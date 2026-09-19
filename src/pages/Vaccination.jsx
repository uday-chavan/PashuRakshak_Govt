import { useState, useEffect } from 'react';
import { Syringe } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import { vaccinationStats, vaccinationSchedule, vaccinationProgress } from '../data/mockData.js';

export default function Vaccination() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="page-head">
        <div className="meta-line">PashuRakshak · Vaccination</div>
        <h1>Vaccination</h1>
        <p>Monitor vaccination drives, schedules and district-wise completion across Maharashtra.</p>
      </div>

      <div className="stat-grid">
        {vaccinationStats.map((s) => (
          <StatCard key={s.key} icon="Syringe" label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="grid-1-3 mt-22">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Vaccination Progress</div>
              <div className="card-subtitle">Disease-wise completion percentage</div>
            </div>
          </div>
          {vaccinationProgress.map((v) => {
            const barClass =
              v.pct >= 80 ? '' : v.pct >= 65 ? 'orange' : 'sky';
            return (
              <div key={v.disease} style={{ marginBottom: 16 }}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{v.disease} Vaccination</span>
                  <b style={{ fontSize: 13 }}>
                    <AnimatedNumber value={v.pct} suffix="%" />
                  </b>
                </div>
                <div className={`progress ${barClass}`}>
                  <span
                    style={{
                      width: animated ? `${v.pct}%` : '0%',
                      transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
          <p className="data-note">Completion based on planned vaccination doses per disease.</p>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">
                <Syringe size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Vaccination Schedule
              </div>
              <div className="card-subtitle">District-wise planned and completed vaccinations</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Vaccine</th>
                  <th>District</th>
                  <th>Completed</th>
                  <th>Pending</th>
                  <th>Upcoming Date</th>
                </tr>
              </thead>
              <tbody>
                {vaccinationSchedule.map((r, i) => (
                  <tr key={i}>
                    <td className="cell-main">{r.disease}</td>
                    <td>{r.vaccine}</td>
                    <td>{r.district}</td>
                    <td style={{ fontWeight: 600, color: '#047857' }}>
                      <AnimatedNumber value={r.completed} />
                    </td>
                    <td style={{ fontWeight: 600, color: '#d97706' }}>
                      <AnimatedNumber value={r.pending} />
                    </td>
                    <td>{r.upcomingDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
