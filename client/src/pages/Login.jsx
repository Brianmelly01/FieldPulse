import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MdWarning } from 'react-icons/md';

const DEMO_CREDS = [
  { role: 'admin', email: 'coordinator@fieldpulse.com', pw: 'admin123', name: 'Dr. Kofi Mensah' },
  { role: 'admin', email: 'sarah@fieldpulse.com',       pw: 'admin123', name: 'Sarah Owusu' },
  { role: 'agent', email: 'james@fieldpulse.com',       pw: 'agent123', name: 'James Asante' },
  { role: 'agent', email: 'amara@fieldpulse.com',       pw: 'agent123', name: 'Amara Diallo' },
  { role: 'agent', email: 'kwame@fieldpulse.com',       pw: 'agent123', name: 'Kwame Boateng' },
];

export default function Login() {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillCreds(cred) {
    setEmail(cred.email);
    setPassword(cred.pw);
    setError('');
  }

  return (
    <div className="login-page">
      {/* ── Left hero panel ────────────────────────── */}
      <div className="login-left">
        <div className="login-left-content">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">🌱</div>
            <div>
              <div className="login-brand-name">FieldPulse</div>
              <div className="login-brand-tagline">SmartSeason Field Monitoring</div>
            </div>
          </div>

          {/* Hero text */}
          <h1 className="login-hero-title">
            Every field tells<br />
            a <em>story.</em><br />
            We help you<br />
            <em>listen.</em>
          </h1>

          <p className="login-hero-subtitle">
            Monitor crop progress, track field stages, and keep your team
            aligned — from planting to harvest, all in one living dashboard.
          </p>

          {/* Mini stats */}
          <div className="login-stats">
            <div className="login-stat-item">
              <div className="value">10</div>
              <div className="label">Active Fields</div>
            </div>
            <div className="login-stat-item">
              <div className="value">5</div>
              <div className="label">Team Members</div>
            </div>
            <div className="login-stat-item">
              <div className="value">4</div>
              <div className="label">Crop Seasons</div>
            </div>
          </div>
        </div>

        {/* Decorative rows */}
        <div className="field-rows">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="field-row" style={{ animationDelay: `${i * -0.7}s`, opacity: 0.5 + i * 0.05 }} />
          ))}
        </div>
      </div>

      {/* ── Right form panel ────────────────────────── */}
      <div className="login-right">
        <div className="login-form-container slide-up">
          <h2 className="login-form-title">Welcome back 👋</h2>
          <p className="login-form-sub">Sign in to your FieldPulse account</p>

          {/* Demo credentials */}
          <div className="demo-creds">
            <div className="demo-creds-title">
              🧪 Demo Credentials — click to fill
            </div>
            {DEMO_CREDS.map(c => (
              <div key={c.email} className="demo-cred-row">
                <span className={`role-tag ${c.role}`}>{c.role}</span>
                <span className="demo-cred-value" style={{ flex: 1 }}>{c.name}</span>
                <button
                  type="button"
                  className="login-fill-btn"
                  onClick={() => fillCreds(c)}
                >
                  Use →
                </button>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="agent@fieldpulse.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="error-banner">
                <MdWarning size={16} />
                {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center', width: '100%' }}
            >
              {loading ? '🌱 Signing in…' : 'Sign in to FieldPulse'}
            </button>
          </form>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
            Contact your coordinator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
