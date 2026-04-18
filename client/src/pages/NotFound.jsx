import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-body)',
      gap: 16,
      padding: 32,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '5rem', lineHeight: 1 }}>🌿</div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '2.5rem',
        color: 'var(--text-primary)',
        fontWeight: 700,
      }}>
        Lost in the field?
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 360 }}>
        The page you're looking for doesn't exist — or may have been harvested already.
      </p>
      <button
        className="btn btn-primary btn-lg"
        style={{ marginTop: 8 }}
        onClick={() => navigate('/')}
      >
        🏠 Back to Dashboard
      </button>
    </div>
  );
}
