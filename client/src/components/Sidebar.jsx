import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  MdDashboard, MdGrass, MdPeople, MdLogout,
} from 'react-icons/md';

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🌱</div>
        <div className="logo-text">
          <h2>FieldPulse</h2>
          <span>SmartSeason Monitor</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Main</span>

        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MdDashboard />
          Dashboard
        </NavLink>

        <NavLink to="/fields" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MdGrass />
          {user?.role === 'admin' ? 'All Fields' : 'My Fields'}
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <span className="nav-section-label" style={{ marginTop: 8 }}>Admin</span>
            <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <MdPeople />
              Team
            </NavLink>
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials(user?.name)}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role === 'admin' ? '🌟 Coordinator' : '🌾 Field Agent'}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <MdLogout />
        </button>
      </div>
    </aside>
  );
}
