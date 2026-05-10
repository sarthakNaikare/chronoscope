import asyncpg
from typing import Optional

async def get_chunk_signals(conn: asyncpg.Connection, chunk_name: Optional[str] = None):
    where = f"WHERE relname = '{chunk_name}'" if chunk_name else "WHERE relname LIKE '_hyper_%'"

    rows = await conn.fetch(f"""
        SELECT
            s.relname AS chunk_name,
            COALESCE(s.n_dead_tup::float / NULLIF(s.n_live_tup + s.n_dead_tup, 0) * 100, 0) AS dead_tuple_ratio,
            COALESCE(EXTRACT(EPOCH FROM (NOW() - s.last_autovacuum)) / 60, 9999) AS autovacuum_lag_minutes
        FROM pg_stat_user_tables s {where}
        ORDER BY dead_tuple_ratio DESC LIMIT 31
    """)

    locks = await conn.fetch("""
        SELECT relation::regclass::text AS chunk_name, COUNT(*) AS lock_count
        FROM pg_locks WHERE relation::regclass::text LIKE '_hyper_%' AND granted = true
        GROUP BY relation
    """)
    lock_map = {r["chunk_name"]: r["lock_count"] for r in locks}

    try:
        compression = await conn.fetch("""
            SELECT chunk_name,
                COALESCE(uncompressed_heap_size::float / NULLIF(compressed_heap_size, 0), 1.0) AS bloat_ratio
            FROM chunk_compression_stats('sensor_readings')
        """)
        comp_map = {r["chunk_name"]: r["bloat_ratio"] for r in compression}
    except Exception:
        comp_map = {}

    results = []
    for row in rows:
        name       = row["chunk_name"]
        dead_ratio = round(row["dead_tuple_ratio"], 2)
        vac_lag    = round(row["autovacuum_lag_minutes"], 1)
        lock_count = lock_map.get(name, 0)
        bloat      = round(comp_map.get(name, 1.0), 2)
        lock_label = "none" if lock_count == 0 else "moderate" if lock_count < 5 else "high"

        score = 100
        score -= min(dead_ratio * 2, 30)
        score -= min((bloat - 1) * 10, 25)
        score -= min(lock_count * 5, 15)
        score -= min(vac_lag / 60 * 5, 20)
        score  = max(0, round(score))

        results.append({
            "chunk_name": name, "health_score": score,
            "dead_tuple_ratio": dead_ratio, "compression_bloat": bloat,
            "lock_contention": lock_label,
            "chunk_exclusion_failed": dead_ratio > 10 or bloat > 2.0,
            "autovacuum_lag_minutes": vac_lag, "row_lock_fanout": lock_count,
        })

    return results
