from fastapi import APIRouter, Depends
import asyncpg
from ..models.schemas import InjectRequest
from ..main import get_conn

router = APIRouter(prefix="/inject", tags=["inject"])

@router.post("")
async def inject_anomaly(body: InjectRequest, conn: asyncpg.Connection = Depends(get_conn)):
    await conn.execute("""
        INSERT INTO sensor_readings (time, device_id, temperature, humidity, pressure)
        SELECT gs, $1, 70.0 + $2 + (random() * 3.0), 62.0 + (random() * 4.0), 1014.0 + (random() * 2.0 - 1.0)
        FROM generate_series(NOW() - ($3::int * INTERVAL '1 minute'), NOW(), INTERVAL '5 minutes') AS gs
    """, body.device_id, body.magnitude, body.duration_minutes)

    await conn.execute("""
        CALL refresh_continuous_aggregate('sensor_hourly', NOW() - INTERVAL '3 hours', NOW())
    """)

    from ..engine.detector import run_detection
    new_ids = await run_detection(conn)
    return {"status": "injected", "new_event_ids": new_ids}
