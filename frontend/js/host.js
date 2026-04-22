/* ── StayFinder Host Dashboard ─────────────────────────────────── */
'use strict';

/* ── Cloudinary Config ───────────────────────────────────────────── */
const CLOUDINARY = {
  cloudName:    'dqyd6hpko',
  uploadPreset: 'StayFinderUploads',
  uploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  },
};

const HostDashboard = {

  currentSection:     'overview',
  bookingsPage:       0,
  bookingsTotalPages: 0,
  listingsPage:       0,
  listingsTotalPages: 0,
  uploadedImageUrls:  [],

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
    if (!Auth.require()) return;

    if (!Auth.isHost()) {
      Utils.toast('Please become a host first');
      setTimeout(() => window.location.href = this._rootPath() + 'index.html', 1500);
      return;
    }

    document.getElementById('nav-logo')?.addEventListener('click', () => {
      window.location.href = this._rootPath() + 'index.html';
    });
    document.getElementById('btn-explore')?.addEventListener('click', () => {
      window.location.href = this._rootPath() + 'index.html';
    });

    Auth.renderNavUser();
    WS.connect();
    WS.loadUnreadCount();
    WS.onNotification(n => this._onNotification(n));

    this._bindNav();
    this._initImageUpload();
    await this.loadOverview();
  },

  /* ── Cloudinary Image Upload ─────────────────────────────────── */
  _initImageUpload() {
    const input = document.getElementById('al-image-input');
    if (!input) return;

    input.addEventListener('change', async () => {
      const files = [...input.files];
      if (!files.length) return;

      if (this.uploadedImageUrls.length + files.length > 5) {
        Utils.toast('Maximum 5 images allowed');
        input.value = '';
        return;
      }

      const uploadBtn = document.getElementById('al-upload-btn');
      if (uploadBtn) {
        uploadBtn.disabled    = true;
        uploadBtn.textContent = `Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`;
      }

      try {
        const urls = await Promise.all(files.map(f => this._uploadToCloudinary(f)));
        this.uploadedImageUrls.push(...urls);
        this._renderImagePreview();
        Utils.toast(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded! ✅`);
      } catch (e) {
        Utils.toast('Upload failed: ' + e.message);
      } finally {
        if (uploadBtn) {
          uploadBtn.disabled    = false;
          uploadBtn.textContent = '+ Add photos';
        }
        input.value = '';
      }
    });
  },

  async _uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file',           file);
    formData.append('upload_preset',  CLOUDINARY.uploadPreset);
    formData.append('folder',         'stayfinder/properties');

    const res  = await fetch(CLOUDINARY.uploadUrl(), { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url;
  },

  _renderImagePreview() {
    const preview = document.getElementById('al-image-preview');
    if (!preview) return;

    if (!this.uploadedImageUrls.length) {
      preview.innerHTML = `
        <p style="color:var(--text-3);font-size:13px;text-align:center;padding:12px 0">
          No photos uploaded yet
        </p>`;
      return;
    }

    preview.innerHTML = this.uploadedImageUrls.map((url, i) => `
      <div style="position:relative;display:inline-block;margin:4px">
        <img src="${Utils.esc(url)}"
             style="width:100px;height:80px;object-fit:cover;
                    border-radius:8px;border:2px solid ${i === 0 ? 'var(--red)' : 'var(--border)'}"
             alt="Photo ${i + 1}">
        <button onclick="HostDashboard._removeImage(${i})"
                style="position:absolute;top:-6px;right:-6px;background:#ff385c;color:white;
                       border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;
                       font-size:11px;line-height:1;font-weight:700">✕</button>
        ${i === 0
            ? `<div style="font-size:10px;text-align:center;color:var(--red);
                         font-weight:600;margin-top:2px">Cover photo</div>`
            : ''
        }
      </div>`
    ).join('');
  },

  _removeImage(index) {
    this.uploadedImageUrls.splice(index, 1);
    this._renderImagePreview();
  },

  /* ── Sidebar Navigation ──────────────────────────────────────── */
  _bindNav() {
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.addEventListener('click', () => this.switchSection(el.dataset.section));
    });
  },

  switchSection(section) {
    document.querySelectorAll('.sidebar-nav-item').forEach(el =>
        el.classList.toggle('active', el.dataset.section === section)
    );
    document.querySelectorAll('.host-section-page').forEach(el =>
        el.classList.toggle('hidden', el.id !== 'section-' + section)
    );
    this.currentSection = section;

    const loaders = {
      overview: () => this.loadOverview(),
      bookings: () => this.loadBookings(0),
      listings: () => this.loadListings(0),
      earnings: () => this.loadEarnings(),
    };
    loaders[section]?.();
  },

  /* ── Overview ────────────────────────────────────────────────── */
  async loadOverview() {
    try {
      const [bookingsData, listingsData] = await Promise.all([
        API.getHostBookings(0),
        API.getMyProperties(0),
      ]);

      const bookings  = bookingsData.content || [];
      const listings  = listingsData.content || [];
      const pending   = bookings.filter(b => b.status === 'PENDING');
      const completed = bookings.filter(b => b.status === 'COMPLETED');
      const earnings  = completed.reduce((s, b) => s + Number(b.totalAmount), 0);

      document.getElementById('stat-earnings').textContent = Utils.formatCurrency(earnings);
      document.getElementById('stat-bookings').textContent = bookings.length;
      document.getElementById('stat-listings').textContent = listings.length;
      document.getElementById('stat-pending').textContent  = pending.length;

      this._renderBookingList(bookings.slice(0, 5), 'overview-booking-list', true);
    } catch (e) {
      Utils.toast('Failed to load dashboard: ' + e.message);
    }
  },

  /* ── Bookings (with pagination) ──────────────────────────────── */
  async loadBookings(page = 0) {
    this.bookingsPage   = page;
    const container     = document.getElementById('full-booking-list');
    container.innerHTML = '<p class="text-muted">Loading bookings...</p>';

    try {
      const data = await API.getHostBookings(page);
      this.bookingsTotalPages = data.totalPages || 0;
      this._renderBookingList(data.content || [], 'full-booking-list', true);
      this._renderPagination(
          'full-booking-list',
          page,
          this.bookingsTotalPages,
          p => this.loadBookings(p)
      );
    } catch (e) {
      container.innerHTML =
          `<p class="text-muted">Failed to load bookings: ${Utils.esc(e.message)}</p>`;
    }
  },

  /* ── Listings (with pagination) ──────────────────────────────── */
  async loadListings(page = 0) {
    this.listingsPage  = page;
    const grid         = document.getElementById('listings-grid');
    grid.innerHTML     = '<p class="text-muted">Loading listings...</p>';

    try {
      const data     = await API.getMyProperties(page);
      const listings = data.content || [];
      this.listingsTotalPages = data.totalPages || 0;

      if (!listings.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state-icon">🏠</div>
            <h3>No listings yet</h3>
            <p>Start by adding your first property.</p>
            <button class="btn btn-primary" onclick="HostDashboard.showAddListing()">
              Add your property
            </button>
          </div>`;
        return;
      }

      grid.innerHTML = listings.map(p => `
        <div class="listing-card">
          <div class="listing-card-img" style="background:${this._colorForCategory(p.category)}">
            ${p.images?.[0]
              ? `<img src="${Utils.esc(p.images[0])}" alt="${Utils.esc(p.title)}"
                      style="width:100%;height:100%;object-fit:cover">`
              : `<span style="font-size:48px">${Utils.categoryIcon(p.category)}</span>`
          }
          </div>
          <div class="listing-card-body">
            <div class="listing-card-name">${Utils.esc(p.title)}</div>
            <div class="listing-card-meta">
              ${Utils.formatCurrency(p.pricePerNight)} / night
              ${p.avgRating   > 0 ? ` · ★ ${Number(p.avgRating).toFixed(2)}` : ''}
              ${p.totalReviews    ? ` · ${p.totalReviews} reviews`            : ''}
            </div>
            <div class="listing-card-tags">
              <span class="badge ${
              p.status === 'APPROVED' ? 'badge-success' :
                  p.status === 'PENDING'  ? 'badge-warning' : 'badge-danger'
          }">${Utils.esc(p.status)}</span>
              ${p.instantBook ? '<span class="badge badge-gray">Instant book</span>' : ''}
            </div>
          </div>
        </div>`
      ).join('');

      this._renderPagination(
          'listings-grid',
          page,
          this.listingsTotalPages,
          p => this.loadListings(p)
      );
    } catch (e) {
      grid.innerHTML =
          `<p class="text-muted">Failed to load listings: ${Utils.esc(e.message)}</p>`;
    }
  },

  /* ── Earnings ────────────────────────────────────────────────── */
  async loadEarnings() {
    try {
      const data     = await API.getHostBookings(0);
      const bookings = (data.content || []).filter(b => b.status === 'COMPLETED');
      const now      = new Date();

      const total = bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
      const thisMonth = bookings
          .filter(b => {
            const d = new Date(b.createdAt);
            return d.getMonth()     === now.getMonth() &&
                d.getFullYear()  === now.getFullYear();
          })
          .reduce((s, b) => s + Number(b.totalAmount), 0);

      document.getElementById('earn-total').textContent    = Utils.formatCurrency(total);
      document.getElementById('earn-month').textContent    = Utils.formatCurrency(thisMonth);
      document.getElementById('earn-bookings').textContent = bookings.length;
    } catch (e) {
      Utils.toast('Failed to load earnings: ' + e.message);
    }
  },

  /* ── Render Booking List ─────────────────────────────────────── */
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

    const rows = bookings.map(b => `
      <div class="booking-row" id="bk-${b.id}">
        <div class="booking-row-img" style="background:#E2D5C3">
          ${b.property?.primaryImage
            ? `<img src="${Utils.esc(b.property.primaryImage)}" alt="">`
            : `<span style="font-size:24px">🏠</span>`
        }
        </div>
        <div class="booking-row-meta">
          <div class="booking-row-guest">${Utils.esc(b.guest?.fullName || '')}</div>
          <div class="booking-row-prop">${Utils.esc(b.property?.title || '')}</div>
          <div class="booking-row-dates">
            ${Utils.formatDate(b.checkIn)} → ${Utils.formatDate(b.checkOut)}
            · ${b.nights} night${b.nights > 1 ? 's' : ''}
            · ${b.guests} guest${b.guests > 1 ? 's' : ''}
          </div>
        </div>
        <div class="booking-row-price">${Utils.formatCurrency(b.totalAmount)}</div>
        ${showActions && b.status === 'PENDING' ? `
          <div class="booking-row-btns">
            <button class="booking-row-btn approve" onclick="HostDashboard.approve(${b.id})">
              Approve
            </button>
            <button class="booking-row-btn decline" onclick="HostDashboard.decline(${b.id})">
              Decline
            </button>
          </div>` : `
          <span class="badge ${
            b.status === 'CONFIRMED'                             ? 'badge-success' :
                b.status === 'PENDING'                               ? 'badge-warning' :
                    b.status === 'CANCELLED' || b.status === 'REJECTED' ? 'badge-danger'  :
                        'badge-gray'
        }">${Utils.esc(b.status)}</span>`
        }
      </div>`
    ).join('');

    const existingPagination = container.querySelector('.pagination-bar');
    container.innerHTML      = `<div class="booking-list">${rows}</div>`;
    if (existingPagination)  container.appendChild(existingPagination);
  },

  /* ── Pagination Helper ───────────────────────────────────────── */
  _renderPagination(containerId, currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return;

    const container = document.getElementById(containerId);
    if (!container)  return;

    container.querySelector('.pagination-bar')?.remove();

    const bar         = document.createElement('div');
    bar.className     = 'pagination-bar';
    bar.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:24px;flex-wrap:wrap';

    const prev       = document.createElement('button');
    prev.className   = 'btn btn-outline btn-sm';
    prev.textContent = '← Previous';
    prev.disabled    = currentPage === 0;
    prev.addEventListener('click', () => onPageChange(currentPage - 1));
    bar.appendChild(prev);

    const start = Math.max(0, currentPage - 2);
    const end   = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) {
      const btn       = document.createElement('button');
      btn.className   = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}`;
      btn.textContent = i + 1;
      btn.addEventListener('click', () => onPageChange(i));
      bar.appendChild(btn);
    }

    const next       = document.createElement('button');
    next.className   = 'btn btn-outline btn-sm';
    next.textContent = 'Next →';
    next.disabled    = currentPage >= totalPages - 1;
    next.addEventListener('click', () => onPageChange(currentPage + 1));
    bar.appendChild(next);

    container.appendChild(bar);
  },

  /* ── Approve / Decline ───────────────────────────────────────── */
  async approve(bookingId) {
    try {
      await API.confirmBooking(bookingId);
      Utils.toast('Booking approved! ✅');
      const row = document.getElementById('bk-' + bookingId);
      if (row) {
        row.querySelector('.booking-row-btns').innerHTML =
            '<span class="badge badge-success">CONFIRMED</span>';
      }
      const stat = document.getElementById('stat-pending');
      if (stat) stat.textContent = Math.max(0, parseInt(stat.textContent) - 1);
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
      const stat = document.getElementById('stat-pending');
      if (stat) stat.textContent = Math.max(0, parseInt(stat.textContent) - 1);
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  /* ── Add Listing ─────────────────────────────────────────────── */
  showAddListing() {
    this.uploadedImageUrls = [];
    this._renderImagePreview();
    Utils.showModal('add-listing-modal');
  },

  async submitListing(e) {
    e.preventDefault();
    const btn = document.getElementById('add-listing-btn');
    btn.disabled    = true;
    btn.textContent = 'Creating...';

    try {
      if (!this.uploadedImageUrls.length) {
        Utils.toast('Please upload at least one photo');
        return;
      }

      const amenities = [
        ...document.querySelectorAll('#al-amenities-grid input[type=checkbox]:checked')
      ].map(cb => cb.value);

      const body = {
        title:         document.getElementById('al-title').value.trim(),
        description:   document.getElementById('al-description').value.trim(),
        propertyType:  document.getElementById('al-type').value,
        category:      document.getElementById('al-category').value,
        address:       document.getElementById('al-address').value.trim(),
        city:          document.getElementById('al-city').value.trim(),
        state:         document.getElementById('al-state').value.trim(),
        country:       'India',
        pricePerNight: Number(document.getElementById('al-price').value),
        maxGuests:     Number(document.getElementById('al-guests').value),
        bedrooms:      Number(document.getElementById('al-bedrooms').value),
        bathrooms:     Number(document.getElementById('al-bathrooms').value),
        beds:          Number(document.getElementById('al-beds').value),
        cleaningFee:   0,
        instantBook:   document.getElementById('al-instant').checked,
        amenities:     amenities.length ? amenities : undefined,
        imageUrls:     this.uploadedImageUrls,
      };

      await API.createProperty(body);
      Utils.hideModal('add-listing-modal');
      Utils.toast('Property submitted for review! 🎉');
      this.uploadedImageUrls = [];
      await this.loadListings(0);
    } catch (e) {
      Utils.toast('Failed: ' + e.message);
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Submit listing';
    }
  },

  /* ── WebSocket Notification Handler ─────────────────────────── */
  _onNotification(n) {
    if (n.type === 'BOOKING_REQUEST') {
      const stat = document.getElementById('stat-pending');
      if (stat) stat.textContent = parseInt(stat.textContent || '0') + 1;
      Utils.toast('New booking request! 📩');
    }
  },

  /* ── Color Map ───────────────────────────────────────────────── */
  _colorForCategory(c) {
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
    return map[c] || '#E2D5C3';
  },

};

window.HostDashboard = HostDashboard;
document.addEventListener('DOMContentLoaded', () => HostDashboard.init());