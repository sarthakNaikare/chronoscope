import asyncpg
from datetime import datetime

async def compute_shadow(conn: asyncpg.Connection, device_id: str, event_start: datetime, event_id: int):
    rows = await conn.fetch("""
        SELECT extract(epoch FROM bucket) AS ts, avg_temp AS val
        FROM sensor_hourly
        WHERE device_id = $1 AND bucket < $2
        ORDER BY bucket DESC LIMIT 12
    """, device_id, event_start)

    if len(rows) < 4:
        return

    slope_row = await conn.fetchrow("""
        SELECT regr_slope(val, ts) AS slope, regr_intercept(val, ts) AS intercept
        FROM unnest($1::float[], $2::float[]) AS t(ts, val)
    """, [r["ts"] for r in rows], [r["val"] for r in rows])

    slope     = slope_row["slope"]     or 0.0
    intercept = slope_row["intercept"] or 0.0

    actual_rows = await conn.fetch("""
        SELECT bucket, avg_temp AS actual_val FROM sensor_hourly
        WHERE device_id = $1 AND bucket >= $2
        ORDER BY bucket LIMIT 24
    """, device_id, event_start)

    for row in actual_rows:
        ts        = row["bucket"].timestamp()
        projected = slope * ts + intercept
        await conn.execute("""
            INSERT INTO chronicle.shadow (event_id, bucket, actual_val, projected_val)
            VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING
        """, event_id, row["bucket"], row["actual_val"], projected)
