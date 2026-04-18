import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Sidebar       from './components/Sidebar.jsx';
import Header        from './components/Header.jsx';
import Login         from './pages/Login.jsx';
import Dashboard     from './pages/Dashboard.jsx';
import Fields        from './pages/Fields.jsx';
import FieldDetail   from './pages/FieldDetail.jsx';
import Users         from './pages/Users.jsx';
import NotFound      from './pages/NotFound.jsx';

// ─── Layout wrapper (sidebar + header + outlet) ────────────
function Layout({ children, pageTitle, breadcrumb }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <Header pageTitle={pageTitle} breadcrumb={breadcrumb} />
      <main className="main-content fade-in">{children}</main>
    </div>
  );
}

// ─── Route guard ───────────────────────────────────────────
function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loader-wrap" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Loading FieldPulse…</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// ─── App ───────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />

          <Route path="/" element={
            <Protected>
              <Layout pageTitle="Dashboard" breadcrumb="Home / Dashboard">
                <Dashboard />
              </Layout>
            </Protected>
          } />

          <Route path="/fields" element={
            <Protected>
              <Layout pageTitle="Fields" breadcrumb="Home / Fields">
                <Fields />
              </Layout>
            </Protected>
          } />

          <Route path="/fields/:id" element={
            <Protected>
              <Layout pageTitle="Field Detail" breadcrumb="Home / Fields / Detail">
                <FieldDetail />
              </Layout>
            </Protected>
          } />

          <Route path="/users" element={
            <Protected adminOnly>
              <Layout pageTitle="Team" breadcrumb="Home / Team">
                <Users />
              </Layout>
            </Protected>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
