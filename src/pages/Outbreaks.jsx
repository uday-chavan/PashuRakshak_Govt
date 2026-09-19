import { Activity } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import SimpleChart from '../components/SimpleChart.jsx';
import AnimatedNumber from '../components/AnimatedNumber.jsx';
import { outbreakStats, diseaseActivity, outbreakList, riskPill } from '../data/mockData.js';

const chartData = diseaseActivity.map((d) => ({
  label: d.month,
  cases: d.cases,
  mortality: d.mortality,
}));

const statusPill = {
  Active: 'pill-critical',
  Monitoring: 'pill-medium',
  Controlled: 'pill-low',
};

export default function Outbreaks() {
  return (
    <div>
      <div className="page-head">
        <div className="meta-line">PashuRakshak · Outbreak Monitoring</div>
        <h1>Outbreak Monitoring</h1>
        <p>Track the spread of livestock diseases across districts and coordinate response.</p>
      </div>

      <div className="stat-grid">
        {outbreakStats.map((s) => (
          <StatCard key={s.key} icon={s.key === 'mortality' ? 'Activity' : 'Virus'} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="grid-2 mt-22">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">
                <Activity size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Disease Activity Trend
              </div>
              <div className="card-subtitle">New cases vs mortality, last six months</div>
            </div>
          </div>
          <SimpleChart
            data={chartData}
            lines={[
              { dataKey: 'cases', name: 'New cases', color: '#10734e' },
              { dataKey: 'mortality', name: 'Mortality', color: '#dc2626' },
            ]}
          />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Outbreak Summary</div>
              <div className="card-subtitle">Statewide status snapshot</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {outbreakStats.map((s) => (
              <div
                key={s.key}
                style={{
                  background: 'var(--green-50)',
                  border: '1px solid var(--line-soft)',
                  borderRadius: 8,
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                  <AnimatedNumber value={s.value} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-22">
        <div className="card-head">
          <div>
            <div className="card-title">Active Outbreak Register</div>
            <div className="card-subtitle">Districts with recent confirmed outbreaks</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Outbreak</th>
                <th>District</th>
                <th>Disease</th>
                <th>Cases</th>
                <th>Risk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {outbreakList.map((o) => (
                <tr key={o.id}>
                  <td className="cell-main">{o.id}</td>
                  <td>{o.district}</td>
                  <td>
                    <span className="pill pill-neutral">{o.disease}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <AnimatedNumber value={o.cases} />
                  </td>
                  <td>
                    <span className={`pill ${riskPill[o.risk] || 'pill-neutral'}`}>{o.risk}</span>
                  </td>
                  <td>
                    <span className={`pill ${statusPill[o.status] || 'pill-neutral'}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
