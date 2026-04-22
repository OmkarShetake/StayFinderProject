/* ── StayFinder Search Page ────────────────────────────────────── */
'use strict';

const Search = {

  currentPage:   0,
  totalPages:    0,
  currentParams: {},
  loading:       false,
  wishlistIds:   new Set(),

  /* ── Root Path ───────────────────────────────────────────────── */
  _rootPath() {
    const path   = window.location.pathname;

    // Local dev — has /frontend/ in path
    const marker = '/frontend/';
    const idx    = path.indexOf(marker);
    if (idx !== -1) return path.substring(0, idx + marker.length);

    // Production — in /pages/ subfolder, go up one level
    if (path.includes('/pages/')) {
      return path.substring(0, path.indexOf('/pages/') + 1);
    }

    // Already at root
    return '/';
  },

  /* ── Init ────────────────────────────────────────────────────── */
  async init() {
    this._readUrlParams();
    this._bindEvents();
    await this.loadProperties();
    if (Auth.isLoggedIn()) await this._loadWishlist();
    Auth.renderNavUser();
    WS.connect();
    WS.loadUnreadCount();
  },

  /* ── Read URL Params ─────────────────────────────────────────── */
  _readUrlParams() {
    const p = new URLSearchParams(window.location.search);
    this.currentParams = {
      city:         p.get('city')         || '',
      checkIn:      p.get('checkIn')      || '',
      checkOut:     p.get('checkOut')     || '',
      guests:       p.get('guests')       || '',
      category:     p.get('category')     || '',
      propertyType: p.get('propertyType') || '',
      minPrice:     p.get('minPrice')     || '',
      maxPrice:     p.get('maxPrice')     || '',
    };

    if (this.currentParams.city)
      document.getElementById('ns-city').textContent = this.currentParams.city;
    if (this.currentParams.checkIn)
      document.getElementById('ns-checkin').textContent = Utils.formatDate(this.currentParams.checkIn);
    if (this.currentParams.checkOut)
      document.getElementById('ns-checkout').textContent = Utils.formatDate(this.currentParams.checkOut);
    if (this.currentParams.guests)
      document.getElementById('ns-guests').textContent = this.currentParams.guests + ' guest(s)';
  },

  /* ── Bind Events ─────────────────────────────────────────────── */
  _bindEvents() {

    // Category pills
    document.querySelectorAll('.cat-item').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.cat-item').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        this.currentParams.category = el.dataset.category || '';
        this.currentPage = 0;
        this.loadProperties();
      });
    });

    // Nav search bar
    document.getElementById('nav-search-bar')?.addEventListener('click', () => {
      Utils.showModal('search-modal');
    });

    // Auth buttons
    document.getElementById('nav-login-btn')?.addEventListener('click', () => {
      Auth.showAuthModal('login');
    });
    document.getElementById('nav-logout')?.addEventListener('click', () => {
      Auth.logout();
    });

    // Search modal submit
    document.getElementById('search-modal-btn')?.addEventListener('click', () => {
      this._applySearchModal();
    });

    // Auth form handlers
    document.getElementById('login-form')?.addEventListener('submit',    Auth.handleLogin.bind(Auth));
    document.getElementById('register-form')?.addEventListener('submit', Auth.handleRegister.bind(Auth));
    document.getElementById('auth-tab-login')?.addEventListener('click',    () => Auth.showAuthModal('login'));
    document.getElementById('auth-tab-register')?.addEventListener('click', () => Auth.showAuthModal('register'));

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) Utils.hideModal(overlay.id);
      });
    });

    // Load more
    document.getElementById('load-more-btn')?.addEventListener('click', () => {
      this.currentPage++;
      this.loadProperties(true);
    });
  },

  /* ── Load Properties ─────────────────────────────────────────── */
  async loadProperties(append = false) {
    if (this.loading) return;
    this.loading = true;

    const grid = document.getElementById('prop-grid');
    if (!append) grid.innerHTML = Utils.skeletonCards(8);

    try {
      const params = { ...this.currentParams, page: this.currentPage, size: 12 };
      const data   = await API.searchProperties(params);
      const props  = data.content || [];
      this.totalPages = data.totalPages || 0;

      if (!append) grid.innerHTML = '';

      if (props.length === 0 && !append) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state-icon">🏠</div>
            <h3>No properties found</h3>
            <p>Try adjusting your filters or search in a different location.</p>
          </div>`;
      } else {
        props.forEach(p => grid.appendChild(this._buildCard(p)));
      }

      const btn = document.getElementById('load-more-btn');
      if (btn) btn.classList.toggle('hidden', this.currentPage >= this.totalPages - 1);

    } catch (e) {
      if (!append) {
        grid.innerHTML = `
          <p class="text-muted" style="grid-column:1/-1;padding:40px;text-align:center">
            Failed to load properties. Please try again.
          </p>`;
      }
    } finally {
      this.loading = false;
    }
  },

  /* ── Build Card ──────────────────────────────────────────────── */
  /*
   * SECURITY: All user-generated strings are wrapped with Utils.esc()
   * to prevent XSS injection via innerHTML.
   */
  _buildCard(p) {
    const div      = document.createElement('div');
    div.className  = 'prop-card';
    div.dataset.id = p.id;

    // Sanitize all user-generated content
    const title     = Utils.esc(p.title);
    const city      = Utils.esc(p.city);
    const state     = Utils.esc(p.state);
    const imgAlt    = Utils.esc(p.title);
    const imgSrc    = Utils.esc(p.images?.[0] || '');
    const typeLabel = Utils.esc(Utils.propertyTypeLabel(p.propertyType));
    const beds      = Number(p.beds)      || 0;
    const rating    = Number(p.avgRating) || 0;
    const price     = Utils.formatCurrency(p.pricePerNight);
    const isSaved   = this.wishlistIds.has(p.id);

    div.innerHTML = `
      <div class="prop-card-img">
        ${imgSrc
        ? `<img class="prop-card-img-inner" src="${imgSrc}" alt="${imgAlt}" loading="lazy">`
        : `<div class="prop-card-img-placeholder" style="background:${this._colorForType(p.category)}">
               ${Utils.categoryIcon(p.category)}
             </div>`
    }
        <div class="prop-heart" data-id="${p.id}" title="Save to wishlist">
          ${isSaved ? '❤️' : '🤍'}
        </div>
        ${p.host?.superhost ? '<div class="prop-badge">Superhost</div>' : ''}
      </div>
      <div class="prop-card-info">
        <div class="prop-card-row1">
          <div class="prop-card-loc">${city}${state ? ', ' + state : ''}</div>
          ${rating > 0
        ? `<div class="prop-card-rating">★ ${rating.toFixed(2)}</div>`
        : ''
    }
        </div>
        <div class="prop-card-type">${typeLabel} · ${beds} bed${beds !== 1 ? 's' : ''}</div>
        <div class="prop-card-price"><strong>${price}</strong> night</div>
      </div>`;

    // Navigate to property detail
    div.addEventListener('click', e => {
      if (e.target.closest('.prop-heart')) return;
      window.location.href = this._rootPath() + `pages/property.html?id=${p.id}`;
    });

    // Wishlist toggle
    div.querySelector('.prop-heart').addEventListener('click', e => {
      e.stopPropagation();
      this._toggleWishlist(p.id, div.querySelector('.prop-heart'));
    });

    return div;
  },

  /* ── Wishlist ────────────────────────────────────────────────── */
  async _loadWishlist() {
    try {
      const props      = await API.getWishlist();
      this.wishlistIds = new Set(props.map(p => p.id));
    } catch (e) {
      console.error('Failed to load wishlist:', e.message);
    }
  },

  async _toggleWishlist(id, el) {
    if (!Auth.isLoggedIn()) { Auth.showAuthModal('login'); return; }
    try {
      await API.toggleWishlist(id);
      if (this.wishlistIds.has(id)) {
        this.wishlistIds.delete(id);
        el.textContent = '🤍';
        Utils.toast('Removed from wishlist');
      } else {
        this.wishlistIds.add(id);
        el.textContent = '❤️';
        Utils.toast('Saved to wishlist');
      }
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  /* ── Search Modal ────────────────────────────────────────────── */
  _applySearchModal() {
    const city     = document.getElementById('sm-city')?.value?.trim()  || '';
    const checkIn  = document.getElementById('sm-checkin')?.value        || '';
    const checkOut = document.getElementById('sm-checkout')?.value       || '';
    const guests   = document.getElementById('sm-guests')?.value         || '';

    // Build query string and redirect to dedicated search page
    const params = new URLSearchParams();
    if (city)     params.set('city',     city);
    if (checkIn)  params.set('checkIn',  checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests)   params.set('guests',   guests);

    window.location.href = this._rootPath() + `pages/search.html?${params.toString()}`;
  },

  /* ── Color Map ───────────────────────────────────────────────── */
  _colorForType(category) {
    const map = {
      BEACH:       '#E2E0C3',
      MOUNTAIN:    '#C3D5E2',
      CITY:        '#E2C3D4',
      COUNTRYSIDE: '#D4E2C3',
      LAKEFRONT:   '#C3E2D4',
      UNIQUE:      '#E2D5C3',
      HERITAGE:    '#E2D4C3',
      CAMPING:     '#E2E4C3',
    };
    return map[category] || '#E2D5C3';
  },

};

document.addEventListener('DOMContentLoaded', () => Search.init());