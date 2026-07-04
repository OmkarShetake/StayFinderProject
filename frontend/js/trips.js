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

const Trips = {
  all: [],

  async init() {
    if (!Auth.require()) return;

    document.getElementById('nav-logo').addEventListener('click', () => {
      window.location.href = _rootPath() + 'index.html';
    });

    document.getElementById('btn-explore').addEventListener('click', () => {
      window.location.href = _rootPath() + 'index.html';
    });

    Auth.renderNavUser();

    await this.load();
    WS.connect();
  },

  async load() {
    const list = document.getElementById('trips-list');
    list.innerHTML = '<p class="text-muted">Loading your trips...</p>';
    try {
      const data = await API.getMyBookings(0);
      this.all = data.content || [];
      this.render(this.all);
    } catch (e) {
      list.innerHTML = `<p class="text-muted">Failed to load trips: ${e.message}</p>`;
    }
  },

  filter(status, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = status === 'all' ? this.all
      : this.all.filter(b => b.status === status ||
          (status === 'CANCELLED' && (b.status === 'CANCELLED' || b.status === 'REJECTED')));
    this.render(filtered);
  },

  render(bookings) {
    const list = document.getElementById('trips-list');
    if (!bookings.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🧳</div>
          <h3>No trips found</h3>
          <p>When you book a stay, it will appear here.</p>
          <button class="btn btn-primary" id="btn-start-exploring">Start exploring</button>
        </div>`;
      document.getElementById('btn-start-exploring')?.addEventListener('click', () => {
        window.location.href = _rootPath() + 'index.html';
      });
      return;
    }
    list.innerHTML = bookings.map(b => `
      <div class="trip-card">
        <div class="trip-img">
          ${b.property?.primaryImage ? `<img src="${b.property.primaryImage}" alt="">` : '🏠'}
        </div>
        <div class="trip-info">
          <div class="trip-title">${b.property?.title || 'Property'}</div>
          <div class="trip-loc">${b.property?.city || ''}</div>
          <div class="trip-dates">${Utils.formatDate(b.checkIn)} → ${Utils.formatDate(b.checkOut)} · ${b.nights} night${b.nights > 1 ? 's' : ''} · ${b.guests} guest${b.guests > 1 ? 's' : ''}</div>
          <div class="trip-price">${Utils.formatCurrency(b.totalAmount)}</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="badge ${b.status === 'CONFIRMED' ? 'badge-success' : b.status === 'PENDING' ? 'badge-warning' : b.status === 'COMPLETED' ? 'badge-gray' : 'badge-danger'}">${b.status}</span>
            ${b.status === 'CONFIRMED' || b.status === 'PENDING' ? `
              <button class="btn btn-secondary btn-sm" onclick="Trips.cancel(${b.id})">Cancel</button>
              <button class="btn btn-outline btn-sm" onclick="Trips.openModify(${b.id}, '${(b.property?.title || '').replace(/'/g, "\\'")}', '${b.checkIn}', '${b.checkOut}', ${b.guests}, ${b.property?.id})">Change dates</button>
              <button class="btn btn-outline btn-sm" onclick="window.location.href='chat.html?bookingId=${b.id}'">💬 Message host</button>` : ''}
            ${b.canReview ? `<button class="btn btn-outline btn-sm" onclick="Trips.openReview(${b.id})">Write review</button>` : ''}
          </div>
          <div class="trip-ref mt-8">Ref: ${b.referenceId}</div>
        </div>
      </div>`).join('');
  },

  async cancel(id) {
    if (!confirm('Cancel this booking?')) return;
    try {
      await API.cancelBooking(id);
      Utils.toast('Booking cancelled');
      await this.load();
    } catch (e) { Utils.toast('Error: ' + e.message); }
  },

  openReview(bookingId) {
    document.getElementById('review-booking-id').value = bookingId;
    Utils.showModal('review-modal');
  },

  openModify(bookingId, propertyTitle, checkIn, checkOut, guests, propertyId) {
    document.getElementById('modify-booking-id').value          = bookingId;
    document.getElementById('modify-property-name').textContent = propertyTitle;
    document.getElementById('modify-checkin').value             = checkIn;
    document.getElementById('modify-checkout').value            = checkOut;
    document.getElementById('modify-guests').value              = guests;
    document.getElementById('modify-price-preview').classList.add('hidden');
    document.getElementById('modify-booking-id').dataset.propertyId = propertyId;
    Utils.showModal('modify-modal');
  },

  async previewModifyPrice() {
    const propertyId = document.getElementById('modify-booking-id').dataset.propertyId;
    const checkIn    = document.getElementById('modify-checkin').value;
    const checkOut   = document.getElementById('modify-checkout').value;
    const guests     = document.getElementById('modify-guests').value;

    if (!checkIn || !checkOut) { Utils.toast('Please select dates'); return; }

    const btn = document.getElementById('modify-preview-btn');
    btn.disabled    = true;
    btn.textContent = 'Loading...';

    try {
      const data   = await API.pricePreview({ propertyId: parseInt(propertyId), checkIn, checkOut, guests: parseInt(guests) });
      const nights = data.nights || 0;

      document.getElementById('modify-pb-label').textContent    = `${Utils.formatCurrency(data.pricePerNight)} × ${nights} night${nights > 1 ? 's' : ''}`;
      document.getElementById('modify-pb-base').textContent     = Utils.formatCurrency(data.baseAmount);
      document.getElementById('modify-pb-cleaning').textContent = Utils.formatCurrency(data.cleaningFee);
      document.getElementById('modify-pb-service').textContent  = Utils.formatCurrency(data.serviceFee);
      document.getElementById('modify-pb-total').textContent    = Utils.formatCurrency(data.totalAmount);
      document.getElementById('modify-price-preview').classList.remove('hidden');
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Preview new price';
    }
  },

  async submitModify() {
    const bookingId = document.getElementById('modify-booking-id').value;
    const checkIn   = document.getElementById('modify-checkin').value;
    const checkOut  = document.getElementById('modify-checkout').value;
    const guests    = parseInt(document.getElementById('modify-guests').value);

    if (!checkIn || !checkOut) { Utils.toast('Please select dates'); return; }

    const btn = document.getElementById('modify-submit-btn');
    btn.disabled    = true;
    btn.textContent = 'Saving...';

    try {
      await API.modifyBooking(parseInt(bookingId), { checkIn, checkOut, guests });
      Utils.hideModal('modify-modal');
      Utils.toast('Booking updated! ✅');
      await this.load();
    } catch (e) {
      Utils.toast('Error: ' + e.message);
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Confirm change';
    }
  },

  async submitReview() {
    try {
      await API.createReview({
        bookingId:     parseInt(document.getElementById('review-booking-id').value),
        cleanliness:   parseInt(document.getElementById('rv-cleanliness').value),
        communication: parseInt(document.getElementById('rv-communication').value),
        checkin:       parseInt(document.getElementById('rv-checkin').value),
        location:      parseInt(document.getElementById('rv-location').value),
        value:         parseInt(document.getElementById('rv-value').value),
        accuracy:      parseInt(document.getElementById('rv-accuracy').value),
        comment:       document.getElementById('rv-comment').value,
      });
      Utils.hideModal('review-modal');
      Utils.toast('Review submitted! ⭐');
      await this.load();
    } catch (e) { Utils.toast('Error: ' + e.message); }
  },
};

document.addEventListener('DOMContentLoaded', () => Trips.init());
