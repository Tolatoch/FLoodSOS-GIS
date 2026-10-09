import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import engine, get_db, Base
from .models import FloodRiskArea, Shelter, Province, User, AuditLog
from .auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
)
from .routing import solve_pgrouting_evacuation
from .agent import run_disaster_agent

# Initialize FastAPI application with OpenAPI documentation
app = FastAPI(
    title="FloodSOS GIS API",
    description="Web GIS Backend for Flood Risk, Safe Shelters and Evacuation Routing (Upper Northern Thailand)",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Pydantic Schemas
# ==========================================
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "th"
    user_location: Optional[dict] = None

# ==========================================
# 1. Auth Endpoints
# ==========================================
@app.post("/auth/signup", tags=["Authentication"])
def signup(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=payload.email,
        full_name=payload.name,
        password_hash=get_password_hash(payload.password),
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token(data={"sub": new_user.email, "role": new_user.role})
    return {"user": {"id": str(new_user.id), "name": new_user.full_name, "email": new_user.email, "role": new_user.role}, "token": token}

@app.post("/auth/signin", tags=["Authentication"])
def signin(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"user": {"id": str(user.id), "name": user.full_name, "email": user.email, "role": user.role}, "token": token}

@app.get("/auth/me", tags=["Authentication"])
def me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "name": current_user.full_name, "email": current_user.email, "role": current_user.role}

# ==========================================
# 2. Flood Risk Endpoints
# ==========================================
@app.get("/flood-risk", tags=["Flood Risk"])
def get_flood_risk(
    province: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(FloodRiskArea)
    if province and province != "all":
        query = query.filter(FloodRiskArea.province_id == province)
    if risk_level and risk_level != "all":
        query = query.filter(FloodRiskArea.risk_level == risk_level)
    return query.all()

@app.get("/flood-risk/at", tags=["Flood Risk"])
def get_flood_risk_at(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    db: Session = Depends(get_db),
):
    # Spatial Point-in-Polygon check via PostGIS ST_Contains
    sql = text("""
        SELECT id, code, title_th, risk_level, water_depth_meters
        FROM flood_risk_areas
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326));
    """)
    result = db.execute(sql, {"lat": lat, "lng": lng}).fetchall()
    return {
        "is_inside_flood_zone": len(result) > 0,
        "matching_zones": [dict(r._mapping) for r in result],
    }

@app.get("/flood-risk/{id}", tags=["Flood Risk"])
def get_flood_risk_by_id(id: str, db: Session = Depends(get_db)):
    area = db.query(FloodRiskArea).filter(FloodRiskArea.id == id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return area

# ==========================================
# 3. Safe Shelters Endpoints
# ==========================================
@app.get("/shelters", tags=["Safe Shelters"])
def get_shelters(
    province: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Shelter)
    if province and province != "all":
        query = query.filter(Shelter.province_id == province)
    if type and type != "all":
        query = query.filter(Shelter.type == type)
    return query.all()

@app.get("/shelters/nearest", tags=["Safe Shelters"])
def get_nearest_shelters(
    lat: float = Query(...),
    lng: float = Query(...),
    limit: int = Query(5),
    db: Session = Depends(get_db),
):
    # Spatial nearest neighbor search via PostGIS `<->` operator
    sql = text("""
        SELECT id, name_th, name_en, type, capacity, current_occupants, contact_phone,
               ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / 1000.0 AS distance_km
        FROM shelters
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        LIMIT :limit;
    """)
    result = db.execute(sql, {"lat": lat, "lng": lng, "limit": limit}).fetchall()
    return [dict(r._mapping) for r in result]

# ==========================================
# 4. Emergency Evacuation Route Endpoint (pgRouting)
# ==========================================
@app.get("/route", tags=["Routing"])
def get_evacuation_route(
    from_lat: float = Query(...),
    from_lng: float = Query(...),
    shelter_id: str = Query(...),
    avoid_flood: bool = Query(True),
    db: Session = Depends(get_db),
):
    route_calc = solve_pgrouting_evacuation(
        db, from_lat, from_lng, shelter_id, avoid_flood
    )
    return route_calc

# ==========================================
# 5. Province Statistics Endpoint
# ==========================================
@app.get("/stats/provinces", tags=["Statistics"])
def get_province_stats(db: Session = Depends(get_db)):
    sql = text("""
        SELECT p.id, p.name_th, p.name_en,
               COUNT(DISTINCT f.id) AS risk_areas_count,
               COALESCE(MAX(f.water_depth_meters), 0) AS max_water_depth,
               COUNT(DISTINCT s.id) AS shelters_count,
               COALESCE(SUM(s.capacity), 0) AS total_capacity
        FROM provinces p
        LEFT JOIN flood_risk_areas f ON f.province_id = p.id
        LEFT JOIN shelters s ON s.province_id = p.id
        GROUP BY p.id, p.name_th, p.name_en;
    """)
    result = db.execute(sql).fetchall()
    return [dict(r._mapping) for r in result]

# ==========================================
# 6. AI Agent Chat Endpoint
# ==========================================
@app.post("/agent/chat", tags=["AI Agent"])
async def agent_chat(payload: ChatRequest):
    return await run_disaster_agent(
        message=payload.message,
        language=payload.language,
        user_location=payload.user_location,
    )

# ==========================================
# 7. Admin Endpoints (Protected by RBAC)
# ==========================================
@app.get("/admin/stats", tags=["Admin"])
def admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return {
        "total_users": db.query(User).count(),
        "total_flood_areas": db.query(FloodRiskArea).count(),
        "total_shelters": db.query(Shelter).count(),
    }

@app.get("/admin/audit-logs", tags=["Admin"])
def admin_audit_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
