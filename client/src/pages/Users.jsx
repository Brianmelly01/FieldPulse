import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete, MdPerson, MdClose } from 'react-icons/md';
import { format } from 'date-fns';
import { usersApi } from '../api/index.js';
import { useAuth }  from '../context/AuthContext.jsx';

function initials(n = '') {
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function safeFmt(d) {
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; }
}

// ─── Add/Edit User Modal ───────────────────────────────────
function UserModal({ editUser = null, defaultRole = 'agent', onClose, onSaved }) {
  const EMPTY = { name: '', email: '', password: '', role: defaultRole };
  const [form, setForm]       = useState(editUser
    ? { name: editUser.name, email: editUser.email, password: '', role: editUser.role }
    : EMPTY
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editUser && !form.password) { setError('Password is required for new users.'); return; }
    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editUser) {
        await usersApi.update(editUser.id, payload);
      } else {
        await usersApi.create(payload);
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = form.role === 'admin';
  const roleColor   = isAdmin ? 'var(--gold)'    : 'var(--primary)';
  const roleGlow    = isAdmin ? 'var(--gold-dim)' : 'var(--primary-glow)';
  const roleBorder  = isAdmin ? 'rgba(249,168,37,0.35)' : 'rgba(91,176,67,0.3)';
  const roleEmoji   = isAdmin ? '🌟' : '🌾';
  const roleLabel   = isAdmin ? 'Admin / Coordinator' : 'Field Agent';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {editUser ? '✏️ Edit Member' : `${roleEmoji} Add ${roleLabel}`}
            </h2>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 6, padding: '2px 10px', borderRadius: 20,
              background: roleGlow, border: `1px solid ${roleBorder}`,
              fontSize: '0.72rem', fontWeight: 700, color: roleColor,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {roleLabel}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder={isAdmin ? 'e.g. Grace Mensah' : 'e.g. James Asante'} value={form.name}
              onChange={e => set('name', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" placeholder="name@fieldpulse.com" value={form.email}
              onChange={e => set('email', e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">{editUser ? 'New Password (optional)' : 'Password *'}</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => set('password', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="agent">🌾 Field Agent</option>
                <option value="admin">🌟 Admin / Coordinator</option>
              </select>
            </div>
          </div>

          {/* Role info card */}
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: roleGlow, border: `1px solid ${roleBorder}`,
            fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5,
          }}>
            {isAdmin
              ? '🌟 Admins can manage the entire team, add or remove members, and oversee all field operations.'
              : '🌾 Field Agents can log updates on assigned fields and view their own task dashboard.'}
          </div>

          {error && <div className="error-banner">⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn"
              disabled={loading}
              id="save-user-btn"
              style={{
                background: roleColor,
                color: isAdmin ? '#1A1000' : '#fff',
                fontWeight: 700,
              }}
            >
              <MdPerson />
              {loading ? 'Saving…' : editUser ? 'Save Changes' : `Add ${roleLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Users Page ────────────────────────────────────────────
export default function Users() {
  const { user: me }           = useAuth();
  const [users,   setUsers]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [modal,   setModal]    = useState(null); // null | { defaultRole, editUser? }
  const [editing, setEditing]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    usersApi.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(u) {
    if (!confirm(`Remove ${u.name} from the team? Their fields will become unassigned.`)) return;
    try {
      await usersApi.remove(u.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const admins = users.filter(u => u.role === 'admin');
  const agents = users.filter(u => u.role === 'agent');

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">👥 Team</h1>
          <p className="page-subtitle">
            {admins.length} coordinator{admins.length !== 1 ? 's' : ''} · {agents.length} field agent{agents.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Dual add buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn"
            id="add-admin-btn"
            onClick={() => setModal({ defaultRole: 'admin' })}
            style={{
              background: 'var(--gold-dim)',
              color: 'var(--gold-light)',
              border: '1px solid rgba(249,168,37,0.3)',
              fontWeight: 600,
            }}
          >
            <MdAdd /> Add Admin
          </button>
          <button
            className="btn btn-primary"
            id="add-agent-btn"
            onClick={() => setModal({ defaultRole: 'agent' })}
          >
            <MdAdd /> Add Field Agent
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader-wrap"><div className="spinner" /></div>
      ) : (
        <>
          {/* ── Coordinators ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="section-title" style={{ margin: 0 }}>🌟 Coordinators</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '1px 9px',
              borderRadius: 20, background: 'var(--gold-dim)', border: '1px solid rgba(249,168,37,0.25)',
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)',
            }}>{admins.length}</span>
          </div>

          <div className="table-wrap" style={{ marginBottom: 32 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Fields</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="empty-state" style={{ padding: 24 }}>
                      <div className="empty-icon">🌟</div>
                      <div className="empty-sub">No coordinators yet.</div>
                    </div>
                  </td></tr>
                )}
                {admins.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{
                          width: 32, height: 32, fontSize: '0.72rem',
                          background: 'linear-gradient(135deg, #7A6200, var(--gold))',
                        }}>{initials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          {u.id === me.id && <div style={{ fontSize: '0.68rem', color: 'var(--gold)' }}>You</div>}
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{safeFmt(u.created_at)}</td>
                    <td><span className="tag admin">{u.field_count} fields</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(u)} id={`edit-user-${u.id}`}><MdEdit /></button>
                        {u.id !== me.id && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)} id={`delete-user-${u.id}`}><MdDelete /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Field Agents ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="section-title" style={{ margin: 0 }}>🌾 Field Agents</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '1px 9px',
              borderRadius: 20, background: 'var(--primary-glow)', border: '1px solid rgba(91,176,67,0.25)',
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)',
            }}>{agents.length}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Assigned Fields</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="empty-state" style={{ padding: 24 }}>
                      <div className="empty-icon">🌾</div>
                      <div className="empty-sub">No field agents yet. Add one to get started.</div>
                    </div>
                  </td></tr>
                )}
                {agents.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{
                          width: 32, height: 32, fontSize: '0.72rem',
                          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                        }}>{initials(u.name)}</div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{safeFmt(u.created_at)}</td>
                    <td>
                      <span className="tag agent">{u.field_count} field{u.field_count !== 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(u)} id={`edit-user-${u.id}`}><MdEdit /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)} id={`delete-user-${u.id}`}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      {modal   && <UserModal defaultRole={modal.defaultRole} onClose={() => setModal(null)}   onSaved={load} />}
      {editing && <UserModal editUser={editing}              onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}
