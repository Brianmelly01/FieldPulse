// Base URL via Vite proxy (/api → http://localhost:5000/api)
const BASE = '/api';

function getToken() {
  return localStorage.getItem('fp_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('fp_token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ─── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
};

// ─── Fields ────────────────────────────────────────────────
export const fieldsApi = {
  list:         ()       => request('/fields'),
  get:          (id)     => request(`/fields/${id}`),
  create:       (data)   => request('/fields',    { method: 'POST', body: JSON.stringify(data) }),
  update:       (id, d)  => request(`/fields/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
  remove:       (id)     => request(`/fields/${id}`, { method: 'DELETE' }),
  getUpdates:   (id)     => request(`/fields/${id}/updates`),
  addUpdate:    (id, d)  => request(`/fields/${id}/updates`, { method: 'POST', body: JSON.stringify(d) }),
};

// ─── Users ─────────────────────────────────────────────────
export const usersApi = {
  list:   ()        => request('/users'),
  agents: ()        => request('/users/agents'),
  create: (data)    => request('/users',     { method: 'POST',   body: JSON.stringify(data) }),
  update: (id, d)   => request(`/users/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
  remove: (id)      => request(`/users/${id}`, { method: 'DELETE' }),
};

// ─── Dashboard ─────────────────────────────────────────────
export const dashboardApi = {
  get: () => request('/dashboard'),
};
