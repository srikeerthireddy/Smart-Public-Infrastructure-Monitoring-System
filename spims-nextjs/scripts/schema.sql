CREATE TABLE IF NOT EXISTS energy_usage (
  id SERIAL PRIMARY KEY,
  area VARCHAR(100) NOT NULL,
  consumption NUMERIC(10, 2) NOT NULL CHECK (consumption >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS energy_usage
  ADD COLUMN IF NOT EXISTS area VARCHAR(100),
  ADD COLUMN IF NOT EXISTS consumption NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

UPDATE energy_usage
SET area = COALESCE(area, 'Unknown')
WHERE area IS NULL;

UPDATE energy_usage
SET consumption = COALESCE(consumption, 0)
WHERE consumption IS NULL;

UPDATE energy_usage
SET timestamp = COALESCE(timestamp, NOW())
WHERE timestamp IS NULL;

ALTER TABLE IF EXISTS energy_usage
  ALTER COLUMN area SET NOT NULL,
  ALTER COLUMN consumption SET NOT NULL,
  ALTER COLUMN timestamp SET NOT NULL;

CREATE TABLE IF NOT EXISTS streetlights (
  id SERIAL PRIMARY KEY,
  location VARCHAR(100) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE', 'OFF', 'FAULT')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS streetlights
  ADD COLUMN IF NOT EXISTS location VARCHAR(100),
  ADD COLUMN IF NOT EXISTS status VARCHAR(16),
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

UPDATE streetlights
SET location = COALESCE(location, 'Unknown')
WHERE location IS NULL;

UPDATE streetlights
SET status = COALESCE(status, 'ACTIVE')
WHERE status IS NULL;

UPDATE streetlights
SET timestamp = COALESCE(timestamp, NOW())
WHERE timestamp IS NULL;

ALTER TABLE IF EXISTS streetlights
  ALTER COLUMN location SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN timestamp SET NOT NULL;

CREATE TABLE IF NOT EXISTS faults (
  id SERIAL PRIMARY KEY,
  issue TEXT NOT NULL,
  location VARCHAR(100) NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE IF EXISTS faults
  ADD COLUMN IF NOT EXISTS issue TEXT,
  ADD COLUMN IF NOT EXISTS location VARCHAR(100),
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

UPDATE faults
SET issue = COALESCE(issue, 'Unknown fault')
WHERE issue IS NULL;

UPDATE faults
SET location = COALESCE(location, 'Unknown')
WHERE location IS NULL;

UPDATE faults
SET resolved = COALESCE(resolved, FALSE)
WHERE resolved IS NULL;

UPDATE faults
SET timestamp = COALESCE(timestamp, NOW())
WHERE timestamp IS NULL;

ALTER TABLE IF EXISTS faults
  ALTER COLUMN issue SET NOT NULL,
  ALTER COLUMN location SET NOT NULL,
  ALTER COLUMN resolved SET NOT NULL,
  ALTER COLUMN timestamp SET NOT NULL;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(16) NOT NULL CHECK (role IN ('ADMIN', 'OPERATOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS role VARCHAR(16),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE users
SET username = COALESCE(username, CONCAT('user_', id::text))
WHERE username IS NULL;

UPDATE users
SET password_hash = COALESCE(password_hash, 'TEMP_HASH')
WHERE password_hash IS NULL;

UPDATE users
SET role = COALESCE(role, 'OPERATOR')
WHERE role IS NULL;

UPDATE users
SET role = UPPER(role);

UPDATE users
SET role = 'OPERATOR'
WHERE role NOT IN ('ADMIN', 'OPERATOR');

UPDATE users
SET created_at = COALESCE(created_at, NOW())
WHERE created_at IS NULL;

ALTER TABLE IF EXISTS users
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL,
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'OPERATOR'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS refresh_sessions
  ADD COLUMN IF NOT EXISTS user_id INTEGER,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_sessions_refresh_token_unique'
  ) THEN
    ALTER TABLE refresh_sessions ADD CONSTRAINT refresh_sessions_refresh_token_unique UNIQUE (refresh_token);
  END IF;
END $$;

UPDATE refresh_sessions
SET created_at = COALESCE(created_at, NOW())
WHERE created_at IS NULL;

ALTER TABLE IF EXISTS refresh_sessions
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN refresh_token SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_energy_usage_timestamp ON energy_usage (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_energy_usage_area ON energy_usage (area);

CREATE INDEX IF NOT EXISTS idx_streetlights_timestamp ON streetlights (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_streetlights_status ON streetlights (status);

CREATE INDEX IF NOT EXISTS idx_faults_timestamp ON faults (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_faults_resolved ON faults (resolved);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_id ON refresh_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires_at ON refresh_sessions (expires_at);
