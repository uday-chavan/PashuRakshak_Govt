import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function SimpleTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '8px 11px',
        fontSize: 12,
        boxShadow: '0 4px 14px rgba(15,46,34,0.1)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="dot"
            style={{ width: 8, height: 8, background: p.color || p.fill || p.stroke }}
          />
          <span>{p.name}:</span>
          <b>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</b>
        </div>
      ))}
    </div>
  );
}

// Simple line chart used where a chart is genuinely useful.
export default function SimpleChart({ data, lines, height = 240 }) {
  return (
    <div
      style={{
        height,
        border: '1.5px solid #000000',
        borderRadius: 10,
        background: '#ffffff',
        padding: '10px 10px 4px 4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 4" stroke="#e8f0ea" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11.5, fill: '#6b7c74' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11.5, fill: '#6b7c74' }} axisLine={false} tickLine={false} />
          <Tooltip content={<SimpleTooltip />} />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || '#10734e'}
              strokeWidth={2.5}
              dot={{ r: 3, fill: line.color || '#10734e', strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
