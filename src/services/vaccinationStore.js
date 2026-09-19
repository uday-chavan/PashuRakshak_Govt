/**
 * PashuRakshak — Vaccination Schedule Store
 *
 * A lightweight singleton store that lets any component push a new
 * vaccination schedule entry and any other component subscribe to updates.
 * Every entry is also written to the Neon PostgreSQL `vaccination_drives` table.
 *
 * Usage (push):
 *   import { addScheduledVaccination } from './vaccinationStore';
 *   addScheduledVaccination({ disease, district, vaccine, upcomingDate });
 *
 * Usage (subscribe):
 *   import { subscribeSchedule, getScheduledVaccinations } from './vaccinationStore';
 *   const unsub = subscribeSchedule(() => setList(getScheduledVaccinations()));
 */

import { addVaccinationDrive } from '../db/client.js';

// ─── Internal state ───────────────────────────────────────────────────────────
let _scheduledVaccinations = []; // entries added via "Schedule Vaccination"
let _listeners = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _notify() {
  _listeners.forEach((fn) => {
    try { fn(); } catch (_) {}
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns a snapshot of all user-scheduled vaccination entries */
export function getScheduledVaccinations() {
  return [..._scheduledVaccinations];
}

/**
 * Add a new vaccination schedule entry and persist to DB.
 * @param {{ disease: string, district: string, vaccine?: string, count?: number, alertId?: string, scheduledDate?: string }} entry
 */
export async function addScheduledVaccination(entry) {
  const today = new Date();
  // Schedule the drive 7 days from today by default
  const driveDate = entry.scheduledDate
    ? new Date(entry.scheduledDate)
    : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const formattedDisplay = driveDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  // ISO date string for DB (YYYY-MM-DD)
  const isoDate = driveDate.toISOString().split('T')[0];

  const disease = entry.disease || 'Unknown';
  const vaccineName = entry.vaccine || `${disease} Vaccine`;
  const district = entry.district || 'Maharashtra';
  const targetCount = entry.count ? Math.max(entry.count * 10, 50) : 50;

  // Optimistically add to local store immediately
  const localEntry = {
    id: `VS-${Date.now()}`,
    disease,
    vaccine: vaccineName,
    vaccine_name: vaccineName,
    district,
    completed: 0,
    completed_count: 0,
    pending: targetCount,
    pending_count: targetCount,
    upcomingDate: formattedDisplay,
    scheduledAt: new Date().toISOString(),
    fromAlert: entry.alertId || null,
  };

  _scheduledVaccinations = [localEntry, ..._scheduledVaccinations];
  _notify();

  // Persist to DB asynchronously (fire-and-forget — UI already updated)
  try {
    await addVaccinationDrive({
      disease,
      vaccineName,
      district,
      targetCount,
      scheduledDate: isoDate,
      notes: entry.alertId ? `Scheduled from alert ${entry.alertId}` : null,
    });
  } catch (err) {
    console.warn('[VaccinationStore] DB write failed (UI still updated):', err.message);
  }

  return localEntry;
}

/** Subscribe to schedule changes. Returns an unsubscribe function. */
export function subscribeSchedule(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

/** Check if an alert has already been scheduled */
export function isAlertScheduled(alertId) {
  return _scheduledVaccinations.some((v) => v.fromAlert === alertId);
}
