import { useState } from 'react';
import { Sparkles, Activity, MapPin, Syringe, CheckCircle2 } from 'lucide-react';
import Modal from './Modal.jsx';
import { addScheduledVaccination, isAlertScheduled } from '../services/vaccinationStore.js';

const URGENCY_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Emerging Cases' },
  { key: 'info', label: 'Advisory' },
];

const URGENCY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    title: 'High Urgency',
    badgeClass: 'pill-critical',
    borderClass: 'border-critical',
  },
  warning: {
    label: 'Emerging Cases',
    title: 'Medium Urgency',
    badgeClass: 'pill-warning',
    borderClass: 'border-warning',
  },
  info: {
    label: 'ADVISORY',
    title: 'Low Urgency',
    badgeClass: 'pill-info',
    borderClass: 'border-info',
  },
};

// ── Alert Card (memoised-style inner component) ───────────────────────────────
function AlertCard({ a, section, onViewOnMap, onOpenDetail }) {
  const [scheduled, setScheduled] = useState(() => isAlertScheduled(a.id));
  const [scheduling, setScheduling] = useState(false);

  function handleScheduleVaccination(e) {
    e.stopPropagation();
    if (scheduled) return;
    setScheduling(true);

    // Brief animation delay before committing
    setTimeout(() => {
      addScheduledVaccination({
        alertId: a.id,
        disease: a.disease || extractDisease(a.title),
        district: a.district,
        count: a.count,
      });
      setScheduled(true);
      setScheduling(false);
    }, 380);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`alert-compact-card ${section.config.borderClass} ${scheduled ? 'alert-card--scheduled' : ''}`}
      onClick={() => !scheduled && onOpenDetail({ ...a, urgencyConfig: section.config })}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !scheduled) {
          onOpenDetail({ ...a, urgencyConfig: section.config });
        }
      }}
    >
      {/* Vaccination Scheduled overlay stamp */}
      {scheduled && (
        <div className="alert-card-scheduled-stamp">
          <CheckCircle2 size={13} />
          Vaccination Scheduled
        </div>
      )}

      <div className={`alert-compact-main ${scheduled ? 'alert-compact-main--struck' : ''}`}>
        <div className="alert-compact-title">{a.title}</div>
        <div className="alert-compact-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="alert-compact-dist">{a.district}</span>
          <span className="alert-compact-dot">·</span>
          <span className="alert-compact-time">{a.time}</span>
          {a.count && (
            <span
              style={{
                fontSize: 10,
                background: a.level === 'critical' ? '#fdeaea' : '#fdf1e3',
                color: a.level === 'critical' ? '#c0392b' : '#c97a1f',
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {a.count} case{a.count > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="alert-compact-actions">
        {/* Schedule Vaccination button */}
        <button
          type="button"
          className={`alert-vacc-btn ${scheduled ? 'alert-vacc-btn--done' : ''} ${scheduling ? 'alert-vacc-btn--loading' : ''}`}
          onClick={handleScheduleVaccination}
          title={scheduled ? 'Vaccination already scheduled' : 'Schedule vaccination drive for this alert'}
          disabled={scheduled || scheduling}
        >
          {scheduled ? (
            <CheckCircle2 size={11} />
          ) : (
            <Syringe size={11} />
          )}
          {scheduling ? '…' : scheduled ? 'Scheduled' : 'Vaccinate'}
        </button>

        {onViewOnMap && a.district && a.district !== 'All 36 Districts' && a.district !== 'Maharashtra Statewide' && (
          <button
            type="button"
            className="alert-compact-map-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap(a.district);
            }}
            title={`Zoom to ${a.district} on map`}
          >
            <MapPin size={11} /> Map
          </button>
        )}
        {!scheduled && <span className="alert-compact-hint">View</span>}
      </div>
    </div>
  );
}

/** Pull disease name out of an alert title like "Emerging FMD Warning in Nashik (3 Cases)" */
function extractDisease(title = '') {
  const match = title.match(/Emerging\s+(.+?)\s+Warning|Critical\s+(.+?)\s+Outbreak/i);
  if (match) return (match[1] || match[2] || '').trim();
  if (title.toLowerCase().includes('fmd')) return 'FMD';
  if (title.toLowerCase().includes('ppr')) return 'PPR';
  if (title.toLowerCase().includes('lsd')) return 'Lumpy Skin Disease';
  if (title.toLowerCase().includes('hs')) return 'HS';
  return 'Disease';
}

// ── Main AlertPanel ───────────────────────────────────────────────────────────
export default function AlertPanel({ alerts = [], limit, onViewOnMap }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const criticalAlerts = alerts.filter((a) => a.level === 'critical');
  const warningAlerts = alerts.filter((a) => a.level === 'warning');
  const infoAlerts = alerts.filter((a) => a.level === 'info');

  const counts = {
    all: alerts.length,
    critical: criticalAlerts.length,
    warning: warningAlerts.length,
    info: infoAlerts.length,
  };

  const sections = [
    { key: 'critical', list: criticalAlerts, config: URGENCY_CONFIG.critical },
    { key: 'warning', list: warningAlerts, config: URGENCY_CONFIG.warning },
    { key: 'info', list: infoAlerts, config: URGENCY_CONFIG.info },
  ].filter((s) => activeCategory === 'all' || activeCategory === s.key);

  return (
    <div className="alert-panel-wrapper">
      {/* 3-Part Urgency Category Navigation */}
      <div className="urgency-tabs" role="tablist" aria-label="Alerts urgency filter">
        {URGENCY_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`urgency-tab-btn ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span className="urgency-tab-name">{cat.label}</span>
            <span className="urgency-tab-count">{counts[cat.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Container constrained to Map height */}
      <div className="urgency-scroll-area">
        {sections.map((section) => {
          if (section.list.length === 0) return null;
          const displayList = limit ? section.list.slice(0, limit) : section.list;

          return (
            <div key={section.key} className="urgency-group">
              <div className="urgency-group-header">
                <span className={`urgency-pill ${section.config.badgeClass}`}>
                  {section.config.label}
                </span>
                <span className="urgency-group-count">
                  {section.list.length} {section.list.length === 1 ? 'Notice' : 'Notices'}
                </span>
              </div>

              <div className="urgency-group-items">
                {displayList.map((a) => (
                  <AlertCard
                    key={a.id}
                    a={a}
                    section={section}
                    onViewOnMap={onViewOnMap}
                    onOpenDetail={setSelectedAlert}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Alert Modal Popup */}
      <Modal
        open={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.title || 'Alert Details'}
        subtitle={`Notice Reference ID: ${selectedAlert?.id || 'AL-0000'}`}
        footer={
          <div className="flex-between" style={{ width: '100%', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
              Department of Animal Husbandry, Govt. of Maharashtra
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {onViewOnMap && selectedAlert && selectedAlert.district && selectedAlert.district !== 'All 36 Districts' && selectedAlert.district !== 'Maharashtra Statewide' && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const targetDist = selectedAlert.district;
                    setSelectedAlert(null);
                    onViewOnMap(targetDist);
                  }}
                >
                  <MapPin size={14} style={{ marginRight: 4 }} /> View on Map
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedAlert(null)}
              >
                Done
              </button>
            </div>
          </div>
        }
      >
        {selectedAlert && (
          <div className="alert-modal-content">
            <div className="alert-modal-grid">
              <div className="alert-modal-item">
                <span className="alert-modal-label">Urgency Priority</span>
                <span className={`urgency-pill ${selectedAlert.urgencyConfig?.badgeClass || 'pill-info'}`}>
                  {selectedAlert.urgencyConfig?.label || selectedAlert.level?.toUpperCase()}
                </span>
              </div>
              <div className="alert-modal-item">
                <span className="alert-modal-label">District</span>
                <strong className="alert-modal-val">{selectedAlert.district}</strong>
              </div>
              {selectedAlert.disease && (
                <div className="alert-modal-item">
                  <span className="alert-modal-label">Target Disease</span>
                  <strong className="alert-modal-val" style={{ color: '#047857' }}>{selectedAlert.disease}</strong>
                </div>
              )}
              <div className="alert-modal-item">
                <span className="alert-modal-label">Telemetry Source</span>
                <span className="pill pill-active">
                  Live Surveillance
                </span>
              </div>
            </div>

            <div className="alert-modal-section">
              <div className="alert-modal-sec-title">Field Intelligence &amp; Overview</div>
              <p className="alert-modal-desc">
                {selectedAlert.desc || 'Active surveillance operational across veterinary units in the designated sector.'}
              </p>
            </div>

            <div className="alert-modal-section">
              <div className="alert-modal-sec-title">Government Response Directives</div>
              <ul className="alert-modal-list">
                {selectedAlert.directives && selectedAlert.directives.length > 0 ? (
                  selectedAlert.directives.map((dir, idx) => <li key={idx}>{dir}</li>)
                ) : (
                  <>
                    <li>Deploy Block Veterinary Officer (BVO) rapid response unit to coordinate ground telemetry.</li>
                    <li>Establish 5 km ring vaccination perimeter around reported herd clusters.</li>
                    <li>Submit serum &amp; tissue diagnostic swabs directly to Regional Disease Diagnostic Laboratory (RDDL).</li>
                    <li>Broadcast SMS health advisories to registered dairy cooperatives and livestock owners.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
