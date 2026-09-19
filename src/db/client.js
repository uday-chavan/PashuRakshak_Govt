/**
 * PashuRakshak — DATABASE CLIENT
 * Connects to Neon PostgreSQL and exposes typed service functions for all tables.
 * Falls back to empty arrays on error so the UI never crashes.
 */

import { neon } from '@neondatabase/serverless';
import { DISTRICT_COORDINATES, ALL_36_MAHARASHTRA_DISTRICTS, normalizeDistrictName } from '../data/maharashtraGeo.js';

const DB_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DATABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_DATABASE_URL) ||
  '';

let sql = null;
function getClient() {
  if (!sql && DB_URL) sql = neon(DB_URL);
  return sql;
}

// ─── HELPER ──────────────────────────────────────────────────────────────────
async function query(fn) {
  const client = getClient();
  if (!client) {
    console.warn('[DB] No DATABASE_URL — returning empty result');
    return [];
  }
  try {
    return await fn(client);
  } catch (err) {
    console.error('[DB] Query failed:', err.message);
    return [];
  }
}

// ─────────────────────────────────────────────
// ANIMAL CASES
// ─────────────────────────────────────────────

/** Returns all animal cases ordered by most recent first */
export async function getAnimalCases() {
  return query((sql) =>
    sql`SELECT * FROM animal_cases ORDER BY date_time DESC`
  );
}

/** Returns the N most recent cases */
export async function getRecentCases(limit = 5) {
  return query((sql) =>
    sql`SELECT * FROM animal_cases ORDER BY date_time DESC LIMIT ${limit}`
  );
}

/** Returns a single case by case_ref (e.g. 'CS-2601') */
export async function getCaseByRef(caseRef) {
  const rows = await query((sql) =>
    sql`SELECT * FROM animal_cases WHERE case_ref = ${caseRef} LIMIT 1`
  );
  return rows[0] ?? null;
}

/** Returns timeline events for a given case id */
export async function getCaseTimeline(caseId) {
  return query((sql) =>
    sql`SELECT * FROM case_timeline WHERE case_id = ${caseId} ORDER BY event_time DESC`
  );
}

/** Insert a new animal case */
export async function addAnimalCase(data) {
  const client = getClient();
  if (!client) throw new Error('No DB connection');
  const {
    animal, species = null, herdSize = 1,
    ownerName, ownerContact, villageArea,
    district, latitude, longitude,
    symptoms, suspectedDisease,
    diseaseUnderTreatment = null, status = 'Pending',
    assignedVet = null, dateTime = null,
  } = data;
  const [row] = await client`
    INSERT INTO animal_cases
      (animal, species, herd_size, owner_name, owner_contact, village_area,
       district, latitude, longitude, symptoms, suspected_disease,
       disease_under_treatment, status, assigned_vet, date_time)
    VALUES
      (${animal}, ${species}, ${herdSize}, ${ownerName}, ${ownerContact},
       ${villageArea}, ${district}, ${latitude}, ${longitude},
       ${symptoms}, ${suspectedDisease}, ${diseaseUnderTreatment},
       ${status}, ${assignedVet}, ${dateTime ?? new Date()})
    RETURNING *
  `;
  return row;
}

/** Update case status */
export async function updateCaseStatus(caseId, status) {
  const client = getClient();
  if (!client) throw new Error('No DB connection');
  const [row] = await client`
    UPDATE animal_cases
    SET status = ${status}, last_updated = NOW()
    WHERE id = ${caseId}
    RETURNING *
  `;
  return row;
}

// ─────────────────────────────────────────────
// OUTBREAKS
// ─────────────────────────────────────────────

export async function getOutbreaks() {
  return query((sql) =>
    sql`SELECT * FROM outbreaks ORDER BY last_reported DESC`
  );
}

export async function getActiveOutbreaks() {
  return query((sql) =>
    sql`SELECT * FROM outbreaks WHERE status IN ('Active','Monitoring') ORDER BY last_reported DESC`
  );
}

// ─────────────────────────────────────────────
// LAB SAMPLES
// ─────────────────────────────────────────────

export async function getLabSamples() {
  return query((sql) =>
    sql`SELECT * FROM lab_samples ORDER BY collected_at DESC`
  );
}

export async function getLabSamplesByCase(caseId) {
  return query((sql) =>
    sql`SELECT * FROM lab_samples WHERE case_id = ${caseId} ORDER BY collected_at DESC`
  );
}

// ─────────────────────────────────────────────
// VACCINATION DRIVES
// ─────────────────────────────────────────────

export async function getVaccinationDrives() {
  return query((sql) =>
    sql`SELECT * FROM vaccination_drives ORDER BY scheduled_date ASC`
  );
}

export async function getActiveVaccinationDrives() {
  return query((sql) =>
    sql`SELECT * FROM vaccination_drives WHERE status IN ('Scheduled','In Progress') ORDER BY scheduled_date ASC`
  );
}

/** Fetch all vaccination drives for the schedule table (ordered by scheduled_date) */
export async function getLiveVaccinationSchedule() {
  return query((sql) =>
    sql`SELECT * FROM vaccination_drives ORDER BY scheduled_date ASC`
  );
}

/**
 * Insert a new vaccination drive into the database.
 * @param {{ disease: string, vaccineName: string, district: string, targetCount: number, scheduledDate: string, notes?: string }} data
 */
export async function addVaccinationDrive(data) {
  const client = getClient();
  if (!client) throw new Error('No DB connection');

  const {
    disease,
    vaccineName,
    district,
    targetCount = 0,
    scheduledDate,
    notes = null,
  } = data;

  // Auto-generate a drive_ref like VD-2601
  const driveRef = `VD-${Date.now().toString().slice(-6)}`;

  const [row] = await client`
    INSERT INTO vaccination_drives
      (drive_ref, disease, vaccine_name, district, target_count,
       pending_count, status, scheduled_date, notes)
    VALUES
      (${driveRef}, ${disease}, ${vaccineName}, ${district},
       ${targetCount}, ${targetCount}, 'Scheduled',
       ${scheduledDate}::date, ${notes})
    RETURNING *
  `;
  return row;
}


// ─────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────

export async function getAlerts() {
  return query((sql) =>
    sql`SELECT * FROM alerts ORDER BY sent_at DESC`
  );
}

export async function getActiveAlerts() {
  return query((sql) =>
    sql`SELECT * FROM alerts WHERE status = 'Active' ORDER BY sent_at DESC`
  );
}

export async function addAlert(data) {
  const client = getClient();
  if (!client) throw new Error('No DB connection');
  const { alertRef, level, title, district, description } = data;
  const [row] = await client`
    INSERT INTO alerts (alert_ref, level, title, district, description)
    VALUES (${alertRef}, ${level}, ${title}, ${district}, ${description})
    RETURNING *
  `;
  return row;
}

// ─────────────────────────────────────────────
// DISTRICTS & DISEASES (master data)
// ─────────────────────────────────────────────

export async function getDistricts() {
  return query((sql) => sql`SELECT * FROM districts ORDER BY name`);
}

export async function getDiseases() {
  return query((sql) => sql`SELECT * FROM diseases ORDER BY code`);
}

// ─────────────────────────────────────────────
// STATS AGGREGATES & HOTSPOTS
// ─────────────────────────────────────────────

/** Returns active case count, active outbreaks, and total affected animals */
export async function getDashboardStats() {
  const client = getClient();
  if (!client) return null;
  try {
    const [stats] = await client`
      SELECT
        (SELECT COUNT(*) FROM animal_cases  WHERE status IN ('Active','Under Treatment','Pending'))  AS active_cases,
        (SELECT COUNT(*) FROM outbreaks     WHERE status IN ('Active','Monitoring'))                 AS active_outbreaks,
        (SELECT COALESCE(SUM(herd_size),0) FROM animal_cases WHERE status IN ('Active','Under Treatment')) AS affected_animals,
        (SELECT COUNT(*) FROM districts     WHERE risk_level = 'critical')                           AS high_risk_areas
    `;
    return {
      activeCases: Number(stats.active_cases),
      activeOutbreaks: Number(stats.active_outbreaks),
      affectedAnimals: Number(stats.affected_animals),
      highRiskAreas: Number(stats.high_risk_areas),
    };
  } catch (err) {
    console.error('[DB] getDashboardStats failed:', err.message);
    return null;
  }
}

/**
 * Returns dynamic district-level hotspot intelligence data for maps & dashboards.
 * Aggregates live numbers from districts, outbreaks, animal_cases, and lab_samples.
 */
export async function getHotspotDistricts() {
  const buildBaseline = () => {
    return ALL_36_MAHARASHTRA_DISTRICTS.map((distName, idx) => ({
      id: idx + 1,
      district: distName,
      latitude: DISTRICT_COORDINATES[distName]?.lat || 19.45,
      longitude: DISTRICT_COORDINATES[distName]?.lng || 76.2,
      risk: 'normal',
      disease: 'None',
      affected: 0,
      affectedAnimals: 0,
      newCases: 0,
      activeVillages: 0,
      vaccinationCoverage: 80,
      riskTrend: 'Stable',
      pendingLab: 0,
      lastReported: 'Recent',
      recentActivity: [
        { day: 'Today', delta: '0' },
        { day: 'Yesterday', delta: '0' },
        { day: '2 days ago', delta: '0' },
      ],
    }));
  };

  const client = getClient();
  if (!client) return buildBaseline();

  try {
    const rows = await client`
      SELECT
        d.id,
        d.name AS district,
        COALESCE(d.latitude, 19.45) AS latitude,
        COALESCE(d.longitude, 76.2) AS longitude,
        COALESCE(o.risk, d.risk_level::text, 'normal') AS risk,
        COALESCE(o.disease, (
          SELECT COALESCE(suspected_disease, confirmed_disease)
          FROM animal_cases ac
          WHERE ac.district_id = d.id OR ac.district ILIKE d.name OR ac.district ILIKE ('%' || d.name || '%')
          ORDER BY ac.date_time DESC LIMIT 1
        ), 'None') AS disease,
        COALESCE(o.affected_animals, (
          SELECT COALESCE(SUM(ac.herd_size), COUNT(ac.id))
          FROM animal_cases ac
          WHERE ac.district_id = d.id OR ac.district ILIKE d.name OR ac.district ILIKE ('%' || d.name || '%')
        ), 0)::int AS affected,
        COALESCE(o.affected_animals, (
          SELECT COALESCE(SUM(ac.herd_size), COUNT(ac.id))
          FROM animal_cases ac
          WHERE ac.district_id = d.id OR ac.district ILIKE d.name OR ac.district ILIKE ('%' || d.name || '%')
        ), 0)::int AS "affectedAnimals",
        COALESCE(o.new_cases_7d, (
          SELECT COUNT(*)
          FROM animal_cases ac
          WHERE (ac.district_id = d.id OR ac.district ILIKE d.name OR ac.district ILIKE ('%' || d.name || '%'))
            AND ac.date_time >= NOW() - INTERVAL '7 days'
        ), 0)::int AS "newCases",
        COALESCE(o.active_villages, (
          SELECT COUNT(DISTINCT ac.village_area)
          FROM animal_cases ac
          WHERE ac.district_id = d.id OR ac.district ILIKE d.name OR ac.district ILIKE ('%' || d.name || '%')
        ), 0)::int AS "activeVillages",
        COALESCE(o.vaccination_coverage, 75.0)::float AS "vaccinationCoverage",
        COALESCE(o.risk_trend, 'Stable') AS "riskTrend",
        COALESCE((
          SELECT COUNT(*)
          FROM lab_samples ls
          WHERE (ls.district_id = d.id OR ls.district ILIKE d.name OR ls.district ILIKE ('%' || d.name || '%'))
            AND ls.status IN ('Collected', 'Under Testing')
        ), 0)::int AS "pendingLab",
        TO_CHAR(COALESCE(o.last_reported, d.updated_at, NOW()), 'DD Mon YYYY') AS "lastReported"
      FROM districts d
      LEFT JOIN outbreaks o ON (o.district_id = d.id OR o.district ILIKE d.name) AND o.status IN ('Active', 'Monitoring')
      ORDER BY 
        CASE COALESCE(o.risk, d.risk_level::text)
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          ELSE 3
        END,
        d.name
    `;

    const mappedDbRows = rows.map((r) => {
      const canonical = normalizeDistrictName(r.district);
      const coords = DISTRICT_COORDINATES[canonical] || DISTRICT_COORDINATES[r.district] || { lat: Number(r.latitude) || 19.45, lng: Number(r.longitude) || 76.2 };
      return {
        ...r,
        district: canonical,
        latitude: coords.lat,
        longitude: coords.lng,
        affected: Number(r.affected) || 0,
        affectedAnimals: Number(r.affectedAnimals) || 0,
        newCases: Number(r.newCases) || 0,
        activeVillages: Number(r.activeVillages) || 0,
        vaccinationCoverage: Number(r.vaccinationCoverage) || 75,
        pendingLab: Number(r.pendingLab) || 0,
        recentActivity: [
          { day: 'Today', delta: `+${Math.max(0, Math.round((Number(r.newCases) || 0) * 0.5))}` },
          { day: 'Yesterday', delta: `+${Math.max(0, Math.round((Number(r.newCases) || 0) * 0.3))}` },
          { day: '2 days ago', delta: `+${Math.max(0, Math.round((Number(r.newCases) || 0) * 0.2))}` },
        ],
      };
    });

    // Ensure all 36 districts are covered even if missing in DB table
    const existingNames = new Set(mappedDbRows.map((x) => x.district.toLowerCase()));
    const missing = ALL_36_MAHARASHTRA_DISTRICTS.filter((d) => !existingNames.has(d.toLowerCase())).map((distName, idx) => ({
      id: 500 + idx,
      district: distName,
      latitude: DISTRICT_COORDINATES[distName]?.lat || 19.45,
      longitude: DISTRICT_COORDINATES[distName]?.lng || 76.2,
      risk: 'normal',
      disease: 'None',
      affected: 0,
      affectedAnimals: 0,
      newCases: 0,
      activeVillages: 0,
      vaccinationCoverage: 80,
      riskTrend: 'Stable',
      pendingLab: 0,
      lastReported: 'Recent',
      recentActivity: [
        { day: 'Today', delta: '0' },
        { day: 'Yesterday', delta: '0' },
        { day: '2 days ago', delta: '0' },
      ],
    }));

    return [...mappedDbRows, ...missing];
  } catch (err) {
    console.error('[DB] getHotspotDistricts failed:', err.message);
    return buildBaseline();
  }
}
