DELETE FROM energy_usage;
DELETE FROM streetlights;
DELETE FROM faults;

INSERT INTO energy_usage (area, consumption, timestamp)
SELECT
  (ARRAY['Downtown', 'Residential-North', 'Industrial-East', 'University-Zone', 'Airport-Corridor'])[floor(random() * 5 + 1)],
  (50 + random() * 300)::numeric(10,2),
  NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 100);

INSERT INTO streetlights (location, status, timestamp)
SELECT
  (ARRAY['Main Avenue', 'Central Park Road', 'Airport Link', 'Harbor Street', 'Ring Road', 'Metro Junction'])[floor(random() * 6 + 1)],
  (ARRAY['ACTIVE', 'OFF', 'FAULT'])[floor(random() * 3 + 1)],
  NOW() - (random() * INTERVAL '7 days')
FROM generate_series(1, 50);

INSERT INTO faults (issue, location, resolved, timestamp, resolved_at)
SELECT
  (ARRAY[
    'Transformer overheating',
    'Voltage instability detected',
    'Streetlight controller offline',
    'Cabinet communication timeout',
    'Power line fluctuation'
  ])[floor(random() * 5 + 1)],
  (ARRAY['Main Avenue', 'Central Park Road', 'Airport Link', 'Harbor Street', 'Ring Road', 'Metro Junction'])[floor(random() * 6 + 1)],
  random() < 0.7,
  NOW() - (random() * INTERVAL '14 days'),
  CASE WHEN random() < 0.7 THEN NOW() - (random() * INTERVAL '10 days') ELSE NULL END
FROM generate_series(1, 30);
