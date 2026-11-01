/* ── StayFinder Formatters & Helpers ────────────────────────────── */

export function formatCurrency(amount) {
  if (amount == null) return '—';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Add date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Add date';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function daysBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b - a) / 86400000);
}

export function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function stars(rating, count) {
  if (!rating) return '';
  return `★ ${Number(rating).toFixed(2)}${count ? ` · ${count} reviews` : ''}`;
}

export function propertyTypeLabel(type) {
  const map = {
    ENTIRE_HOME: 'Entire home',
    PRIVATE_ROOM: 'Private room',
    SHARED_ROOM: 'Shared room',
  };
  return map[type] || type || '';
}

export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
  if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
  return formatDateFull(dateStr);
}

export function buildQuery(params) {
  return Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function amenityIcon(a) {
  const map = {
    WIFI: '📶',
    AC: '❄️',
    KITCHEN: '🍳',
    TV: '📺',
    PARKING: '🅿️',
    POOL: '🏊',
    GYM: '💪',
    SEA_VIEW: '🌊',
    WASHER: '🫧',
    IRON: '🧹',
    BALCONY: '🏙️',
    BBQ: '🔥',
    PET_FRIENDLY: '🐾',
    WORKSPACE: '💼',
    HOT_TUB: '🛁',
  };
  return map[a] || '✨';
}

export function categoryIcon(c) {
  const map = {
    BEACH: '🏖',
    MOUNTAIN: '🏔',
    CITY: '🏙',
    COUNTRYSIDE: '🌿',
    LAKEFRONT: '🌊',
    UNIQUE: '🛖',
    HERITAGE: '🏰',
    CAMPING: '🏕',
  };
  return map[c] || '🏠';
}

