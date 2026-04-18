import { useState, useEffect } from 'react';
import { MdClose, MdAdd } from 'react-icons/md';
import { fieldsApi, usersApi } from '../api/index.js';

const STAGES    = ['Planted', 'Growing', 'Ready', 'Harvested'];
const CROP_OPTS = ['Maize','Cassava','Tomatoes','Beans','Sorghum','Rice','Broccoli','Onions','Sunflower','Carrots','Wheat','Potatoes'];

const EMPTY = {
  name: '', crop_type: 'Maize', planting_date: '',
  current_stage: 'Planted', location: '',
  area_hectares: '', description: '', assigned_to: '',
};

export default function AddFieldModal({ onClose, onCreated, editField = null }) {
  const [form,    setForm]    = useState(editField ? {
    name:          editField.name,
    crop_type:     editField.crop_type,
    planting_date: editField.planting_date?.split('T')[0] || editField.planting_date,
    current_stage: editField.current_stage,
    location:      editField.location      || '',
    area_hectares: editField.area_hectares || '',
    description:   editField.description   || '',
    assigned_to:   editField.assigned_to   || '',
  } : EMPTY);
  const [agents,  setAgents]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    usersApi.agents().then(setAgents).catch(() => {});
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.planting_date) {
      setError('Field name and planting date are required.');
      return;
    }
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        area_hectares: form.area_hectares ? parseFloat(form.area_hectares) : 1.0,
        assigned_to:   form.assigned_to   ? parseInt(form.assigned_to)     : null,
      };
      if (editField) {
        await fieldsApi.update(editField.id, payload);
      } else {
        await fieldsApi.create(payload);
      }
      onCreated();
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
          <h2 className="modal-title">{editField ? '✏️ Edit Field' : '🌱 Add New Field'}</h2>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Field Name *</label>
              <input className="form-input" placeholder="e.g. North Block Plot A" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Crop Type *</label>
              <select className="form-select" value={form.crop_type} onChange={e => set('crop_type', e.target.value)}>
                {CROP_OPTS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Planting Date *</label>
              <input className="form-input" type="date" value={form.planting_date} onChange={e => set('planting_date', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Current Stage</label>
              <select className="form-select" value={form.current_stage} onChange={e => set('current_stage', e.target.value)}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Area (hectares)</label>
              <input className="form-input" type="number" step="0.1" min="0.1" placeholder="1.0" value={form.area_hectares} onChange={e => set('area_hectares', e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Location / Plot Reference</label>
              <input className="form-input" placeholder="e.g. Northern Ridge, Sector 4" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Assign to Agent</label>
              <select className="form-select" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">— Unassigned —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Notes / Description</label>
              <textarea className="form-textarea" rows={3} placeholder="Any additional context about this field…"
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          {error && <div className="error-banner">⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="submit-field-btn">
              <MdAdd />
              {loading ? 'Saving…' : editField ? 'Save Changes' : 'Create Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
