import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard.jsx';
import SimpleChart from '../components/SimpleChart.jsx';
import LeafletMapView from '../components/LeafletMapView.jsx';
import MapErrorBoundary from '../components/MapErrorBoundary.jsx';
import AlertPanel from '../components/AlertPanel.jsx';
import {
  overviewStats,
  importantAlerts,
  hotspotDistricts as mockHotspotDistricts,
  diseaseActivity,
} from '../data/mockData.js';
import { getAnimalCases, getHotspotDistricts } from '../db/client.js';

const chartData = diseaseActivity.map((d) => ({
  label: d.month,
  cases: d.cases,
  mortality: d.mortality,
}));

const statusPill = {
  Active: 'pill-active',
  'Under Treatment': 'pill-pending',
  Resolved: 'pill-complete',
  Pending: 'pill-neutral',
};

export default function Overview() {
  const [selected, setSelected] = useState(null);
  const [liveDistricts, setLiveDistricts] = useState(mockHotspotDistricts);
  const [liveRecentCases, setLiveRecentCases] = useState([]);
  const [casePins, setCasePins] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);

  useEffect(() => {
    // Fetch live hotspot districts from DB
    getHotspotDistricts()
      .then((data) => {
        if (data && data.length > 0) {
          setLiveDistricts(data);
        }
      })
      .catch((err) => console.warn('[Overview] getHotspotDistricts fallback:', err));

    // Fetch live animal cases from DB
    getAnimalCases()
      .then((data) => {
        setLiveRecentCases(data.slice(0, 5));
        // Build pin data for map — only cases with valid coordinates
        setCasePins(
          data
            .filter((c) => c.latitude && c.longitude)
            .map((c) => ({
              id: c.id,
              caseRef: c.case_ref,
              lat: parseFloat(c.latitude),
              lng: parseFloat(c.longitude),
              animal: c.animal,
              village: c.village_area,
              district: c.district,
              disease: c.suspected_disease || c.confirmed_disease,
              status: c.status,
              vet: c.assigned_vet,
            }))
        );
      })
      .catch(() => { setLiveRecentCases([]); setCasePins([]); })
      .finally(() => setCasesLoading(false));
  }, []);

  // Escape key listener to clear selection & return map to default
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedDistrict = selected
    ? liveDistricts.find((d) => (d.district || d.name) === (selected.district || selected.name))
    : null;

  return (
    <div>
      <div className="page-head">
        <div className="meta-line">PashuRakshak · Government Dashboard</div>
        <h1>Overview</h1>
      </div>

      <div className="stat-grid">
        {overviewStats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="grid-1-2 mt-22">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Maharashtra Disease Hotspot Map</div>
              <div className="card-subtitle">
                District-wise risk levels overlay. Click a marker for details.
              </div>
            </div>
          </div>

          <MapErrorBoundary height={440}>
            <LeafletMapView
              districts={liveDistricts}
              casePins={casePins}
              selected={selectedDistrict?.district || selectedDistrict?.name}
              height={440}
              onSelect={(d) => setSelected(d)}
            />
          </MapErrorBoundary>
          <div className="legend mt-18" style={{ flexWrap: 'wrap', gap: '10px 18px' }}>
            <span className="lg"><span className="dot" style={{ background: '#2fa36b' }} /> Normal</span>
            <span className="lg"><span className="dot" style={{ background: '#f59e0b' }} /> Attention</span>
            <span className="lg"><span className="dot" style={{ background: '#dc2626' }} /> Critical</span>
            <span style={{ borderLeft: '1px solid var(--line)', margin: '0 4px' }} />
            <span className="lg" style={{ fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 9, height: 9, background: '#dc2626', transform: 'rotate(45deg)', display: 'inline-block', marginRight: 3, borderRadius: 1 }} /> Active case
            </span>
            <span className="lg" style={{ fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 9, height: 9, background: '#f59e0b', transform: 'rotate(45deg)', display: 'inline-block', marginRight: 3, borderRadius: 1 }} /> Under treatment
            </span>
            <span className="lg" style={{ fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 9, height: 9, background: '#6366f1', transform: 'rotate(45deg)', display: 'inline-block', marginRight: 3, borderRadius: 1 }} /> Pending
            </span>
            <span className="lg" style={{ fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 9, height: 9, background: '#10b981', transform: 'rotate(45deg)', display: 'inline-block', marginRight: 3, borderRadius: 1 }} /> Resolved
            </span>
            {casePins.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                {casePins.length} live DB case{casePins.length !== 1 ? 's' : ''} plotted
              </span>
            )}
          </div>
          {selectedDistrict && (
            <div
              className="mt-18"
              style={{
                background: 'var(--green-50)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 13,
              }}
            >
              <b>{selectedDistrict.district}</b> — {selectedDistrict.disease}, risk{' '}
              <b>
                {selectedDistrict.risk === 'critical'
                  ? 'Critical'
                  : selectedDistrict.risk === 'warning'
                    ? 'Attention'
                    : 'Normal'}
              </b>
              <span style={{ color: 'var(--muted)' }}>
                {' '}· {selectedDistrict.affected} affected animals · last reported{' '}
                {selectedDistrict.lastReported}
              </span>
            </div>
          )}
        </div>

        <div className="card card-alerts">
          <div className="card-head">
            <div>
              <div className="card-title">Important Alerts</div>
              <div className="card-subtitle">Categorized by urgency level &amp; real-time updates</div>
            </div>
          </div>
          <AlertPanel alerts={importantAlerts} />
        </div>
      </div>

      <div className="grid-1-2 mt-22">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Disease Activity</div>
              <div className="card-subtitle">Reported cases and mortality by month</div>
            </div>
          </div>
          <SimpleChart
            data={chartData}
            lines={[
              { dataKey: 'cases', name: 'Cases', color: '#047857' },
              { dataKey: 'mortality', name: 'Mortality', color: '#dc2626' },
            ]}
          />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent Cases</div>
              <div className="card-subtitle">
                Live records from Central Database &nbsp;
                <span style={{
                  display: 'inline-block',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  verticalAlign: 'middle',
                  marginLeft: 2,
                }} />
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Animal</th>
                  <th>Village / District</th>
                  <th>Disease</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {casesLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
                      Loading live records from database…
                    </td>
                  </tr>
                ) : liveRecentCases.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
                      No records found
                    </td>
                  </tr>
                ) : liveRecentCases.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-main">{c.case_ref || c.caseRef || (typeof c.id === 'string' && c.id.startsWith('CS-') ? c.id : `CS-260${c.id}`)}</td>
                    <td>{c.animal}</td>
                    <td>
                      {c.village_area || c.village || c.villageArea || 'Area Sector'}
                      <span className="cell-sub">{c.district}</span>
                    </td>
                    <td>
                      <span className="pill pill-neutral">{c.confirmed_disease || c.suspected_disease || c.disease || c.suspectedDisease}</span>
                    </td>
                    <td>
                      <span className={`pill ${statusPill[c.status] || 'pill-neutral'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="data-note">
        Case records loaded live from Neon PostgreSQL (pg-18). District risk data is demonstration overlay.
      </p>
    </div>
  );
}
