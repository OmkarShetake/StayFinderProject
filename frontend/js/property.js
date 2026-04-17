/* ── StayFinder Property Detail Page ──────────────────────────── */
'use strict';

const PropertyPage = {
  property: null,
  propertyId: null,
  checkIn: null,
  checkOut: null,
  selectingCI: true,
  guests: 1,
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  bookedDates: new Set(),
  MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  DAYS: ['Su','Mo','Tu','We','Th','Fr','Sa'],

  /* Resolve frontend root path dynamically — same logic as auth.js */
  _rootPath() {
    const path = window.location.pathname;
    const marker = '/frontend/';
    const idx = path.indexOf(marker);
    if (idx !== -1) return path.substring(0, idx + marker.length);
    return path.replace(/\/[^/]*$/, '/');
  },

  async init() {
    const params = new URLSearchParams(window.location.search);
    this.propertyId = params.get('id');
    if (!this.propertyId) {
      window.location.href = this._rootPath() + 'index.html'; // ← FIXED
      return;
    }

    Auth.renderNavUser();
    WS.connect();
    WS.loadUnreadCount();
    this._bindEvents();
    await this.loadProperty();
    await this.loadAvailability();
    await this.loadReviews();
    this.renderCalendar();
  },

  async loadProperty() {
    try {
      this.property = await API.getProperty(this.propertyId);
      this._renderProperty();
    } catch {
      Utils.toast('Failed to load property');
    }
  },

  _renderProperty() {
    const p = this.property;
    document.title = p.title + ' — StayFinder';

    // Title & meta
    document.getElementById('detail-title').textContent = p.title;
    document.getElementById('detail-rating').innerHTML =
        p.avgRating > 0 ? `★ ${Number(p.avgRating).toFixed(2)} · <span class="underline">${p.totalReviews} reviews</span>` : '';
    document.getElementById('detail-location').textContent = `${p.city}, ${p.state}, ${p.country}`;
    if (p.host?.superhost) document.getElementById('detail-superhost').classList.remove('hidden');

    // Photos
    const imgs = p.images || [];
    const photoMain = document.getElementById('photo-main');
    const photoThumb1 = document.getElementById('photo-thumb-1');
    const photoThumb2 = document.getElementById('photo-thumb-2');
    if (imgs[0]) photoMain.innerHTML = `<img src="${imgs[0]}" alt="${p.title}">`;
    if (imgs[1]) photoThumb1.innerHTML = `<img src="${imgs[1]}" alt="">`;
    if (imgs[2]) photoThumb2.innerHTML = `<img src="${imgs[2]}" alt="">`;

    // Host section
    document.getElementById('host-title').textContent = `${Utils.propertyTypeLabel(p.propertyType)} hosted by ${p.host?.fullName}`;
    document.getElementById('host-sub').textContent = `${p.maxGuests} guests · ${p.bedrooms} bedroom${p.bedrooms > 1 ? 's' : ''} · ${p.beds} bed${p.beds > 1 ? 's' : ''} · ${p.bathrooms} bath${p.bathrooms > 1 ? 's' : ''}`;
    document.getElementById('host-avatar').textContent = Utils.initials(p.host?.fullName || '');
    if (p.host?.superhost) document.getElementById('host-superhost-badge').classList.remove('hidden');

    // Superhost highlight
    if (p.host?.superhost) {
      document.getElementById('highlight-superhost').classList.remove('hidden');
    }
    // Instant book highlight
    if (p.instantBook) {
      document.getElementById('highlight-instant').classList.remove('hidden');
    }

    // Amenities
    const amenGrid = document.getElementById('amenity-grid');
    const amenities = [...(p.amenities || [])].slice(0, 10);
    amenGrid.innerHTML = amenities.map(a =>
        `<div class="amenity-item"><span class="amenity-icon">${Utils.amenityIcon(a)}</span>${a.replace(/_/g, ' ')}</div>`
    ).join('');

    // Booking card price
    document.getElementById('bk-price').innerHTML = `${Utils.formatCurrency(p.pricePerNight)} <span>night</span>`;
    document.getElementById('bk-rating').textContent = p.avgRating > 0
        ? `★ ${Number(p.avgRating).toFixed(2)} · ${p.totalReviews} reviews` : '';

    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (p.wishlisted) {
      saveBtn.innerHTML = '❤ Saved';
    }
  },

  async loadAvailability() {
    const from = new Date();
    const to   = new Date(); to.setMonth(to.getMonth() + 3);
    try {
      const avData = await API.getAvailability(
          this.propertyId,
          from.toISOString().slice(0,10),
          to.toISOString().slice(0,10)
      );
      this.bookedDates = new Set(
          avData.filter(a => !a.available).map(a => a.date)
      );
    } catch {}
  },

  async loadReviews() {
    try {
      const [reviewsData, summary] = await Promise.all([
        API.getReviews(this.propertyId),
        API.getRatingSummary(this.propertyId),
      ]);

      // Rating bars
      if (summary) {
        const bars = {
          'bar-cleanliness':   summary.cleanliness,
          'bar-communication': summary.communication,
          'bar-checkin':       summary.checkin,
          'bar-location':      summary.location,
          'bar-value':         summary.value,
          'bar-accuracy':      summary.accuracy,
        };
        const labels = {
          'lbl-cleanliness':   summary.cleanliness,
          'lbl-communication': summary.communication,
          'lbl-checkin':       summary.checkin,
          'lbl-location':      summary.location,
          'lbl-value':         summary.value,
          'lbl-accuracy':      summary.accuracy,
        };
        Object.entries(bars).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el) el.style.width = (val ? Number(val) / 5 * 100 : 0) + '%';
        });
        Object.entries(labels).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val ? Number(val).toFixed(1) : '';
        });
        const hdr = document.getElementById('rating-hdr');
        if (hdr && summary.overall > 0)
          hdr.textContent = `★ ${Number(summary.overall).toFixed(2)} · ${summary.totalReviews} reviews`;
      }

      // Review cards
      const reviews = reviewsData.content || [];
      const container = document.getElementById('reviews-container');
      if (reviews.length === 0) {
        container.innerHTML = '<p class="text-muted">No reviews yet. Be the first to review!</p>';
        return;
      }
      container.innerHTML = reviews.map(r => `
        <div class="review-item">
          <div class="review-header">
            <div class="reviewer-avatar">${Utils.initials(r.guestName)}</div>
            <div>
              <div class="reviewer-name">${r.guestName}</div>
              <div class="review-date">${Utils.formatDateFull(r.createdAt)}</div>
            </div>
          </div>
          <div class="review-comment">${r.comment || ''}</div>
        </div>`).join('');
    } catch {}
  },

  /* ── Calendar ──────────────────────────────────────────────── */
  renderCalendar() {
    document.getElementById('cal-month-title').textContent =
        this.MONTHS[this.calMonth] + ' ' + this.calYear;

    const hdr = document.getElementById('cal-days-hdr');
    hdr.innerHTML = this.DAYS.map(d => `<div class="cal-day-name">${d}</div>`).join('');

    const today = new Date(); today.setHours(0,0,0,0);
    const firstDay = new Date(this.calYear, this.calMonth, 1).getDay();
    const daysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();
    let html = '';

    for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.calYear}-${String(this.calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const date = new Date(this.calYear, this.calMonth, d);
      const isPast   = date < today;
      const isBooked = this.bookedDates.has(dateStr);
      let cls = 'cal-day';

      if (isPast || isBooked) {
        cls += isPast ? ' past' : ' booked';
      } else if (this.checkIn && this.checkOut) {
        const ci = new Date(this.checkIn), co = new Date(this.checkOut);
        if (date.getTime() === ci.getTime())       cls += ' rs';
        else if (date.getTime() === co.getTime())  cls += ' re';
        else if (date > ci && date < co)           cls += ' ir';
      } else if (this.checkIn && date.getTime() === new Date(this.checkIn).getTime()) {
        cls += ' sel';
      }

      const click = (!isPast && !isBooked) ? `onclick="PropertyPage.pickDay('${dateStr}')"` : '';
      html += `<div class="${cls}" ${click}>${d}</div>`;
    }

    document.getElementById('cal-days').innerHTML = html;
  },

  pickDay(dateStr) {
    const date = new Date(dateStr);
    if (this.selectingCI || !this.checkIn || (this.checkIn && this.checkOut)) {
      this.checkIn = dateStr;
      this.checkOut = null;
      this.selectingCI = false;
    } else {
      if (date <= new Date(this.checkIn)) {
        this.checkIn = dateStr;
        this.checkOut = null;
        return;
      }
      this.checkOut = dateStr;
      this.selectingCI = true;
    }
    this.renderCalendar();
    this._updateDateDisplay();
    if (this.checkIn && this.checkOut) this._loadPricePreview();
  },

  prevMonth() {
    if (this.calMonth === 0) { this.calMonth = 11; this.calYear--; }
    else this.calMonth--;
    this.renderCalendar();
  },

  nextMonth() {
    if (this.calMonth === 11) { this.calMonth = 0; this.calYear++; }
    else this.calMonth++;
    this.renderCalendar();
  },

  _updateDateDisplay() {
    document.getElementById('ci-val').textContent = Utils.formatDate(this.checkIn);
    document.getElementById('co-val').textContent = Utils.formatDate(this.checkOut);
    document.getElementById('ci-val').className = 'date-cell-val' + (this.checkIn ? ' set' : '');
    document.getElementById('co-val').className = 'date-cell-val' + (this.checkOut ? ' set' : '');
  },

  changeGuests(delta) {
    const max = this.property?.maxGuests || 4;
    this.guests = Math.max(1, Math.min(max, this.guests + delta));
    document.getElementById('guest-count').textContent = this.guests;
    document.getElementById('guest-val').textContent = this.guests + (this.guests === 1 ? ' guest' : ' guests');
    document.getElementById('btn-guest-minus').disabled = this.guests <= 1;
    document.getElementById('btn-guest-plus').disabled  = this.guests >= max;
  },

  async _loadPricePreview() {
    if (!this.checkIn || !this.checkOut) return;
    try {
      const data = await API.pricePreview({
        propertyId: parseInt(this.propertyId),
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests,
      });
      const nights = data.nights || 0;
      document.getElementById('pb-label').textContent = `${Utils.formatCurrency(data.pricePerNight)} × ${nights} night${nights > 1 ? 's' : ''}`;
      document.getElementById('pb-base').textContent    = Utils.formatCurrency(data.baseAmount);
      document.getElementById('pb-cleaning').textContent = Utils.formatCurrency(data.cleaningFee);
      document.getElementById('pb-service').textContent  = Utils.formatCurrency(data.serviceFee);
      document.getElementById('pb-total').textContent    = Utils.formatCurrency(data.totalAmount);
      document.getElementById('price-breakdown').classList.remove('hidden');
      document.getElementById('pb-placeholder').classList.add('hidden');
    } catch {}
  },

  async doReserve() {
    if (!Auth.isLoggedIn()) { Auth.showAuthModal('login'); return; }
    if (!this.checkIn || !this.checkOut) {
      Utils.toast('Please select your dates');
      return;
    }
    const btn = document.getElementById('reserve-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
    try {
      const booking = await API.createBooking({
        propertyId: parseInt(this.propertyId),
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests,
      });
      Utils.toast('Booking confirmed! Ref: ' + booking.referenceId);
      setTimeout(() => window.location.href = this._rootPath() + 'pages/trips.html', 1500); // ← FIXED
    } catch (e) {
      Utils.toast('Booking failed: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Reserve';
    }
  },

  async toggleSave() {
    if (!Auth.isLoggedIn()) { Auth.showAuthModal('login'); return; }
    try {
      await API.toggleWishlist(this.propertyId);
      const btn = document.getElementById('save-btn');
      const isSaved = btn.innerHTML.includes('❤');
      btn.innerHTML = isSaved ? '♡ Save' : '❤ Saved';
      Utils.toast(isSaved ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    }
  },

  _bindEvents() {
    document.getElementById('cal-prev')?.addEventListener('click', () => this.prevMonth());
    document.getElementById('cal-next')?.addEventListener('click', () => this.nextMonth());
    document.getElementById('btn-guest-minus')?.addEventListener('click', () => this.changeGuests(-1));
    document.getElementById('btn-guest-plus')?.addEventListener('click',  () => this.changeGuests(1));
    document.getElementById('reserve-btn')?.addEventListener('click', () => this.doReserve());
    document.getElementById('save-btn')?.addEventListener('click', () => this.toggleSave());
    document.getElementById('nav-login-btn')?.addEventListener('click', () => Auth.showAuthModal('login'));
    document.getElementById('login-form')?.addEventListener('submit', Auth.handleLogin.bind(Auth));
    document.getElementById('register-form')?.addEventListener('submit', Auth.handleRegister.bind(Auth));
    document.getElementById('auth-tab-login')?.addEventListener('click', () => Auth.showAuthModal('login'));
    document.getElementById('auth-tab-register')?.addEventListener('click', () => Auth.showAuthModal('register'));
    document.querySelectorAll('.modal-overlay').forEach(o =>
        o.addEventListener('click', e => { if (e.target === o) Utils.hideModal(o.id); }));
  },
};

window.PropertyPage = PropertyPage;
document.addEventListener('DOMContentLoaded', () => PropertyPage.init());


