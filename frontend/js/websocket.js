/* ── StayFinder WebSocket Client ───────────────────────────────── */
'use strict';

const WS = {

  client:       null,
  connected:    false,
  _notifHandler: null,

  /* ── Resolve WebSocket backend URL ──────────────────────────── */
  _wsUrl() {
    const isLocal = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    if (isLocal) {
      // SockJS requires http:// not ws://
      return 'http://localhost:8080/ws';
    }

    // SockJS requires https:// not wss://
    return 'https://stayfinder-backend-5en8.onrender.com/ws';
  },

  /* ── Connect ─────────────────────────────────────────────────── */
  connect() {
    if (this.connected || !Auth.isLoggedIn()) return;

    try {
      const socket = new SockJS(this._wsUrl());
      this.client  = Stomp.over(socket);

      // Suppress STOMP console logs
      this.client.debug = () => {};

      this.client.connect(
          { Authorization: 'Bearer ' + Auth.getToken() },
          () => {
            this.connected = true;
            const userId   = Auth.getUser()?.id;
            if (!userId) return;

            // Subscribe to personal notification queue
            this.client.subscribe(
                `/user/${userId}/queue/notifications`,
                msg => {
                  try {
                    const notification = JSON.parse(msg.body);
                    this._handleNotification(notification);
                  } catch (e) {
                    console.warn('WS notification parse error:', e.message);
                  }
                }
            );
          },
          err => {
            this.connected = false;
            console.warn('WebSocket connection failed:', err);
          }
      );
    } catch (e) {
      console.warn('WebSocket init failed:', e.message);
    }
  },

  /* ── Disconnect ──────────────────────────────────────────────── */
  disconnect() {
    if (this.client && this.connected) {
      this.client.disconnect();
      this.connected = false;
    }
  },

  /* ── Handle incoming notification ───────────────────────────── */
  _handleNotification(notification) {
    // Update unread dot
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.classList.remove('hidden');

    // Call custom handler if registered
    if (typeof this._notifHandler === 'function') {
      this._notifHandler(notification);
    }

    // Show toast for important notifications
    if (notification.title) {
      Utils.toast('🔔 ' + notification.title);
    }
  },

  /* ── Register notification handler ──────────────────────────── */
  onNotification(fn) {
    this._notifHandler = fn;
  },

  /* ── Load unread count on page load ─────────────────────────── */
  async loadUnreadCount() {
    if (!Auth.isLoggedIn()) return;
    try {
      const data  = await API.getUnreadCount();
      const count = data.count || data || 0;
      const dot   = document.querySelector('.notif-dot');
      if (dot && count > 0) dot.classList.remove('hidden');
    } catch (e) {
      console.warn('Could not load unread count:', e.message);
    }
  },

};

window.WS = WS;