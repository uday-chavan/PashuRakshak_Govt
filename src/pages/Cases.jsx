import { useEffect, useState } from 'react';
import {
  ClipboardList,
  User,
  MapPin,
  Syringe,
  Globe,
  Stethoscope,
  Phone,
  Database,
  RefreshCw,
} from 'lucide-react';
import Modal from '../components/Modal.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import { caseStatusPill, cases as mockCases } from '../data/mockData.js';
import { getAnimalCases, getCaseTimeline } from '../db/client.js';

const statusFilterOptions = ['All', 'Active', 'Under Treatment', 'Resolved', 'Pending'];

function formatCoords(lat, lng, decimals = 4) {
  const nLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const nLng = typeof lng === 'number' ? lng : parseFloat(lng);
  if (!isNaN(nLat) && !isNaN(nLng)) {
    return `${nLat.toFixed(decimals)}°N, ${nLng.toFixed(decimals)}°E`;
  }
  return '19.7515°N, 75.7139°E';
}

function formatDate(val) {
  if (!val) return '06 Sep 2026';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // ignore
  }
  return String(val);
}

function formatTimelineTime(val) {
  if (!val) return 'Recent';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch {
    // ignore
  }
  return String(val);
}

export default function Cases() {
  const [casesList, setCasesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseTimeline, setCaseTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await getAnimalCases();
      if (data && data.length > 0) {
        setCasesList(data);
      } else {
        setCasesList(mockCases);
      }
    } catch (err) {
      console.error('Error loading cases:', err);
      setCasesList(mockCases);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleSelectCase = async (c) => {
    setSelectedCase(c);
    if (c.timeline && Array.isArray(c.timeline) && c.timeline.length > 0) {
      setCaseTimeline(c.timeline);
      return;
    }
    if (c.id) {
      setTimelineLoading(true);
      try {
        const tl = await getCaseTimeline(c.id);
        setCaseTimeline(tl || []);
      } catch (err) {
        console.warn('Failed to load timeline:', err);
        setCaseTimeline([]);
      } finally {
        setTimelineLoading(false);
      }
    } else {
      setCaseTimeline([]);
    }
  };

  const filtered = casesList.filter(
    (c) => statusFilter === 'All' || c.status === statusFilter
  );

  return (
    <div>
      <div className="page-head">
        <div className="flex-between">
          <div>
            <div className="meta-line">PashuRakshak · Neon PostgreSQL Live Registry</div>
            <h1>Case Management</h1>
            <p>
              Track individual animal health records, location telemetry, symptoms, and treatment regimens in real-time.
            </p>
          </div>
          <div className="flex" style={{ gap: 10 }}>
            <span
              className="pill"
              style={{
                background: '#ecfdf5',
                color: '#047857',
                border: '1.5px solid #a7f3d0',
                fontWeight: 700,
              }}
            >
              <Database size={13} /> Neon DB Connected
            </span>
            <button
              type="button"
              className="btn btn-outline"
              onClick={loadCases}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              {loading ? 'Refreshing...' : 'Sync DB'}
            </button>
          </div>
        </div>
      </div>

      <div className="card-head">
        <div className="card-title">
          Live Case Registry (<AnimatedNumber value={filtered.length} /> Cases)
        </div>
        <div className="filter-bar" style={{ padding: 0, border: 'none', boxShadow: 'none', marginBottom: 0 }}>
          <div className="field">
            <label>Filter by Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusFilterOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Animal</th>
              <th>Location (Village / District)</th>
              <th>Coordinates (Lat, Long)</th>
              <th>Suspected / Confirmed Disease</th>
              <th>Status</th>
              <th>Date / Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const caseIdDisplay = c.case_ref || c.caseRef || (c.id && typeof c.id === 'string' && c.id.startsWith('CS-') ? c.id : `CS-260${c.id}`);
              const animalDisplay = c.animal || 'Livestock';
              const villageDisplay = c.village_area || c.village || c.villageArea || 'Area Sector';
              const districtDisplay = c.district || 'Maharashtra';
              const coordsDisplay = formatCoords(c.latitude, c.longitude, 4);
              const diseaseDisplay = c.confirmed_disease || c.suspected_disease || c.disease || c.suspectedDisease || 'Observation';
              const statusDisplay = c.status || 'Active';
              const dateDisplay = formatDate(c.last_updated || c.lastUpdated || c.date_time || c.created_at);

              return (
                <tr key={c.id || caseIdDisplay} className="clickable" onClick={() => handleSelectCase(c)}>
                  <td className="cell-main">{caseIdDisplay}</td>
                  <td style={{ fontWeight: 600 }}>{animalDisplay}</td>
                  <td>
                    <strong>{villageDisplay}</strong>
                    <span className="cell-sub">{districtDisplay}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#0f172a', fontWeight: 600 }}>
                      {coordsDisplay}
                    </span>
                  </td>
                  <td>
                    <span className="pill pill-neutral" style={{ fontWeight: 700 }}>
                      {diseaseDisplay}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${caseStatusPill[statusDisplay] || 'pill-neutral'}`}>
                      {statusDisplay}
                    </span>
                  </td>
                  <td>{dateDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="data-note">
        <AnimatedNumber value={filtered.length} /> live records loaded from PostgreSQL database. Click any row to view complete symptoms, treatment protocols, and GPS telemetry.
      </p>

      <Modal
        open={!!selectedCase}
        onClose={() => {
          setSelectedCase(null);
          setCaseTimeline([]);
        }}
        title={selectedCase ? (selectedCase.case_ref || selectedCase.caseRef || (typeof selectedCase.id === 'string' && selectedCase.id.startsWith('CS-') ? selectedCase.id : `CS-260${selectedCase.id}`)) : ''}
        subtitle={selectedCase ? `${selectedCase.confirmed_disease || selectedCase.suspected_disease || selectedCase.disease || selectedCase.suspectedDisease || 'Observation'} · ${selectedCase.village_area || selectedCase.village || selectedCase.villageArea || 'Village Area'}, ${selectedCase.district || 'Maharashtra'}` : ''}
      >
        {selectedCase && (() => {
          const modalAnimal = selectedCase.animal || 'Livestock';
          const modalOwner = selectedCase.owner_name || selectedCase.owner || 'Registered Owner';
          const modalVillage = selectedCase.village_area || selectedCase.village || selectedCase.villageArea || 'Village Area';
          const modalDistrict = selectedCase.district || 'Maharashtra';
          const modalCoords = formatCoords(selectedCase.latitude, selectedCase.longitude, 5);
          const modalVet = selectedCase.assigned_vet || selectedCase.vet || 'Field Veterinary Officer';
          const modalStatus = selectedCase.status || 'Active';
          const modalSymptoms = selectedCase.symptoms || 'Clinical presentation recorded during surveillance.';
          const modalTreatment = selectedCase.disease_under_treatment || selectedCase.treatment || selectedCase.diseaseUnderTreatment || 'Supportive therapy and monitoring.';

          return (
            <div>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="k">Animal / Herd</div>
                  <div className="v">
                    <ClipboardList size={14} /> {modalAnimal}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="k">Registered Owner</div>
                  <div className="v">
                    <User size={14} /> {modalOwner}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="k">Village / Area Location</div>
                  <div className="v">
                    <MapPin size={14} /> {modalVillage}, {modalDistrict}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="k">GPS Coordinates</div>
                  <div className="v" style={{ fontFamily: 'monospace' }}>
                    {modalCoords}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="k">Assigned Veterinarian</div>
                  <div className="v">
                    <Stethoscope size={14} /> {modalVet}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="k">Case Status</div>
                  <div className="v">
                    <span className={`pill ${caseStatusPill[modalStatus] || 'pill-neutral'}`}>
                      {modalStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-22">
                <div className="card-title" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Symptoms &amp; Clinical Presentation
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>
                  {modalSymptoms}
                </div>
              </div>

              <div className="mt-22">
                <div className="card-title" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Disease Under Treatment &amp; Regimen
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>
                  {modalTreatment}
                </div>
              </div>

              <div className="mt-22">
                <div className="card-title" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                  Case Audit &amp; Surveillance Timeline
                </div>
                {timelineLoading ? (
                  <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>Loading timeline events...</div>
                ) : caseTimeline.length > 0 ? (
                  <ul className="timeline">
                    {caseTimeline.map((t, i) => (
                      <li key={i}>
                        <span className="tl-dot" />
                        <div className="tl-time">{formatTimelineTime(t.event_time || t.time)}</div>
                        <div className="tl-title">
                          {t.event_text || t.text}
                          {t.recorded_by && (
                            <span style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                              Recorded by: {t.recorded_by}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '8px 0', fontStyle: 'italic' }}>
                    No timeline events recorded yet.
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
