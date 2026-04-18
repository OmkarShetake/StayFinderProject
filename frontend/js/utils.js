/* ── StayFinder Utils ──────────────────────────────────────────── */
'use strict';

const Utils = {

  /* ── XSS Sanitization ────────────────────────────────────────── */
  /**
   * Escapes HTML special characters to prevent XSS attacks.
   * Use this on ALL user-generated content before injecting into innerHTML.
   * Example: Utils.esc(property.title) instead of property.title
   */
  esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#x27;')
        .replace(/\//g, '&#x2F;');
  },

  /* ── Toast Notification ──────────────────────────────────────── */
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

  /* ── Currency ────────────────────────────────────────────────── */
  formatCurrency(amount) {
    if (amount == null) return '—';
    return '₹' + Number(amount).toLocaleString('en-IN');
  },

  /* ── Dates ───────────────────────────────────────────────────── */
  formatDate(dateStr) {
    if (!dateStr) return 'Add date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  },

  formatDateFull(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  },

  daysBetween(from, to) {
    const a = new Date(from), b = new Date(to);
    return Math.round((b - a) / 86400000);
  },

  /* ── Debounce ────────────────────────────────────────────────── */
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  /* ── Text Helpers ────────────────────────────────────────────── */
  initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  stars(rating, count) {
    if (!rating) return '';
    return `★ ${Number(rating).toFixed(2)}${count ? ` · ${count} reviews` : ''}`;
  },

  propertyTypeLabel(type) {
    const map = {
      ENTIRE_HOME:  'Entire home',
      PRIVATE_ROOM: 'Private room',
      SHARED_ROOM:  'Shared room',
    };
    return map[type] || type;
  },

  /* ── Query Builder ───────────────────────────────────────────── */
  buildQuery(params) {
    return Object.entries(params)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
  },

  /* ── Relative Time ───────────────────────────────────────────── */
  relativeTime(dateStr) {
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)     return 'Just now';
    if (diff < 3600)   return Math.floor(diff / 60)    + ' min ago';
    if (diff < 86400)  return Math.floor(diff / 3600)  + ' hr ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
    return Utils.formatDateFull(dateStr);
  },

  /* ── Modals ──────────────────────────────────────────────────── */
  showModal(id) {
    document.getElementById(id)?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  hideModal(id) {
    document.getElementById(id)?.classList.add('hidden');
    document.body.style.overflow = '';
  },

  onClickOutside(el, fn) {
    const handler = e => {
      if (!el.contains(e.target)) {
        fn();
        document.removeEventListener('click', handler);
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
  },

  /* ── Skeleton Loader ─────────────────────────────────────────── */
  skeletonCards(n = 8) {
    return Array(n).fill(0).map(() => `
      <div class="prop-card">
        <div class="prop-card-img skeleton" style="border-radius:12px"></div>
        <div class="skeleton-line" style="width:80%;margin-top:10px"></div>
        <div class="skeleton-line" style="width:60%;margin-top:6px"></div>
        <div class="skeleton-line" style="width:40%;margin-top:6px"></div>
      </div>`
    ).join('');
  },

  /* ── Icon Maps ───────────────────────────────────────────────── */
  amenityIcon(a) {
    const map = {
      WIFI:         '📶',
      AC:           '❄️',
      KITCHEN:      '🍳',
      TV:           '📺',
      PARKING:      '🅿️',
      POOL:         '🏊',
      GYM:          '💪',
      SEA_VIEW:     '🌊',
      WASHER:       '🫧',
      IRON:         '🧹',
      BALCONY:      '🏙️',
      BBQ:          '🔥',
      PET_FRIENDLY: '🐾',
      WORKSPACE:    '💼',
      HOT_TUB:      '🛁',
    };
    return map[a] || '✨';
  },

  categoryIcon(c) {
    const map = {
      BEACH:       '🏖',
      MOUNTAIN:    '🏔',
      CITY:        '🏙',
      COUNTRYSIDE: '🌿',
      LAKEFRONT:   '🌊',
      UNIQUE:      '🛖',
      HERITAGE:    '🏰',
      CAMPING:     '🏕',
    };
    return map[c] || '🏠';
  },

};

window.Utils = Utils;