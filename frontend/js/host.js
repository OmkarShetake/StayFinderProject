/* ── StayFinder Host Dashboard ─────────────────────────────────── */
'use strict';

const HostDashboard = {
  currentSection: 'overview',

  async init() {
    if (!Auth.require()) return;
    if (!Auth.isHost()) {
      Utils.toast('Please become a host first');
      setTimeout(() => window.location.href = '/', 1500);
      return;
    }
    Auth.renderNavUser();
    WS.connect();
    WS.loadUnreadCount();
    WS.onNotification(n => this._onNotification(n));
    this._bindNav();
    await this.loadOverview();
  },

  _bindNav() {
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const section = el.dataset.section;
        this.switchSection(section);
      });
    });
    document.getElementById('nav-login-btn')?.addEventListener('click', () => Auth.showAuthModal('login'));
    document.getElementById('nav-logout')?.addEventListener('click', () => Auth.logout());
  },

  switchSection(section) {
    document.querySelectorAll('.sidebar-nav-item').forEach(el =>
      el.classList.toggle('active', el.dataset.section === section));
    document.querySelectorAll('.host-section-page').forEach(el =>
      el.classList.toggle('hidden', el.id !== 'section-' + section));
    this.currentSection = section;

    const loaders = {
      overview:  () => this.loadOverview(),
      bookings:  () => this.loadBookings(),
      listings:  () => this.loadListings(),
      earnings:  () => this.loadEarnings(),
    };
    loaders[section]?.();
  },

  async loadOverview() {
    try {
      const [bookingsData, listingsData] = await Promise.all([
        API.getHostBookings(0),
        API.getMyProperties(0),
      ]);

      const bookings  = bookingsData.content  || [];
      const listings  = listingsData.content  || [];
      const pending   = bookings.filter(b => b.status === 'PENDING');
      const completed = bookings.filter(b => b.status === 'COMPLETED');
      const earnings  = completed.reduce((s, b) => s + Number(b.totalAmount), 0);

      // Stats
      document.getElementById('stat-earnings').textContent  = Utils.formatCurrency(earnings);
      document.getElementById('stat-bookings').textContent  = bookings.length;
      document.getElementById('stat-listings').textContent  = listings.length;
      document.getElementById('stat-pending').textContent   = pending.length;

      // Recent bookings
      this._renderBookingList(bookings.slice(0, 5), 'overview-booking-list', true);
    } catch (e) {
      Utils.toast('Failed to load dashboard: ' + e.message);
    }
  },

  async loadBookings() {
    try {
      const data = await API.getHostBookings(0);
      this._renderBookingList(data.content || [], 'full-booking-list', true);
    } catch {}
  },

  async loadListings() {
    try {
      const data = await API.getMyProperties(0);
      const grid = document.getElementById('listings-grid');
      const listings = data.content || [];

      if (!listings.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state-icon">🏠</div>
            <h3>No listings yet</h3>
            <p>Start by adding your first property.</p>
            <button class="btn btn-primary" onclick="HostDashboard.showAddListing()">Add your property</button>
          </div>`;
        return;
      }

      grid.innerHTML = listings.map(p => `
        <div class="listing-card">
          <div class="listing-card-img" style="background:${this._colorForCategory(p.category)}">
            ${p.images?.[0]
              ? `<img src="${p.images[0]}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover">`
              : `<span style="font-size:48px">${Utils.categoryIcon(p.category)}</span>`}
          </div>
          <div class="listing-card-body">
            <div class="listing-card-name">${p.title}</div>
            <div class="listing-card-meta">${Utils.formatCurrency(p.pricePerNight)} / night
              ${p.avgRating > 0 ? ` · ★ ${Number(p.avgRating).toFixed(2)}` : ''}
              ${p.totalReviews ? ` · ${p.totalReviews} reviews` : ''}
            </div>
            <div class="listing-card-tags">
              <span class="badge ${p.status === 'APPROVED' ? 'badge-success' : p.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}">
                ${p.status}
              </span>
              ${p.host?.superhost ? '<span class="badge badge-red">Superhost</span>' : ''}
              ${p.instantBook ? '<span class="badge badge-gray">Instant book</span>' : ''}
            </div>
          </div>
        </div>`).join('');
    } catch {}
  },

  async loadEarnings() {
    try {
      const data  = await API.getHostBookings(0);
      const bookings = (data.content || []).filter(b => b.status === 'COMPLETED');
      const total  = bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
      const thisMonth = bookings.filter(b => {
        const d = new Date(b.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((s, b) => s + Number(b.totalAmount), 0);

      document.getElementById('earn-total').textContent   = Utils.formatCurrency(total);
      document.getElementById('earn-month').textContent   = Utils.formatCurrency(thisMonth);
      document.getElementById('earn-bookings').textContent = bookings.length;
    } catch {}
  },

  _renderBookingList(bookings, containerId, showActions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!bookings.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>Bookings will appear here once guests reserve your property.</p>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="booking-list">
      ${bookings.map(b => `
        <div class="booking-row" id="bk-${b.id}">
          <div class="booking-row-img" style="background:#E2D5C3">
            ${b.property?.primaryImage
              ? `<img src="${b.property.primaryImage}" alt="">`
              : `<span style="font-size:24px">🏠</span>`}
          </div>
          <div class="booking-row-meta">
            <div class="booking-row-guest">${b.guest?.fullName}</div>
            <div class="booking-row-prop">${b.property?.title}</div>
            <div class="booking-row-dates">
              ${Utils.formatDate(b.checkIn)} → ${Utils.formatDate(b.checkOut)}
              · ${b.nights} night${b.nights > 1 ? 's' : ''}
              · ${b.guests} guest${b.guests > 1 ? 's' : ''}
            </div>
          </div>
          <div class="booking-row-price">${Utils.formatCurrency(b.totalAmount)}</div>
          ${showActions && b.status === 'PENDING' ? `
            <div class="booking-row-btns">
              <button class="booking-row-btn approve" onclick="HostDashboard.approve(${b.id})">Approve</button>
              <button class="booking-row-btn decline" onclick="HostDashboard.decline(${b.id})">Decline</button>
            </div>` : `
            <span class="badge ${b.status === 'CONFIRMED' ? 'badge-success' : b.status === 'PENDING' ? 'badge-warning' : b.status === 'CANCELLED' || b.status === 'REJECTED' ? 'badge-danger' : 'badge-gray'}">
              ${b.status}
            </span>`}
        </div>`).join('')}
    </div>`;
  },

  async approve(bookingId) {
    try {
      await API.confirmBooking(bookingId);
      Utils.toast('Booking approved! ✅');
      const row = document.getElementById('bk-' + bookingId);
      if (row) {
        row.querySelector('.booking-row-btns').innerHTML =
          '<span class="badge badge-success">CONFIRMED</span>';
      }
      const pendingStat = document.getElementById('stat-pending');
      if (pendingStat) pendingStat.textContent = Math.max(0, parseInt(pendingStat.textContent) - 1);
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  async decline(bookingId) {
    if (!confirm('Decline this booking request?')) return;
    try {
      await API.rejectBooking(bookingId);
      Utils.toast('Booking declined');
      const row = document.getElementById('bk-' + bookingId);
      if (row) {
        row.querySelector('.booking-row-btns').innerHTML =
          '<span class="badge badge-danger">REJECTED</span>';
      }
      const pendingStat = document.getElementById('stat-pending');
      if (pendingStat) pendingStat.textContent = Math.max(0, parseInt(pendingStat.textContent) - 1);
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  showAddListing() {
    Utils.showModal('add-listing-modal');
  },

  async submitListing(e) {
    e.preventDefault();
    const btn = document.getElementById('add-listing-btn');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    try {
      // Collect checked amenities
      const amenities = [...document.querySelectorAll('#al-amenities-grid input[type=checkbox]:checked')]
        .map(cb => cb.value);

      // Collect image URLs (comma-separated, filter empties)
      const imageUrls = (document.getElementById('al-images').value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const body = {
        title:        document.getElementById('al-title').value,
        description:  document.getElementById('al-description').value,
        propertyType: document.getElementById('al-type').value,
        category:     document.getElementById('al-category').value,
        address:      document.getElementById('al-address').value,
        city:         document.getElementById('al-city').value,
        state:        document.getElementById('al-state').value,
        pricePerNight: Number(document.getElementById('al-price').value),
        maxGuests:    Number(document.getElementById('al-guests').value),
        bedrooms:     Number(document.getElementById('al-bedrooms').value),
        bathrooms:    Number(document.getElementById('al-bathrooms').value),
        beds:         Number(document.getElementById('al-beds').value),
        instantBook:  document.getElementById('al-instant').checked,
        amenities:    amenities.length ? amenities : undefined,
        imageUrls:    imageUrls.length ? imageUrls : undefined,
      };
      await API.createProperty(body);
      Utils.hideModal('add-listing-modal');
      Utils.toast('Property submitted for review! 🎉');
      await this.loadListings();
    } catch (e) {
      Utils.toast('Failed: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit listing';
    }
  },

  _onNotification(n) {
    const dot = document.getElementById('stat-pending');
    if (n.type === 'BOOKING_REQUEST' && dot) {
      dot.textContent = parseInt(dot.textContent || '0') + 1;
    }
  },

  _colorForCategory(c) {
    const map = { BEACH:'#E2E0C3',MOUNTAIN:'#C3D5E2',CITY:'#E2C3D4',COUNTRYSIDE:'#D4E2C3' };
    return map[c] || '#E2D5C3';
  },
};

window.HostDashboard = HostDashboard;
document.addEventListener('DOMContentLoaded', () => HostDashboard.init());
