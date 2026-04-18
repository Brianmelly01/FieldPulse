import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { StagePill, StageBar } from './StagePill.jsx';
import CropIcon from './CropIcon.jsx';
import { formatDistanceToNow } from 'date-fns';

function safeTimeAgo(dateStr) {
  if (!dateStr) return 'No updates yet';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
}

function statusClass(status) {
  if (status === 'Active')    return 'status-active';
  if (status === 'At Risk')   return 'status-at-risk';
  if (status === 'Completed') return 'status-completed';
  return '';
}

export default function FieldCard({ field }) {
  const navigate = useNavigate();

  return (
    <article
      className={`field-card slide-up ${statusClass(field.status)}`}
      onClick={() => navigate(`/fields/${field.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/fields/${field.id}`)}
      aria-label={`View field: ${field.name}`}
    >
      {/* Header row */}
      <div className="field-card-header">
        <CropIcon cropType={field.crop_type} size="2.2rem" />
        <StatusBadge status={field.status} />
      </div>

      {/* Name + location */}
      <div>
        <div className="field-card-name">{field.name}</div>
        <div className="field-card-meta">
          <span>📍</span>
          <span>{field.location || 'Location not set'}</span>
        </div>
        <div className="field-card-meta" style={{ marginTop: 3 }}>
          <span>🌿</span>
          <span>{field.crop_type}</span>
          <span style={{ margin: '0 3px', color: 'var(--border-light)' }}>·</span>
          <span>{field.area_hectares} ha</span>
        </div>
      </div>

      {/* Stage */}
      <div>
        <StagePill stage={field.current_stage} />
        <div style={{ marginTop: 8 }}>
          <StageBar stage={field.current_stage} />
        </div>
      </div>

      {/* Footer */}
      <div className="field-card-footer">
        <span>
          {field.agent_name ? `👤 ${field.agent_name}` : 'Unassigned'}
        </span>
        <span title={field.last_update_date || ''}>
          🕐 {safeTimeAgo(field.last_update_date || field.updated_at)}
        </span>
      </div>
    </article>
  );
}
