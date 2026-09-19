import { useState } from 'react';
import Modal from './Modal.jsx';

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

export default function AlertPanel({ alerts = [], limit }) {
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
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    className={`alert-compact-card ${section.config.borderClass}`}
                    onClick={() => setSelectedAlert({ ...a, urgencyConfig: section.config })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedAlert({ ...a, urgencyConfig: section.config });
                      }
                    }}
                  >
                    <div className="alert-compact-main">
                      <div className="alert-compact-title">{a.title}</div>
                      <div className="alert-compact-meta">
                        <span className="alert-compact-dist">{a.district}</span>
                        <span className="alert-compact-dot">·</span>
                        <span className="alert-compact-time">{a.time}</span>
                      </div>
                    </div>
                    <span className="alert-compact-hint">View</span>
                  </div>
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
          <div className="flex-between" style={{ width: '100%' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
              Department of Animal Husbandry, Govt. of Maharashtra
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setSelectedAlert(null)}
            >
              Done
            </button>
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
              <div className="alert-modal-item">
                <span className="alert-modal-label">Time Reported</span>
                <span className="alert-modal-val">{selectedAlert.time}</span>
              </div>
              <div className="alert-modal-item">
                <span className="alert-modal-label">Surveillance Status</span>
                <span className="pill pill-active">Active Directive</span>
              </div>
            </div>

            <div className="alert-modal-section">
              <div className="alert-modal-sec-title">Field Intelligence & Overview</div>
              <p className="alert-modal-desc">
                {selectedAlert.desc || 'Active surveillance operational across veterinary units in the designated sector.'}
              </p>
            </div>

            <div className="alert-modal-section">
              <div className="alert-modal-sec-title">Government Response Directives</div>
              <ul className="alert-modal-list">
                <li>Deploy Block Veterinary Officer (BVO) rapid response unit to coordinate ground telemetry.</li>
                <li>Establish 5 km ring vaccination perimeter around reported herd clusters.</li>
                <li>Submit serum & tissue diagnostic swabs directly to Regional Disease Diagnostic Laboratory (RDDL).</li>
                <li>Broadcast SMS health advisories to registered dairy cooperatives and livestock owners.</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
