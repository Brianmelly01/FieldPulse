import { useAuth } from '../context/AuthContext.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Header({ pageTitle, breadcrumb }) {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h1>{pageTitle}</h1>
        {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
      </div>

      <div className="header-right">
        <span className="header-greeting">
          {greeting()}, <strong style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</strong> 👋
        </span>
        <span className="header-badge">
          {user?.role === 'admin' ? '🌟' : '🌾'} {user?.role}
        </span>
      </div>
    </header>
  );
}
