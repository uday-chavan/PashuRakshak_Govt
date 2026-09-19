import { useState, useEffect } from 'react';
import { Syringe, Plus, X, CheckCircle2, Calendar } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import { vaccinationStats, vaccinationSchedule, vaccinationProgress } from '../data/mockData.js';
import { subscribeSchedule, getScheduledVaccinations, addScheduledVaccination } from '../services/vaccinationStore.js';
import { getLiveVaccinationSchedule } from '../db/client.js';

// Maharashtra districts dropdown
const MH_DISTRICTS = [
  'Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana',
  'Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna',
  'Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded',
  'Nandurbar','Nashik','Osmanabad','Palghar','Parbhani','Pune','Raigad',
  'Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha',
  'Washim','Yavatmal',
];

const DISEASES = ['FMD','PPR','HS','LSD','Anthrax','Brucellosis','Rabies','BQ','Theileriosis','Other'];

// ── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    disease: '',
    vaccine: '',
    district: '',
    targetCount: '',
    scheduledDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
    // Auto-fill vaccine name
    if (k === 'disease' && v) {
      setForm((f) => ({ ...f, disease: v, vaccine: `${v} Vaccine` }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.disease || !form.district || !form.scheduledDate) {
      setError('Disease, District and Date are required.');
      return;
    }
    setSaving(true);
    try {
      await addScheduledVaccination({
        disease: form.disease,
        vaccine: form.vaccine || `${form.disease} Vaccine`,
        district: form.district,
        count: form.targetCount ? Number(form.targetCount) : undefined,
        scheduledDate: form.scheduledDate,
        notes: form.notes || null,
      });
      setForm({ disease: '', vaccine: '', district: '', targetCount: '', scheduledDate: '', notes: '' });
      onSaved?.();
      onClose();
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal vacc-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Schedule New Vaccination Drive"
      >
        {/* Header */}
        <div className="vacc-modal-header">
          <div className="vacc-modal-title">
            <Syringe size={16} style={{ color: '#047857' }} />
            Schedule New Vaccination Drive
          </div>
          <button type="button" className="notif-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vacc-modal-body">
          <div className="vacc-modal-grid">
            {/* Disease */}
            <div className="vacc-form-group">
              <label className="vacc-form-label" htmlFor="vacc-disease">Disease *</label>
              <select
                id="vacc-disease"
                className="vacc-form-select"
                value={form.disease}
                onChange={(e) => setField('disease', e.target.value)}
                required
              >
                <option value="">Select disease…</option>
                {DISEASES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Vaccine Name */}
            <div className="vacc-form-group">
              <label className="vacc-form-label" htmlFor="vacc-vaccine">Vaccine Name</label>
              <input
                id="vacc-vaccine"
                className="vacc-form-input"
                type="text"
                placeholder="e.g. FMD Polyvalent Vaccine"
                value={form.vaccine}
                onChange={(e) => setField('vaccine', e.target.value)}
              />
            </div>

            {/* District */}
            <div className="vacc-form-group">
              <label className="vacc-form-label" htmlFor="vacc-district">District *</label>
              <select
                id="vacc-district"
                className="vacc-form-select"
                value={form.district}
                onChange={(e) => setField('district', e.target.value)}
                required
              >
                <option value="">Select district…</option>
                {MH_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Target Animals */}
            <div className="vacc-form-group">
              <label className="vacc-form-label" htmlFor="vacc-count">Target Animals</label>
              <input
                id="vacc-count"
                className="vacc-form-input"
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={form.targetCount}
                onChange={(e) => setField('targetCount', e.target.value)}
              />
            </div>

            {/* Scheduled Date */}
            <div className="vacc-form-group vacc-form-group--full">
              <label className="vacc-form-label" htmlFor="vacc-date">
                <Calendar size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                Scheduled Date *
              </label>
              <input
                id="vacc-date"
                className="vacc-form-input"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.scheduledDate}
                onChange={(e) => setField('scheduledDate', e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="vacc-form-group vacc-form-group--full">
              <label className="vacc-form-label" htmlFor="vacc-notes">Notes (optional)</label>
              <textarea
                id="vacc-notes"
                className="vacc-form-input vacc-form-textarea"
                placeholder="Additional notes or instructions…"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {error && (
            <div className="vacc-form-error">{error}</div>
          )}

          <div className="vacc-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Scheduling…' : (
                <><CheckCircle2 size={14} style={{ marginRight: 6 }} />Schedule Drive</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Vaccination() {
  const [animated, setAnimated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [alertSchedules, setAlertSchedules] = useState(() => getScheduledVaccinations());
  const [dbSchedules, setDbSchedules] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Animate progress bars
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Fetch live vaccination drives from DB
  const fetchDbSchedules = () => {
    getLiveVaccinationSchedule()
      .then((rows) => setDbSchedules(rows || []))
      .catch(() => setDbSchedules([]))
      .finally(() => setDbLoading(false));
  };

  useEffect(() => {
    fetchDbSchedules();
  }, []);

  // Subscribe to alert-triggered vaccinations
  useEffect(() => {
    const unsub = subscribeSchedule(() => {
      setAlertSchedules(getScheduledVaccinations());
      // Re-fetch DB after a short delay to pick up the DB write
      setTimeout(fetchDbSchedules, 600);
    });
    return unsub;
  }, []);

  // Build combined schedule: alert-triggered (local) + DB rows merged, deduped
  // Local entries that haven't been persisted yet are shown first
  const dbIds = new Set(dbSchedules.map((r) => r.drive_ref));
  const localOnlyEntries = alertSchedules.filter((e) => !dbIds.has(e.drive_ref));

  // Normalise DB rows to the same shape as mock data
  const normalisedDb = dbSchedules.map((r) => ({
    id: r.id,
    drive_ref: r.drive_ref,
    disease: r.disease || '—',
    vaccine: r.vaccine_name || r.vaccine || '—',
    district: r.district || '—',
    completed: Number(r.completed_count) || 0,
    pending: Number(r.pending_count) || Number(r.target_count) || 0,
    upcomingDate: r.scheduled_date
      ? new Date(r.scheduled_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      : '—',
    fromDb: true,
  }));

  // If DB has data, use it; otherwise fall back to mock + local entries
  const hasDbData = normalisedDb.length > 0;
  const combinedSchedule = hasDbData
    ? [...localOnlyEntries, ...normalisedDb]
    : [...localOnlyEntries, ...vaccinationSchedule];

  const alertCount = alertSchedules.length;

  return (
    <div>
      <div className="page-head">
        <div className="meta-line">PashuRakshak · Vaccination</div>
        <h1>Vaccination</h1>
        <p>Monitor vaccination drives, schedules and district-wise completion across Maharashtra.</p>
      </div>

      <div className="stat-grid">
        {vaccinationStats.map((s) => (
          <StatCard key={s.key} icon="Syringe" label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="grid-1-3 mt-22">
        {/* Progress Card */}
        <div className="card vacc-card-equal">
          <div className="card-head">
            <div>
              <div className="card-title">Vaccination Progress</div>
              <div className="card-subtitle">Disease-wise completion percentage</div>
            </div>
          </div>
          <div className="vacc-progress-list">
            {vaccinationProgress.map((v) => {
              const barClass = v.pct >= 80 ? '' : v.pct >= 65 ? 'orange' : 'sky';
              return (
                <div key={v.disease} className="vacc-progress-item">
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{v.disease} Vaccination</span>
                    <b style={{ fontSize: 12.5 }}>
                      <AnimatedNumber value={v.pct} suffix="%" />
                    </b>
                  </div>
                  <div className={`progress ${barClass}`}>
                    <span
                      style={{
                        width: animated ? `${v.pct}%` : '0%',
                        transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="data-note" style={{ marginTop: 'auto', paddingTop: 6 }}>
            Completion based on planned vaccination doses per disease.
          </p>
        </div>

        {/* Schedule Table Card */}
        <div className="card vacc-card-equal">
          <div className="card-head">
            <div style={{ width: '100%' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Syringe size={16} style={{ verticalAlign: '-2px' }} />
                  Vaccination Schedule
                </span>

                {/* ── Schedule New Vaccination button ── */}
                <button
                  type="button"
                  className="btn btn-primary vacc-schedule-btn"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus size={13} style={{ marginRight: 4 }} />
                  Schedule Drive
                </button>
              </div>
              <div className="card-subtitle">
                District-wise planned and completed vaccinations
              </div>
            </div>
          </div>

          <div className="table-wrap vacc-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Vaccine</th>
                  <th>District</th>
                  <th>Completed</th>
                  <th>Pending</th>
                  <th>Upcoming Date</th>
                </tr>
              </thead>
              <tbody>
                {dbLoading && normalisedDb.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
                      Loading schedule from database…
                    </td>
                  </tr>
                ) : combinedSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
                      No vaccination drives scheduled yet.
                    </td>
                  </tr>
                ) : (
                  combinedSchedule.map((r, i) => (
                    <tr
                      key={r.id || r.drive_ref || i}
                      className={r.isNew || r.fromAlert || (alertCount > 0 && i < alertCount) ? 'vacc-row--new' : ''}
                    >
                      <td className="cell-main">{r.disease}</td>
                      <td>{r.vaccine || r.vaccine_name}</td>
                      <td>{r.district}</td>
                      <td style={{ fontWeight: 600, color: '#047857' }}>
                        <AnimatedNumber value={r.completed} />
                      </td>
                      <td style={{ fontWeight: 600, color: '#d97706' }}>
                        <AnimatedNumber value={r.pending} />
                      </td>
                      <td>{r.upcomingDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule New Vaccination Modal */}
      <ScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchDbSchedules}
      />
    </div>
  );
}
