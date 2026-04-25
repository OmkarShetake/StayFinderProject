/* ── StayFinder API Client ─────────────────────────────────────── */
'use strict';

const API = {
    /* ── Base URL ────────────────────────────────────────────────── */
    // localhost → hit backend directly
    // Railway production → use backend Railway URL
    BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? ((['3000','80','443',''].includes(window.location.port))
            ? '/api/v1'
            : 'http://localhost:8080/api/v1')
        : 'https://stayfinder-backend-5en8.onrender.com/api/v1',

    /* Build headers */
    _headers(auth = true) {
        const h = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = Auth.getToken();
            if (token) h['Authorization'] = 'Bearer ' + token;
        }
        return h;
    },

    /* Generic request — auto-refreshes token on 401 */
    async _req(method, path, body = null, auth = true) {
        const opts = { method, headers: this._headers(auth) };
        if (body) opts.body = JSON.stringify(body);
        Utils.progressStart?.();
        let res = await fetch(this.BASE + path, opts);

        // If unauthorized and we have a refresh token, try refreshing once
        if (res.status === 401 && auth && Auth.getRefresh()) {
            const refreshed = await Auth.refreshToken();
            if (refreshed) {
                opts.headers = this._headers(auth);
                res = await fetch(this.BASE + path, opts);
            } else {
                Auth.clear();
                window.location.href = '/?login=1';
                Utils.progressDone?.();
                return;
            }
        }

        const data = await res.json().catch(() => ({}));
        Utils.progressDone?.();
        if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
        return data;
    },

    /* ── Auth ───────────────────────────────────────────────────── */
    register: (body)  => API._req('POST', '/auth/register', body, false),
    login:    (body)  => API._req('POST', '/auth/login', body, false),
    refresh:  (body)  => API._req('POST', '/auth/refresh', body, false),
    me:       ()      => API._req('GET',  '/auth/me'),
    becomeHost: ()    => API._req('POST', '/auth/become-host'),
    updateProfile: (body) => API._req('PATCH', '/auth/profile', body),
    forgotPassword: (body) => API._req('POST', '/auth/forgot-password', {
        ...body,
        frontendUrl: window.location.origin
    }, false),
    resetPassword:  (body) => API._req('POST', '/auth/reset-password', body, false),

    /* ── Properties ─────────────────────────────────────────────── */
    searchProperties: (params) =>
        API._req('GET', `/properties/search?${Utils.buildQuery(params)}`, null, false),
    getProperty: (id) =>
        API._req('GET', `/properties/${id}`, null, false),
    getAvailability: (id, from, to) =>
        API._req('GET', `/properties/${id}/availability?from=${from}&to=${to}`, null, false),
    createProperty: (body)   => API._req('POST', '/host/properties', body),
    getMyProperties: (p = 0) => API._req('GET', `/host/properties?page=${p}`),
    updateAvailability: (id, body) => API._req('PUT', `/host/properties/${id}/availability`, body),

    /* ── Wishlist ───────────────────────────────────────────────── */
    toggleWishlist: (propertyId) => API._req('POST', `/wishlists/${propertyId}`),
    getWishlist: ()              => API._req('GET', '/wishlists'),

    /* ── Bookings ───────────────────────────────────────────────── */
    createBooking:   (body) => API._req('POST', '/bookings', body),
    getMyBookings:   (p = 0) => API._req('GET', `/bookings?page=${p}`),
    getBooking:      (id)   => API._req('GET', `/bookings/${id}`),
    cancelBooking:   (id)   => API._req('PATCH', `/bookings/${id}/cancel`),
    modifyBooking:   (id, body) => API._req('PATCH', `/bookings/${id}/modify`, body),
    pricePreview:    (body) => API._req('POST', '/bookings/price-preview', body),
    getHostBookings: (p = 0) => API._req('GET', `/host/bookings?page=${p}`),
    confirmBooking:  (id)   => API._req('PATCH', `/host/bookings/${id}/confirm`),
    rejectBooking:   (id)   => API._req('PATCH', `/host/bookings/${id}/reject`),

    /* ── Reviews ────────────────────────────────────────────────── */
    createReview:    (body) => API._req('POST', '/reviews', body),
    getReviews:      (id, p = 0) => API._req('GET', `/reviews/property/${id}?page=${p}`, null, false),
    getRatingSummary:(id)   => API._req('GET', `/reviews/property/${id}/summary`, null, false),

    /* ── Notifications ──────────────────────────────────────────── */
    getNotifications:   () => API._req('GET', '/notifications'),
    getUnreadCount:     () => API._req('GET', '/notifications/unread/count'),
    markAllRead:        () => API._req('PATCH', '/notifications/mark-all-read'),

    /* ── Messages ───────────────────────────────────────────────── */
    sendMessage:      (body)       => API._req('POST', '/messages', body),
    getMessages:      (bookingId)  => API._req('GET', `/messages/booking/${bookingId}`),
    getUnreadMessages:()           => API._req('GET', '/messages/unread/count'),

    /* ── Admin ──────────────────────────────────────────────────── */
    adminGetProperties:   (status = 'PENDING', p = 0) =>
        API._req('GET', `/admin/properties?status=${status}&page=${p}`),
    adminApproveProperty: (id) => API._req('PATCH', `/admin/properties/${id}/approve`),
    adminRejectProperty:  (id) => API._req('PATCH', `/admin/properties/${id}/reject`),
    adminDeleteProperty:  (id) => API._req('DELETE', `/admin/properties/${id}`),
    adminGetBookings:     (p = 0) => API._req('GET', `/admin/bookings?page=${p}`),
};

window.API = API;