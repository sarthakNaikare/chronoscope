CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS sensor_readings (
    time        TIMESTAMPTZ      NOT NULL,
    device_id   TEXT             NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    humidity    DOUBLE PRECISION,
    pressure    DOUBLE PRECISION
);

SELECT create_hypertable(
    'sensor_readings', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_sensor_device_time
    ON sensor_readings (device_id, time DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_hourly
WITH (timescaledb.continuous) AS
    SELECT
        time_bucket('1 hour', time) AS bucket,
        device_id,
        AVG(temperature)            AS avg_temp,
        MIN(temperature)            AS min_temp,
        MAX(temperature)            AS max_temp,
        COUNT(*)                    AS reading_count
    FROM sensor_readings
    GROUP BY bucket, device_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
    'sensor_hourly',
    start_offset      => INTERVAL '3 hours',
    end_offset        => INTERVAL '30 minutes',
    schedule_interval => INTERVAL '30 minutes',
    if_not_exists     => TRUE
);

ALTER TABLE sensor_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id',
    timescaledb.compress_orderby   = 'time DESC'
);

SELECT add_compression_policy(
    'sensor_readings',
    INTERVAL '7 days',
    if_not_exists => TRUE
);
