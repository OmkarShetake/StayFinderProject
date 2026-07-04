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

  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = document.getElementById('fp-btn');
    const email = document.getElementById('fp-email').value.trim();
    const errEl = document.getElementById('error-msg');
    const sucEl = document.getElementById('success-msg');

    errEl.classList.add('hidden');
    sucEl.classList.add('hidden');
    btn.disabled    = true;
    btn.textContent = 'Sending...';

    try {
      await API.forgotPassword({ email });
      sucEl.classList.remove('hidden');
      document.getElementById('forgot-form').classList.add('hidden');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Send reset link';
    }
  });
});
