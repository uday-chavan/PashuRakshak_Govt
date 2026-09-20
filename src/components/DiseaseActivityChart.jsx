import { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import './DiseaseActivityChart.css';

/* ─── Custom Tooltip ─────────────────────────────────────── */
function RichTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const metaMap = {
    cases:        { label: 'New Cases',      unit: '',  color: '#059669' },
    mortality:    { label: 'Mortality',       unit: '',  color: '#dc2626' },
    atRisk:       { label: 'At-Risk Animals', unit: '',  color: '#f59e0b' },
    vaccinated:   { label: 'Vaccinated',      unit: '',  color: '#0066cc' },
    recoveryRate: { label: 'Recovery Rate',   unit: '%', color: '#10b981' },
    alerts:       { label: 'Active Alerts',   unit: '',  color: '#f97316' },
  };

  return (
    <div className="dac-tooltip">
      <div className="dac-tooltip-head">{label}</div>
      <div className="dac-tooltip-body">
        {payload.map((p, i) => {
          const m = metaMap[p.dataKey];
          if (!m) return null;
          return (
            <div key={i} className="dac-tooltip-row">
              <span className="dac-tooltip-dot" style={{ background: m.color }} />
              <span className="dac-tooltip-label">{m.label}</span>
              <span className="dac-tooltip-val">
                {typeof p.value === 'number'
                  ? p.value.toLocaleString('en-IN') + m.unit
                  : p.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Legend ─────────────────────────────────────────────── */
const LEGEND_ITEMS = [
  { key: 'cases',        label: 'New Cases',   color: '#059669', type: 'area' },
  { key: 'atRisk',       label: 'At-Risk',     color: '#f59e0b', type: 'area' },
  { key: 'vaccinated',   label: 'Vaccinated',  color: '#0066cc', type: 'bar'  },
  { key: 'mortality',    label: 'Mortality',   color: '#dc2626', type: 'line' },
  { key: 'recoveryRate', label: 'Recovery %',  color: '#10b981', type: 'line' },
  { key: 'alerts',       label: 'Alerts',      color: '#f97316', type: 'line' },
];

function CustomLegend({ metrics, onToggle }) {
  return (
    <div className="dac-legend">
      {LEGEND_ITEMS.map((it) => (
        <button
          key={it.key}
          className={`dac-leg-btn ${metrics.includes(it.key) ? 'on' : 'off'}`}
          onClick={() => onToggle(it.key)}
          title={metrics.includes(it.key) ? `Hide ${it.label}` : `Show ${it.label}`}
        >
          <span className={`dac-leg-icon ${it.type}`} style={{ borderColor: it.color, background: it.type !== 'line' ? it.color : 'transparent', color: it.color }} />
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
const DEFAULT_METRICS = ['cases', 'atRisk', 'mortality', 'vaccinated', 'recoveryRate'];

export default function DiseaseActivityChart({ data, height = 300 }) {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);

  function toggle(key) {
    setMetrics((prev) =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter((k) => k !== key) : prev
        : [...prev, key]
    );
  }

  const has = (k) => metrics.includes(k);
  const peak = data.reduce((max, d) => (d.cases > max.cases ? d : max), data[0]);
  const last = data[data.length - 1];

  return (
    <div className="dac-wrap">
      <CustomLegend metrics={metrics} onToggle={toggle} />

      {/* KPI summary strip */}
      <div className="dac-kpi-strip">
        <div className="dac-kpi">
          <span className="dac-kpi-v" style={{ color: '#059669' }}>
            {data.reduce((s, d) => s + d.cases, 0).toLocaleString('en-IN')}
          </span>
          <span className="dac-kpi-k">Total Cases</span>
        </div>
        <div className="dac-kpi-sep" />
        <div className="dac-kpi">
          <span className="dac-kpi-v" style={{ color: '#dc2626' }}>
            {data.reduce((s, d) => s + d.mortality, 0).toLocaleString('en-IN')}
          </span>
          <span className="dac-kpi-k">Deaths</span>
        </div>
        <div className="dac-kpi-sep" />
        <div className="dac-kpi">
          <span className="dac-kpi-v" style={{ color: '#0066cc' }}>
            {last.vaccinated.toLocaleString('en-IN')}
          </span>
          <span className="dac-kpi-k">Vaccinated</span>
        </div>
        <div className="dac-kpi-sep" />
        <div className="dac-kpi">
          <span className="dac-kpi-v" style={{ color: '#10b981' }}>
            {last.recoveryRate}%
          </span>
          <span className="dac-kpi-k">Recovery Rate</span>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 14, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#059669" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 5" stroke="#e8f0ea" vertical={false} />

            {/* Peak case month */}
            <ReferenceLine
              x={peak.month}
              stroke="#05966955"
              strokeDasharray="4 3"
              strokeWidth={1.2}
              label={{ value: '▲ Peak', fill: '#059669', fontSize: 9.5, position: 'insideTopLeft' }}
            />

            <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: '#6b7c74' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#6b7c74' }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#6b7c74' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tickCount={5}
            />

            <Tooltip content={<RichTooltip />} />

            {/* Vaccinated bars — background layer */}
            {has('vaccinated') && (
              <Bar yAxisId="left" dataKey="vaccinated" name="Vaccinated" fill="#0066cc" opacity={0.18} radius={[3, 3, 0, 0]} />
            )}

            {/* At-risk area */}
            {has('atRisk') && (
              <Area yAxisId="left" type="monotone" dataKey="atRisk" name="At-Risk" stroke="#f59e0b" strokeWidth={1.6} strokeDasharray="5 2" fill="url(#gradAtRisk)" dot={false} />
            )}

            {/* New cases — primary filled area */}
            {has('cases') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cases"
                name="New Cases"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#gradCases)"
                dot={{ r: 3.5, fill: '#059669', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
              />
            )}

            {/* Mortality */}
            {has('mortality') && (
              <Line yAxisId="left" type="monotone" dataKey="mortality" name="Mortality" stroke="#dc2626" strokeWidth={2.2} dot={{ r: 3.5, fill: '#dc2626', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            )}

            {/* Active alerts */}
            {has('alerts') && (
              <Line yAxisId="left" type="monotone" dataKey="alerts" name="Alerts" stroke="#f97316" strokeWidth={1.6} strokeDasharray="4 2" dot={{ r: 2.5, fill: '#f97316', strokeWidth: 0 }} />
            )}

            {/* Recovery rate — right axis with % scale */}
            {has('recoveryRate') && (
              <Line yAxisId="right" type="monotone" dataKey="recoveryRate" name="Recovery %" stroke="#10b981" strokeWidth={1.8} strokeDasharray="7 3" dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
