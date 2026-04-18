import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { dashboardApi } from '../api/index.js';
import { useAuth }       from '../context/AuthContext.jsx';
import StatusBadge       from '../components/StatusBadge.jsx';
import { StagePill }     from '../components/StagePill.jsx';
import { cropEmoji }     from '../components/CropIcon.jsx';

const STATUS_COLORS  = { Active: '#5BB043', 'At Risk': '#F97316', Completed: '#64B5F6' };
const STAGE_COLORS   = { Planted: '#90A4AE', Growing: '#5BB043', Ready: '#F9A825', Harvested: '#8D6E63' };

// Animated count-up hook
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    if (!target) { setCount(target ?? 0); return; }
    start.current = Date.now();
    const step = () => {
      const progress = Math.min((Date.now() - start.current) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

function StatCard({ icon, value, label, color = 'var(--primary)' }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      </div>
      <div className="stat-body">
        <div className="stat-value">{typeof value === 'number' ? animated : (value ?? '—')}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function safeTimeAgo(d) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; }
}

export default function Dashboard() {
  const { user }            = useAuth();
  const navigate            = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loader-wrap">
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)' }}>Loading dashboard…</span>
    </div>
  );

  if (!data) return <div className="error-banner">⚠️ Failed to load dashboard</div>;

  const {
    totalFields, statusBreakdown, stageBreakdown,
    recentUpdates, atRiskFields, agentCount, agentMetrics,
  } = data;

  const statusChartData = Object.entries(statusBreakdown).map(([name, value]) => ({ name, value }));
  const stageChartData  = Object.entries(stageBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="fade-in">
      {/* ── Stats ────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard icon="🌾" value={totalFields} label="Total Fields" color="var(--primary)" />
        <StatCard icon="✅" value={statusBreakdown.Active}    label="Active Fields"    color="var(--status-active)" />
        <StatCard icon="⚠️" value={statusBreakdown['At Risk']} label="At-Risk Fields"  color="var(--status-risk)" />
        <StatCard icon="🏆" value={statusBreakdown.Completed} label="Completed"        color="var(--status-completed)" />
        {user.role === 'admin' && (
          <StatCard icon="👥" value={agentCount} label="Field Agents" color="var(--gold)" />
        )}
      </div>

      {/* ── At-risk alert ────────────────────────── */}
      {atRiskFields?.length > 0 && (
        <div className="risk-alert" style={{ marginBottom: 24 }}>
          <span className="risk-alert-icon">⚠️</span>
          <div className="risk-alert-body">
            <div className="title">{atRiskFields.length} field{atRiskFields.length > 1 ? 's' : ''} need{atRiskFields.length === 1 ? 's' : ''} attention</div>
            <div className="sub">
              {atRiskFields.map(f => f.name).join(', ')} — check for updates or overdue harvests.
            </div>
          </div>
        </div>
      )}

      {/* ── Charts + Activity ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>

        {/* Status distribution chart */}
        <div className="card">
          <div className="section-title">📊 Status Overview</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                labelLine={false}
              >
                {statusChartData.map(entry => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--text-secondary)' }}
              />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stage distribution chart */}
        <div className="card">
          <div className="section-title">🌱 Stage Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stageChartData.filter(d => d.value > 0)}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${value}`}
              >
                {stageChartData.map(entry => (
                  <Cell key={entry.name} fill={STAGE_COLORS[entry.name] || '#ccc'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
                itemStyle={{ color: 'var(--text-secondary)' }}
              />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Activity + Agent Metrics ──────── */}
      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* Recent updates */}
        <div className="card">
          <div className="section-title">🕐 Recent Activity</div>
          {recentUpdates?.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-icon">📋</div>
              <div className="empty-sub">No updates yet</div>
            </div>
          ) : (
            <div className="activity-feed">
              {recentUpdates?.map(u => (
                <div key={u.id} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <div className="activity-title">
                      <span
                        style={{ cursor: 'pointer', color: 'var(--primary-light)', textDecoration: 'underline dotted' }}
                        onClick={() => navigate(`/fields/${u.field_id}`)}
                      >
                        {cropEmoji(u.crop_type)} {u.field_name}
                      </span>
                      {' '}moved to{' '}
                      <StagePill stage={u.stage} />
                    </div>
                    <div className="activity-meta">
                      by {u.agent_name} · {safeTimeAgo(u.created_at)}
                      {u.notes && (
                        <div style={{ marginTop: 3, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                          "{u.notes.length > 80 ? u.notes.slice(0, 80) + '…' : u.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin: agent performance table */}
        {user.role === 'admin' && agentMetrics && (
          <div className="card">
            <div className="section-title">👥 Agent Overview</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Fields</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {agentMetrics.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                          {a.total_fields}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--status-completed)' }}>
                          {a.completed} / {a.total_fields}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {agentMetrics.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No agents yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Agent: My Season at a Glance ─────────── */}

      {user.role === 'agent' && totalFields > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title">🌱 My Season at a Glance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 14 }}>
            {[
              { icon: '🌱', label: 'Planted',   val: stageBreakdown.Planted,   color: '#90A4AE' },
              { icon: '🌿', label: 'Growing',   val: stageBreakdown.Growing,   color: 'var(--primary)' },
              { icon: '🌾', label: 'Ready',     val: stageBreakdown.Ready,     color: 'var(--gold)' },
              { icon: '✅', label: 'Harvested', val: stageBreakdown.Harvested, color: 'var(--status-completed)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-body)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          {statusBreakdown['At Risk'] > 0 && (
            <div style={{
              background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              fontSize: '0.82rem', color: '#FB8C4A',
            }}>
              ⚠️ You have <strong>{statusBreakdown['At Risk']}</strong> field{statusBreakdown['At Risk'] > 1 ? 's' : ''} at risk — log an update to keep them on track.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

