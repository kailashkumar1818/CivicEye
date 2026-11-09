CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ ENUMS ============
CREATE TYPE user_role     AS ENUM ('citizen', 'admin', 'officer');
CREATE TYPE report_category AS ENUM
  ('pothole', 'garbage', 'broken_streetlight', 'damaged_road', 'other');
CREATE TYPE report_status AS ENUM
  ('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');

-- ============ USERS ============
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone         VARCHAR(20),
  avatar_url    TEXT,
  city          VARCHAR(100),
  role          user_role NOT NULL DEFAULT 'citizen',
  department_id UUID,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ DEPARTMENTS ============
CREATE TABLE departments (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,      -- e.g. Roads, Sanitation, Electricity
  handles report_category[] NOT NULL DEFAULT '{}'
);
ALTER TABLE users ADD CONSTRAINT fk_user_dept
  FOREIGN KEY (department_id) REFERENCES departments(id);

-- ============ REPORTS ============
CREATE SEQUENCE report_seq START 1;

CREATE TABLE reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_no   VARCHAR(20) NOT NULL UNIQUE,         -- CE-2026-000123
  user_id        UUID NOT NULL REFERENCES users(id),
  title          VARCHAR(150) NOT NULL,
  description    TEXT,
  category       report_category NOT NULL,            -- final (user-confirmed)
  status         report_status NOT NULL DEFAULT 'submitted',
  priority       SMALLINT NOT NULL DEFAULT 0,         -- raised by confirmations/severity

  -- location
  location       GEOGRAPHY(Point, 4326) NOT NULL,
  address        TEXT,
  area           VARCHAR(150),                        -- ward / locality
  city           VARCHAR(100),
  location_source VARCHAR(10) NOT NULL DEFAULT 'gps', -- gps | exif | manual

  -- AI results
  ai_status      VARCHAR(15) NOT NULL DEFAULT 'pending', -- ok | unavailable | pending
  ai_category    report_category,
  ai_confidence  REAL,
  ai_severity    severity_level,
  ai_detections  JSONB,
  needs_review   BOOLEAN NOT NULL DEFAULT false,

  -- workflow
  assigned_department_id UUID REFERENCES departments(id),
  assigned_to    UUID REFERENCES users(id),
  duplicate_of   UUID REFERENCES reports(id),
  confirmation_count INT NOT NULL DEFAULT 0,
  resolved_at    TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_location ON reports USING GIST (location);
CREATE INDEX idx_reports_status   ON reports (status);
CREATE INDEX idx_reports_category ON reports (category);
CREATE INDEX idx_reports_user     ON reports (user_id);
CREATE INDEX idx_reports_created  ON reports (created_at DESC);
CREATE INDEX idx_reports_area     ON reports (area);

CREATE TABLE report_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  public_id  TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ TRACKING ============
CREATE TABLE report_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  from_status report_status,
  to_status   report_status NOT NULL,
  changed_by  UUID REFERENCES users(id),
  note        TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT false,   -- internal notes hidden from citizen
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_report ON report_status_history (report_id, created_at);

-- ============ DUPLICATES: "me too" confirmations ============
CREATE TABLE report_confirmations (
  report_id  UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, user_id)
);

-- ============ NOTIFICATIONS ============
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id  UUID REFERENCES reports(id) ON DELETE CASCADE,
  title      VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON notifications (user_id, is_read, created_at DESC);

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();

