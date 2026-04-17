/* ── StayFinder Utils ──────────────────────────────────────────── */
'use strict';

const Utils = {
  /* Toast notification */
  toast(msg, duration = 2800) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(Utils._toastTimer);
    Utils._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  },

  /* Format currency in INR */
  formatCurrency(amount) {
    if (amount == null) return '—';
    return '₹' + Number(amount).toLocaleString('en-IN');
  },

  /* Format date for display */
  formatDate(dateStr) {
    if (!dateStr) return 'Add date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  },

  /* Format full date */
  formatDateFull(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  },

  /* Days between two date strings */
  daysBetween(from, to) {
    const a = new Date(from), b = new Date(to);
    return Math.round((b - a) / 86400000);
  },

  /* Debounce */
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  /* Get initials from name */
  initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  /* Star rating HTML */
  stars(rating, count) {
    if (!rating) return '';
    return `★ ${Number(rating).toFixed(2)}${count ? ` · ${count} reviews` : ''}`;
  },

  /* Property type label */
  propertyTypeLabel(type) {
    const map = {
      ENTIRE_HOME: 'Entire home',
      PRIVATE_ROOM: 'Private room',
      SHARED_ROOM: 'Shared room',
    };
    return map[type] || type;
  },

  /* Build query string from object */
  buildQuery(params) {
    return Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
  },

  /* Relative time */
  relativeTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
    return Utils.formatDateFull(dateStr);
  },

  /* Show modal */
  showModal(id) {
    document.getElementById(id)?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  /* Hide modal */
  hideModal(id) {
    document.getElementById(id)?.classList.add('hidden');
    document.body.style.overflow = '';
  },

  /* Click outside to close */
  onClickOutside(el, fn) {
    const handler = e => {
      if (!el.contains(e.target)) { fn(); document.removeEventListener('click', handler); }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
  },

  /* Skeleton loader HTML */
  skeletonCards(n = 8) {
    return Array(n).fill(0).map(() => `
      <div class="prop-card">
        <div class="prop-card-img skeleton" style="border-radius:12px"></div>
        <div class="skeleton-line" style="width:80%;margin-top:10px"></div>
        <div class="skeleton-line" style="width:60%;margin-top:6px"></div>
        <div class="skeleton-line" style="width:40%;margin-top:6px"></div>
      </div>`).join('');
  },

  /* Amenity icon map */
  amenityIcon(a) {
    const map = {
      WIFI: '📶', AC: '❄️', KITCHEN: '🍳', TV: '📺',
      PARKING: '🅿️', POOL: '🏊', GYM: '💪', SEA_VIEW: '🌊',
      WASHER: '🫧', IRON: '🧹', BALCONY: '🏙️', BBQ: '🔥',
      PET_FRIENDLY: '🐾', WORKSPACE: '💼', HOT_TUB: '🛁',
    };
    return map[a] || '✨';
  },

  /* Category icon map */
  categoryIcon(c) {
    const map = {
      BEACH: '🏖', MOUNTAIN: '🏔', CITY: '🏙', COUNTRYSIDE: '🌿',
      LAKEFRONT: '🌊', UNIQUE: '🛖', HERITAGE: '🏰', CAMPING: '🏕',
    };
    return map[c] || '🏠';
  },
};

window.Utils = Utils;
