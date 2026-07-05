document.addEventListener('DOMContentLoaded', () => {
  // Fix nav logo path
  document.getElementById('nav-logo')?.addEventListener('click', () => {
    const path = window.location.pathname;
    const marker = '/frontend/';
    const idx = path.indexOf(marker);
    const root = idx !== -1 ? path.substring(0, idx + marker.length) : path.replace(/\/[^/]*$/, '/');
    window.location.href = root + 'index.html';
  });

  // Dark mode
  const darkBtn = document.getElementById('dark-mode-btn');
  const isDark  = localStorage.getItem('sf_dark') === 'true';
  if (isDark) { document.body.classList.add('dark'); darkBtn.textContent = '☀️'; }
  darkBtn?.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('sf_dark', dark);
    darkBtn.textContent = dark ? '☀️' : '🌙';
  });

  // Show login form by default
  document.getElementById('login-form')?.classList.remove('hidden');

  // ── Email Verification Banner ────────────────────────────────
  const user = Auth.getUser();
  if (user && !user.emailVerified) {
    const banner = document.getElementById('verification-banner');
    banner?.classList.remove('hidden');

    document.getElementById('resend-verification-btn')?.addEventListener('click', async () => {
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

    document.getElementById('close-verification-banner')?.addEventListener('click', () => {
      banner.classList.add('hidden');
    });
  }

  // ── City Autocomplete ─────────────────────────────────────────
  const CITIES = [
    { name: 'Mumbai',      state: 'Maharashtra',      icon: '🏙' },
    { name: 'Goa',         state: 'Goa',              icon: '🏖' },
    { name: 'Manali',      state: 'Himachal Pradesh', icon: '🏔' },
    { name: 'Jaipur',      state: 'Rajasthan',        icon: '🏰' },
    { name: 'Udaipur',     state: 'Rajasthan',        icon: '🌊' },
    { name: 'Bangalore',   state: 'Karnataka',        icon: '🏙' },
    { name: 'Shimla',      state: 'Himachal Pradesh', icon: '🏔' },
    { name: 'Rishikesh',   state: 'Uttarakhand',      icon: '🌿' },
    { name: 'New Delhi',   state: 'Delhi',            icon: '🏙' },
    { name: 'Pune',        state: 'Maharashtra',      icon: '🏙' },
    { name: 'Hyderabad',   state: 'Telangana',        icon: '🏙' },
    { name: 'Coorg',       state: 'Karnataka',        icon: '🌿' },
    { name: 'Srinagar',    state: 'J&K',              icon: '🌊' },
    { name: 'Alappuzha',   state: 'Kerala',           icon: '🌊' },
    { name: 'Wayanad',     state: 'Kerala',           icon: '🌿' },
    { name: 'Jodhpur',     state: 'Rajasthan',        icon: '🏰' },
    { name: 'Mysore',      state: 'Karnataka',        icon: '🏰' },
    { name: 'Nashik',      state: 'Maharashtra',      icon: '🌿' },
    { name: 'Bhuj',        state: 'Gujarat',          icon: '🌿' },
    { name: 'Pondicherry', state: 'Puducherry',       icon: '🏖' },
  ];

  const cityInput   = document.getElementById('sm-city');
  const suggestions = document.getElementById('city-suggestions');

  cityInput?.addEventListener('input', () => {
    const val = cityInput.value.trim().toLowerCase();
    if (!val) { suggestions.classList.add('hidden'); return; }

    const matches = CITIES.filter(c =>
      c.name.toLowerCase().startsWith(val) ||
      c.state.toLowerCase().startsWith(val)
    ).slice(0, 6);

    if (!matches.length) { suggestions.classList.add('hidden'); return; }

    suggestions.innerHTML = matches.map(c => `
      <div class="city-suggestion-item" data-city="${c.name}">
        <span class="city-suggestion-icon">${c.icon}</span>
        <span class="city-suggestion-name">${c.name}</span>
        <span class="city-suggestion-state">${c.state}</span>
      </div>`).join('');
    suggestions.classList.remove('hidden');
  });

  suggestions?.addEventListener('click', e => {
    const item = e.target.closest('.city-suggestion-item');
    if (!item) return;
    cityInput.value = item.dataset.city;
    suggestions.classList.add('hidden');
  });

  document.addEventListener('click', e => {
    if (!cityInput?.contains(e.target) && !suggestions?.contains(e.target)) {
      suggestions?.classList.add('hidden');
    }
  });

  cityInput?.addEventListener('keydown', e => {
    if (e.key === 'Escape') suggestions?.classList.add('hidden');
  });

  // Auto-open login modal if ?login=1
  if (new URLSearchParams(window.location.search).get('login') === '1') {
    Auth.showAuthModal('login');
  }

  // Notifications sub-panel inside dropdown
  document.getElementById('nav-dropdown-notifications')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('nav-notif-panel')?.classList.remove('hidden');
    loadNotifList();
  });

  document.getElementById('nav-notif-back')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('nav-notif-panel')?.classList.add('hidden');
  });

  document.getElementById('nav-notif-mark-read')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await API.markAllRead();
      document.querySelector('.notif-dot')?.classList.add('hidden');
      document.getElementById('nav-notif-badge')?.classList.add('hidden');
      Utils.toast('All notifications marked as read');
    } catch {}
  });

  async function loadNotifList() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    list.innerHTML = '<div style="padding:16px;text-align:center;color:#717171;font-size:13px">Loading...</div>';
    try {
      const notifs = await API.getNotifications();
      if (!notifs.length) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#717171;font-size:13px">No notifications</div>';
        return;
      }
      list.innerHTML = notifs.slice(0, 8).map(n => `
        <div class="notif-item${!n.read ? ' unread' : ''}">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${Utils.relativeTime(n.createdAt)}</div>
        </div>`).join('');
      await API.markAllRead();
      document.querySelector('.notif-dot')?.classList.add('hidden');
      document.getElementById('nav-notif-badge')?.classList.add('hidden');
    } catch {}
  }
});
