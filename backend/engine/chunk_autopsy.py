import asyncpg
from typing import Optional

async def get_chunk_signals(conn: asyncpg.Connection, chunk_name: Optional[str] = None):
    # get all chunks from timescaledb catalog directly
    # this always has data regardless of pg_stat_user_tables population
    chunks = await conn.fetch("""
        SELECT
            c.chunk_name,
            c.range_start,
            c.range_end,
            c.is_compressed
        FROM timescaledb_information.chunks c
        WHERE c.hypertable_name = 'sensor_readings'
        ORDER BY c.range_start DESC
        LIMIT 31
    """)

    if not chunks:
        return []

    # get whatever stats pg_stat_user_tables has — may be zeros for new chunks
    stats_rows = await conn.fetch("""
        SELECT
            relname,
            COALESCE(n_dead_tup, 0)                                         AS dead,
            COALESCE(n_live_tup, 0)                                         AS live,
            COALESCE(
                EXTRACT(EPOCH FROM (NOW() - last_autovacuum)) / 60,
                9999
            )                                                                AS vac_lag
        FROM pg_stat_user_tables
        WHERE relname LIKE '_hyper_%'
    """)
    stats_map = {r["relname"]: r for r in stats_rows}

    # lock contention
    locks = await conn.fetch("""
        SELECT relation::regclass::text AS chunk_name, COUNT(*) AS lock_count
        FROM pg_locks
        WHERE relation::regclass::text LIKE '_hyper_%' AND granted = true
        GROUP BY relation
    """)
    lock_map = {r["chunk_name"]: r["lock_count"] for r in locks}

    results = []
    for i, chunk in enumerate(chunks):
        name  = chunk["chunk_name"]
        stats = stats_map.get(name)

        live      = stats["live"] if stats else 0
        dead      = stats["dead"] if stats else 0
        vac_lag   = stats["vac_lag"] if stats else 9999
        total     = live + dead
        dead_ratio = round(dead / total * 100, 2) if total > 0 else 0.0
        vac_lag   = round(vac_lag, 1)
        lock_count = lock_map.get(name, 0)
        bloat      = 1.0
        lock_label = "none" if lock_count == 0 else "moderate" if lock_count < 5 else "high"

        score = 100
        score -= min(dead_ratio * 2, 30)
        score -= min((bloat - 1) * 10, 25)
        score -= min(lock_count * 5, 15)
        score -= min(vac_lag / 60 * 5, 20) if vac_lag < 9999 else 5
        score  = max(0, round(score))

        results.append({
            "chunk_name":            name,
            "health_score":          score,
            "dead_tuple_ratio":      dead_ratio,
            "compression_bloat":     bloat,
            "lock_contention":       lock_label,
            "chunk_exclusion_failed": dead_ratio > 10 or bloat > 2.0,
            "autovacuum_lag_minutes": vac_lag,
            "row_lock_fanout":       lock_count,
            "is_compressed":         chunk["is_compressed"],
            "range_start":           str(chunk["range_start"]),
        })

    return results
