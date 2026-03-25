document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('jobseeker')) return;
  initNavbar();
  loadProfile();
  loadMyApplications();
  setupProfileForm();
  setupTabs();
});

const loadProfile = async () => {
  try {
    const data = await userAPI.getProfile();
    const user = data.user;
    const initial = user.name?.charAt(0).toUpperCase() || '?';
    document.getElementById('profile-avatar').textContent = initial;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-location').textContent = user.location || 'Location not set';
    document.getElementById('profile-bio').textContent = user.bio || 'No bio yet.';
    const skillsEl = document.getElementById('profile-skills');
    if (skillsEl) {
      skillsEl.innerHTML = user.skills?.length
        ? user.skills.map(s => `<span class="badge badge-primary">${s}</span>`).join('')
        : '<span style="color:var(--text-muted);font-size:0.85rem">No skills added yet</span>';
    }

    // Prefill edit form
    document.getElementById('edit-name').value = user.name || '';
    document.getElementById('edit-bio').value = user.bio || '';
    document.getElementById('edit-location').value = user.location || '';
    document.getElementById('edit-skills').value = (user.skills || []).join(', ');
    document.getElementById('edit-resume').value = user.resumeUrl || '';
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const setupProfileForm = () => {
  const form = document.getElementById('edit-profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const skillsRaw = document.getElementById('edit-skills').value;
      const body = {
        name: document.getElementById('edit-name').value.trim(),
        bio: document.getElementById('edit-bio').value.trim(),
        location: document.getElementById('edit-location').value.trim(),
        skills: skillsRaw.split(',').map(s => s.trim()).filter(Boolean),
        resumeUrl: document.getElementById('edit-resume').value.trim(),
      };

      const data = await userAPI.updateProfile(body);
      // Update stored user name
      const stored = getUser();
      if (stored) { stored.name = data.user.name; setAuth(getToken(), stored); }

      showToast('Profile updated! ✅', 'success');
      loadProfile();
      initNavbar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });
};

const loadMyApplications = async () => {
  const container = document.getElementById('my-applications');
  if (!container) return;
  container.innerHTML = `<div class="loading-box"><div class="spinner"></div></div>`;

  try {
    const data = await applicationsAPI.getMine();
    if (!data.applications.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📨</div><h3>No applications yet</h3><p>Start applying to jobs to see your applications here</p><a href="jobs.html" class="btn btn-primary" style="margin-top:1rem">Browse Jobs</a></div>`;
      return;
    }

    container.innerHTML = data.applications.map(app => `
      <div class="card" style="margin-bottom:1rem;cursor:pointer" onclick="window.location.href='job-detail.html?id=${app.job?._id}'">
        <div style="display:flex;align-items:flex-start;gap:1rem">
          <div class="company-logo">${companyInitial(app.job?.company)}</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:1rem">${app.job?.title || 'Job'}</div>
            <div style="color:var(--primary-light);font-size:0.85rem;margin-bottom:0.4rem">${app.job?.company || ''}</div>
            <div style="display:flex;gap:0.75rem;font-size:0.82rem;color:var(--text-muted);flex-wrap:wrap">
              <span>📍 ${app.job?.location || ''}</span>
              <span>${getJobTypeBadge(app.job?.type || 'full-time')}</span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            ${getStatusBadge(app.status)}
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.4rem">${formatDate(app.createdAt)}</div>
          </div>
        </div>
        ${app.employerNote ? `<div style="margin-top:0.75rem;padding:0.65rem;background:rgba(99,102,241,0.08);border-radius:8px;font-size:0.85rem;color:var(--text-secondary)"><strong>📝 Employer note:</strong> ${app.employerNote}</div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
};

const setupTabs = () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = p.id === tabId ? 'block' : 'none');
    });
  });
};
