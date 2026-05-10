import asyncpg
import os
from datetime import datetime
from .shadow_projection import compute_shadow

THRESHOLD = float(os.getenv("DEVIATION_THRESHOLD", "0.15"))

async def run_detection(conn: asyncpg.Connection):
    devices = await conn.fetch("SELECT DISTINCT device_id FROM sensor_readings")
    new_events = []

    for record in devices:
        device_id = record["device_id"]

        stats = await conn.fetchrow("""
            WITH recent AS (
                SELECT bucket, avg_temp FROM sensor_hourly
                WHERE device_id = $1 ORDER BY bucket DESC LIMIT 7
            ),
            baseline AS (SELECT AVG(avg_temp) AS rolling_avg FROM recent OFFSET 1)
            SELECT r.bucket AS latest_bucket, r.avg_temp AS latest_val, b.rolling_avg AS baseline
            FROM recent r, baseline b ORDER BY r.bucket DESC LIMIT 1
        """, device_id)

        if not stats or not stats["baseline"]:
            continue

        latest   = stats["latest_val"]
        baseline = stats["baseline"]
        gap_pct  = abs(latest - baseline) / baseline

        if gap_pct < THRESHOLD:
            continue

        existing = await conn.fetchval("""
            SELECT id FROM chronicle.events
            WHERE device_id = $1 AND detected_at > NOW() - INTERVAL '2 hours' LIMIT 1
        """, device_id)

        if existing:
            continue

        severity = "critical" if gap_pct > 0.25 else "warn"

        chunks = await conn.fetch("""
            SELECT chunk_name FROM timescaledb_information.chunks
            WHERE hypertable_name = 'sensor_readings'
              AND range_start <= $1 AND range_end >= $1
        """, stats["latest_bucket"])

        event_id = await conn.fetchval("""
            INSERT INTO chronicle.events
                (device_id, event_start, gap_magnitude, gap_pct, severity, implicated_chunks)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        """, device_id, stats["latest_bucket"],
            round(latest - baseline, 2), round(gap_pct * 100, 2),
            severity, [c["chunk_name"] for c in chunks])

        await compute_shadow(conn, device_id, stats["latest_bucket"], event_id)
        new_events.append(event_id)

    return new_events
