import { useState } from 'react';
import { Megaphone, Send, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import { previousAlerts, districtOptions } from '../data/mockData.js';

const alertTypes = ['Vaccination', 'Disease Warning', 'General Advisory'];

export default function Alerts() {
  const [sendOpen, setSendOpen] = useState(false);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    district: '',
    language: 'Marathi',
    type: 'Disease Warning',
    message: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const send = () => {
    setSendOpen(false);
    setSuccess('Advisory sent successfully.');
    setTimeout(() => setSuccess(null), 3500);
  };

  return (
    <div>
      <div className="page-head">
        <div className="meta-line">PashuRakshak · Alerts</div>
        <h1>Alerts</h1>
        <p>Review recent alerts and send new advisories to district officers and field staff.</p>
        <div className="page-head-actions">
          <button className="btn btn-primary" onClick={() => setSendOpen(true)}>
            <Send size={15} /> Send New Alert
          </button>
        </div>
      </div>

      {success && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              <Megaphone size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Recent Alerts
            </div>
            <div className="card-subtitle">Previously sent advisories and notices</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>District</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {previousAlerts.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td className="cell-main">{a.district}</td>
                  <td>{a.message}</td>
                  <td>
                    <span className="pill pill-complete">{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title="Send New Alert"
        subtitle="Compose an alert for district officials and field officers"
        footer={
          <div className="flex-between">
            <button className="btn btn-outline" onClick={() => setSendOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={send} disabled={!form.district || !form.message}>
              <Send size={15} /> Send Alert
            </button>
          </div>
        }
      >
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Select District</label>
          <select value={form.district} onChange={set('district')}>
            <option value="">Select District</option>
            {districtOptions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Select Language</label>
          <select value={form.language} onChange={set('language')}>
            {['Marathi', 'Hindi', 'English'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Alert Type</label>
          <select value={form.type} onChange={set('type')}>
            {alertTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Message</label>
          <textarea
            value={form.message}
            onChange={set('message')}
            placeholder="Enter alert message…"
          />
        </div>
      </Modal>
    </div>
  );
}