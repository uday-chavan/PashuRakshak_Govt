/**
 * PashuRakshak — COMPLETE DATABASE SETUP
 * Creates all 9 tables + seeds with Maharashtra data.
 * Run once:  node src/db/setupDb.js
 */

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.VITE_DATABASE_URL, ssl: { rejectUnauthorized: false } });


/** Run a raw SQL string on a pooled client */
async function run(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

/** Insert one row and return it */
async function insert(sql, params = []) {
  const result = await run(sql, params);
  return result.rows[0];
}

// ─────────────────────────────────────────────
// SCHEMA DDL (idempotent)
// ─────────────────────────────────────────────
async function createSchema() {
  console.log('Dropping old schema...');
  await run(`DROP TABLE IF EXISTS vaccination_records, vaccination_drives, lab_samples, outbreak_cases, outbreaks, case_timeline, animal_cases, livestock_owners, veterinary_officers, alerts, diseases, districts CASCADE`);
  await run(`DROP TYPE IF EXISTS case_status, risk_level, lab_status, alert_level, vax_status, outbreak_status, sample_type, test_method CASCADE`);
  console.log('Creating enums and tables...');


  const stmts = [
    // Enums
    `DO $$ BEGIN CREATE TYPE case_status AS ENUM ('Active','Under Treatment','Resolved','Pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE risk_level AS ENUM ('critical','warning','normal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE lab_status AS ENUM ('Collected','Under Testing','Positive','Negative','Report Ready','Inconclusive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE alert_level AS ENUM ('critical','warning','info'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE vax_status AS ENUM ('Scheduled','In Progress','Completed','Cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE outbreak_status AS ENUM ('Active','Monitoring','Controlled','Closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE sample_type AS ENUM ('Blood','Epithelial Swab','Nasal Swab','Fecal','Tissue','Milk','Serum'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE test_method AS ENUM ('ELISA','PCR','AGID','HI','CFT','Culture','SNT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    // 1. districts
    `CREATE TABLE IF NOT EXISTS districts (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(100) NOT NULL UNIQUE,
      division     VARCHAR(100),
      headquarters VARCHAR(100),
      latitude     DECIMAL(9,6),
      longitude    DECIMAL(9,6),
      risk_level   risk_level DEFAULT 'normal',
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 2. diseases
    `CREATE TABLE IF NOT EXISTS diseases (
      id            SERIAL PRIMARY KEY,
      code          VARCHAR(20)  NOT NULL UNIQUE,
      full_name     VARCHAR(200) NOT NULL,
      category      VARCHAR(100),
      is_notifiable BOOLEAN DEFAULT TRUE,
      description   TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 3. veterinary_officers
    `CREATE TABLE IF NOT EXISTS veterinary_officers (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(150) NOT NULL,
      employee_id VARCHAR(30)  UNIQUE,
      district_id INTEGER REFERENCES districts(id),
      phone       VARCHAR(15),
      email       VARCHAR(150),
      designation VARCHAR(100),
      is_active   BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 4. livestock_owners
    `CREATE TABLE IF NOT EXISTS livestock_owners (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(150) NOT NULL,
      phone         VARCHAR(15),
      aadhar_last4  CHAR(4),
      village       VARCHAR(150),
      district_id   INTEGER REFERENCES districts(id),
      latitude      DECIMAL(9,6),
      longitude     DECIMAL(9,6),
      total_animals INTEGER,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 5. animal_cases
    `CREATE TABLE IF NOT EXISTS animal_cases (
      id                      SERIAL PRIMARY KEY,
      case_ref                VARCHAR(20) UNIQUE,
      animal                  VARCHAR(200) NOT NULL,
      species                 VARCHAR(80),
      herd_size               INTEGER DEFAULT 1,
      owner_id                INTEGER REFERENCES livestock_owners(id),
      owner_name              VARCHAR(150),
      owner_contact           VARCHAR(15),
      village_area            VARCHAR(150),
      district_id             INTEGER REFERENCES districts(id),
      district                VARCHAR(100),
      latitude                DECIMAL(9,6),
      longitude               DECIMAL(9,6),
      symptoms                TEXT,
      suspected_disease       VARCHAR(100),
      confirmed_disease_id    INTEGER REFERENCES diseases(id),
      confirmed_disease       VARCHAR(100),
      disease_under_treatment VARCHAR(200),
      status                  case_status DEFAULT 'Pending',
      assigned_vet_id         INTEGER REFERENCES veterinary_officers(id),
      assigned_vet            VARCHAR(150),
      date_time               TIMESTAMPTZ DEFAULT NOW(),
      last_updated            TIMESTAMPTZ DEFAULT NOW(),
      vet_status              VARCHAR(200),
      lab_status              VARCHAR(200),
      notes                   TEXT,
      created_at              TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 6. case_timeline
    `CREATE TABLE IF NOT EXISTS case_timeline (
      id          SERIAL PRIMARY KEY,
      case_id     INTEGER NOT NULL REFERENCES animal_cases(id) ON DELETE CASCADE,
      event_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      event_text  TEXT NOT NULL,
      recorded_by VARCHAR(150)
    )`,

    // 7. outbreaks
    `CREATE TABLE IF NOT EXISTS outbreaks (
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
    )`,

    // 8. outbreak_cases
    `CREATE TABLE IF NOT EXISTS outbreak_cases (
      outbreak_id INTEGER NOT NULL REFERENCES outbreaks(id) ON DELETE CASCADE,
      case_id     INTEGER NOT NULL REFERENCES animal_cases(id) ON DELETE CASCADE,
      added_at    TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (outbreak_id, case_id)
    )`,

    // 9. lab_samples
    `CREATE TABLE IF NOT EXISTS lab_samples (
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
    )`,

    // 10. vaccination_drives
    `CREATE TABLE IF NOT EXISTS vaccination_drives (
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
    )`,

    // 11. vaccination_records
    `CREATE TABLE IF NOT EXISTS vaccination_records (
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
    )`,

    // 12. alerts
    `CREATE TABLE IF NOT EXISTS alerts (
      id          SERIAL PRIMARY KEY,
      alert_ref   VARCHAR(20) UNIQUE,
      level       alert_level DEFAULT 'info',
      title       VARCHAR(300),
      district_id INTEGER REFERENCES districts(id),
      district    VARCHAR(100),
      description TEXT,
      issued_by   VARCHAR(150) DEFAULT 'Department of Animal Husbandry, Maharashtra',
      status      VARCHAR(30)  DEFAULT 'Active',
      sent_at     TIMESTAMPTZ  DEFAULT NOW(),
      expires_at  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_animal_cases_district ON animal_cases(district_id)`,
    `CREATE INDEX IF NOT EXISTS idx_animal_cases_status   ON animal_cases(status)`,
    `CREATE INDEX IF NOT EXISTS idx_animal_cases_date     ON animal_cases(date_time DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_animal_cases_disease  ON animal_cases(suspected_disease)`,
    `CREATE INDEX IF NOT EXISTS idx_outbreaks_district    ON outbreaks(district_id)`,
    `CREATE INDEX IF NOT EXISTS idx_outbreaks_status      ON outbreaks(status)`,
    `CREATE INDEX IF NOT EXISTS idx_lab_samples_case      ON lab_samples(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_lab_samples_status    ON lab_samples(status)`,
    `CREATE INDEX IF NOT EXISTS idx_vax_drives_district   ON vaccination_drives(district_id)`,
    `CREATE INDEX IF NOT EXISTS idx_vax_drives_status     ON vaccination_drives(status)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_level          ON alerts(level)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_district       ON alerts(district_id)`,
  ];

  for (const stmt of stmts) {
    await run(stmt);
  }

  console.log('✅  Schema ready.');
}

// ─────────────────────────────────────────────
// SEED (truncate then re-insert)
// ─────────────────────────────────────────────
async function seed() {
  console.log('⏳  Truncating old data…');
  await run(`
    TRUNCATE vaccination_records, vaccination_drives, lab_samples,
             outbreak_cases, outbreaks, case_timeline, animal_cases,
             livestock_owners, veterinary_officers, alerts, diseases, districts
    RESTART IDENTITY CASCADE
  `);

  // ─── 1. DISTRICTS ─────────────────────────────
  console.log('   Districts…');
  const districtData = [
    ['Nashik', 'Nashik', 'Nashik', 20.0059, 73.7897, 'critical'],
    ['Pune', 'Pune', 'Pune', 18.5204, 73.8567, 'warning'],
    ['Ahmednagar', 'Pune', 'Ahmednagar', 19.0948, 74.7480, 'warning'],
    ['Solapur', 'Pune', 'Solapur', 17.6805, 75.9064, 'critical'],
    ['Latur', 'Aurangabad', 'Latur', 18.4088, 76.5604, 'warning'],
    ['Nagpur', 'Nagpur', 'Nagpur', 21.1458, 79.0882, 'normal'],
    ['Aurangabad', 'Aurangabad', 'Aurangabad', 19.8762, 75.3433, 'warning'],
    ['Amravati', 'Amravati', 'Amravati', 20.9374, 77.7796, 'normal'],
    ['Kolhapur', 'Pune', 'Kolhapur', 16.7050, 74.2433, 'normal'],
    ['Jalgaon', 'Nashik', 'Jalgaon', 21.0077, 75.5626, 'critical'],
    ['Raigad', 'Konkan', 'Alibag', 18.6414, 73.2329, 'normal'],
    ['Wardha', 'Nagpur', 'Wardha', 20.7453, 78.6022, 'warning'],
  ];

  const dMap = {};
  for (const [name, division, hq, lat, lng, risk] of districtData) {
    const row = await insert(
      `INSERT INTO districts (name, division, headquarters, latitude, longitude, risk_level)
       VALUES ($1,$2,$3,$4,$5,$6::risk_level) RETURNING id`,
      [name, division, hq, lat, lng, risk]
    );
    dMap[name] = row.id;
  }

  // ─── 2. DISEASES ──────────────────────────────
  console.log('   Diseases…');
  const diseaseData = [
    ['FMD', 'Foot and Mouth Disease', 'Viral', true, 'Highly contagious viral disease of cloven-hoofed animals.'],
    ['PPR', 'Peste des Petits Ruminants', 'Viral', true, 'Acute viral disease mainly affecting goats and sheep.'],
    ['HS', 'Haemorrhagic Septicaemia', 'Bacterial', true, 'Bacterial disease in cattle/buffalo caused by Pasteurella multocida.'],
    ['LSD', 'Lumpy Skin Disease', 'Viral', true, 'Viral disease in cattle causing skin nodules and systemic illness.'],
    ['BQ', 'Black Quarter', 'Bacterial', true, 'Acute febrile disease of cattle caused by Clostridium chauvoei.'],
    ['THEIL', 'Theileriosis', 'Parasitic', false, 'Tick-borne parasitic disease causing severe anaemia in cattle.'],
    ['ANTX', 'Anthrax', 'Bacterial', true, 'Acute bacterial disease caused by Bacillus anthracis; zoonotic.'],
    ['RVF', 'Rift Valley Fever', 'Viral', true, 'Zoonotic viral disease affecting ruminants and humans.'],
  ];

  const diseaseMap = {};
  for (const [code, full_name, category, is_notifiable, description] of diseaseData) {
    const row = await insert(
      `INSERT INTO diseases (code, full_name, category, is_notifiable, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [code, full_name, category, is_notifiable, description]
    );
    diseaseMap[code] = row.id;
  }

  // ─── 3. VETERINARY OFFICERS ───────────────────
  console.log('   Vets…');
  const vetData = [
    ['Dr. Arvind Patil', 'VET-MH-001', 'Nashik', '9876543210', 'a.patil@mahavet.gov.in', 'District Veterinary Officer'],
    ['Dr. Sunanda Kulkarni', 'VET-MH-002', 'Pune', '9756122334', 's.kulkarni@mahavet.gov.in', 'Assistant Veterinary Officer'],
    ['Dr. Ravi Deshmukh', 'VET-MH-003', 'Ahmednagar', '9890055678', 'r.deshmukh@mahavet.gov.in', 'District Veterinary Officer'],
    ['Dr. Meena Shinde', 'VET-MH-004', 'Solapur', '9823011223', 'm.shinde@mahavet.gov.in', 'Assistant Veterinary Officer'],
    ['Dr. Pramod More', 'VET-MH-005', 'Latur', '9765490876', 'p.more@mahavet.gov.in', 'Veterinary Surgeon'],
    ['Dr. Suresh Joshi', 'VET-MH-006', 'Aurangabad', '9930044556', 's.joshi@mahavet.gov.in', 'District Veterinary Officer'],
  ];

  const vetMap = {};
  for (const [name, emp_id, district, phone, email, designation] of vetData) {
    const row = await insert(
      `INSERT INTO veterinary_officers (name, employee_id, district_id, phone, email, designation)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [name, emp_id, dMap[district], phone, email, designation]
    );
    vetMap[name] = row.id;
  }

  // ─── 4. LIVESTOCK OWNERS ──────────────────────
  console.log('   Owners…');
  const ownerData = [
    ['Ramesh Jadhav', '9876543210', 'Niphad', 'Nashik', 20.0833, 73.7661, 12],
    ['Suresh Pawar', '9756122334', 'Baramati', 'Pune', 18.1471, 74.5773, 20],
    ['Kavita More', '9890055678', 'Shirdi', 'Ahmednagar', 19.7653, 74.4773, 1],
    ['Vijay Kale', '9823011223', 'Pandharpur', 'Solapur', 17.6805, 75.3328, 1],
    ['Anil Bansode', '9765490876', 'Udgir', 'Latur', 18.3964, 77.1118, 35],
    ['Nitin Joshi', '9930044556', 'Paithan', 'Aurangabad', 19.4756, 75.3887, 1],
    ['Bhimrao Wagare', '9821034561', 'Manmad', 'Nashik', 20.2552, 74.4316, 8],
    ['Laxmi Bhosale', '9834120098', 'Kopargaon', 'Ahmednagar', 19.8959, 74.4773, 3],
  ];

  const ownerMap = {};
  for (const [name, phone, village, district, lat, lng, animals] of ownerData) {
    const row = await insert(
      `INSERT INTO livestock_owners (name, phone, village, district_id, latitude, longitude, total_animals)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [name, phone, village, dMap[district], lat, lng, animals]
    );
    ownerMap[name] = row.id;
  }

  // ─── 5. ANIMAL CASES ──────────────────────────
  console.log('   Cases…');
  const caseData = [
    { case_ref: 'CS-2601', animal: 'Crossbred Cow (Herd of 12)', species: 'Bovine', herd_size: 12, owner: 'Ramesh Jadhav', village: 'Niphad', district: 'Nashik', lat: 20.0833, lng: 73.7661, symptoms: 'Excessive salivation, mouth blisters, lameness, reduced feed intake', suspected: 'FMD', confirmed: 'FMD', treatment: 'Antiseptic mouth wash, supportive fluids, anti-inflammatory medication', status: 'Active', vet: 'Dr. Arvind Patil', date: '2026-09-04T09:00:00+05:30', vet_status: 'Treatment ongoing', lab_status: 'Sample sent for confirmation' },
    { case_ref: 'CS-2602', animal: 'Goat Herd (20 animals)', species: 'Caprine', herd_size: 20, owner: 'Suresh Pawar', village: 'Baramati', district: 'Pune', lat: 18.1471, lng: 74.5773, symptoms: 'Fever, nasal discharge, diarrhoea, oral lesions', suspected: 'PPR', confirmed: 'PPR', treatment: 'Supportive care, electrolytes, antibiotics for secondary infection', status: 'Under Treatment', vet: 'Dr. Sunanda Kulkarni', date: '2026-09-04T10:00:00+05:30', vet_status: 'Treatment ongoing', lab_status: 'Pending sample collection' },
    { case_ref: 'CS-2603', animal: 'Buffalo (1 animal)', species: 'Bovine', herd_size: 1, owner: 'Kavita More', village: 'Shirdi', district: 'Ahmednagar', lat: 19.7653, lng: 74.4773, symptoms: 'Mouth blisters, mild fever, reduced appetite', suspected: 'FMD', confirmed: 'FMD', treatment: 'Completed full course of care; animal recovered', status: 'Resolved', vet: 'Dr. Ravi Deshmukh', date: '2026-08-18T09:00:00+05:30', vet_status: 'Recovered', lab_status: 'Negative' },
    { case_ref: 'CS-2604', animal: 'Crossbred Cow (1 animal)', species: 'Bovine', herd_size: 1, owner: 'Vijay Kale', village: 'Pandharpur', district: 'Solapur', lat: 17.6805, lng: 75.3328, symptoms: 'Suspected mouth lesions, fever — awaiting vet confirmation', suspected: 'FMD', confirmed: null, treatment: 'Not started — awaiting assessment', status: 'Pending', vet: 'Dr. Meena Shinde', date: '2026-09-06T08:00:00+05:30', vet_status: 'Pending vet visit', lab_status: 'Not initiated' },
    { case_ref: 'CS-2605', animal: 'Ovine Herd (Grass Cutter)', species: 'Ovine', herd_size: 35, owner: 'Anil Bansode', village: 'Udgir', district: 'Latur', lat: 18.3964, lng: 77.1118, symptoms: 'Skin nodules, mild fever, reduced milk yield', suspected: 'LSD', confirmed: 'LSD', treatment: 'Isolation, supportive therapy, insect control', status: 'Under Treatment', vet: 'Dr. Arvind Patil', date: '2026-09-03T11:00:00+05:30', vet_status: 'Treatment ongoing', lab_status: 'Sample under testing' },
    { case_ref: 'CS-2606', animal: 'Bullock (1 animal)', species: 'Bovine', herd_size: 1, owner: 'Nitin Joshi', village: 'Paithan', district: 'Aurangabad', lat: 19.4756, lng: 75.3887, symptoms: 'Nasal discharge, mild fever, depression', suspected: 'PPR', confirmed: 'PPR', treatment: 'Completed supportive course; animal recovered', status: 'Resolved', vet: 'Dr. Sunanda Kulkarni', date: '2026-08-25T10:00:00+05:30', vet_status: 'Recovered', lab_status: 'Negative' },
    { case_ref: 'CS-2607', animal: 'Cattle Herd (8 animals)', species: 'Bovine', herd_size: 8, owner: 'Bhimrao Wagare', village: 'Manmad', district: 'Nashik', lat: 20.2552, lng: 74.4316, symptoms: 'High fever, sudden death of one animal, swollen limbs, respiratory distress', suspected: 'HS', confirmed: 'HS', treatment: 'Oxytetracycline injection, supportive fluids, isolation of sick animals', status: 'Active', vet: 'Dr. Arvind Patil', date: '2026-09-06T07:30:00+05:30', vet_status: 'Treatment ongoing', lab_status: 'Collected' },
    { case_ref: 'CS-2608', animal: 'Mixed Cattle Herd (3 animals)', species: 'Bovine', herd_size: 3, owner: 'Laxmi Bhosale', village: 'Kopargaon', district: 'Ahmednagar', lat: 19.8959, lng: 74.4773, symptoms: 'Skin lesions, lumps on neck and back, fever 104°F, nasal discharge', suspected: 'LSD', confirmed: 'LSD', treatment: 'Insecticide spray, wound dressing, symptomatic treatment', status: 'Under Treatment', vet: 'Dr. Ravi Deshmukh', date: '2026-09-05T13:00:00+05:30', vet_status: 'Treatment ongoing', lab_status: 'Under Testing' },
  ];

  const caseMap = {};
  for (const c of caseData) {
    const row = await insert(
      `INSERT INTO animal_cases
         (case_ref, animal, species, herd_size, owner_id, owner_name, village_area,
          district_id, district, latitude, longitude, symptoms, suspected_disease,
          confirmed_disease_id, confirmed_disease, disease_under_treatment, status,
          assigned_vet_id, assigned_vet, date_time, vet_status, lab_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::case_status,$18,$19,$20,$21,$22)
       RETURNING id`,
      [c.case_ref, c.animal, c.species, c.herd_size,
      ownerMap[c.owner], c.owner, c.village,
      dMap[c.district], c.district, c.lat, c.lng,
      c.symptoms, c.suspected,
      c.confirmed ? diseaseMap[c.confirmed] : null, c.confirmed,
      c.treatment, c.status,
      vetMap[c.vet], c.vet,
      c.date, c.vet_status, c.lab_status]
    );
    caseMap[c.case_ref] = row.id;
  }

  // ─── 6. CASE TIMELINE ─────────────────────────
  console.log('   Timelines…');
  const timelines = [
    ['CS-2601', '2026-09-06T09:00:00+05:30', 'Daily clinical round completed', 'Dr. Arvind Patil'],
    ['CS-2601', '2026-09-05T16:00:00+05:30', 'Vaccination of contact herd completed', 'Field Officer'],
    ['CS-2601', '2026-09-04T12:00:00+05:30', 'Case registered by field officer', 'Field Officer'],
    ['CS-2602', '2026-09-05T17:00:00+05:30', 'Supportive treatment started', 'Dr. Sunanda Kulkarni'],
    ['CS-2602', '2026-09-04T10:00:00+05:30', 'Case reported by village volunteer', 'Village Volunteer'],
    ['CS-2603', '2026-09-01T14:00:00+05:30', 'Case resolved after 14-day observation', 'Dr. Ravi Deshmukh'],
    ['CS-2603', '2026-08-18T09:00:00+05:30', 'Treatment completed', 'Dr. Ravi Deshmukh'],
    ['CS-2604', '2026-09-06T08:00:00+05:30', 'Case reported by owner', 'Vijay Kale'],
    ['CS-2605', '2026-09-06T10:00:00+05:30', 'Follow-up visit completed', 'Dr. Arvind Patil'],
    ['CS-2605', '2026-09-03T11:00:00+05:30', 'Case registered', 'Field Officer'],
    ['CS-2606', '2026-08-30T13:00:00+05:30', 'Case resolved', 'Dr. Sunanda Kulkarni'],
    ['CS-2607', '2026-09-06T07:30:00+05:30', 'Case registered — 1 animal mortality noted', 'Dr. Arvind Patil'],
    ['CS-2607', '2026-09-06T10:00:00+05:30', 'Oxytetracycline administered to 7 animals', 'Dr. Arvind Patil'],
    ['CS-2608', '2026-09-05T13:00:00+05:30', 'Initial examination and isolation completed', 'Dr. Ravi Deshmukh'],
    ['CS-2608', '2026-09-05T15:00:00+05:30', 'Samples dispatched to RDDL Pune', 'Field Officer'],
  ];

  for (const [ref, ts, text, by] of timelines) {
    await run(
      `INSERT INTO case_timeline (case_id, event_time, event_text, recorded_by) VALUES ($1,$2,$3,$4)`,
      [caseMap[ref], ts, text, by]
    );
  }

  // ─── 7. OUTBREAKS ─────────────────────────────
  console.log('   Outbreaks…');
  const outbreakData = [
    ['OB-118', 'Nashik', 'FMD', 124, 124, 6, 11, 2, 'High', 'Active', 72.00, 'Increasing', '2026-08-20', '2026-09-06T09:00:00+05:30'],
    ['OB-117', 'Pune', 'PPR', 86, 86, 5, 7, 0, 'Medium', 'Monitoring', 91.00, 'Stable', '2026-08-25', '2026-09-06T09:00:00+05:30'],
    ['OB-116', 'Ahmednagar', 'FMD', 53, 53, 4, 5, 0, 'Low', 'Controlled', 73.00, 'Stable', '2026-08-28', '2026-09-05T09:00:00+05:30'],
    ['OB-115', 'Solapur', 'FMD', 47, 47, 4, 12, 1, 'Medium', 'Monitoring', 66.00, 'Increasing', '2026-08-30', '2026-09-05T09:00:00+05:30'],
    ['OB-114', 'Latur', 'LSD', 61, 61, 3, 6, 0, 'High', 'Active', 81.00, 'Stable', '2026-08-22', '2026-09-06T10:00:00+05:30'],
    ['OB-113', 'Aurangabad', 'PPR', 38, 38, 3, 4, 0, 'Medium', 'Monitoring', 69.00, 'Stable', '2026-08-26', '2026-09-05T09:00:00+05:30'],
    ['OB-112', 'Nagpur', 'HS', 22, 22, 2, 1, 0, 'Low', 'Controlled', 88.00, 'Decreasing', '2026-08-15', '2026-09-04T09:00:00+05:30'],
    ['OB-111', 'Amravati', 'HS', 12, 12, 1, 0, 0, 'Low', 'Controlled', 78.00, 'Decreasing', '2026-08-10', '2026-09-03T09:00:00+05:30'],
    ['OB-110', 'Jalgaon', 'PPR', 342, 342, 6, 18, 3, 'High', 'Active', 64.00, 'Increasing', '2026-08-18', '2026-09-06T09:00:00+05:30'],
  ];

  for (const [ref, district, disease, total, affected, villages, new7, mort7, risk, status, vacc, trend, started, lastRep] of outbreakData) {
    await run(
      `INSERT INTO outbreaks
         (outbreak_ref, district_id, district, disease_id, disease, total_cases, affected_animals,
          active_villages, new_cases_7d, mortality_7d, risk, status, vaccination_coverage,
          risk_trend, started_at, last_reported)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::outbreak_status,$13,$14,$15,$16)`,
      [ref, dMap[district], district, diseaseMap[disease], disease,
        total, affected, villages, new7, mort7, risk, status, vacc, trend, started, lastRep]
    );
  }

  // ─── 8. LAB SAMPLES ───────────────────────────
  console.log('   Lab samples…');
  const labData = [
    ['LAB-2041', 'CS-2601', 'Nashik', 'Epithelial Swab', 'ELISA', 'ELISA - FMD', 'FMD', 'Positive', '2026-09-04T12:00:00+05:30', '2026-09-05T08:00:00+05:30', '2026-09-06T09:00:00+05:30', 'Dr. Arvind Patil'],
    ['LAB-2040', 'CS-2602', 'Pune', 'Nasal Swab', 'PCR', 'PCR - PPR', 'PPR', 'Under Testing', '2026-09-05T11:00:00+05:30', null, null, 'Dr. Sunanda Kulkarni'],
    ['LAB-2039', 'CS-2604', 'Solapur', 'Blood', 'ELISA', 'ELISA - FMD', 'FMD', 'Report Ready', '2026-09-04T09:00:00+05:30', '2026-09-05T07:00:00+05:30', '2026-09-05T16:00:00+05:30', 'Dr. Meena Shinde'],
    ['LAB-2038', 'CS-2605', 'Latur', 'Tissue', 'PCR', 'PCR - LSD', 'LSD', 'Under Testing', '2026-09-04T13:00:00+05:30', null, null, 'Dr. Arvind Patil'],
    ['LAB-2037', 'CS-2603', 'Ahmednagar', 'Epithelial Swab', 'ELISA', 'ELISA - FMD', 'FMD', 'Negative', '2026-08-19T10:00:00+05:30', '2026-08-20T08:00:00+05:30', '2026-08-21T10:00:00+05:30', 'Dr. Ravi Deshmukh'],
    ['LAB-2036', 'CS-2606', 'Aurangabad', 'Nasal Swab', 'PCR', 'PCR - PPR', 'PPR', 'Negative', '2026-08-26T09:00:00+05:30', '2026-08-27T07:00:00+05:30', '2026-08-28T10:00:00+05:30', 'Dr. Sunanda Kulkarni'],
    ['LAB-2035', 'CS-2601', 'Nashik', 'Blood', 'PCR', 'PCR - FMD', 'FMD', 'Collected', '2026-09-05T14:00:00+05:30', null, null, 'Field Officer'],
    ['LAB-2034', 'CS-2607', 'Nashik', 'Blood', 'Culture', 'Culture - HS', 'HS', 'Collected', '2026-09-06T09:00:00+05:30', null, null, 'Dr. Arvind Patil'],
    ['LAB-2033', 'CS-2608', 'Ahmednagar', 'Tissue', 'PCR', 'PCR - LSD', 'LSD', 'Under Testing', '2026-09-05T16:00:00+05:30', null, null, 'Dr. Ravi Deshmukh'],
  ];

  for (const [ref, caseRef, district, sType, tMethod, tName, disease, status, collected, tested, reported, by] of labData) {
    await run(
      `INSERT INTO lab_samples
         (sample_ref, case_id, case_ref, district_id, district, sample_type, test_method,
          test_name, disease_id, status, collected_at, tested_at, reported_at, collected_by)
       VALUES ($1,$2,$3,$4,$5,$6::sample_type,$7::test_method,$8,$9,$10::lab_status,$11,$12,$13,$14)`,
      [ref, caseMap[caseRef], caseRef, dMap[district], district,
        sType, tMethod, tName, diseaseMap[disease], status,
        collected, tested, reported, by]
    );
  }

  // ─── 9. VACCINATION DRIVES ────────────────────
  console.log('   Vaccination drives…');
  const vaxData = [
    ['VAX-001', 'FMD', 'FMD Polyvalent Vaccine Type O/A/Asia1', 'Nashik', 1000, 820, 180, 'In Progress', '2026-09-12', 'Dr. Arvind Patil'],
    ['VAX-002', 'PPR', 'PPR Live Attenuated Vaccine', 'Pune', 760, 640, 120, 'In Progress', '2026-09-15', 'Dr. Sunanda Kulkarni'],
    ['VAX-003', 'HS', 'HS Oil Adjuvant Vaccine', 'Ahmednagar', 520, 430, 90, 'Scheduled', '2026-09-18', 'Dr. Ravi Deshmukh'],
    ['VAX-004', 'LSD', 'LSD Live Attenuated Vaccine', 'Latur', 650, 510, 140, 'In Progress', '2026-09-20', 'Dr. Arvind Patil'],
    ['VAX-005', 'FMD', 'FMD Polyvalent Vaccine Type O/A/Asia1', 'Solapur', 490, 380, 110, 'Scheduled', '2026-09-22', 'Dr. Meena Shinde'],
    ['VAX-006', 'PPR', 'PPR Live Attenuated Vaccine', 'Aurangabad', 385, 290, 95, 'Scheduled', '2026-09-25', 'Dr. Sunanda Kulkarni'],
    ['VAX-007', 'FMD', 'FMD Polyvalent Vaccine Type O/A/Asia1', 'Jalgaon', 800, 100, 700, 'In Progress', '2026-09-10', 'Dr. Arvind Patil'],
    ['VAX-008', 'BQ', 'Black Quarter Vaccine', 'Nagpur', 300, 280, 20, 'Completed', '2026-08-28', 'Dr. Suresh Joshi'],
  ];

  for (const [ref, disease, vaccine, district, target, completed, pending, status, date, by] of vaxData) {
    await run(
      `INSERT INTO vaccination_drives
         (drive_ref, disease_id, disease, vaccine_name, district_id, district,
          target_count, completed_count, pending_count, status, scheduled_date, conducted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::vax_status,$11,$12)`,
      [ref, diseaseMap[disease], disease, vaccine, dMap[district], district,
        target, completed, pending, status, date, by]
    );
  }

  // ─── 10. ALERTS ───────────────────────────────
  console.log('   Alerts…');
  const alertData = [
    ['AL-1042', 'critical', 'FMD outbreak spreading in Nashik', 'Nashik', '124 cases reported in the last 7 days. Ring vaccination drive prioritised for the affected belt.', 'Active', '2026-09-06T07:00:00+05:30'],
    ['AL-1043', 'critical', 'Lumpy Skin Disease containment in Solapur', 'Solapur', '47 cattle herds infected. Veterinary rapid response team deployed to quarantine boundary.', 'Active', '2026-09-06T05:00:00+05:30'],
    ['AL-1041', 'warning', 'PPR cases rising in Pune', 'Pune', '86 goat herds affected. Monitoring enhanced and clinical advisory dispatched to field staff.', 'Active', '2026-09-06T04:00:00+05:30'],
    ['AL-1040', 'warning', 'FMD cluster in Ahmednagar', 'Ahmednagar', '53 cases under control. Buffer zone surveillance initiated across 12 adjacent villages.', 'Sent', '2026-09-05T09:00:00+05:30'],
    ['AL-1039', 'info', 'Statewide Vaccination Drive scheduled in Latur', 'Latur', 'Free FMD and HS vaccination camps planned on 20 Sep for 400+ cattle.', 'Sent', '2026-09-04T09:00:00+05:30'],
    ['AL-1038', 'info', 'Biosecurity Protocol circular issued', 'Nashik', 'Standard Operating Procedures updated for live animal transit and weekly cattle markets.', 'Sent', '2026-09-03T10:00:00+05:30'],
    ['AL-1037', 'critical', 'PPR surge in Jalgaon — rapid response deployed', 'Jalgaon', '18 new cases in 24 hours. Field team dispatched. Movement restriction advisory issued.', 'Active', '2026-09-06T06:00:00+05:30'],
    ['AL-1036', 'warning', 'HS mortality reported in Nashik (Manmad)', 'Nashik', '1 animal mortality from suspected HS. Full herd under observation and treatment.', 'Active', '2026-09-06T08:00:00+05:30'],
  ];

  for (const [ref, level, title, district, desc, status, sent] of alertData) {
    await run(
      `INSERT INTO alerts (alert_ref, level, title, district_id, district, description, status, sent_at)
       VALUES ($1,$2::alert_level,$3,$4,$5,$6,$7,$8)`,
      [ref, level, title, dMap[district], district, desc, status, sent]
    );
  }

  console.log('✅  All data seeded successfully.');
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
(async () => {
  try {
    await createSchema();
    await seed();
    console.log('\n🎉  PashuRakshak database ready.\n');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌  Setup failed:', err.message, '\n', err.stack);
    await pool.end();
    process.exit(1);
  }
})();