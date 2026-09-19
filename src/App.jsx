import { useState, useEffect } from 'react';
import './components/Sidebar.css';
import './components/Topbar.css';
import './pages/HotspotMap.css';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Overview from './pages/Overview.jsx';
import Outbreaks from './pages/Outbreaks.jsx';
import HotspotMap from './pages/HotspotMap.jsx';
import Cases from './pages/Cases.jsx';
import Vaccination from './pages/Vaccination.jsx';
import Laboratory from './pages/Laboratory.jsx';
import Alerts from './pages/Alerts.jsx';

const PAGES = {
  overview: Overview,
  outbreaks: Outbreaks,
  hotspots: HotspotMap,
  cases: Cases,
  vaccination: Vaccination,
  laboratory: Laboratory,
  alerts: Alerts,
};

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return PAGES[hash] ? hash : 'overview';
}

export default function App() {
  const [page, setPage] = useState(getPageFromHash);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync page → hash whenever user navigates via sidebar/buttons
  const handleNavigate = (newPage) => {
    window.location.hash = newPage;
    setPage(newPage);
  };

  // Sync hash → page when user uses browser back/forward or reloads
  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const ActivePage = PAGES[page] || Overview;

  return (
    <div className="app-shell">
      <Sidebar
        active={page}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="app-body">
        <Topbar page={page} onMenu={() => setMobileOpen(true)} />
        <main className="main-content">
          <div key={page} className="page-wrapper page-enter">
            <ActivePage onNavigate={handleNavigate} />
          </div>
        </main>
      </div>
    </div>
  );
}