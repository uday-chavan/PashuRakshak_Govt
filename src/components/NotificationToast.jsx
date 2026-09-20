/**
 * PashuRakshak — Disease Case Notification Toast System
 *
 * Renders a fixed top-right stack of toast notifications.
 * - Groups by disease: same disease → count updates, level may promote to CRITICAL
 * - New disease → new toast card with slide-in entry animation
 * - Auto-dismisses after 8 seconds; manual close button always available
 * - Max 5 toasts visible; oldest auto-dismissed when limit exceeded
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X, Zap, Activity } from 'lucide-react';

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS = 8000;

function getLevel(count) {
  return count > 10 ? 'critical' : 'warning';
}

function getLevelConfig(level) {
  if (level === 'critical') {
    return {
      label: 'CRITICAL',
      icon: <Zap size={12} />,
      borderColor: '#dc2626',
      badgeBg: '#fdeaea',
      badgeColor: '#b91c1c',
      headerBg: 'linear-gradient(90deg, rgba(220,38,38,0.10) 0%, transparent 100%)',
      dot: '#dc2626',
    };
  }
  return {
    label: 'EMERGING',
    icon: <Activity size={12} />,
    borderColor: '#f59e0b',
    badgeBg: '#fdf1e3',
    badgeColor: '#b45309',
    headerBg: 'linear-gradient(90deg, rgba(245,158,11,0.10) 0%, transparent 100%)',
    dot: '#f59e0b',
  };
}

// ─── Individual Toast Card ───────────────────────────────────────────────────

function ToastCard({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const prevLevelRef = useRef(toast.level);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 340);
  }, [toast.id, onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, toast.count]); // reset timer on count update

  // Detect promotion to critical
  useEffect(() => {
    if (prevLevelRef.current !== 'critical' && toast.level === 'critical') {
      setPromoted(true);
      setTimeout(() => setPromoted(false), 1200);
    }
    prevLevelRef.current = toast.level;
  }, [toast.level]);

  const cfg = getLevelConfig(toast.level);
  const isNew = toast.isNew;

  return (
    <div
      className={`notif-card ${exiting ? 'notif-card--exit' : 'notif-card--enter'} ${promoted ? 'notif-card--promoted' : ''}`}
      style={{ borderLeftColor: cfg.borderColor }}
      role="alert"
      aria-live="assertive"
    >
      {/* Animated timer bar */}
      <div
        className="notif-timer-bar"
        style={{
          background: cfg.borderColor,
          animationDuration: `${AUTO_DISMISS_MS}ms`,
          // Re-trigger animation when count changes by using key trick via inline var
          '--anim-key': toast.count,
        }}
        key={`${toast.id}-${toast.count}`}
      />

      {/* Header */}
      <div className="notif-card-header" style={{ background: cfg.headerBg }}>
        <div className="notif-card-header-left">
          <span
            className="notif-dot-pulse"
            style={{ background: cfg.dot }}
          />
          <span
            className="notif-badge"
            style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
          >
            {cfg.icon}
            {cfg.label}
          </span>
          <span className="notif-new-tag notif-text-anim">
            {isNew ? 'NEW CASE' : 'UPDATED'}
          </span>
        </div>
        <button
          className="notif-close-btn"
          onClick={dismiss}
          aria-label="Dismiss notification"
          type="button"
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="notif-card-body">
        <div className="notif-disease notif-text-anim" style={{ animationDelay: '0.05s' }}>
          <AlertTriangle size={14} style={{ color: cfg.borderColor, flexShrink: 0, marginTop: 1 }} />
          <span>{toast.disease}</span>
        </div>
        <div className="notif-meta notif-text-anim" style={{ animationDelay: '0.10s' }}>
          <span className="notif-district">
            {toast.village && toast.village.toLowerCase() !== (toast.district || '').toLowerCase()
              ? `${toast.village}, ${toast.district}`
              : toast.district}
          </span>
          {toast.district && toast.disease && (
            <span className="notif-sep">·</span>
          )}
          <span
            className={`notif-count ${promoted ? 'notif-count--flash' : ''}`}
            style={{ color: cfg.borderColor }}
          >
            {toast.count} case{toast.count !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="notif-desc notif-text-anim" style={{ animationDelay: '0.15s' }}>
          {toast.level === 'critical'
            ? `⚠ Critical threshold exceeded in ${toast.village && toast.village.toLowerCase() !== (toast.district || '').toLowerCase() ? `${toast.village}, ${toast.district}` : toast.district}. Immediate response required.`
            : `New ${toast.disease} case${toast.count > 1 ? 's' : ''} detected in ${toast.village && toast.village.toLowerCase() !== (toast.district || '').toLowerCase() ? `${toast.village}, ${toast.district}` : toast.district}. Field units alerted.`}
        </p>

        {toast.district && (
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="alert-compact-map-btn"
              style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={(e) => {
                e.stopPropagation();
                window.location.hash = 'hotspots';
                const mapCard = document.getElementById('overview-map-card');
                if (mapCard) mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.dispatchEvent(
                  new CustomEvent('pashurakshak:view_case', {
                    detail: {
                      district: toast.district,
                      village: toast.village,
                      lat: toast.lat,
                      lng: toast.lng,
                      disease: toast.disease,
                    },
                  })
                );
              }}
            >
              <Activity size={11} /> View on Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toast Stack ─────────────────────────────────────────────────────────────

let _toastIdCounter = 1;

export default function NotificationToast({ events }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!events || events.length === 0) return;

    // events = array of { disease, district, count, latestDate, village, lat, lng }
    setToasts((prev) => {
      let updated = [...prev];

      events.forEach((evt) => {
        const disease = evt.disease || 'Undiagnosed Condition';
        const district = evt.district || 'Maharashtra';
        const village = evt.village || '';
        const lat = evt.lat ?? null;
        const lng = evt.lng ?? null;
        const addedCount = evt.count || 1;

        // Find existing toast for this disease and district
        const existingIdx = updated.findIndex(
          (t) =>
            t.disease.toLowerCase() === disease.toLowerCase() &&
            (t.district || '').toLowerCase() === district.toLowerCase()
        );

        if (existingIdx >= 0) {
          // Update existing — increment count, potentially promote
          const existing = updated[existingIdx];
          const newCount = existing.count + addedCount;
          const newLevel = getLevel(newCount);
          updated[existingIdx] = {
            ...existing,
            village: village || existing.village,
            lat: lat || existing.lat,
            lng: lng || existing.lng,
            count: newCount,
            level: newLevel,
            isNew: false,
            updatedAt: Date.now(),
          };
        } else {
          // Create new toast
          const newToast = {
            id: `notif-${_toastIdCounter++}`,
            disease,
            district,
            village,
            lat,
            lng,
            count: addedCount,
            level: getLevel(addedCount),
            isNew: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          updated = [newToast, ...updated]; // prepend newest
        }
      });

      // Cap to MAX_TOASTS — remove oldest
      if (updated.length > MAX_TOASTS) {
        updated = updated.slice(0, MAX_TOASTS);
      }

      return updated;
    });
  }, [events]);

  if (toasts.length === 0) return null;

  return (
    <div className="notif-toast-stack" aria-label="Disease case notifications" role="region">
      <div className="notif-stack-label">
        <span className="notif-stack-dot" />
        Live
      </div>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
