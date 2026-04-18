import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate }           from 'react-router-dom';
import { format, formatDistanceToNow }      from 'date-fns';
import { MdArrowBack, MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { fieldsApi }  from '../api/index.js';
import { useAuth }    from '../context/AuthContext.jsx';
import StatusBadge    from '../components/StatusBadge.jsx';
import { StagePill, StageBar } from '../components/StagePill.jsx';
import CropIcon       from '../components/CropIcon.jsx';
import UpdateModal    from '../components/UpdateModal.jsx';
import AddFieldModal  from '../components/AddFieldModal.jsx';

function safeDate(d)    { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } }
function safeAgo(d)     { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } }
function initials(n='') { return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }

const STAGE_ICONS = { Planted:'🌱', Growing:'🌿', Ready:'🌾', Harvested:'✅' };

export default function FieldDetail() {
  const { id }                = useParams();
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [field,  setField]    = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, u] = await Promise.all([fieldsApi.get(id), fieldsApi.getUpdates(id)]);
      setField(f); setUpdates(u);
    } catch {
      navigate('/fields');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!confirm(`Delete "${field.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fieldsApi.remove(id);
      navigate('/fields');
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;
  if (!field)  return null;

  const canUpdate = user.role === 'admin' || user.id === field.assigned_to;
  const daysSincePlanted = Math.floor(
    (Date.now() - new Date(field.planting_date)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fade-in">
      {/* Back button */}
      <button
        className="btn btn-outline btn-sm"
        style={{ marginBottom: 20 }}
        onClick={() => navigate('/fields')}
        id="back-to-fields-btn"
      >
        <MdArrowBack /> Back to Fields
      </button>

      {/* ── Hero card ──────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <CropIcon cropType={field.crop_type} size="3rem" />
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {field.name}
              </h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={field.status} />
                <StagePill stage={field.current_stage} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {canUpdate && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowUpdate(true)} id="log-update-btn">
                <MdAdd /> Log Update
              </button>
            )}
            {user.role === 'admin' && (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setShowEdit(true)} id="edit-field-btn">
                  <MdEdit />
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting} id="delete-field-btn">
                  <MdDelete />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stage progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Season Progress
          </div>
          <StageBar stage={field.current_stage} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {['Planted', 'Growing', 'Ready', 'Harvested'].map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>

        <hr className="divider" />

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 18 }}>
          {[
            { label: '🌿 Crop',        value: field.crop_type },
            { label: '📍 Location',    value: field.location || 'Not specified' },
            { label: '📐 Area',        value: `${field.area_hectares} hectares` },
            { label: '📅 Planted',     value: safeDate(field.planting_date) },
            { label: '⏱️ Days Growing', value: `${daysSincePlanted} days` },
            { label: '👤 Agent',       value: field.agent_name || 'Unassigned' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {field.description && (
          <>
            <hr className="divider" />
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
              "{field.description}"
            </div>
          </>
        )}
      </div>

      {/* ── Update history ──────────────────────────── */}
      <div className="card">
        <div className="section-title">📋 Update History ({updates.length})</div>

        {updates.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-icon">📝</div>
            <div className="empty-sub">No updates logged yet for this field.</div>
          </div>
        ) : (
          <div className="update-timeline">
            {updates.map((u, idx) => (
              <div key={u.id} className="update-item">
                <div className="update-avatar" style={{ background: idx === 0 ? 'linear-gradient(135deg, var(--primary-dark), var(--primary))' : 'var(--bg-elevated)' }}>
                  {initials(u.agent_name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.agent_name}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>updated stage to</span>
                    <StagePill stage={u.stage} />
                  </div>
                  {u.notes && (
                    <div style={{ marginTop: 6, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {u.notes}
                    </div>
                  )}
                  <div style={{ marginTop: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {STAGE_ICONS[u.stage]} {safeDate(u.created_at)} · {safeAgo(u.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showUpdate && (
        <UpdateModal field={field} onClose={() => setShowUpdate(false)} onUpdated={load} />
      )}
      {showEdit && (
        <AddFieldModal editField={field} onClose={() => setShowEdit(false)} onCreated={load} />
      )}
    </div>
  );
}
