BEGIN;

INSERT INTO sensor_readings (time, device_id, temperature, humidity, pressure)
SELECT gs, 'device_1',
    71.0 + (2.0 * sin(extract(epoch FROM gs) / 3600.0)) + (random() * 0.6 - 0.3),
    55.0 + (random() * 5.0), 1013.0 + (random() * 2.0 - 1.0)
FROM generate_series(NOW() - INTERVAL '30 days', NOW(), INTERVAL '5 minutes') AS gs;

INSERT INTO sensor_readings (time, device_id, temperature, humidity, pressure)
SELECT gs, 'device_2',
    74.0 + (1.5 * cos(extract(epoch FROM gs) / 7200.0)) + (random() * 0.5 - 0.25),
    58.0 + (random() * 4.0), 1012.0 + (random() * 2.0 - 1.0)
FROM generate_series(NOW() - INTERVAL '30 days', NOW(), INTERVAL '5 minutes') AS gs;

INSERT INTO sensor_readings (time, device_id, temperature, humidity, pressure)
SELECT gs, 'device_3',
    70.0 + (3.0 * sin(extract(epoch FROM gs) / 5400.0)) + (random() * 0.8 - 0.4),
    60.0 + (random() * 5.0), 1014.0 + (random() * 2.0 - 1.0)
FROM generate_series(NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 hours', INTERVAL '5 minutes') AS gs;

INSERT INTO sensor_readings (time, device_id, temperature, humidity, pressure)
SELECT gs, 'device_3',
    70.0 + (3.0 * sin(extract(epoch FROM gs) / 5400.0)) + 18.0 + (random() * 4.0),
    62.0 + (random() * 5.0), 1014.0 + (random() * 2.0 - 1.0)
FROM generate_series(NOW() - INTERVAL '2 hours', NOW(), INTERVAL '5 minutes') AS gs;

INSERT INTO sensor_readings (time, device_id, temperature, humidity, pressure)
SELECT gs, 'device_4',
    68.0 + (1.0 * sin(extract(epoch FROM gs) / 4800.0)) + (random() * 0.4 - 0.2),
    52.0 + (random() * 3.0), 1015.0 + (random() * 1.5 - 0.75)
FROM generate_series(NOW() - INTERVAL '30 days', NOW(), INTERVAL '5 minutes') AS gs;

INSERT INTO sensor_readings (time, device_id, temperature, humidity, pressure)
SELECT gs, 'device_5',
    72.0 + (2.5 * sin(extract(epoch FROM gs) / 6000.0))
    + CASE WHEN gs > NOW() - INTERVAL '6 hours'
        THEN (extract(epoch FROM gs - (NOW() - INTERVAL '6 hours')) / 3600.0) * 1.5
        ELSE 0 END
    + (random() * 0.7 - 0.35),
    57.0 + (random() * 4.0), 1011.0 + (random() * 2.0 - 1.0)
FROM generate_series(NOW() - INTERVAL '30 days', NOW(), INTERVAL '5 minutes') AS gs;

COMMIT;

CALL refresh_continuous_aggregate('sensor_hourly', NOW() - INTERVAL '30 days', NOW());
