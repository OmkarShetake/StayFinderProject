/* ── Root Path ─────────────────────────────────────────────────── */
function _rootPath() {
  const path   = window.location.pathname;
  const marker = '/frontend/';
  const idx    = path.indexOf(marker);
  if (idx !== -1) return path.substring(0, idx + marker.length);
  if (path.includes('/pages/')) {
    return path.substring(0, path.indexOf('/pages/') + 1);
  }
  return '/';
}

/* ── Search Page Controller ────────────────────────────────────── */
const SearchPage = {

  currentPage:  0,
  totalPages:   0,
  totalItems:   0,
  loading:      false,
  wishlistIds:  new Set(),
  selectedType: '',
  selectedCat:  '',

  /* ── Init ──────────────────────────────────────────────────── */
  async init() {
    // Nav
    document.getElementById('nav-logo').addEventListener('click', () => {
      window.location.href = _rootPath() + 'index.html';
    });
    document.getElementById('nav-search-bar').addEventListener('click', () => {
      Utils.showModal('search-modal');
    });
    document.getElementById('ns-search-btn').addEventListener('click', e => {
      e.stopPropagation();
      Utils.showModal('search-modal');
    });
    document.getElementById('search-modal-btn').addEventListener('click', () => {
      this._applyNavSearch();
    });

    // Auth
    document.getElementById('nav-login-btn')?.addEventListener('click', () => {
      Auth.showAuthModal('login');
    });
    document.getElementById('login-form')?.addEventListener('submit',    Auth.handleLogin.bind(Auth));
    document.getElementById('register-form')?.addEventListener('submit', Auth.handleRegister.bind(Auth));
    document.getElementById('auth-tab-login')?.addEventListener('click',    () => Auth.showAuthModal('login'));
    document.getElementById('auth-tab-register')?.addEventListener('click', () => Auth.showAuthModal('register'));

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(o => {
      o.addEventListener('click', e => { if (e.target === o) Utils.hideModal(o.id); });
    });

    Auth.renderNavUser();
    if (Auth.isLoggedIn()) await this._loadWishlist();

    // Read URL params and pre-fill filters
    this._readUrlParams();

    // Map/Grid toggle
    document.getElementById('btn-grid-view')?.addEventListener('click', () => this.switchView('grid'));
    document.getElementById('btn-map-view')?.addEventListener('click',  () => this.switchView('map'));

    // Natural Language Search
    const nlSearchBtn   = document.getElementById('nl-search-btn');
    const nlSearchInput = document.getElementById('nl-search-input');

    if (nlSearchBtn) {
      nlSearchBtn.addEventListener('click', () => this.handleNaturalSearch());
    }
    if (nlSearchInput) {
      nlSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleNaturalSearch();
      });
    }

    // Load personalized recommendations
    if (Auth.isLoggedIn()) {
      this.loadPersonalizedRecommendations();
    }

    // Load results
    await this.loadResults(0);

    WS.connect();
  },

  /* ── Read URL params → pre-fill sidebar filters ────────────── */
  _readUrlParams() {
    const p = new URLSearchParams(window.location.search);

    const city     = p.get('city')         || '';
    const checkIn  = p.get('checkIn')      || '';
    const checkOut = p.get('checkOut')     || '';
    const guests   = p.get('guests')       || '';
    const category = p.get('category')     || '';
    const type     = p.get('propertyType') || '';
    const minPrice = p.get('minPrice')     || '';
    const maxPrice = p.get('maxPrice')     || '';

    if (city)     document.getElementById('f-city').value      = city;
    if (checkIn)  document.getElementById('f-checkin').value   = checkIn;
    if (checkOut) document.getElementById('f-checkout').value  = checkOut;
    if (guests)   document.getElementById('f-guests').value    = guests;
    if (minPrice) document.getElementById('f-min-price').value = minPrice;
    if (maxPrice) document.getElementById('f-max-price').value = maxPrice;

    if (type) {
      this.selectedType = type;
      document.querySelectorAll('.filter-type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
      });
    }

    if (category) {
      this.selectedCat = category;
      document.querySelectorAll('.filter-cat-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === category);
      });
    }

    document.getElementById('ns-city').textContent     = city     || 'Anywhere';
    document.getElementById('ns-checkin').textContent  = checkIn  ? Utils.formatDate(checkIn)  : 'Add dates';
    document.getElementById('ns-checkout').textContent = checkOut ? Utils.formatDate(checkOut) : 'Add dates';
    document.getElementById('ns-guests').textContent   = guests   ? guests + ' guests'         : 'Add guests';

    if (city)     document.getElementById('sm-city').value     = city;
    if (checkIn)  document.getElementById('sm-checkin').value  = checkIn;
    if (checkOut) document.getElementById('sm-checkout').value = checkOut;
    if (guests)   document.getElementById('sm-guests').value   = guests;
  },

  /* ── Get current filter params ─────────────────────────────── */
  _getParams(page = 0) {
    return {
      city:         document.getElementById('f-city').value.trim()     || undefined,
      checkIn:      document.getElementById('f-checkin').value          || undefined,
      checkOut:     document.getElementById('f-checkout').value         || undefined,
      guests:       document.getElementById('f-guests').value           || undefined,
      minPrice:     document.getElementById('f-min-price').value        || undefined,
      maxPrice:     document.getElementById('f-max-price').value        || undefined,
      propertyType: this.selectedType                                   || undefined,
      category:     this.selectedCat                                    || undefined,
      page,
      size: 12,
    };
  },

  /* ── Load Results ───────────────────────────────────────────── */
  async loadResults(page = 0) {
    if (this.loading) return;
    this.loading = true;

    const grid = document.getElementById('results-grid');
    grid.innerHTML = Utils.skeletonCards(8);
    document.getElementById('results-count').textContent = 'Searching...';

    try {
      const params = this._getParams(page);
      const data   = await API.searchProperties(params);
      const props  = data.content        || [];
      this.totalPages  = data.totalPages  || 0;
      this.totalItems  = data.totalElements || props.length;
      this.currentPage = page;

      this._updateUrl(params);

      document.getElementById('results-count').textContent =
        this.totalItems === 0
          ? 'No properties found'
          : `${this.totalItems} propert${this.totalItems === 1 ? 'y' : 'ies'} found`;

      if (!props.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state-icon">🔍</div>
            <h3>No properties found</h3>
            <p>Try adjusting your filters or searching a different location.</p>
            <button class="btn btn-primary" onclick="SearchPage.clearFilters()">
              Clear filters
            </button>
          </div>`;
        document.getElementById('pagination').innerHTML = '';
        return;
      }

      grid.innerHTML = '';
      props.forEach(p => grid.appendChild(this._buildCard(p)));
      this._allProps = props;
      this._renderPagination();

    } catch (e) {
      grid.innerHTML = `
        <p class="text-muted" style="grid-column:1/-1;padding:40px;text-align:center">
          Failed to load results. Please try again.
        </p>`;
      document.getElementById('results-count').textContent = '';
    } finally {
      this.loading = false;
    }
  },

  /* ── Build Property Card ────────────────────────────────────── */
  _buildCard(p) {
    const div      = document.createElement('div');
    div.className  = 'prop-card';
    div.dataset.id = p.id;

    const title     = Utils.esc(p.title);
    const city      = Utils.esc(p.city);
    const state     = Utils.esc(p.state);
    const imgSrc    = Utils.esc(p.images?.[0] || '');
    const imgAlt    = Utils.esc(p.title);
    const typeLabel = Utils.esc(Utils.propertyTypeLabel(p.propertyType));
    const beds      = Number(p.beds)      || 0;
    const rating    = Number(p.avgRating) || 0;
    const price     = Utils.formatCurrency(p.pricePerNight);
    const isSaved   = this.wishlistIds.has(p.id);

    div.innerHTML = `
      <div class="prop-card-img">
        ${imgSrc
          ? `<img class="prop-card-img-inner" src="${imgSrc}" alt="${imgAlt}" loading="lazy">`
          : `<div class="prop-card-img-placeholder" style="background:#E2D5C3;font-size:52px">🏠</div>`
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

    div.addEventListener('click', e => {
      if (e.target.closest('.prop-heart')) return;
      window.location.href = _rootPath() + `pages/property.html?id=${p.id}`;
    });

    div.querySelector('.prop-heart').addEventListener('click', e => {
      e.stopPropagation();
      this._toggleWishlist(p.id, div.querySelector('.prop-heart'));
    });

    return div;
  },

  /* ── Pagination ─────────────────────────────────────────────── */
  _renderPagination() {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    if (this.totalPages <= 1) return;

    const prev       = document.createElement('button');
    prev.className   = 'btn btn-outline btn-sm';
    prev.textContent = '← Previous';
    prev.disabled    = this.currentPage === 0;
    prev.addEventListener('click', () => this.loadResults(this.currentPage - 1));
    container.appendChild(prev);

    const start = Math.max(0, this.currentPage - 2);
    const end   = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) {
      const btn       = document.createElement('button');
      btn.className   = `btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-outline'}`;
      btn.textContent = i + 1;
      btn.addEventListener('click', () => this.loadResults(i));
      container.appendChild(btn);
    }

    const next       = document.createElement('button');
    next.className   = 'btn btn-outline btn-sm';
    next.textContent = 'Next →';
    next.disabled    = this.currentPage >= this.totalPages - 1;
    next.addEventListener('click', () => this.loadResults(this.currentPage + 1));
    container.appendChild(next);
  },

  /* ── Filter Actions ─────────────────────────────────────────── */
  selectType(type, btn) {
    this.selectedType = type;
    document.querySelectorAll('.filter-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  selectCategory(cat, btn) {
    this.selectedCat = cat;
    document.querySelectorAll('.filter-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  applyFilters() {
    this.loadResults(0);
  },

  clearFilters() {
    document.getElementById('f-city').value      = '';
    document.getElementById('f-checkin').value   = '';
    document.getElementById('f-checkout').value  = '';
    document.getElementById('f-guests').value    = '';
    document.getElementById('f-min-price').value = '';
    document.getElementById('f-max-price').value = '';

    this.selectedType = '';
    this.selectedCat  = '';
    document.querySelectorAll('.filter-type-btn').forEach((b, i) =>
      b.classList.toggle('active', i === 0)
    );
    document.querySelectorAll('.filter-cat-btn').forEach((b, i) =>
      b.classList.toggle('active', i === 0)
    );

    this.loadResults(0);
  },

  /* ── Nav search modal apply ─────────────────────────────────── */
  _applyNavSearch() {
    const city     = document.getElementById('sm-city').value.trim()  || '';
    const checkIn  = document.getElementById('sm-checkin').value       || '';
    const checkOut = document.getElementById('sm-checkout').value      || '';
    const guests   = document.getElementById('sm-guests').value        || '';

    document.getElementById('f-city').value     = city;
    document.getElementById('f-checkin').value  = checkIn;
    document.getElementById('f-checkout').value = checkOut;
    document.getElementById('f-guests').value   = guests;

    document.getElementById('ns-city').textContent     = city     || 'Anywhere';
    document.getElementById('ns-checkin').textContent  = checkIn  ? Utils.formatDate(checkIn)  : 'Add dates';
    document.getElementById('ns-checkout').textContent = checkOut ? Utils.formatDate(checkOut) : 'Add dates';
    document.getElementById('ns-guests').textContent   = guests   ? guests + ' guests'         : 'Add guests';

    Utils.hideModal('search-modal');
    this.loadResults(0);
  },

  /* ── Update URL without reload ──────────────────────────────── */
  _updateUrl(params) {
    const query = Object.entries(params)
      .filter(([k, v]) => v != null && v !== '' && k !== 'page' && k !== 'size')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    window.history.replaceState({}, '', `?${query}`);
  },

  /* ── Map View ───────────────────────────────────────────────── */
  _map: null,
  _mapMarkers: [],
  _allProps: [],

  _initMap() {
    if (this._map) return;
    this._map = L.map('map-view').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this._map);
  },

  _renderMap(props) {
    this._initMap();
    this._mapMarkers.forEach(m => m.remove());
    this._mapMarkers = [];

    const bounds = [];
    props.forEach(p => {
      if (!p.latitude || !p.longitude) return;
      const lat = parseFloat(p.latitude);
      const lng = parseFloat(p.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const icon = L.divIcon({
        className: '',
        html: `<div class="map-price-pin">₹${Math.round(p.pricePerNight / 1000)}k</div>`,
        iconAnchor: [30, 16],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(this._map);
      marker.bindPopup(`
        <div style="width:200px">
          ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px">` : ''}
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${p.title}</div>
          <div style="font-size:12px;color:#717171;margin-bottom:6px">${p.city}, ${p.state}</div>
          <div style="font-weight:700;font-size:14px;color:#FF385C">₹${Number(p.pricePerNight).toLocaleString('en-IN')} / night</div>
          <a href="property.html?id=${p.id}" style="display:block;margin-top:8px;padding:8px;background:#222;color:white;text-align:center;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none">View property</a>
        </div>
      `);
      this._mapMarkers.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      this._map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    setTimeout(() => this._map.invalidateSize(), 100);
  },

  switchView(mode) {
    const grid    = document.getElementById('results-grid');
    const mapView = document.getElementById('map-view');
    const btnGrid = document.getElementById('btn-grid-view');
    const btnMap  = document.getElementById('btn-map-view');

    if (mode === 'map') {
      grid.style.display    = 'none';
      mapView.style.display = 'block';
      btnGrid.classList.remove('active');
      btnMap.classList.add('active');
      this._renderMap(this._allProps);
    } else {
      grid.style.display    = '';
      mapView.style.display = 'none';
      btnGrid.classList.add('active');
      btnMap.classList.remove('active');
    }
  },

  /* ── Wishlist ───────────────────────────────────────────────── */
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

  /* ── AI: Load Personalized Recommendations ────────────────── */
  async loadPersonalizedRecommendations() {
    try {
      const urlParams   = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('city') || '';

      const data = await API.getPersonalizedRecommendations(searchQuery);

      if (data.recommendation && data.hasHistory) {
        const banner = document.getElementById('ai-recommendations-banner');
        const text   = document.getElementById('ai-rec-text');

        if (banner && text) {
          text.textContent = data.recommendation;
          banner.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.error('Failed to load recommendations:', e.message);
    }
  },

  /* ── AI: Handle Natural Language Search ────────────────────── */
  async handleNaturalSearch() {
    const input = document.getElementById('nl-search-input');
    const query = input.value.trim();

    if (!query) {
      Utils.toast('Please enter a search query');
      return;
    }

    const btn = document.getElementById('nl-search-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Searching...';

    try {
      const interpretation = await API.interpretNaturalSearch(query);
      console.log('AI Interpretation:', interpretation);

      if (interpretation.CITY) {
        const cityInput = document.getElementById('f-city');
        if (cityInput) cityInput.value = interpretation.CITY;
      }
      if (interpretation.CATEGORY) {
        const catSelect = document.getElementById('f-category');
        if (catSelect) catSelect.value = interpretation.CATEGORY;
      }
      if (interpretation.PROPERTY_TYPE) {
        const typeSelect = document.getElementById('f-type');
        if (typeSelect) typeSelect.value = interpretation.PROPERTY_TYPE;
      }
      if (interpretation.GUESTS) {
        const guestsInput = document.getElementById('f-guests');
        if (guestsInput) guestsInput.value = interpretation.GUESTS;
      }

      const parts = [];
      if (interpretation.CITY)     parts.push(`📍 ${interpretation.CITY}`);
      if (interpretation.CATEGORY) parts.push(`🏖️ ${interpretation.CATEGORY}`);
      if (interpretation.GUESTS)   parts.push(`👥 ${interpretation.GUESTS} guests`);

      if (parts.length > 0) {
        Utils.toast('Found: ' + parts.join(' • '));
      } else {
        Utils.toast('Searching for: ' + query);
      }

      this.applyFilters();

    } catch (e) {
      console.error('Natural search failed:', e.message);
      Utils.toast('Search failed. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Search';
    }
  },

  /* ── Close Recommendations Banner ──────────────────────────── */
  closeRecommendations() {
    document.getElementById('ai-recommendations-banner').classList.add('hidden');
  },
};

document.addEventListener('DOMContentLoaded', () => {
  SearchPage.init();

  // ── City Autocomplete ───────────────────────────────────────
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

  const input = document.getElementById('f-city');
  const box   = document.getElementById('f-city-suggestions');
  if (input && box) {
    input.addEventListener('input', () => {
      const val = input.value.trim().toLowerCase();
      if (!val) { box.classList.add('hidden'); return; }
      const matches = CITIES.filter(c =>
        c.name.toLowerCase().startsWith(val) || c.state.toLowerCase().startsWith(val)
      ).slice(0, 6);
      if (!matches.length) { box.classList.add('hidden'); return; }
      box.innerHTML = matches.map(c => `
        <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:14px;cursor:pointer"
             onmouseover="this.style.background='#f7f7f7'" onmouseout="this.style.background=''"
             data-city="${c.name}">
          <span style="font-size:16px">${c.icon}</span>
          <span style="font-weight:600">${c.name}</span>
          <span style="font-size:12px;color:#717171;margin-left:4px">${c.state}</span>
        </div>`).join('');
      box.classList.remove('hidden');
    });
    box.addEventListener('click', e => {
      const item = e.target.closest('[data-city]');
      if (!item) return;
      input.value = item.dataset.city;
      box.classList.add('hidden');
      SearchPage.applyFilters();
    });
    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !box.contains(e.target)) box.classList.add('hidden');
    });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') box.classList.add('hidden'); });
  }


});
