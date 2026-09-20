import { Bell, Menu, User } from 'lucide-react';
import emblem from '../assets/Emblem.png';

const PAGE_TITLES = {
  overview: 'Overview',
  outbreaks: 'Outbreak Monitoring',
  hotspots: 'Hotspot Map',
  cases: 'Case Management',
  vaccination: 'Vaccination',
  laboratory: 'Laboratory',
  alerts: 'Alerts',
};

export default function Topbar({ page, onMenu, sidebarCollapsed }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu"
          onClick={onMenu}
          aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          title={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
        >
          <Menu size={19} />
        </button>
        <img
          src={emblem}
          alt="Government Emblem of India / Maharashtra"
          className="topbar-govt-emblem"
        />
        <div className="topbar-title">
          <span className="topbar-heading">Maharashtra Livestock Health Surveillance</span>
          <span className="topbar-sub">PashuRakshak · {PAGE_TITLES[page] || 'Overview'}</span>
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={17} />
        </button>
        <button
          className="user-avatar-btn"
          title="Government Officer (Administrator)"
          aria-label="User Profile"
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
