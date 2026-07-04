function _rootPath() {
  const path = window.location.pathname;
  const marker = '/frontend/';
  const idx = path.indexOf(marker);
  if (idx !== -1) return path.substring(0, idx + marker.length);
  if (path.includes('/pages/')) {
    return path.substring(0, path.indexOf('/pages/') + 1);
  }
  return '/';
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('nav-logo').addEventListener('click', () => {
    window.location.href = _rootPath() + 'index.html';
  });

  // Dark mode
  const darkBtn = document.getElementById('dark-mode-btn');
  const isDark = localStorage.getItem('sf_dark') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    darkBtn.textContent = '☀️';
  }
  darkBtn?.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('sf_dark', dark);
    darkBtn.textContent = dark ? '☀️' : '🌙';
  });

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    showError('Invalid verification link. Please check your email and try again.');
    return;
  }

  try {
    const response = await fetch(API.BASE + '/auth/verify-email?token=' + token);
    const data = await response.json();

    if (response.ok) {
      showSuccess();
    } else {
      showError(data.message || 'Verification failed. The link may have expired.');
    }
  } catch (error) {
    showError('Network error. Please check your connection and try again.');
  }
});

function showSuccess() {
  document.getElementById('verify-icon').textContent = '✅';
  document.getElementById('verify-title').textContent = 'Email verified!';
  document.getElementById('verify-message').textContent =
    'Your email has been successfully verified. You can now access all features of StayFinder.';

  const btn = document.getElementById('verify-btn');
  btn.classList.remove('hidden');
  btn.addEventListener('click', () => {
    window.location.href = _rootPath() + 'index.html';
  });
}

function showError(message) {
  document.getElementById('verify-icon').textContent = '❌';
  document.getElementById('verify-title').textContent = 'Verification failed';
  document.getElementById('verify-message').textContent = message;

  const resendSection = document.getElementById('resend-section');
  resendSection.classList.remove('hidden');

  document.getElementById('resend-btn').addEventListener('click', async () => {
    const user = Auth.getUser();
    if (!user) {
      Utils.toast('Please log in first');
      window.location.href = _rootPath() + 'index.html?login=1';
      return;
    }

    try {
      const response = await fetch(
        API.BASE + '/auth/resend-verification?email=' + encodeURIComponent(user.email),
        { method: 'POST' }
      );
      const data = await response.json();

      if (response.ok) {
        Utils.toast('Verification email sent! Check your inbox.');
      } else {
        Utils.toast(data.message || 'Failed to resend email');
      }
    } catch (error) {
      Utils.toast('Network error. Please try again.');
    }
  });
}
