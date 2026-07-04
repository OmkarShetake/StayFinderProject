function _rootPath() {
  const path = window.location.pathname;
  const idx  = path.indexOf('/frontend/');
  if (idx !== -1) return path.substring(0, idx + '/frontend/'.length);
  if (path.includes('/pages/')) return path.substring(0, path.indexOf('/pages/') + 1);
  return '/';
}

const Chat = {
  bookingId: null,
  currentUserId: null,
  messages: [],

  async init() {
    if (!Auth.require()) return;
    Auth.renderNavUser();

    const params = new URLSearchParams(window.location.search);
    this.bookingId = params.get('bookingId');
    if (!this.bookingId) { window.location.href = _rootPath() + 'pages/trips.html'; return; }

    this.currentUserId = Auth.getUser()?.id;

    document.getElementById('nav-logo').addEventListener('click', () => {
      window.location.href = _rootPath() + 'index.html';
    });
    document.getElementById('chat-back').addEventListener('click', () => history.back());

    document.getElementById('chat-send-btn').addEventListener('click', () => this.send());

    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });

    document.getElementById('chat-input').addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    await this.loadMessages();

    WS.connect();
    WS.onNotification(n => {
      if (n.bookingId == this.bookingId) this.loadMessages();
    });

    if (WS.client && WS.connected) {
      WS.client.subscribe(`/user/${this.currentUserId}/queue/messages`, msg => {
        try {
          const m = JSON.parse(msg.body);
          if (m.bookingId == this.bookingId) this.loadMessages();
        } catch {}
      });
    }
  },

  async loadMessages() {
    try {
      const msgs = await API.getMessages(this.bookingId);
      this.messages = msgs;
      this.renderMessages();

      const titleEl = document.getElementById('chat-title');
      const other = msgs.find(m => m.senderId != this.currentUserId);
      if (other) {
        titleEl.textContent = other.senderName;
      } else if (msgs.length > 0) {
        titleEl.textContent = msgs[0].receiverName || 'Your host';
      } else {
        titleEl.textContent = 'New conversation';
      }
      document.getElementById('chat-subtitle').textContent = `Booking #${this.bookingId}`;
    } catch (e) {
      document.getElementById('chat-messages').innerHTML =
        '<div class="chat-empty">Could not load messages.</div>';
    }
  },

  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!this.messages.length) {
      container.innerHTML = '<div class="chat-empty">No messages yet. Say hello! 👋</div>';
      return;
    }

    container.innerHTML = this.messages.map(m => {
      const isMine = m.senderId == this.currentUserId;
      const time   = new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="chat-msg ${isMine ? 'mine' : 'theirs'}">
          ${!isMine ? `<div class="chat-sender">${Utils.esc(m.senderName)}</div>` : ''}
          <div class="chat-bubble">${Utils.esc(m.content)}</div>
          <div class="chat-time">${time}</div>
        </div>`;
    }).join('');

    container.scrollTop = container.scrollHeight;
  },

  async send() {
    const input   = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;

    const btn = document.getElementById('chat-send-btn');
    btn.disabled = true;

    try {
      await API.sendMessage({ bookingId: parseInt(this.bookingId), content });
      input.value = '';
      input.style.height = 'auto';
      await this.loadMessages();
    } catch (e) {
      Utils.toast('Failed to send: ' + e.message);
    } finally {
      btn.disabled = false;
      input.focus();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Chat.init());
