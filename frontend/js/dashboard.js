document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('employer')) return;
  initNavbar();
  loadDashboard();
  setupJobForm();
  setupTabs();
});

let editingJobId = null;
let allMyJobs = [];

const loadDashboard = async () => {
  await Promise.all([loadMyJobs(), loadStats()]);
};

const loadStats = async () => {
  try {
    const data = await jobsAPI.getMyJobs();
    const jobs = data.jobs;
    const open = jobs.filter(j => j.status === 'open').length;
    const totalApps = jobs.reduce((a, j) => a + (j.applicationsCount || 0), 0);
    document.getElementById('stat-jobs').textContent = jobs.length;
    document.getElementById('stat-open').textContent = open;
    document.getElementById('stat-apps').textContent = totalApps;
  } catch (e) {}
};

const loadMyJobs = async () => {
  const container = document.getElementById('my-jobs-list');
  if (!container) return;
  container.innerHTML = `<div class="loading-box"><div class="spinner"></div></div>`;

  try {
    const data = await jobsAPI.getMyJobs();
    allMyJobs = data.jobs;

    if (!data.jobs.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>No jobs posted yet</h3><p>Post your first job to start hiring!</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Type</th>
              <th>Applicants</th>
              <th>Status</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.jobs.map(job => `
              <tr>
                <td>
                  <div style="font-weight:600">${job.title}</div>
                  <div style="font-size:0.8rem;color:var(--text-muted)">${job.location}</div>
                </td>
                <td>${getJobTypeBadge(job.type)}</td>
                <td><span style="font-weight:600;color:var(--primary-light)">${job.applicationsCount || 0}</span></td>
                <td>${getStatusBadge(job.status)}</td>
                <td style="color:var(--text-muted);font-size:0.85rem">${formatDate(job.createdAt)}</td>
                <td>
                  <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                    <button class="btn btn-sm btn-outline" onclick="viewApplications('${job._id}', '${job.title}')">👥 Applicants</button>
                    <button class="btn btn-sm btn-ghost" onclick="editJob('${job._id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteJob('${job._id}')">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
};

const setupJobForm = () => {
  const form = document.getElementById('post-job-form');
  if (!form) return;

  const user = getUser();
  const companyInput = document.getElementById('job-company');
  if (companyInput && user?.companyName) companyInput.value = user.companyName;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const skillsRaw = document.getElementById('job-skills').value;
    const reqRaw = document.getElementById('job-requirements').value;

    const body = {
      title: document.getElementById('job-title').value.trim(),
      company: document.getElementById('job-company').value.trim(),
      location: document.getElementById('job-location').value.trim(),
      type: document.getElementById('job-type').value,
      category: document.getElementById('job-category').value,
      experience: document.getElementById('job-experience').value,
      description: document.getElementById('job-description').value.trim(),
      skills: skillsRaw.split(',').map(s => s.trim()).filter(Boolean),
      requirements: reqRaw.split('\n').map(s => s.trim()).filter(Boolean),
      salary: {
        min: Number(document.getElementById('salary-min').value) || undefined,
        max: Number(document.getElementById('salary-max').value) || undefined,
      },
      status: document.getElementById('job-status').value,
    };

    try {
      if (editingJobId) {
        await jobsAPI.update(editingJobId, body);
        showToast('Job updated successfully! ✅', 'success');
        editingJobId = null;
        btn.textContent = 'Post Job';
        document.getElementById('form-title').textContent = '📝 Post a New Job';
        document.getElementById('cancel-edit')?.remove();
      } else {
        await jobsAPI.create(body);
        showToast('Job posted successfully! 🎉', 'success');
      }
      form.reset();
      if (user?.companyName && document.getElementById('job-company')) {
        document.getElementById('job-company').value = user.companyName;
      }
      await loadMyJobs();
      await loadStats();
      switchTab('my-jobs-tab');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      if (!editingJobId) btn.textContent = 'Post Job';
    }
  });
};

const editJob = async (id) => {
  const job = allMyJobs.find(j => j._id === id);
  if (!job) return;

  editingJobId = id;
  switchTab('post-job-tab');

  document.getElementById('form-title').textContent = '✏️ Edit Job';
  document.getElementById('job-title').value = job.title || '';
  document.getElementById('job-company').value = job.company || '';
  document.getElementById('job-location').value = job.location || '';
  document.getElementById('job-type').value = job.type || 'full-time';
  document.getElementById('job-category').value = job.category || 'Technology';
  document.getElementById('job-experience').value = job.experience || 'Any';
  document.getElementById('job-description').value = job.description || '';
  document.getElementById('job-skills').value = (job.skills || []).join(', ');
  document.getElementById('job-requirements').value = (job.requirements || []).join('\n');
  document.getElementById('salary-min').value = job.salary?.min || '';
  document.getElementById('salary-max').value = job.salary?.max || '';
  document.getElementById('job-status').value = job.status || 'open';

  const btn = document.querySelector('#post-job-form button[type="submit"]');
  btn.textContent = 'Update Job';

  let cancelBtn = document.getElementById('cancel-edit');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit';
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      editingJobId = null;
      document.getElementById('post-job-form').reset();
      document.getElementById('form-title').textContent = '📝 Post a New Job';
      btn.textContent = 'Post Job';
      cancelBtn.remove();
    };
    btn.parentNode.insertBefore(cancelBtn, btn);
  }
};

const deleteJob = async (id) => {
  if (!confirm('Delete this job? All applications will be lost.')) return;
  try {
    await jobsAPI.delete(id);
    showToast('Job deleted', 'info');
    await loadMyJobs();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const viewApplications = async (jobId, jobTitle) => {
  const modal = document.getElementById('apps-modal');
  const modalTitle = document.getElementById('apps-modal-title');
  const body = document.getElementById('apps-modal-body');
  if (!modal) return;

  modalTitle.textContent = `Applicants – ${jobTitle}`;
  body.innerHTML = `<div class="loading-box"><div class="spinner"></div></div>`;
  modal.classList.add('open');

  try {
    const data = await applicationsAPI.getForJob(jobId);
    if (!data.applications.length) {
      body.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><h3>No applications yet</h3></div>`;
      return;
    }
    body.innerHTML = data.applications.map(app => `
      <div class="card" style="margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem">
          <div class="nav-avatar" style="width:44px;height:44px;font-size:1.1rem">${(app.applicant?.name || 'U').charAt(0)}</div>
          <div style="flex:1">
            <div style="font-weight:700">${app.applicant?.name || 'Unknown'}</div>
            <div style="color:var(--text-muted);font-size:0.82rem">${app.applicant?.email || ''}</div>
          </div>
          <div>${getStatusBadge(app.status)}</div>
        </div>
        ${app.applicant?.skills?.length ? `<div style="margin-bottom:0.75rem;display:flex;gap:0.4rem;flex-wrap:wrap">${app.applicant.skills.map(s=>`<span class="badge badge-ghost">${s}</span>`).join('')}</div>` : ''}
        ${app.coverLetter ? `<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.75rem;background:var(--bg-input);padding:0.75rem;border-radius:8px">${app.coverLetter}</p>` : ''}
        ${app.resumeUrl ? `<a href="${app.resumeUrl}" target="_blank" class="btn btn-sm btn-outline" style="margin-bottom:0.75rem">📄 Resume</a>` : ''}
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <select class="filter-select" id="status-${app._id}" onchange="updateAppStatus('${app._id}', this.value)">
            ${['pending','reviewed','accepted','rejected'].map(s=>`<option value="${s}" ${app.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.5rem">Applied ${formatDate(app.createdAt)}</div>
      </div>
    `).join('');
  } catch (err) {
    body.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
};

const updateAppStatus = async (appId, status) => {
  try {
    await applicationsAPI.updateStatus(appId, { status });
    showToast(`Status updated to ${status}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const setupTabs = () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.getElementById('apps-modal-close')?.addEventListener('click', () => {
    document.getElementById('apps-modal').classList.remove('open');
  });
  document.getElementById('apps-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'apps-modal') e.target.classList.remove('open');
  });
};

const switchTab = (tabId) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = p.id === tabId ? 'block' : 'none');
};
