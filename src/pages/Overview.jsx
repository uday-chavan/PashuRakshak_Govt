import { useState, useEffect, useCallback } from 'react';
import { Sparkles, MapPin, ChevronRight } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import TypewriterTitle from '../components/TypewriterTitle.jsx';
import DiseaseActivityChart from '../components/DiseaseActivityChart.jsx';
import LeafletMapView from '../components/LeafletMapView.jsx';
import MapErrorBoundary from '../components/MapErrorBoundary.jsx';
import AlertPanel from '../components/AlertPanel.jsx';
import {
  overviewStats,
  importantAlerts as defaultImportantAlerts,
  hotspotDistricts as mockHotspotDistricts,
  diseaseActivity,
} from '../data/mockData.js';
import { getAnimalCases, getHotspotDistricts } from '../db/client.js';
import { generateAllDiseaseAlerts } from '../services/geminiAlertService.js';
import { startPolling, stopPolling, subscribe, resetPolling } from '../services/pollingService.js';
import {
  parseAnimalCaseToPin,
  normalizeDistrictName,
  matchDistrict,
  DISTRICT_COORDINATES,
  getDistrictFromCoordinates,
  getNearestTownAndDistrict,
} from '../data/maharashtraGeo.js';

const statusPill = {
  Active: 'pill-active',
  'Under Treatment': 'pill-pending',
  Resolved: 'pill-complete',
  Pending: 'pill-neutral',
};

export default function Overview({ onNewCases }) {
  const [selected, setSelected] = useState(null);
  const [liveDistricts, setLiveDistricts] = useState(mockHotspotDistricts);
  const [liveRecentCases, setLiveRecentCases] = useState([]);
  const [casePins, setCasePins] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [alerts, setAlerts] = useState(defaultImportantAlerts);
  const [aiAlertsLoading, setAiAlertsLoading] = useState(false);

  // ── Helper: build map pins from raw cases (handles mobile coordinate formats & unswapping) ───
  const buildPins = useCallback((data) => {
    if (!Array.isArray(data)) return [];
    return data.map(parseAnimalCaseToPin).filter(Boolean);
  }, []);

  // ── Helper: refresh all live data from DB ─────────────────────────────
  const refreshFromDB = useCallback(async () => {
    try {
      const [casesData, districtsData] = await Promise.all([
        getAnimalCases(),
        getHotspotDistricts(),
      ]);

      setLiveRecentCases(casesData.slice(0, 5));
      const pins = buildPins(casesData);
      setCasePins(pins);

      if (districtsData && districtsData.length > 0) {
        setLiveDistricts(districtsData);
      }
    } catch (err) {
      console.warn('[Overview] refreshFromDB error:', err);
    }
  }, [buildPins]);

  // ── Initial data load ─────────────────────────────────────────────────
  useEffect(() => {
    getHotspotDistricts()
      .then((data) => {
        if (data && data.length > 0) setLiveDistricts(data);
      })
      .catch((err) => console.warn('[Overview] getHotspotDistricts fallback:', err));

    getAnimalCases()
      .then((data) => {
        setLiveRecentCases(data.slice(0, 5));
        setCasePins(buildPins(data));
      })
      .catch(() => { setLiveRecentCases([]); setCasePins([]); })
      .finally(() => setCasesLoading(false));
  }, [buildPins]);

  // ── Polling: start background check on mount, stop on unmount ─────────
  useEffect(() => {
    resetPolling(); // re-establish baseline when component mounts

    const unsub = subscribe(async ({ newCases, allCases }) => {
      // 1. Refresh map pins and recent cases table
      setLiveRecentCases(allCases.slice(0, 5));
      const pins = buildPins(allCases);
      setCasePins(pins);

      // 2. Re-fetch districts to get updated hotspot risk levels
      getHotspotDistricts()
        .then((d) => { if (d && d.length > 0) setLiveDistricts(d); })
        .catch(() => {});

      // 3. Bubble new case events up to App-level notification system
      if (onNewCases && newCases.length > 0) {
        // Group new cases by disease and resolved district for the notification payload
        const diseaseMap = new Map();
        newCases.forEach((c) => {
          const rawLat = c.latitude ?? c.lat;
          const rawLng = c.longitude ?? c.lng;
          const { village, district } = getNearestTownAndDistrict(
            rawLat,
            rawLng,
            c.village_area || c.village || c.villageArea || c.location || '',
            c.district
          );
          const disease = c.suspected_disease || c.confirmed_disease || c.disease || 'General Livestock Health Distress';
          const resolvedDist = district || 'Maharashtra';
          const key = `${disease}__${resolvedDist}`;
          const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat);
          const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng);

          if (!diseaseMap.has(key)) {
            diseaseMap.set(key, {
              disease,
              district: resolvedDist,
              village,
              count: 0,
              latestDate: c.date_time || c.dateTime,
              lat: !isNaN(lat) ? lat : null,
              lng: !isNaN(lng) ? lng : null,
            });
          }
          diseaseMap.get(key).count += 1;
        });
        onNewCases([...diseaseMap.values()]);
      }
    });

    startPolling();

    return () => {
      unsub();
      stopPolling();
    };
  }, [buildPins, onNewCases]);

  // ── Regenerate alerts whenever case pins or districts update ──────────
  useEffect(() => {
    try {
      const newAlerts = generateAllDiseaseAlerts(casePins, liveDistricts);
      if (newAlerts && newAlerts.length > 0) {
        setAlerts(newAlerts);
      }
    } catch (err) {
      console.warn('[Overview] Alert generation error:', err);
    }
  }, [casePins, liveDistricts]);

  // ── Escape key to clear selection ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const selectedDistrictName = typeof selected === 'string' ? selected : (selected?.district || selected?.name || '');
  const selectedDistrict = selectedDistrictName
    ? liveDistricts.find((d) => matchDistrict(d.district || d.name, selectedDistrictName)) || (typeof selected === 'object' ? selected : null)
    : null;

  const handleViewOnMap = useCallback((target) => {
    if (!target) return;
    let rawDist = '';
    let targetCoords = null;

    if (typeof target === 'string') {
      rawDist = target;
    } else if (target && typeof target === 'object') {
      rawDist = target.district || target.name || '';
      if (typeof target.lat === 'number' && typeof target.lng === 'number' && !isNaN(target.lat) && !isNaN(target.lng)) {
        targetCoords = { lat: target.lat, lng: target.lng };
      }
    }

    const cleanDist = normalizeDistrictName(rawDist);

    // If target didn't have coordinates, find in live casePins or DISTRICT_COORDINATES
    if (!targetCoords) {
      const matchingCase = casePins.find((p) => matchDistrict(p.district, cleanDist));
      if (matchingCase && typeof matchingCase.lat === 'number' && !isNaN(matchingCase.lat)) {
        targetCoords = { lat: matchingCase.lat, lng: matchingCase.lng };
      } else {
        const centroid = DISTRICT_COORDINATES[cleanDist] || DISTRICT_COORDINATES[rawDist];
        if (centroid) {
          targetCoords = { lat: centroid.lat, lng: centroid.lng };
        }
      }
    }

    const matchedDistrict = liveDistricts.find(
      (d) => matchDistrict(d.district || d.name, cleanDist)
    );

    const selectionObj = {
      ...(matchedDistrict || { district: cleanDist, name: cleanDist, risk: 'normal' }),
      district: cleanDist,
      name: cleanDist,
      lat: targetCoords?.lat,
      lng: targetCoords?.lng,
      zoom: targetCoords ? 12 : 10,
      timestamp: Date.now(),
    };

    setSelected(selectionObj);

    // Smooth scroll to map card
    const mapCard = document.getElementById('overview-map-card');
    if (mapCard) {
      mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [casePins, liveDistricts]);

  // Listen for external "View on Map" triggers (e.g. from Notification Toast)
  useEffect(() => {
    const handleViewCaseEvent = (e) => {
      if (e.detail) {
        handleViewOnMap(e.detail);
      }
    };
    window.addEventListener('pashurakshak:view_case', handleViewCaseEvent);
    return () => window.removeEventListener('pashurakshak:view_case', handleViewCaseEvent);
  }, [handleViewOnMap]);

  return (
    <div>
      <div className="page-head">
        <div className="meta-line">PashuRakshak · Government Dashboard</div>
        <TypewriterTitle text="Overview" />
      </div>

      <div className="stat-grid">
        {overviewStats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="grid-1-2 mt-22">
        <div className="card" id="overview-map-card">
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
              selected={selected}
              height={440}
              onSelect={(d) => setSelected(d)}
              storageKey="pashurakshak_overview_map_view"
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
            <div style={{ width: '100%' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Important Alerts</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
                  Live
                </span>
              </div>
              <div className="card-subtitle">
                Categorized by urgency level &amp; real-time surveillance updates
              </div>
            </div>
          </div>
          <AlertPanel alerts={alerts} onViewOnMap={handleViewOnMap} />
        </div>
      </div>

      <div className="grid-1-2 mt-22">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Disease Activity Analytics</div>
              <div className="card-subtitle">Multi-factor epidemiological surveillance &amp; trend analysis</div>
            </div>
          </div>
          <DiseaseActivityChart data={diseaseActivity} height={260} />
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
          {/* Desktop Table View */}
          <div className="table-wrap recent-cases-desktop-table">
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
                ) : liveRecentCases.map((c) => {
                  const { village: resolvedVillage, district: resolvedDistrict } = getNearestTownAndDistrict(
                    c.latitude ?? c.lat,
                    c.longitude ?? c.lng,
                    c.village_area || c.village || c.villageArea || '',
                    c.district
                  );
                  const distDisplay = resolvedDistrict;
                  const villageDisplay = resolvedVillage;

                  return (
                    <tr key={c.id}>
                      <td className="cell-main">{c.case_ref || c.caseRef || (typeof c.id === 'string' && c.id.startsWith('CS-') ? c.id : `CS-260${c.id}`)}</td>
                      <td>{c.animal}</td>
                      <td>
                        {villageDisplay}
                        <span className="cell-sub">{distDisplay}</span>
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Case Cards View */}
          <div className="recent-cases-mobile-list">
            {casesLoading ? (
              <div className="cases-mobile-empty">Loading live records from database…</div>
            ) : liveRecentCases.length === 0 ? (
              <div className="cases-mobile-empty">No records found</div>
            ) : (
              liveRecentCases.map((c) => {
                const { village: resolvedVillage, district: resolvedDistrict } = getNearestTownAndDistrict(
                  c.latitude ?? c.lat,
                  c.longitude ?? c.lng,
                  c.village_area || c.village || c.villageArea || '',
                  c.district
                );
                const caseId = c.case_ref || c.caseRef || (typeof c.id === 'string' && c.id.startsWith('CS-') ? c.id : `CS-260${c.id}`);
                const disease = c.confirmed_disease || c.suspected_disease || c.disease || c.suspectedDisease;

                return (
                  <div
                    key={c.id}
                    className="recent-case-mobile-card"
                    onClick={() => handleViewOnMap(c)}
                  >
                    <div className="rc-card-top">
                      <span className="rc-case-id">{caseId}</span>
                      <span className={`pill ${statusPill[c.status] || 'pill-neutral'}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="rc-card-body">
                      <div className="rc-animal-disease">
                        <span className="rc-animal-name">{c.animal}</span>
                        <span className="rc-dot-sep">·</span>
                        <span className="rc-disease-name">{disease}</span>
                      </div>
                      <div className="rc-location">
                        <MapPin size={12} className="rc-pin-ic" />
                        <span>{resolvedVillage}, <strong>{resolvedDistrict}</strong></span>
                      </div>
                    </div>
                    <div className="rc-card-foot">
                      <span className="rc-view-map-link">
                        Locate on Map <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <p className="data-note">
        Case records loaded live from Neon PostgreSQL (pg-18). District risk data is demonstration overlay.
      </p>
    </div>
  );
}
