INSERT INTO energy_usage (area, consumption)
VALUES
  ('Downtown', 128.40),
  ('Residential-North', 96.25),
  ('Industrial-East', 211.75),
  ('University-Zone', 74.10)
ON CONFLICT DO NOTHING;

INSERT INTO streetlights (location, status)
VALUES
  ('Main Avenue', 'ACTIVE'),
  ('Central Park Road', 'ACTIVE'),
  ('Airport Link', 'OFF'),
  ('Harbor Street', 'FAULT')
ON CONFLICT DO NOTHING;

INSERT INTO faults (issue, location, resolved)
VALUES
  ('Transformer overheating', 'Industrial-East', FALSE),
  ('Streetlight power line issue', 'Harbor Street', FALSE),
  ('Cabinet communication timeout', 'Downtown', TRUE)
ON CONFLICT DO NOTHING;