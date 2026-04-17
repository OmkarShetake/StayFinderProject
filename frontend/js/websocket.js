/* ── StayFinder WebSocket / Notifications ──────────────────────── */
'use strict';

const WS = {
  client: null,
  connected: false,
  _handlers: [],

  /* Connect to STOMP WebSocket */
  connect() {
    if (!Auth.isLoggedIn() || this.connected) return;

    const token = Auth.getToken();
    const socket = new SockJS('/ws');
    this.client = Stomp.over(socket);
    this.client.debug = null; // silence STOMP logs

    this.client.connect(
      { Authorization: 'Bearer ' + token },
      () => {
        this.connected = true;
        const user = Auth.getUser();
        if (!user) return;

        // Subscribe to personal notification queue
        this.client.subscribe(
          `/user/${user.id}/queue/notifications`,
          (msg) => {
            try {
              const notif = JSON.parse(msg.body);
              this._onNotification(notif);
            } catch {}
          }
        );
        console.log('WS connected for user', user.id);
      },
      (err) => {
        this.connected = false;
        console.warn('WS connection failed:', err);
        // Retry after 5s
        setTimeout(() => this.connect(), 5000);
      }
    );
  },

  /* Disconnect */
  disconnect() {
    if (this.client && this.connected) {
      this.client.disconnect();
      this.connected = false;
    }
  },

  /* Register handler */
  onNotification(fn) {
    this._handlers.push(fn);
  },

  /* Internal: dispatch notification */
  _onNotification(notif) {
    // Update unread badge
    WS.incrementUnreadBadge();
    // Show toast
    Utils.toast(notif.title);
    // Call all registered handlers
    this._handlers.forEach(fn => fn(notif));
  },

  /* Increment unread badge in navbar */
  incrementUnreadBadge() {
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.classList.remove('hidden');
  },

  /* Load unread count from API on page load */
  async loadUnreadCount() {
    if (!Auth.isLoggedIn()) return;
    try {
      const data = await API.getUnreadCount();
      const dot = document.querySelector('.notif-dot');
      if (dot && data.count > 0) dot.classList.remove('hidden');
      else if (dot) dot.classList.add('hidden');
    } catch {}
  },
};

window.WS = WS;
