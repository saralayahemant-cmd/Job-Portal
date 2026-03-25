let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  loadJobs();
  setupFilters();
});

const setupFilters = () => {
  ['search-input', 'type-filter', 'category-filter', 'experience-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', debounce(() => { currentPage = 1; loadJobs(); }, 400));
    el.addEventListener('change', () => { currentPage = 1; loadJobs(); });
  });

  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) searchBtn.addEventListener('click', () => { currentPage = 1; loadJobs(); });

  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    ['search-input', 'type-filter', 'category-filter', 'experience-filter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    currentPage = 1;
    loadJobs();
  });
};

const loadJobs = async () => {
  const grid = document.getElementById('jobs-grid');
  const countEl = document.getElementById('jobs-count');
  if (!grid) return;

  grid.innerHTML = `<div class="loading-box" style="grid-column:1/-1"><div class="spinner"></div><p>Loading jobs...</p></div>`;

  const params = {
    page: currentPage,
    limit: 12,
  };

  const search = document.getElementById('search-input')?.value.trim();
  const type = document.getElementById('type-filter')?.value;
  const category = document.getElementById('category-filter')?.value;
  const experience = document.getElementById('experience-filter')?.value;

  if (search) params.search = search;
  if (type) params.type = type;
  if (category) params.category = category;
  if (experience) params.experience = experience;

  try {
    const data = await jobsAPI.getAll(params);
    totalPages = data.pages || 1;

    if (countEl) countEl.textContent = `${data.total} job${data.total !== 1 ? 's' : ''} found`;

    if (!data.jobs.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔍</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>`;
      renderPagination();
      return;
    }

    grid.innerHTML = data.jobs.map(renderJobCard).join('');
    renderPagination();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><h3>Failed to load jobs</h3><p>${err.message}</p></div>`;
  }
};

const renderJobCard = (job) => `
  <div class="job-card" onclick="window.location.href='job-detail.html?id=${job._id}'">
    <div class="job-card-header">
      <div class="company-logo">${companyInitial(job.company)}</div>
      <div class="job-card-meta">
        <div class="job-title">${job.title}</div>
        <div class="job-company">${job.company}</div>
      </div>
      ${job.status === 'open' ? '<span class="badge badge-success" style="margin-left:auto;flex-shrink:0">Open</span>' : '<span class="badge badge-danger" style="margin-left:auto;flex-shrink:0">Closed</span>'}
    </div>
    <div style="display:flex;gap:0.5rem;align-items:center;color:var(--text-muted);font-size:0.82rem;flex-wrap:wrap;">
      <span>📍 ${job.location}</span>
      ${job.category ? `<span>• ${job.category}</span>` : ''}
    </div>
    <div class="job-card-tags">
      ${getJobTypeBadge(job.type)}
      ${job.experience ? `<span class="badge badge-ghost">${job.experience}</span>` : ''}
      ${(job.skills || []).slice(0, 3).map(s => `<span class="badge badge-ghost">${s}</span>`).join('')}
    </div>
    <div class="job-card-footer">
      <div class="job-salary">${formatSalary(job.salary)}</div>
      <div style="display:flex;align-items:center;gap:1rem">
        <span style="font-size:0.78rem;color:var(--text-muted)">👥 ${job.applicationsCount || 0} applicants</span>
        <div class="job-date">${formatDate(job.createdAt)}</div>
      </div>
    </div>
  </div>
`;

const renderPagination = () => {
  const pg = document.getElementById('pagination');
  if (!pg) return;

  if (totalPages <= 1) { pg.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) html += `<button class="page-btn" onclick="changePage(${currentPage - 1})">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
    }
  }
  if (currentPage < totalPages) html += `<button class="page-btn" onclick="changePage(${currentPage + 1})">›</button>`;
  pg.innerHTML = html;
};

const changePage = (page) => {
  currentPage = page;
  loadJobs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};
