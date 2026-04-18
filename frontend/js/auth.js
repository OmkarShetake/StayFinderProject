/* ── StayFinder Auth Manager ───────────────────────────────────── */
'use strict';

const Auth = {
  TOKEN_KEY:   'sf_token',
  REFRESH_KEY: 'sf_refresh',
  USER_KEY:    'sf_user',

  getToken()   { return localStorage.getItem(this.TOKEN_KEY); },
  getRefresh() { return localStorage.getItem(this.REFRESH_KEY); },
  getUser()    { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); },
  isLoggedIn() { return !!this.getToken(); },
  isHost()     { return this.getUser()?.host === true; },
  isAdmin()    { return this.getUser()?.role === 'ADMIN'; },

  save(data) {
    localStorage.setItem(this.TOKEN_KEY,   data.accessToken);
    localStorage.setItem(this.REFRESH_KEY, data.refreshToken);
    localStorage.setItem(this.USER_KEY,    JSON.stringify(data.user));
  },

  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /* Resolve the frontend root path dynamically */
  _rootPath() {
    const path = window.location.pathname;
    const marker = '/frontend/';
    const idx = path.indexOf(marker);
    if (idx !== -1) return path.substring(0, idx + marker.length);
    return path.replace(/\/[^/]*$/, '/');
  },

  /* Login */
  async login(email, password) {
    const data = await API.login({ email, password });
    this.save(data);
    return data;
  },

  /* Register */
  async register(email, password, fullName, phone) {
    const data = await API.register({ email, password, fullName, phone });
    this.save(data);
    return data;
  },

  /* Logout */
  logout() {
    this.clear();
    window.location.href = this._rootPath() + 'index.html';
  },

  /* Refresh token */
  async refreshToken() {
    const rt = this.getRefresh();
    if (!rt) return false;
    try {
      const data = await API.refresh({ refreshToken: rt });
      this.save(data);
      return true;
    } catch {
      this.clear();
      return false;
    }
  },

  /* Require auth — redirect to login if not */
  require() {
    if (!this.isLoggedIn()) {
      window.location.href = this._rootPath() + 'index.html?login=1';
      return false;
    }
    return true;
  },

  /* ── Render navbar user state + wire dropdown ───────────────── */
  renderNavUser() {
    const user = this.getUser();
    const root = this._rootPath();

    // Avatar initials
    const avatarEl = document.getElementById('nav-avatar');
    if (avatarEl) {
      avatarEl.textContent = user ? Utils.initials(user.fullName) : '👤';
    }

    // Login button (simple button — hide when logged in)
    const loginBtn = document.getElementById('nav-login-btn');
    if (loginBtn) loginBtn.classList.toggle('hidden', !!user);

    // Host button
    const hostBtn = document.getElementById('nav-host-btn');
    if (hostBtn) {
      hostBtn.textContent = user?.host ? 'Host dashboard' : 'Airbnb your home';
      hostBtn.onclick = () => {
        if (user?.host) window.location.href = root + 'pages/host.html';
        else Auth._promptBecomeHost();
      };
    }

    // Dropdown sections
    const dropdownUser   = document.getElementById('nav-dropdown-user');
    const dropdownGuest  = document.getElementById('nav-dropdown-guest');
    const dropdownAuth   = document.getElementById('nav-dropdown-auth');
    const dropdownLogout = document.getElementById('nav-dropdown-logout-wrap');
    const dropdownAvatar = document.getElementById('nav-dropdown-avatar');
    const dropdownName   = document.getElementById('nav-dropdown-name');
    const dropdownEmail  = document.getElementById('nav-dropdown-email');

    if (user) {
      if (dropdownUser)   dropdownUser.classList.remove('hidden');
      if (dropdownGuest)  dropdownGuest.classList.add('hidden');
      if (dropdownAuth)   dropdownAuth.classList.remove('hidden');
      if (dropdownLogout) dropdownLogout.classList.remove('hidden');
      if (dropdownAvatar) dropdownAvatar.textContent = Utils.initials(user.fullName);
      if (dropdownName)   dropdownName.textContent   = user.fullName || 'Guest';
      if (dropdownEmail)  dropdownEmail.textContent  = user.email || '';

      // Show admin panel link only for admins
      const adminLink = document.getElementById('nav-dropdown-admin');
      if (adminLink) {
        adminLink.classList.toggle('hidden', user.role !== 'ADMIN');
      }
    } else {
      if (dropdownUser)   dropdownUser.classList.add('hidden');
      if (dropdownGuest)  dropdownGuest.classList.remove('hidden');
      if (dropdownAuth)   dropdownAuth.classList.add('hidden');
      if (dropdownLogout) dropdownLogout.classList.add('hidden');
    }

    // Wire dropdown item clicks (safe — won't double-bind if called again)
    this._on('nav-dropdown-login',    () => { Auth._closeDropdown(); Auth.showAuthModal('login'); });
    this._on('nav-dropdown-signup',   () => { Auth._closeDropdown(); Auth.showAuthModal('register'); });
    this._on('nav-dropdown-trips',    () => { window.location.href = root + 'pages/trips.html'; });
    this._on('nav-dropdown-wishlist', () => { window.location.href = root + 'pages/wishlist.html'; });
    this._on('nav-dropdown-host-link',() => { window.location.href = root + 'pages/host.html'; });
    this._on('nav-dropdown-admin',    () => { window.location.href = root + 'pages/admin.html'; });
    this._on('nav-logout',            () => { Auth.logout(); });

    this._initDropdownToggle();
  },

  /* Safe single-bind helper */
  _on(id, fn) {
    const el = document.getElementById(id);
    if (!el || el._bound) return;
    el._bound = true;
    el.addEventListener('click', fn);
  },

  /* Toggle dropdown open/close */
  _initDropdownToggle() {
    const btn      = document.getElementById('nav-user-btn');
    const dropdown = document.getElementById('nav-dropdown');
    if (!btn || !dropdown || btn._dropdownBound) return;
    btn._dropdownBound = true;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) Auth._closeDropdown();
      else {
        dropdown.classList.add('open');
        setTimeout(() => document.addEventListener('click', Auth._outsideClickHandler), 0);
      }
    });
  },

  _outsideClickHandler(e) {
    const dropdown = document.getElementById('nav-dropdown');
    const btn      = document.getElementById('nav-user-btn');
    if (dropdown && !dropdown.contains(e.target) && !btn?.contains(e.target)) {
      Auth._closeDropdown();
    }
  },

  _closeDropdown() {
    document.getElementById('nav-dropdown')?.classList.remove('open');
    document.removeEventListener('click', Auth._outsideClickHandler);
  },

  /* Prompt become host */
  async _promptBecomeHost() {
    if (confirm('Switch to hosting mode? You can list your property and start earning.')) {
      try {
        await API.becomeHost();
        const userData = await API.me();
        localStorage.setItem(Auth.USER_KEY, JSON.stringify(userData));
        Utils.toast('Welcome to hosting! 🏠');
        setTimeout(() => window.location.href = Auth._rootPath() + 'pages/host.html', 1000);
      } catch (e) {
        Utils.toast('Failed: ' + e.message);
      }
    }
  },

  /* Auth modal */
  showAuthModal(mode = 'login') {
    Utils.showModal('auth-modal');
    document.getElementById('auth-modal-title').textContent =
        mode === 'login' ? 'Log in to StayFinder' : 'Join StayFinder';
    document.getElementById('auth-tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('auth-tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', mode !== 'register');
  },

  /* Handle login form */
  async handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
    try {
      await Auth.login(
          document.getElementById('login-email').value,
          document.getElementById('login-password').value
      );
      Utils.hideModal('auth-modal');
      Auth.renderNavUser();
      Utils.toast('Welcome back! 👋');
      window.location.reload();
    } catch (err) {
      document.getElementById('login-error').textContent = err.message;
      document.getElementById('login-error').classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Log in';
    }
  },

  /* Handle register form */
  async handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
    try {
      await Auth.register(
          document.getElementById('reg-email').value,
          document.getElementById('reg-password').value,
          document.getElementById('reg-name').value,
          document.getElementById('reg-phone').value
      );
      Utils.hideModal('auth-modal');
      Auth.renderNavUser();
      Utils.toast('Welcome to StayFinder! 🎉');
      window.location.reload();
    } catch (err) {
      document.getElementById('reg-error').textContent = err.message;
      document.getElementById('reg-error').classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign up';
    }
  },
};

window.Auth = Auth;