import { useMemo, useState, useEffect } from 'react';
import {
  MapPin,
  Syringe,
  Activity,
  CalendarDays,
  X,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  ChevronRight,
} from 'lucide-react';
import LeafletMapView from '../components/LeafletMapView.jsx';
import MapErrorBoundary from '../components/MapErrorBoundary.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import {
  hotspotDistricts as mockHotspotDistricts,
  riskMeta,
  attentionAreas as mockAttentionAreas,
} from '../data/mockData.js';
import { getHotspotDistricts, getAnimalCases } from '../db/client.js';
import {
  ALL_36_MAHARASHTRA_DISTRICTS,
  DISTRICT_COORDINATES,
  normalizeDistrictName,
  matchDistrict,
} from '../data/maharashtraGeo.js';

const periodOptions = ['Last 7 Days', 'Last 30 Days', 'All'];
const modes = [
  { key: 'cases', label: 'Cases' },
  { key: 'risk', label: 'Risk' },
  { key: 'vaccination', label: 'Vaccination' },
];

const RISK_STYLE = {
  critical: { color: '#C0392B', bg: '#FDEAEA' },
  warning: { color: '#C97A1F', bg: '#FDF1E3' },
  normal: { color: '#237A50', bg: '#EAF7EF' },
};

const RISK_LABEL = {
  critical: 'Critical',
  warning: 'Emerging',
  normal: 'Normal',
};

function RiskBadge({ risk }) {
  const t = RISK_STYLE[risk] || RISK_STYLE.normal;
  return (
    <span
      className="hm-risk-badge"
      style={{ color: t.color, background: t.bg, border: `1px solid ${t.color}22` }}
    >
      <span className="dot" style={{ background: t.color }} />
      {RISK_LABEL[risk] || riskMeta[risk]?.label || 'Normal'}
    </span>
  );
}

function TrendIcon({ trend }) {
  if (trend === 'Increasing')
    return <span className="hm-trend hm-trend-up"><ArrowUpRight size={15} /> Increasing</span>;
  if (trend === 'Decreasing')
    return <span className="hm-trend hm-trend-down"><ArrowDownRight size={15} /> Decreasing</span>;
  return <span className="hm-trend hm-trend-flat"><Minus size={15} /> Stable</span>;
}

export default function HotspotMap({ onNavigate }) {
  // Baseline with all 36 districts
  const [liveDistricts, setLiveDistricts] = useState(() => {
    return ALL_36_MAHARASHTRA_DISTRICTS.map((dName, idx) => ({
      id: idx + 1,
      district: dName,
      latitude: DISTRICT_COORDINATES[dName]?.lat || 19.45,
      longitude: DISTRICT_COORDINATES[dName]?.lng || 76.2,
      risk: 'normal',
      disease: 'None',
      affectedAnimals: 0,
      newCases: 0,
      activeVillages: 0,
      vaccinationCoverage: 78,
      riskTrend: 'Stable',
    }));
  });

  const [casePins, setCasePins] = useState([]);
  const [disease, setDisease] = useState('All Diseases');
  const [districtFilter, setDistrictFilter] = useState('');
  const [period, setPeriod] = useState('Last 7 Days');
  const [mode, setMode] = useState('cases');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Fetch live hotspot districts from DB (returns all 36 districts)
    getHotspotDistricts()
      .then((data) => {
        if (data && data.length > 0) {
          setLiveDistricts(data);
        }
      })
      .catch((err) => console.warn('[HotspotMap] getHotspotDistricts fallback:', err));

    // Fetch live cases as GPS points
    getAnimalCases()
      .then((data) => {
        setCasePins(
          data
            .filter((c) => c.latitude && c.longitude)
            .map((c) => ({
              id: c.id,
              caseRef: c.case_ref || c.caseRef || `CS-260${c.id}`,
              lat: parseFloat(c.latitude),
              lng: parseFloat(c.longitude),
              animal: c.animal,
              village: c.village_area || c.village || c.villageArea || 'Area Sector',
              district: normalizeDistrictName(c.district),
              disease: c.confirmed_disease || c.suspected_disease || c.disease || c.suspectedDisease,
              status: c.status || 'Active',
              vet: c.assigned_vet || c.vet,
            }))
        );
      })
      .catch(() => setCasePins([]));
  }, []);

  const filterable = useMemo(() => liveDistricts.map((d) => ({ ...d })), [liveDistricts]);

  // Dropdown list with all 36 districts and live case counts
  const districtDropdownOptions = useMemo(() => {
    return ALL_36_MAHARASHTRA_DISTRICTS.map((dName) => {
      const matchCount = casePins.filter((p) => matchDistrict(p.district, dName)).length;
      return {
        name: dName,
        casesCount: matchCount,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [casePins]);

  const diseaseOptions = useMemo(() => {
    const list = new Set(['All Diseases']);
    filterable.forEach((d) => {
      if (d.disease && d.disease !== 'None') list.add(d.disease);
    });
    casePins.forEach((p) => {
      if (p.disease) list.add(p.disease);
    });
    return Array.from(list);
  }, [filterable, casePins]);

  const dynamicAttentionAreas = useMemo(() => {
    const criticalAndWarning = filterable.filter(
      (d) => d.risk === 'critical' || d.risk === 'warning' || (d.affectedAnimals || 0) > 0
    );
    if (criticalAndWarning.length > 0) {
      return criticalAndWarning.map((d) => ({
        district: d.district,
        risk: d.risk,
        note: `${d.affectedAnimals || d.affected || 0} animals affected · ${d.disease || 'General alert'}`,
      }));
    }
    return mockAttentionAreas;
  }, [filterable]);

  const filtered = useMemo(
    () =>
      filterable.filter((d) => {
        if (disease !== 'All Diseases' && d.disease !== disease) return false;
        if (districtFilter && !matchDistrict(d.district || d.name, districtFilter)) return false;
        return true;
      }),
    [filterable, disease, districtFilter]
  );

  // Selected district full object
  const selectedFull = useMemo(() => {
    if (!selected) return null;
    const targetName = typeof selected === 'string' ? selected : (selected.district || selected.name);
    return filterable.find((d) => matchDistrict(d.district || d.name, targetName)) || {
      district: targetName,
      name: targetName,
      risk: 'normal',
      disease: 'None',
      affectedAnimals: 0,
      newCases: 0,
      activeVillages: 0,
      vaccinationCoverage: 80,
      riskTrend: 'Stable',
    };
  }, [selected, filterable]);

  const handleSelect = (r) => {
    if (!r) {
      setSelected(null);
      setDistrictFilter('');
      return;
    }
    const distName = typeof r === 'string' ? r : (r.district || r.name);
    const d = filterable.find((x) => matchDistrict(x.district || x.name, distName));
    setSelected(d || { district: distName, name: distName, risk: 'normal' });
    setDistrictFilter(distName);
  };

  // Escape key listener to clear selection & return map to default
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setDistrictFilter('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cases inside the currently selected district
  const selectedDistrictName = selectedFull ? (selectedFull.district || selectedFull.name) : '';
  const districtCases = useMemo(() => {
    if (!selectedDistrictName) return [];
    return casePins.filter((pin) => matchDistrict(pin.district, selectedDistrictName));
  }, [casePins, selectedDistrictName]);

  const legendItems = useMemo(() => {
    if (mode === 'vaccination') {
      return [
        { label: 'High Coverage', color: '#3AA15C' },
        { label: 'Medium Coverage', color: '#E0A83B' },
        { label: 'Low Coverage', color: '#D48A8A' },
      ];
    }
    return [
      { label: 'Normal (0 Alert)', color: '#3AA15C' },
      { label: 'Emerging / Attention', color: '#E0861E' },
      { label: 'Critical Hotspot', color: '#D45050' },
    ];
  }, [mode]);

  return (
    <div className="hm-page">
      {period !== 'Last 7 Days' && (
        <div className="hm-period-note" key={period}>
          <CalendarDays size={13} /> Showing surveillance data for <b>{period}</b>.
        </div>
      )}
      <div className="hm-card">
        {/* ---------- Header ---------- */}
        <div className="hm-head">
          <div className="hm-title-block">
            <div className="hm-title-row">
              <div className="hm-title">
                <MapPin size={18} />
                Maharashtra Disease Intelligence Map
              </div>
              <span className="hm-live">
                <span className="hm-live-dot" /> 36 Districts Telemetry Active
              </span>
            </div>
            <div className="hm-sub">
              Monitor disease activity, spatial clustering, village-level cases, and vaccination coverage across all 36 Maharashtra districts.
            </div>
          </div>

          <div className="hm-head-right">
            <div className="hm-mode-switch" role="tablist" aria-label="Map mode">
              {modes.map((m) => (
                <button
                  key={m.key}
                  role="tab"
                  aria-selected={mode === m.key}
                  className={`hm-mode-btn ${mode === m.key ? 'active' : ''}`}
                  onClick={() => setMode(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="hm-filters">
              {/* Select District Dropdown (All 36 Districts) */}
              <div className="hm-filter">
                <label>Select District</label>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDistrictFilter(val);
                    if (!val) {
                      setSelected(null);
                    } else {
                      const found = filterable.find((d) => matchDistrict(d.district || d.name, val));
                      setSelected(found || { district: val, name: val, risk: 'normal' });
                    }
                  }}
                >
                  <option value="">All Districts ({ALL_36_MAHARASHTRA_DISTRICTS.length})</option>
                  {districtDropdownOptions.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} {d.casesCount > 0 ? `(${d.casesCount} case${d.casesCount > 1 ? 's' : ''})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hm-filter">
                <label>Disease</label>
                <select value={disease} onChange={(e) => setDisease(e.target.value)}>
                  {diseaseOptions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="hm-filter">
                <label>Period</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {periodOptions.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Body ---------- */}
        <div className="hm-body">
          <div className="hm-map-column">
            <MapErrorBoundary height={500}>
              <LeafletMapView
                districts={filtered}
                casePins={casePins}
                selected={selectedFull?.district || selectedFull?.name}
                onSelect={handleSelect}
                mode={mode}
                height={500}
              />
            </MapErrorBoundary>

            <div className="hm-map-footer">
              <div className="hm-legend">
                {legendItems.map((l) => (
                  <span className="hm-lg" key={l.label}>
                    <span className="dot" style={{ background: l.color }} /> {l.label}
                  </span>
                ))}
              </div>
              <div className="hm-summary">
                {mode === 'vaccination'
                  ? `${filtered.length} districts monitored`
                  : `${filtered.length} districts tracked · ${casePins.length} live case pins`}
              </div>
            </div>

            {/* ---------- Areas needing attention ---------- */}
            <div className="hm-attention">
              <div className="hm-attention-title">Hotspots &amp; Active Watchlist</div>
              {dynamicAttentionAreas.map((a) => {
                const full = filterable.find((d) => matchDistrict(d.district || d.name, a.district));
                const isCurrent = selectedFull && matchDistrict(selectedFull.district || selectedFull.name, a.district);
                return (
                  <button
                    key={a.district}
                    className={`hm-attention-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleSelect(full || a.district)}
                  >
                    <span
                      className="hm-attention-dot"
                      style={{ background: (RISK_STYLE[a.risk] || {}).color || '#059669' }}
                    />
                    <span className="hm-attention-name">{a.district}</span>
                    <span className="hm-attention-note">{a.note}</span>
                    <span
                      className={`hm-attention-view ${isCurrent ? 'active' : ''}`}
                    >
                      Inspect
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------- District intelligence panel ---------- */}
          <aside className="hm-detail-panel">
            {selectedFull ? (
              <div className="hm-detail hm-intel">
                <div className="hm-detail-head">
                  <div className="hm-detail-title">District Intelligence</div>
                  <button className="hm-detail-close" onClick={() => handleSelect(null)} aria-label="Close">
                    <X size={15} />
                  </button>
                </div>

                <div className="hm-detail-district">
                  <div className="hm-detail-dist-name">{selectedFull.district || selectedFull.name}</div>
                  <RiskBadge risk={selectedFull.risk || 'normal'} />
                </div>
                <div className="hm-intel-disease">
                  <span className="hm-intel-disease-ic"><Activity size={13} /></span>
                  {selectedFull.disease && selectedFull.disease !== 'None' ? selectedFull.disease : 'Routine Surveillance'}
                </div>

                <div className="hm-metrics">
                  <div className="hm-metric">
                    <span className="hm-metric-ic"><Syringe size={14} /></span>
                    <div>
                      <div className="hm-metric-v">
                        <AnimatedNumber value={selectedFull.affectedAnimals ?? selectedFull.affected ?? 0} />
                      </div>
                      <div className="hm-metric-k">Affected Animals</div>
                    </div>
                  </div>
                  <div className="hm-metric">
                    <span className="hm-metric-ic"><ArrowUpRight size={14} /></span>
                    <div>
                      <div className="hm-metric-v">
                        <AnimatedNumber value={selectedFull.newCases ?? 0} />
                      </div>
                      <div className="hm-metric-k">New Cases</div>
                    </div>
                  </div>
                  <div className="hm-metric">
                    <span className="hm-metric-ic"><MapPin size={14} /></span>
                    <div>
                      <div className="hm-metric-v">
                        <AnimatedNumber value={selectedFull.activeVillages ?? (districtCases.length > 0 ? new Set(districtCases.map(c => c.village)).size : 0)} />
                      </div>
                      <div className="hm-metric-k">Active Villages</div>
                    </div>
                  </div>
                  <div className="hm-metric">
                    <span className="hm-metric-ic"><ShieldCheck size={14} /></span>
                    <div>
                      <div className="hm-metric-v">
                        <AnimatedNumber value={selectedFull.vaccinationCoverage || 78} suffix="%" />
                      </div>
                      <div className="hm-metric-k">Vaccination</div>
                    </div>
                  </div>
                </div>

                {/* Village / Taluka Level Cases Breakdown */}
                <div className="hm-sec-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <span>Taluka &amp; Village Cases</span>
                  <span className="pill pill-neutral" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                    <AnimatedNumber value={districtCases.length} /> Cases
                  </span>
                </div>

                {districtCases.length > 0 ? (
                  <div className="hm-case-list">
                    {districtCases.map((c) => (
                      <div
                        key={c.id || c.caseRef}
                        className={`hm-case-item ${c.status === 'Active' ? 'status-active' : c.status === 'Under Treatment' ? 'status-treatment' : 'status-resolved'}`}
                      >
                        <div className="hm-case-item-header">
                          <span className="hm-case-ref-tag">{c.caseRef}</span>
                          <span className={`pill ${c.status === 'Active' ? 'pill-critical' : c.status === 'Under Treatment' ? 'pill-warning' : c.status === 'Resolved' ? 'pill-complete' : 'pill-neutral'}`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="hm-case-animal-name">{c.animal}</div>
                        <div className="hm-case-location">
                          <MapPin size={12.5} className="hm-case-pin-ic" />
                          <span>Village / Taluka: <strong>{c.village}</strong></span>
                        </div>
                        <div className="hm-case-footer">
                          <span className="hm-case-disease-badge">{c.disease || 'Under Testing'}</span>
                          {c.lat && c.lng && (
                            <span className="hm-case-coords">
                              {c.lat.toFixed(3)}°N, {c.lng.toFixed(3)}°E
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hm-zero-cases-banner">
                    <div className="hm-zero-cases-title">
                      <ShieldCheck size={14} color="#047857" /> 0 Active Cases Reported
                    </div>
                    No active disease clusters currently reported in <b>{selectedDistrictName}</b>. Continuous veterinary surveillance and biosecurity monitoring active.
                  </div>
                )}

                <div className="hm-sec-label" style={{ marginTop: 14 }}>Recent Activity</div>
                <div className="hm-activity">
                  {(selectedFull.recentActivity || [
                    { day: 'Today', delta: '+0' },
                    { day: 'Yesterday', delta: '+0' },
                    { day: '2 days ago', delta: '0' },
                  ]).map((a) => (
                    <div className="hm-activity-row" key={a.day}>
                      <span>{a.day}</span>
                      <span className={`hm-activity-delta ${a.delta === '0' || a.delta === '+0' ? 'flat' : ''}`}>
                        {a.delta === '0' || a.delta === '+0' ? 'No change' : `${a.delta} cases`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="hm-foot">
                  <div className="hm-trend-row">
                    <span className="hm-sec-label" style={{ margin: 0 }}>Risk Trend</span>
                    <TrendIcon trend={selectedFull.riskTrend} />
                  </div>
                  <div className="hm-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onNavigate && onNavigate('cases')}
                    >
                      View All Cases
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onNavigate && onNavigate('vaccination')}
                    >
                      <Syringe size={14} /> Vaccination
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hm-detail hm-detail-empty">
                <div className="hm-empty-ic"><AlertTriangle size={20} /></div>
                <div className="hm-empty-title">Select Any of 36 Districts</div>
                <p className="hm-empty-text">
                  Choose a district from the dropdown or click its marker on the map to inspect its real-time telemetry, village cases, risk level, and vaccination coverage.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}