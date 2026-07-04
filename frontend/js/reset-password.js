function _rootPath() {
  const path = window.location.pathname;
  const idx  = path.indexOf('/frontend/');
  if (idx !== -1) return path.substring(0, idx + '/frontend/'.length);
  if (path.includes('/pages/')) return path.substring(0, path.indexOf('/pages/') + 1);
  return '/';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav-logo').addEventListener('click', () => {
    window.location.href = _rootPath() + 'index.html';
  });

  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) {
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('invalid-token').classList.remove('hidden');
    return;
  }

  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn      = document.getElementById('rp-btn');
    const password = document.getElementById('rp-password').value;
    const confirm  = document.getElementById('rp-confirm').value;
    const errEl    = document.getElementById('error-msg');

    errEl.classList.add('hidden');

    if (password !== confirm) {
      errEl.textContent = 'Passwords do not match';
      errEl.classList.remove('hidden');
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Resetting...';

    try {
      await API.resetPassword({ token, newPassword: password });
      document.getElementById('reset-form').classList.add('hidden');
      document.getElementById('success-msg').classList.remove('hidden');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      if (err.message.includes('expired') || err.message.includes('Invalid')) {
        document.getElementById('reset-form').classList.add('hidden');
        document.getElementById('invalid-token').classList.remove('hidden');
      }
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Reset password';
    }
  });
});
