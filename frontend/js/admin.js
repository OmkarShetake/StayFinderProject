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

const Admin = {
  currentPropertyStatus: 'PENDING',

  async init() {
    if (!Auth.require()) return;

    const user = Auth.getUser();
    if (!user || user.role !== 'ADMIN') {
      Utils.toast('Admin access required');
      setTimeout(() => window.location.href = _rootPath() + 'index.html', 1500);
      return;
    }

    document.getElementById('nav-logo').addEventListener('click', () => {
      window.location.href = _rootPath() + 'index.html';
    });
    document.getElementById('btn-explore').addEventListener('click', () => {
      window.location.href = _rootPath() + 'index.html';
    });

    Auth.renderNavUser();
    await this.loadProperties('PENDING');
    WS.connect();
  },

  switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-properties').classList.toggle('hidden', tab !== 'properties');
    document.getElementById('tab-bookings').classList.toggle('hidden', tab !== 'bookings');
    if (tab === 'bookings') this.loadBookings();
  },

  filterProperties(status, btn) {
    document.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.currentPropertyStatus = status;
    this.loadProperties(status);
  },

  async loadProperties(status) {
    const list = document.getElementById('properties-list');
    list.innerHTML = '<p class="text-muted">Loading properties...</p>';
    try {
      const data = await API.adminGetProperties(status, 0);
      const properties = data.content || [];
      if (!properties.length) {
        list.innerHTML = `<p class="text-muted">No ${status.toLowerCase()} properties found.</p>`;
        return;
      }
      list.innerHTML = properties.map(p => `
        <div class="admin-card">
          ${p.images?.[0] ? `<img src="${Utils.esc(p.images[0])}" class="property-img" alt="${Utils.esc(p.title)}">` : ''}
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">${Utils.esc(p.title)}</div>
              <div class="admin-card-meta">
                📍 ${Utils.esc(p.city)}, ${Utils.esc(p.state)}, ${Utils.esc(p.country)} •
                ${Utils.formatCurrency(p.pricePerNight)}/night •
                ${p.bedrooms} bed, ${p.bathrooms} bath
              </div>
              <div class="admin-card-meta">
                👤 Host: ${Utils.esc(p.host?.fullName || 'N/A')} (${Utils.esc(p.host?.email || '')}) •
                Created: ${Utils.formatDateFull(p.createdAt)}
              </div>
            </div>
            <span class="badge ${p.status === 'APPROVED' ? 'badge-success' : p.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}">${Utils.esc(p.status)}</span>
          </div>
          ${p.description ? `<div style="font-size:14px;color:var(--text-2);margin-bottom:12px;line-height:1.5">${Utils.esc(p.description)}</div>` : ''}
          <div class="admin-card-actions">
            ${p.status === 'PENDING' ? `
              <button class="btn btn-primary btn-sm" onclick="Admin.approveProperty(${p.id})">✓ Approve</button>
              <button class="btn btn-secondary btn-sm" onclick="Admin.rejectProperty(${p.id})">✕ Reject</button>
            ` : ''}
            <button class="btn btn-outline btn-sm" onclick="window.open('${_rootPath()}pages/property.html?id=${p.id}','_blank')">👁 View</button>
            <button class="btn btn-sm" style="background:#ff385c;color:white;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:600" onclick="Admin.deleteProperty(${p.id}, '${(p.title || '').replace(/'/g, "\\'")}')">🗑 Delete</button>
          </div>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = `<p class="text-muted">Failed to load properties: ${e.message}</p>`;
    }
  },

  async approveProperty(id) {
    if (!confirm('Approve this property? It will become visible to all guests.')) return;
    try {
      await API.adminApproveProperty(id);
      Utils.toast('Property approved! 🎉');
      await this.loadProperties(this.currentPropertyStatus);
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  async rejectProperty(id) {
    if (!confirm('Reject this property?')) return;
    try {
      await API.adminRejectProperty(id);
      Utils.toast('Property rejected');
      await this.loadProperties(this.currentPropertyStatus);
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  async deleteProperty(id, title) {
    if (!confirm(`Permanently delete "${title}"?\n\nThis cannot be undone.`)) return;
    try {
      await API.adminDeleteProperty(id);
      Utils.toast('Property deleted 🗑');
      await this.loadProperties(this.currentPropertyStatus);
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  async loadBookings() {
    const list = document.getElementById('bookings-list');
    list.innerHTML = '<p class="text-muted">Loading bookings...</p>';
    try {
      const data = await API.adminGetBookings(0);
      const bookings = data.content || [];
      if (!bookings.length) {
        list.innerHTML = '<p class="text-muted">No bookings found.</p>';
        return;
      }
      list.innerHTML = bookings.map(b => `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">${Utils.esc(b.property?.title || 'Property')}</div>
              <div class="admin-card-meta">
                📍 ${Utils.esc(b.property?.city || 'N/A')} •
                Ref: <code>${Utils.esc(b.referenceId)}</code> •
                ${b.nights} night${b.nights > 1 ? 's' : ''}, ${b.guests} guest${b.guests > 1 ? 's' : ''}
              </div>
              <div class="admin-card-meta">
                👤 Guest: ${Utils.esc(b.guest?.fullName || 'N/A')} (${Utils.esc(b.guest?.email || '')}) •
                ${Utils.formatDate(b.checkIn)} → ${Utils.formatDate(b.checkOut)}
              </div>
              <div class="admin-card-meta">
                💰 ${Utils.formatCurrency(b.totalAmount)} •
                Booked: ${Utils.formatDateFull(b.createdAt)}
              </div>
            </div>
            <span class="badge ${
              b.status === 'CONFIRMED' ? 'badge-success' :
              b.status === 'PENDING'   ? 'badge-warning' :
              b.status === 'COMPLETED' ? 'badge-gray'    : 'badge-danger'
            }">${Utils.esc(b.status)}</span>
          </div>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = `<p class="text-muted">Failed to load bookings: ${e.message}</p>`;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
