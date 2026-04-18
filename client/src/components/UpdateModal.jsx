import { useState } from 'react';
import { MdClose, MdSend } from 'react-icons/md';
import { fieldsApi } from '../api/index.js';
import { StagePill } from './StagePill.jsx';

const STAGES = ['Planted', 'Growing', 'Ready', 'Harvested'];

export default function UpdateModal({ field, onClose, onUpdated }) {
  const [stage, setStage] = useState(field.current_stage);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!notes.trim()) { setError('Please add a note about this update.'); return; }
    setLoading(true);
    setError('');
    try {
      await fieldsApi.addUpdate(field.id, { stage, notes: notes.trim() });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">📝 Log Field Update</h2>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        <div style={{ marginBottom: 18, padding: '10px 14px', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Updating field</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{field.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Current stage: <StagePill stage={field.current_stage} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">New Stage</label>
            <select
              className="form-select"
              value={stage}
              onChange={e => setStage(e.target.value)}
            >
              {STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observations & Notes *</label>
            <textarea
              className="form-textarea"
              placeholder="What did you observe in the field today? Note any changes, concerns, or milestones…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {error && <div className="error-banner">⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="submit-update-btn">
              <MdSend />
              {loading ? 'Saving…' : 'Submit Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
