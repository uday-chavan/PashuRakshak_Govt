import React, { useState, useEffect } from 'react';
import { Monitor, AlertTriangle, X, ChevronRight, Smartphone, Info } from 'lucide-react';
import './DesktopNotice.css';

const DESKTOP_BREAKPOINT = 1024;

export default function DesktopNotice() {
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < DESKTOP_BREAKPOINT;
    }
    return false;
  });

  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth < DESKTOP_BREAKPOINT;
      setIsSmallScreen(small);
      // If user expands screen to desktop and reduces again, reset dismissed state if preferred
      if (!small) {
        setIsDismissed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isSmallScreen) {
    return null;
  }

  // If dismissed, show a compact floating pill badge so user can reopen if needed
  if (isDismissed) {
    return (
      <aside aria-label="Desktop screen notice" className="desktop-notice-pill" onClick={() => setIsDismissed(false)}>
        <Monitor size={14} className="notice-pill-icon" />
        <span className="notice-pill-text">Desktop Optimized</span>
        <Info size={12} className="notice-pill-info" />
      </aside>
    );
  }

  return (
    <aside aria-label="Desktop screen notice" className="desktop-notice-banner" role="alert">
      <div className="desktop-notice-container">
        <div className="desktop-notice-left">
          <div className="desktop-notice-icon-wrapper">
            <Monitor size={18} className="desktop-icon-main" />
            <span className="desktop-notice-alert-dot">!</span>
          </div>
          <div className="desktop-notice-content">
            <div className="desktop-notice-title-row">
              <h2 className="desktop-notice-title">Optimized for Desktop Screens</h2>
              <span className="desktop-notice-tag">Notice</span>
            </div>
            <p className="desktop-notice-desc">
              The PashuRakshak Livestock Health Surveillance portal is currently optimized for desktop and widescreen displays. 
              Interactive GIS maps, analytical charts, and surveillance grids may appear constrained on mobile or smaller screens.
            </p>
            {isExpanded && (
              <div className="desktop-notice-details">
                <div className="desktop-detail-item">
                  <Monitor size={14} />
                  <span><strong>Recommended:</strong> Min width 1280px or desktop / laptop browser.</span>
                </div>
                <div className="desktop-detail-item">
                  <Smartphone size={14} />
                  <span><strong>Mobile Tip:</strong> Rotate to landscape mode or enable "Desktop site" in your browser.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="desktop-notice-actions">
          <button
            type="button"
            className="desktop-notice-btn-details"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less Info' : 'Tips'}
          </button>
          <button
            type="button"
            className="desktop-notice-btn-dismiss"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss notice"
          >
            <span>Dismiss</span>
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
