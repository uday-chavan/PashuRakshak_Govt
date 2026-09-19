-- ============================================================
-- PashuRakshak — FULL DATABASE SCHEMA
-- Neon PostgreSQL (Maharashtra Animal Health Surveillance)
-- Author: PashuRakshak Dev Team
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE case_status    AS ENUM ('Active', 'Under Treatment', 'Resolved', 'Pending');
CREATE TYPE risk_level     AS ENUM ('critical', 'warning', 'normal');
CREATE TYPE lab_status     AS ENUM ('Collected', 'Under Testing', 'Positive', 'Negative', 'Report Ready', 'Inconclusive');
CREATE TYPE alert_level    AS ENUM ('critical', 'warning', 'info');
CREATE TYPE vax_status     AS ENUM ('Scheduled', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE outbreak_status AS ENUM ('Active', 'Monitoring', 'Controlled', 'Closed');
CREATE TYPE sample_type    AS ENUM ('Blood', 'Epithelial Swab', 'Nasal Swab', 'Fecal', 'Tissue', 'Milk', 'Serum');
CREATE TYPE test_method    AS ENUM ('ELISA', 'PCR', 'AGID', 'HI', 'CFT', 'Culture', 'SNT');

-- ─────────────────────────────────────────────
-- 2. MASTER / LOOKUP TABLES
-- ─────────────────────────────────────────────

-- 2a. Districts
CREATE TABLE IF NOT EXISTS districts (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  division        VARCHAR(100),
  headquarters    VARCHAR(100),
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  risk_level      risk_level   DEFAULT 'normal',
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- 2b. Diseases
CREATE TABLE IF NOT EXISTS diseases (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(20)  NOT NULL UNIQUE,
  full_name       VARCHAR(200) NOT NULL,
  category        VARCHAR(100),
  is_notifiable   BOOLEAN      DEFAULT TRUE,
  description     TEXT,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- 2c. Veterinary Officers
CREATE TABLE IF NOT EXISTS veterinary_officers (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  employee_id     VARCHAR(30)  UNIQUE,
  district_id     INTEGER REFERENCES districts(id),
  phone           VARCHAR(15),
  email           VARCHAR(150),
  designation     VARCHAR(100),
  is_active       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- 2d. Livestock Owners (Farmers)
CREATE TABLE IF NOT EXISTS livestock_owners (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  phone           VARCHAR(15),
  aadhar_last4    CHAR(4),
  village         VARCHAR(150),
  district_id     INTEGER REFERENCES districts(id),
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  total_animals   INTEGER,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. CORE TABLES
-- ─────────────────────────────────────────────

-- 3a. Animal Cases (Primary Reporting Unit)
CREATE TABLE IF NOT EXISTS animal_cases (
  id                    SERIAL PRIMARY KEY,
  case_ref              VARCHAR(20) UNIQUE,
  animal                VARCHAR(200) NOT NULL,
  species               VARCHAR(80),
  herd_size             INTEGER DEFAULT 1,
  owner_id              INTEGER REFERENCES livestock_owners(id),
  owner_name            VARCHAR(150),
  owner_contact         VARCHAR(15),
  village_area          VARCHAR(150),
  district_id           INTEGER REFERENCES districts(id),
  district              VARCHAR(100),
  latitude              DECIMAL(9,6),
  longitude             DECIMAL(9,6),
  symptoms              TEXT,
  suspected_disease     VARCHAR(100),
  confirmed_disease_id  INTEGER REFERENCES diseases(id),
  confirmed_disease     VARCHAR(100),
  disease_under_treatment VARCHAR(200),
  status                case_status  DEFAULT 'Pending',
  assigned_vet_id       INTEGER REFERENCES veterinary_officers(id),
  assigned_vet          VARCHAR(150),
  date_time             TIMESTAMPTZ  DEFAULT NOW(),
  last_updated          TIMESTAMPTZ  DEFAULT NOW(),
  vet_status            VARCHAR(200),
  lab_status            VARCHAR(200),
  notes                 TEXT,
  created_at            TIMESTAMPTZ  DEFAULT NOW()
);

-- 3b. Case Timeline Events
CREATE TABLE IF NOT EXISTS case_timeline (
  id          SERIAL PRIMARY KEY,
  case_id     INTEGER NOT NULL REFERENCES animal_cases(id) ON DELETE CASCADE,
  event_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_text  TEXT NOT NULL,
  recorded_by VARCHAR(150)
);

-- ─────────────────────────────────────────────
-- 4. OUTBREAK MONITORING
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outbreaks (
  id                    SERIAL PRIMARY KEY,
  outbreak_ref          VARCHAR(20) UNIQUE,
  district_id           INTEGER REFERENCES districts(id),
  district              VARCHAR(100),
  disease_id            INTEGER REFERENCES diseases(id),
  disease               VARCHAR(100),
  total_cases           INTEGER DEFAULT 0,
  affected_animals      INTEGER DEFAULT 0,
  active_villages       INTEGER DEFAULT 0,
  new_cases_7d          INTEGER DEFAULT 0,
  mortality_7d          INTEGER DEFAULT 0,
  risk                  VARCHAR(20),
  status                outbreak_status DEFAULT 'Active',
  vaccination_coverage  DECIMAL(5,2),
  risk_trend            VARCHAR(50),
  started_at            TIMESTAMPTZ,
  last_reported         TIMESTAMPTZ DEFAULT NOW(),
  closed_at             TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbreak_cases (
  outbreak_id  INTEGER NOT NULL REFERENCES outbreaks(id) ON DELETE CASCADE,
  case_id      INTEGER NOT NULL REFERENCES animal_cases(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (outbreak_id, case_id)
);

-- ─────────────────────────────────────────────
-- 5. LABORATORY MANAGEMENT
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lab_samples (
  id            SERIAL PRIMARY KEY,
  sample_ref    VARCHAR(20) UNIQUE,
  case_id       INTEGER REFERENCES animal_cases(id),
  case_ref      VARCHAR(20),
  district_id   INTEGER REFERENCES districts(id),
  district      VARCHAR(100),
  sample_type   sample_type,
  test_method   test_method,
  test_name     VARCHAR(200),
  disease_id    INTEGER REFERENCES diseases(id),
  lab_name      VARCHAR(200) DEFAULT 'Regional Disease Diagnostic Laboratory, Pune',
  report_no     VARCHAR(100),
  status        lab_status DEFAULT 'Collected',
  collected_at  TIMESTAMPTZ DEFAULT NOW(),
  tested_at     TIMESTAMPTZ,
  reported_at   TIMESTAMPTZ,
  result_value  TEXT,
  notes         TEXT,
  collected_by  VARCHAR(150),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. VACCINATION MANAGEMENT
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vaccination_drives (
  id               SERIAL PRIMARY KEY,
  drive_ref        VARCHAR(20) UNIQUE,
  disease_id       INTEGER REFERENCES diseases(id),
  disease          VARCHAR(100),
  vaccine_name     VARCHAR(200),
  district_id      INTEGER REFERENCES districts(id),
  district         VARCHAR(100),
  target_count     INTEGER DEFAULT 0,
  completed_count  INTEGER DEFAULT 0,
  pending_count    INTEGER DEFAULT 0,
  status           vax_status DEFAULT 'Scheduled',
  scheduled_date   DATE,
  completed_date   DATE,
  conducted_by     VARCHAR(150),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccination_records (
  id            SERIAL PRIMARY KEY,
  drive_id      INTEGER REFERENCES vaccination_drives(id),
  owner_id      INTEGER REFERENCES livestock_owners(id),
  animal_type   VARCHAR(100),
  herd_size     INTEGER DEFAULT 1,
  vaccine_name  VARCHAR(200),
  batch_no      VARCHAR(50),
  vaccinated_at TIMESTAMPTZ DEFAULT NOW(),
  next_due      DATE,
  vet_id        INTEGER REFERENCES veterinary_officers(id),
  village       VARCHAR(150),
  district_id   INTEGER REFERENCES districts(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. ALERTS & ADVISORIES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  id           SERIAL PRIMARY KEY,
  alert_ref    VARCHAR(20) UNIQUE,
  level        alert_level DEFAULT 'info',
  title        VARCHAR(300),
  district_id  INTEGER REFERENCES districts(id),
  district     VARCHAR(100),
  description  TEXT,
  issued_by    VARCHAR(150) DEFAULT 'Department of Animal Husbandry, Maharashtra',
  status       VARCHAR(30) DEFAULT 'Active',
  sent_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_animal_cases_district ON animal_cases(district_id);
CREATE INDEX IF NOT EXISTS idx_animal_cases_status   ON animal_cases(status);
CREATE INDEX IF NOT EXISTS idx_animal_cases_date     ON animal_cases(date_time DESC);
CREATE INDEX IF NOT EXISTS idx_animal_cases_disease  ON animal_cases(suspected_disease);

CREATE INDEX IF NOT EXISTS idx_outbreaks_district    ON outbreaks(district_id);
CREATE INDEX IF NOT EXISTS idx_outbreaks_status      ON outbreaks(status);

CREATE INDEX IF NOT EXISTS idx_lab_samples_case      ON lab_samples(case_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_status    ON lab_samples(status);

CREATE INDEX IF NOT EXISTS idx_vax_drives_district   ON vaccination_drives(district_id);
CREATE INDEX IF NOT EXISTS idx_vax_drives_status     ON vaccination_drives(status);

CREATE INDEX IF NOT EXISTS idx_alerts_level          ON alerts(level);
CREATE INDEX IF NOT EXISTS idx_alerts_district       ON alerts(district_id);
