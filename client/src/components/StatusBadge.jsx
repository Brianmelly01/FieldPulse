export default function StatusBadge({ status }) {
  const map = {
    'Active':    { cls: 'active',    label: 'Active' },
    'At Risk':   { cls: 'at-risk',   label: 'At Risk' },
    'Completed': { cls: 'completed', label: 'Completed' },
  };

  const { cls, label } = map[status] || { cls: 'active', label: status };

  return (
    <span className={`status-badge ${cls}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}
