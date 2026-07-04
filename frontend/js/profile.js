function _rootPath() {
  const path = window.location.pathname;
  const idx  = path.indexOf('/frontend/');
  if (idx !== -1) return path.substring(0, idx + '/frontend/'.length);
  if (path.includes('/pages/')) return path.substring(0, path.indexOf('/pages/') + 1);
  return '/';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.require()) return;

  Auth.renderNavUser();
  WS.connect();

  const user = Auth.getUser();

  document.getElementById('profile-avatar').textContent = Utils.initials(user.fullName);
  document.getElementById('profile-name').textContent   = user.fullName;
  document.getElementById('profile-email').textContent  = user.email;

  const roleBadge = document.getElementById('profile-role');
  if (user.role === 'ADMIN') {
    roleBadge.innerHTML = '<span class="badge badge-danger">Admin</span>';
  } else if (user.host) {
    roleBadge.innerHTML = '<span class="badge badge-success">Host</span>';
  } else {
    roleBadge.innerHTML = '<span class="badge badge-gray">Guest</span>';
  }

  document.getElementById('p-name').value  = user.fullName || '';
  document.getElementById('p-phone').value = user.phone    || '';
  document.getElementById('p-email').value = user.email    || '';

  const hostStatusText = document.getElementById('host-status-text');
  const becomeHostBtn  = document.getElementById('become-host-btn');
  if (user.host) {
    hostStatusText.textContent = 'You are a host';
    becomeHostBtn.textContent  = 'Go to dashboard';
    becomeHostBtn.addEventListener('click', () => {
      window.location.href = _rootPath() + 'pages/host.html';
    });
  } else {
    becomeHostBtn.addEventListener('click', async () => {
      if (!confirm('Become a host and start listing your property?')) return;
      try {
        await API.becomeHost();
        const updated = await API.me();
        localStorage.setItem(Auth.USER_KEY, JSON.stringify(updated));
        Utils.toast('Welcome to hosting! 🏠');
        setTimeout(() => window.location.href = _rootPath() + 'pages/host.html', 1000);
      } catch (e) { Utils.toast('Error: ' + e.message); }
    });
  }

  document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const btn       = document.getElementById('save-profile-btn');
    const successEl = document.getElementById('profile-success');
    const errorEl   = document.getElementById('profile-error');
    successEl.classList.add('hidden');
    errorEl.classList.add('hidden');

    const fullName = document.getElementById('p-name').value.trim();
    const phone    = document.getElementById('p-phone').value.trim();

    if (!fullName) { Utils.toast('Name cannot be empty'); return; }

    btn.disabled    = true;
    btn.textContent = 'Saving...';

    try {
      const updated = await API.updateProfile({ fullName, phone });
      const stored = Auth.getUser();
      stored.fullName = updated.fullName;
      stored.phone    = updated.phone;
      localStorage.setItem(Auth.USER_KEY, JSON.stringify(stored));

      document.getElementById('profile-avatar').textContent = Utils.initials(updated.fullName);
      document.getElementById('profile-name').textContent   = updated.fullName;
      successEl.classList.remove('hidden');
      Auth.renderNavUser();
    } catch (e) {
      errorEl.textContent = e.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Save changes';
    }
  });

  document.getElementById('signout-btn').addEventListener('click', () => Auth.logout());

  document.getElementById('nav-logo').addEventListener('click', () => {
    window.location.href = _rootPath() + 'index.html';
  });
});
