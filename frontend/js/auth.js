document.addEventListener('DOMContentLoaded', () => {
  initNavbar();

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    // Redirect if already logged in
    if (getToken()) window.location.href = getUser()?.role === 'employer' ? 'dashboard.html' : 'jobs.html';

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;margin:0"></span> Logging in...';

      try {
        const data = await authAPI.login({ email, password });
        setAuth(data.token, data.user);
        showToast(`Welcome back, ${data.user.name}! 👋`, 'success');
        setTimeout(() => {
          window.location.href = data.user.role === 'employer' ? 'dashboard.html' : 'jobs.html';
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    });
  }

  if (registerForm) {
    if (getToken()) window.location.href = 'index.html';

    const roleToggle = document.querySelectorAll('.role-btn');
    const roleInput = document.getElementById('role');
    const companyField = document.getElementById('company-field');

    roleToggle.forEach(btn => {
      btn.addEventListener('click', () => {
        roleToggle.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        roleInput.value = btn.dataset.role;
        if (companyField) {
          companyField.style.display = btn.dataset.role === 'employer' ? 'block' : 'none';
        }
      });
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('button[type="submit"]');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const role = roleInput.value;
      const companyName = document.getElementById('company-name')?.value.trim();

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;margin:0"></span> Creating account...';

      try {
        const body = { name, email, password, role };
        if (role === 'employer' && companyName) body.companyName = companyName;

        const data = await authAPI.register(body);
        setAuth(data.token, data.user);
        showToast(`Account created! Welcome, ${data.user.name}! 🎉`, 'success');
        setTimeout(() => {
          window.location.href = data.user.role === 'employer' ? 'dashboard.html' : 'jobs.html';
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
  }
});
