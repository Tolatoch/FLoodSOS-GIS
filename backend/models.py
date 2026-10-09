import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    ARRAY,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from sqlalchemy.sql import func
from .database import Base

class Province(Base):
    __tablename__ = "provinces"

    id = Column(String(32), primary_key=True)
    name_th = Column(String(100), nullable=False)
    name_en = Column(String(100), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    zoom_level = Column(Integer, default=11)
    area_sq_km = Column(Float)
    population = Column(Integer)
    boundary = Column(Geometry("MultiPolygon", srid=4326))

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="user") # 'admin', 'staff', 'user', 'guest'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FloodRiskArea(Base):
    __tablename__ = "flood_risk_areas"

    id = Column(String(64), primary_key=True)
    code = Column(String(64), unique=True, nullable=False)
    title_th = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    province_id = Column(String(32), ForeignKey("provinces.id"))
    district_th = Column(String(100), nullable=False)
    district_en = Column(String(100), nullable=False)
    subdistrict_th = Column(String(100))
    subdistrict_en = Column(String(100))
    risk_level = Column(String(50), nullable=False) # 'very_low', 'low', 'moderate', 'high', 'very_high'
    gistda_status = Column(String(50), nullable=False) # 'normal', 'watch', 'warning', 'critical'
    water_depth_meters = Column(Float, default=0.0)
    affected_area_sq_km = Column(Float, default=0.0)
    affected_households = Column(Integer, default=0)
    source = Column(String(100), default="GISTDA Flood Monitoring")
    alert_note_th = Column(Text)
    alert_note_en = Column(Text)
    geom = Column(Geometry("Polygon", srid=4326), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(String(64), primary_key=True)
    name_th = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False) # 'government', 'school', 'university', 'temple', etc.
    province_id = Column(String(32), ForeignKey("provinces.id"))
    district_th = Column(String(100), nullable=False)
    district_en = Column(String(100), nullable=False)
    subdistrict_th = Column(String(100))
    subdistrict_en = Column(String(100))
    address_th = Column(Text)
    address_en = Column(Text)
    capacity = Column(Integer, nullable=False)
    current_occupants = Column(Integer, default=0)
    status = Column(String(50), default="open") # 'open', 'standby', 'full'
    contact_phone = Column(String(50))
    facilities = Column(ARRAY(String))
    source = Column(String(100), default="DDPM Open Data CKAN")
    geom = Column(Geometry("Point", srid=4326), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

class RoadNetwork(Base):
    __tablename__ = "road_network"

    id = Column(Integer, primary_key=True, autoincrement=True)
    osm_id = Column(Integer)
    source = Column(Integer, index=True)
    target = Column(Integer, index=True)
    cost = Column(Float)
    reverse_cost = Column(Float)
    speed_kmh = Column(Float, default=50.0)
    highway_type = Column(String(50))
    flood_penalty = Column(Float, default=1.0)
    geom = Column(Geometry("LineString", srid=4326), nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    user_name = Column(String(150))
    user_role = Column(String(50))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=False)
    details_th = Column(Text)
    details_en = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
