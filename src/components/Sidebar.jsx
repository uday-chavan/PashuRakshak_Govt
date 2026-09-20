import {
  LayoutDashboard,
  Activity,
  Map,
  ClipboardList,
  Syringe,
  FlaskConical,
  Megaphone,
} from 'lucide-react';
import logo from '../assets/pashu-rakshak-logo.png';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'outbreaks', label: 'Outbreak Monitoring', icon: Activity },
  { id: 'hotspots', label: 'Hotspot Map', icon: Map },
  { id: 'cases', label: 'Case Management', icon: ClipboardList },
  { id: 'vaccination', label: 'Vaccination', icon: Syringe },
  { id: 'laboratory', label: 'Laboratory', icon: FlaskConical },
  { id: 'alerts', label: 'Alerts', icon: Megaphone },
];

export default function Sidebar({ active, onNavigate, mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onCloseMobile} />}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logo} alt="PashuRakshak emblem" className="sidebar-logo" />
          <div className="sidebar-brand-text">
            <span className="brand-name">PashuRakshak</span>
            <span className="brand-sub">Government of Maharashtra</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p>Maharashtra Animal Husbandry Department</p>
        </div>
      </aside>
    </>
  );
}
