const STAGES = ['Planted', 'Growing', 'Ready', 'Harvested'];

const STAGE_ICONS = {
  Planted:   '🌱',
  Growing:   '🌿',
  Ready:     '🌾',
  Harvested: '✅',
};

export function StagePill({ stage }) {
  const cls = stage?.toLowerCase() || 'planted';
  return (
    <span className={`stage-pill ${cls}`}>
      {STAGE_ICONS[stage] || '🌱'} {stage}
    </span>
  );
}

export function StageBar({ stage }) {
  const current = STAGES.indexOf(stage);
  return (
    <div className="stage-bar" title={`Stage: ${stage}`}>
      {STAGES.map((s, i) => (
        <div
          key={s}
          className={`stage-bar-step ${i < current ? 'done' : i === current ? 'current' : ''}`}
          title={s}
        />
      ))}
    </div>
  );
}
