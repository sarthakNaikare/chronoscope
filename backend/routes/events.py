from fastapi import APIRouter, Depends
import asyncpg
from ..main import get_conn

router = APIRouter(prefix="/events", tags=["events"])

@router.get("")
async def list_events(conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch("""
        SELECT id, detected_at, device_id, event_start, gap_magnitude,
               gap_pct, severity, implicated_chunks, chunk_health_score, resolved_at
        FROM chronicle.events ORDER BY detected_at DESC LIMIT 20
    """)
    return [dict(r) for r in rows]

@router.get("/{event_id}/counterfactual")
async def counterfactual(event_id: int, conn: asyncpg.Connection = Depends(get_conn)):
    rows = await conn.fetch("""
        SELECT bucket, actual_val, projected_val, gap
        FROM chronicle.shadow WHERE event_id = $1 ORDER BY bucket
    """, event_id)
    return [dict(r) for r in rows]

@router.post("/poll")
async def poll(conn: asyncpg.Connection = Depends(get_conn)):
    from ..engine.detector import run_detection
    new_ids = await run_detection(conn)
    return {"new_events": new_ids}
