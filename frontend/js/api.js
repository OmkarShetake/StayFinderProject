/* ── StayFinder API Client ─────────────────────────────────────── */
'use strict';

const API = {

  /* ── Base URL Logic ─────────────────────────────────────────── */
  // If served via nginx (port 3000/80/443) → use relative path
  // Otherwise → call backend directly

  BASE: (['3000', '80', '443', ''].includes(window.location.port))
      ? '/api/v1'
      : 'http://localhost:8080/api/v1',


  /* ── Build Headers ─────────────────────────────────────────── */
  _headers(auth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (auth) {
      const token = Auth.getToken();
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
    }

    return headers;
  },


  /* ── Generic Request Handler ───────────────────────────────── */
  // Handles fetch + token refresh automatically

  async _req(method, path, body = null, auth = true) {

    const options = {
      method,
      headers: this._headers(auth)
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response = await fetch(this.BASE + path, options);


    /* ── Auto Token Refresh on 401 ───────────────────────────── */

    if (response.status === 401 && auth && Auth.getRefresh()) {

      const refreshed = await Auth.refreshToken();

      if (refreshed) {

        // Retry request with new token
        options.headers = this._headers(auth);

        response = await fetch(
            this.BASE + path,
            options
        );

      } else {

        // Refresh failed → Logout
        Auth.clear();

        window.location.href = '/?login=1';

        return;
      }
    }


    /* ── Handle Response ───────────────────────────────────── */

    const data =
        await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
          data.message ||
          `Request failed (${response.status})`
      );
    }

    return data;
  },


  /* ── Auth APIs ───────────────────────────────────────────── */

  register: (body) =>
      API._req('POST', '/auth/register', body, false),

  login: (body) =>
      API._req('POST', '/auth/login', body, false),

  refresh: (body) =>
      API._req('POST', '/auth/refresh', body, false),

  me: () =>
      API._req('GET', '/auth/me'),

  becomeHost: () =>
      API._req('POST', '/auth/become-host'),



  /* ── Property APIs ───────────────────────────────────────── */

  searchProperties: (params) =>
      API._req(
          'GET',
          `/properties/search?${Utils.buildQuery(params)}`,
          null,
          false
      ),

  getProperty: (id) =>
      API._req(
          'GET',
          `/properties/${id}`,
          null,
          false
      ),

  getAvailability: (id, from, to) =>
      API._req(
          'GET',
          `/properties/${id}/availability?from=${from}&to=${to}`,
          null,
          false
      ),

  createProperty: (body) =>
      API._req(
          'POST',
          '/host/properties',
          body
      ),

  getMyProperties: (page = 0) =>
      API._req(
          'GET',
          `/host/properties?page=${page}`
      ),

  updateAvailability: (id, body) =>
      API._req(
          'PUT',
          `/host/properties/${id}/availability`,
          body
      ),



  /* ── Wishlist APIs ───────────────────────────────────────── */

  toggleWishlist: (propertyId) =>
      API._req(
          'POST',
          `/wishlists/${propertyId}`
      ),

  getWishlist: () =>
      API._req(
          'GET',
          '/wishlists'
      ),



  /* ── Booking APIs ───────────────────────────────────────── */

  createBooking: (body) =>
      API._req(
          'POST',
          '/bookings',
          body
      ),

  getMyBookings: (page = 0) =>
      API._req(
          'GET',
          `/bookings?page=${page}`
      ),

  getBooking: (id) =>
      API._req(
          'GET',
          `/bookings/${id}`
      ),

  cancelBooking: (id) =>
      API._req(
          'PATCH',
          `/bookings/${id}/cancel`
      ),

  pricePreview: (body) =>
      API._req(
          'POST',
          '/bookings/price-preview',
          body
      ),

  getHostBookings: (page = 0) =>
      API._req(
          'GET',
          `/host/bookings?page=${page}`
      ),

  confirmBooking: (id) =>
      API._req(
          'PATCH',
          `/host/bookings/${id}/confirm`
      ),

  rejectBooking: (id) =>
      API._req(
          'PATCH',
          `/host/bookings/${id}/reject`
      ),



  /* ── Review APIs ───────────────────────────────────────── */

  createReview: (body) =>
      API._req(
          'POST',
          '/reviews',
          body
      ),

  getReviews: (id, page = 0) =>
      API._req(
          'GET',
          `/reviews/property/${id}?page=${page}`,
          null,
          false
      ),

  getRatingSummary: (id) =>
      API._req(
          'GET',
          `/reviews/property/${id}/summary`,
          null,
          false
      ),



  /* ── Notification APIs ─────────────────────────────────── */

  getNotifications: () =>
      API._req(
          'GET',
          '/notifications'
      ),

  getUnreadCount: () =>
      API._req(
          'GET',
          '/notifications/unread/count'
      ),

  markAllRead: () =>
      API._req(
          'PATCH',
          '/notifications/mark-all-read'
      ),



  /* ── Admin APIs ───────────────────────────────────────── */

  adminGetProperties:
      (status = 'PENDING', page = 0) =>
          API._req(
              'GET',
              `/admin/properties?status=${status}&page=${page}`
          ),

  adminApproveProperty: (id) =>
      API._req(
          'PATCH',
          `/admin/properties/${id}/approve`
      ),

  adminRejectProperty: (id) =>
      API._req(
          'PATCH',
          `/admin/properties/${id}/reject`
      ),

  adminDeleteProperty: (id) =>
      API._req(
          'DELETE',
          `/admin/properties/${id}`
      ),

  adminGetBookings: (page = 0) =>
      API._req(
          'GET',
          `/admin/bookings?page=${page}`
      )

};


/* ── Make API globally available ───────────────────────────── */

window.API = API;