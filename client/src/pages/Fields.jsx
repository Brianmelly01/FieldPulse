import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdSearch, MdFilterList } from 'react-icons/md';
import { fieldsApi }    from '../api/index.js';
import { useAuth }      from '../context/AuthContext.jsx';
import FieldCard        from '../components/FieldCard.jsx';
import AddFieldModal    from '../components/AddFieldModal.jsx';

const STATUS_OPTS = ['All', 'Active', 'At Risk', 'Completed'];
const STAGE_OPTS  = ['All', 'Planted', 'Growing', 'Ready', 'Harvested'];

export default function Fields() {
  const { user }              = useAuth();
  const [fields, setFields]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState('All');
  const [stageF, setStageF]   = useState('All');

  const load = useCallback(() => {
    setLoading(true);
    fieldsApi.list()
      .then(setFields)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter
  const visible = fields.filter(f => {
    const q = search.toLowerCase();
    if (q && !f.name.toLowerCase().includes(q) &&
        !f.crop_type.toLowerCase().includes(q) &&
        !f.location?.toLowerCase().includes(q)) return false;
    if (statusF !== 'All' && f.status !== statusF) return false;
    if (stageF  !== 'All' && f.current_stage !== stageF) return false;
    return true;
  });

  return (
    <div className="fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user.role === 'admin' ? '🌾 All Fields' : '🌾 My Fields'}
          </h1>
          <p className="page-subtitle">
            {user.role === 'admin'
              ? `${fields.length} fields across all agents`
              : `${fields.length} field${fields.length !== 1 ? 's' : ''} assigned to you`}
          </p>
        </div>
        {user.role === 'admin' && (
          <button
            id="add-field-btn"
            className="btn btn-primary"
            onClick={() => setShowAdd(true)}
          >
            <MdAdd /> Add Field
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <MdSearch />
          <input
            className="form-input"
            placeholder="Search by name, crop, or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="field-search"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <MdFilterList style={{ color: 'var(--text-muted)' }} />
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 120 }}
            value={statusF}
            onChange={e => setStatusF(e.target.value)}
            id="status-filter"
          >
            {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 120 }}
            value={stageF}
            onChange={e => setStageF(e.target.value)}
            id="stage-filter"
          >
            {STAGE_OPTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loader-wrap"><div className="spinner" /></div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌿</div>
          <div className="empty-title">{fields.length === 0 ? 'No fields yet' : 'No matches found'}</div>
          <div className="empty-sub">
            {fields.length === 0
              ? user.role === 'admin'
                ? 'Create your first field to get started.'
                : 'You have no fields assigned yet.'
              : 'Try adjusting your search or filters.'}
          </div>
          {user.role === 'admin' && fields.length === 0 && (
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>
              <MdAdd /> Create First Field
            </button>
          )}
        </div>
      ) : (
        <div className="fields-grid">
          {visible.map(f => <FieldCard key={f.id} field={f} />)}
        </div>
      )}

      {showAdd && (
        <AddFieldModal
          onClose={() => setShowAdd(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
