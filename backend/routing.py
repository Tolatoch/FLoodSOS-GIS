from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any

def solve_pgrouting_evacuation(
    db: Session,
    start_lat: float,
    start_lng: float,
    dest_shelter_id: str,
    avoid_flood: bool = True,
) -> Dict[str, Any]:
    """
    Executes pgr_dijkstra over PostGIS road network topology
    avoiding roads intersecting high / very_high flood polygons.
    """
    query = text("""
        SELECT * FROM get_safe_evacuation_route(
            :start_lat,
            :start_lng,
            :dest_shelter_id,
            :avoid_flood
        );
    """)

    try:
        result = db.execute(
            query,
            {
                "start_lat": start_lat,
                "start_lng": start_lng,
                "dest_shelter_id": dest_shelter_id,
                "avoid_flood": avoid_flood,
            },
        ).fetchall()

        segments = []
        total_cost = 0.0

        for row in result:
            total_cost += row.cost or 0
            segments.append({
                "seq": row.seq,
                "node": row.node,
                "edge": row.edge,
                "cost": row.cost,
            })

        return {
            "success": True,
            "total_distance_m": total_cost,
            "estimated_minutes": round((total_cost / 1000.0) / 35.0 * 60.0, 1),
            "segments_count": len(segments),
        }
    except Exception as e:
        # Fallback approximation if topology not yet populated
        return {
            "success": False,
            "error": str(e),
            "fallback_mode": True,
        }
