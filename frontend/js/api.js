// ===== API BASE URL =====
const API_URL = 'https://job-portal-1-wjay.onrender.com'||'http://localhost:5000/api';

// ===== TOKEN MANAGEMENT =====
const getToken = () => localStorage.getItem('jp_token');
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('jp_user')); } catch { return null; }
};
const setAuth = (token, user) => {
  localStorage.setItem('jp_token', token);
  localStorage.setItem('jp_user', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('jp_token');
  localStorage.removeItem('jp_user');
};

// ===== CORE FETCH WRAPPER =====
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const errMsg = data.message || data.errors?.[0]?.msg || 'Something went wrong';
    throw new Error(errMsg);
  }
  return data;
};

// ===== AUTH API =====
const authAPI = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiFetch('/auth/me'),
};

// ===== JOBS API =====
const jobsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/jobs${qs ? '?' + qs : ''}`);
  },
  getById: (id) => apiFetch(`/jobs/${id}`),
  create: (body) => apiFetch('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/jobs/${id}`, { method: 'DELETE' }),
  getMyJobs: () => apiFetch('/jobs/my-jobs'),
};

// ===== APPLICATIONS API =====
const applicationsAPI = {
  apply: (jobId, body) => apiFetch(`/applications/${jobId}`, { method: 'POST', body: JSON.stringify(body) }),
  getForJob: (jobId) => apiFetch(`/applications/job/${jobId}`),
  getMine: () => apiFetch('/applications/me'),
  updateStatus: (id, body) => apiFetch(`/applications/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ===== USER API =====
const userAPI = {
  getProfile: () => apiFetch('/users/profile'),
  updateProfile: (body) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

// ===== TOAST NOTIFICATIONS =====
const showToast = (message, type = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

// ===== NAVBAR INIT =====
const initNavbar = () => {
  const user = getUser();
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) navLinks.classList.remove('open');
    });
  }

  if (user) {
    const initial = user.name?.charAt(0).toUpperCase() || '?';
    navActions.innerHTML = `
      <div class="nav-user">
        <div class="nav-avatar">${initial}</div>
        <span style="color:var(--text-secondary);font-size:0.85rem;">${user.name}</span>
      </div>
      ${user.role === 'employer'
        ? `<a href="dashboard.html" class="btn btn-outline btn-sm">Dashboard</a>`
        : `<a href="profile.html" class="btn btn-outline btn-sm">Profile</a>`}
      <button onclick="logout()" class="btn btn-ghost btn-sm">Logout</button>
    `;
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-ghost btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }
};

const logout = () => {
  clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = 'index.html', 600);
};

const requireAuth = (role = null) => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = 'login.html';
    return false;
  }
  if (role && user.role !== role) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
};

// ===== UTILS =====
const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatSalary = (salary) => {
  if (!salary?.min && !salary?.max) return 'Not specified';
  const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : n;
  if (salary.min && salary.max) return `$${fmt(salary.min)} – $${fmt(salary.max)}`;
  if (salary.min) return `From $${fmt(salary.min)}`;
  return `Up to $${fmt(salary.max)}`;
};

const getJobTypeBadge = (type) => {
  const map = { 'full-time': 'primary', 'part-time': 'secondary', 'remote': 'success', 'contract': 'warning', 'internship': 'ghost' };
  return `<span class="badge badge-${map[type] || 'ghost'}">${type}</span>`;
};

const getStatusBadge = (status) => {
  const map = { pending: 'warning', reviewed: 'secondary', accepted: 'success', rejected: 'danger', open: 'success', closed: 'danger' };
  return `<span class="badge badge-${map[status] || 'ghost'}"><span class="status-dot ${status}"></span>${status}</span>`;
};

const companyInitial = (name) => (name || 'C').charAt(0).toUpperCase();
