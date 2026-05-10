CREATE SCHEMA IF NOT EXISTS chronicle;

CREATE TABLE IF NOT EXISTS chronicle.events (
    id                  SERIAL PRIMARY KEY,
    detected_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    device_id           TEXT             NOT NULL,
    hypertable          TEXT             NOT NULL DEFAULT 'sensor_readings',
    event_start         TIMESTAMPTZ      NOT NULL,
    gap_magnitude       DOUBLE PRECISION NOT NULL,
    gap_pct             DOUBLE PRECISION NOT NULL,
    implicated_chunks   TEXT[],
    chunk_health_score  INTEGER,
    severity            TEXT             NOT NULL DEFAULT 'warn'
                            CHECK (severity IN ('ok', 'warn', 'critical')),
    resolved_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chronicle_events_recent
    ON chronicle.events (detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_chronicle_events_device
    ON chronicle.events (device_id, detected_at DESC);

CREATE TABLE IF NOT EXISTS chronicle.shadow (
    id            SERIAL PRIMARY KEY,
    event_id      INTEGER NOT NULL REFERENCES chronicle.events(id) ON DELETE CASCADE,
    bucket        TIMESTAMPTZ      NOT NULL,
    actual_val    DOUBLE PRECISION NOT NULL,
    projected_val DOUBLE PRECISION NOT NULL,
    gap           DOUBLE PRECISION GENERATED ALWAYS AS (actual_val - projected_val) STORED
);

CREATE INDEX IF NOT EXISTS idx_chronicle_shadow_event
    ON chronicle.shadow (event_id, bucket);

INSERT INTO chronicle.events
    (detected_at, device_id, event_start, gap_magnitude, gap_pct, severity, implicated_chunks, chunk_health_score)
VALUES
(NOW() - INTERVAL '14 hours', 'device_1', NOW() - INTERVAL '14 hours 30 minutes',
 4.2, 6.1, 'warn', ARRAY['_hyper_1_3_chunk','_hyper_1_4_chunk'], 88),
(NOW() - INTERVAL '6 hours', 'device_5', NOW() - INTERVAL '6 hours 15 minutes',
 9.1, 12.8, 'warn', ARRAY['_hyper_1_22_chunk','_hyper_1_23_chunk'], 74);
