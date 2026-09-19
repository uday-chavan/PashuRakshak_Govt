import { useState } from 'react';
import { FlaskConical, FileText } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import Modal from '../components/Modal.jsx';
import { labStats, samples, labStatusPill, labReport } from '../data/mockData.js';

export default function Laboratory() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [reportSample, setReportSample] = useState(null);

  const statusOptions = ['All', 'Collected', 'Under Testing', 'Positive', 'Negative', 'Report Ready'];

  const filtered = samples.filter(
    (s) => statusFilter === 'All' || s.status === statusFilter
  );

  return (
    <div>
      <div className="page-head">
        <div className="meta-line">PashuRakshak · Laboratory</div>
        <h1>Laboratory</h1>
        <p>Track sample collection, testing status and diagnostic reports across laboratories.</p>
      </div>

      <div className="stat-grid">
        {labStats.map((s) => (
          <StatCard key={s.key} icon="FlaskConical" label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="card-head mt-22">
        <div className="card-title">Sample Registry</div>
        <div className="filter-bar" style={{ padding: 0, border: 'none', boxShadow: 'none', marginBottom: 0 }}>
          <div className="field">
            <label>Filter by status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Sample ID</th>
              <th>Case ID</th>
              <th>District</th>
              <th>Test</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="cell-main">{s.id}</td>
                <td>{s.caseId}</td>
                <td>{s.district}</td>
                <td>{s.test}</td>
                <td>
                  <span className={`pill ${labStatusPill[s.status] || 'pill-neutral'}`}>
                    {s.status}
                  </span>
                </td>
                <td>{s.date}</td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setReportSample(s)}
                  >
                    <FileText size={13} /> View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!reportSample}
        onClose={() => setReportSample(null)}
        title="Laboratory Report"
        subtitle={reportSample ? `${reportSample.test} · ${reportSample.district}` : ''}
      >
        {reportSample && (
          <div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="k">Report No.</div>
                <div className="v">{labReport.reportNo}</div>
              </div>
              <div className="detail-item">
                <div className="k">Laboratory</div>
                <div className="v">{labReport.lab}</div>
              </div>
              <div className="detail-item">
                <div className="k">Sample ID</div>
                <div className="v">{reportSample.id}</div>
              </div>
              <div className="detail-item">
                <div className="k">Case ID</div>
                <div className="v">{reportSample.caseId}</div>
              </div>
              <div className="detail-item">
                <div className="k">Disease Tested</div>
                <div className="v">{labReport.disease}</div>
              </div>
              <div className="detail-item">
                <div className="k">Status</div>
                <div className="v">
                  <span className={`pill ${labStatusPill[reportSample.status] || 'pill-neutral'}`}>
                    {reportSample.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-22">
              <div className="card-title" style={{ fontSize: 14, marginBottom: 8 }}>
                <FlaskConical size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Sample Details
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                <div><b>Sample type:</b> {labReport.sampleType}</div>
                <div><b>Test method:</b> {labReport.testMethod}</div>
                <div><b>Collected:</b> {reportSample.date}</div>
              </div>
            </div>
            <p className="data-note">Static demonstration report for the prototype.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}