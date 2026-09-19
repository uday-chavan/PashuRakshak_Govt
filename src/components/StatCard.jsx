import AnimatedNumber from './AnimatedNumber.jsx';

export default function StatCard({ label, value, note }) {
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^[+-]?[\d,]+(\.\d+)?%?$/.test(value.trim()));

  return (
    <div className="card stat-card">
      <div className="stat-row">
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">
        {isNumeric ? <AnimatedNumber value={value} /> : value}
      </div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}
