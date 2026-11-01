import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useToast } from '../../context/ToastContext';
import { initials, formatDate, relativeTime } from '../../utils/formatters';
import notificationService from '../../services/notificationService';
import SearchModal from '../search/SearchModal';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, isHost, isAdmin, logout, openAuthModal, becomeHost } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();
  const { unreadNotifCount, setUnreadNotifCount, refreshUnreadCount } = useWebSocket();
  const { showToast } = useToast();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const dropdownRef = useRef(null);
  const userBtnRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleHostClick = async () => {
    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }
    if (isHost) {
      navigate('/host');
    } else {
      if (window.confirm('Switch to hosting mode? You can list your property and start earning.')) {
        try {
          await becomeHost();
          showToast('Welcome to hosting! 🏠');
          navigate('/host');
        } catch (err) {
          showToast('Failed: ' + err.message);
        }
      }
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const data = await notificationService.getNotifications();
      const list = Array.isArray(data) ? data : data.content || [];
      setNotifications(list);
      // Auto mark read upon viewing panel
      await notificationService.markAllRead();
      setUnreadNotifCount(0);
    } catch {
      // Non-critical
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleOpenNotifPanel = (e) => {
    e.stopPropagation();
    setNotifPanelOpen(true);
    loadNotifications();
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllRead();
      setUnreadNotifCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read');
    } catch (err) {
      showToast(err.message || 'Failed to mark read');
    }
  };

  // Read query params from current search if on search page
  const searchParams = new URLSearchParams(location.search);
  const cityParam = searchParams.get('city') || 'Anywhere';
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-logo" id="nav-logo">
          stayfinder
        </Link>

        {/* Search Pill */}
        <div className="nav-search" id="nav-search-bar" onClick={() => setSearchModalOpen(true)}>
          <div className="ns-pill">
            <div className="ns-label">Where</div>
            <div className="ns-value" id="ns-city">
              {cityParam}
            </div>
          </div>
          <div className="ns-pill">
            <div className="ns-label">Check in</div>
            <div className="ns-value" id="ns-checkin">
              {checkInParam ? formatDate(checkInParam) : 'Add dates'}
            </div>
          </div>
          <div className="ns-pill">
            <div className="ns-label">Check out</div>
            <div className="ns-value" id="ns-checkout">
              {checkOutParam ? formatDate(checkOutParam) : 'Add dates'}
            </div>
          </div>
          <div className="ns-pill">
            <div className="ns-label">Who</div>
            <div className="ns-value" id="ns-guests">
              {guestsParam ? `${guestsParam} guests` : 'Add guests'}
            </div>
          </div>
          <button
            className="ns-btn"
            id="ns-search-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchModalOpen(true);
            }}
          >
            <svg viewBox="0 0 14 14">
              <circle cx="6" cy="6" r="4" />
              <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
            </svg>
          </button>
        </div>

        <div className="nav-right">
          <button className="nav-link" id="nav-host-btn" onClick={handleHostClick}>
            {isHost ? 'Host dashboard' : 'Airbnb your home'}
          </button>

          {!isLoggedIn && (
            <button
              className="nav-link"
              id="nav-login-btn"
              onClick={() => openAuthModal('login')}
            >
              Log in
            </button>
          )}

          <button
            id="dark-mode-btn"
            title="Toggle dark mode"
            onClick={toggleDarkMode}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User menu trigger */}
          <div
            className="nav-user"
            id="nav-user-btn"
            ref={userBtnRef}
            style={{ position: 'relative' }}
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <div className="nav-ham">☰</div>
            <div className="nav-avatar" id="nav-avatar">
              {user ? initials(user.fullName) : '👤'}
            </div>
            {unreadNotifCount > 0 && <div className="notif-dot" />}

            {/* Dropdown Menu */}
            <div
              className={`nav-dropdown ${dropdownOpen ? 'open' : ''}`}
              id="nav-dropdown"
              ref={dropdownRef}
              onClick={(e) => e.stopPropagation()}
            >
              {isLoggedIn ? (
                <>
                  {/* Logged in user header */}
                  <div className="nav-dropdown-user" id="nav-dropdown-user">
                    <div className="nav-dropdown-avatar" id="nav-dropdown-avatar">
                      {initials(user?.fullName)}
                    </div>
                    <div>
                      <div className="nav-dropdown-name" id="nav-dropdown-name">
                        {user?.fullName || 'Guest'}
                      </div>
                      <div className="nav-dropdown-email" id="nav-dropdown-email">
                        {user?.email || ''}
                      </div>
                    </div>
                  </div>

                  {/* Logged-in links */}
                  <div className="nav-dropdown-section" id="nav-dropdown-auth">
                    <button
                      className="nav-dropdown-item"
                      id="nav-dropdown-notifications"
                      onClick={handleOpenNotifPanel}
                    >
                      <span className="nav-dropdown-item-icon">🔔</span>
                      <span>Notifications</span>
                      {unreadNotifCount > 0 && (
                        <span className="nav-dropdown-notif-badge" id="nav-notif-badge">
                          {unreadNotifCount}
                        </span>
                      )}
                    </button>
                    <button
                      className="nav-dropdown-item"
                      id="nav-dropdown-trips"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/trips');
                      }}
                    >
                      <span className="nav-dropdown-item-icon">🧳</span> My trips
                    </button>
                    <button
                      className="nav-dropdown-item"
                      id="nav-dropdown-wishlist"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/wishlist');
                      }}
                    >
                      <span className="nav-dropdown-item-icon">❤️</span> Wishlists
                    </button>
                    <button
                      className="nav-dropdown-item"
                      id="nav-dropdown-host-link"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (isHost) navigate('/host');
                        else handleHostClick();
                      }}
                    >
                      <span className="nav-dropdown-item-icon">🏠</span> Host dashboard
                    </button>
                    {isAdmin && (
                      <button
                        className="nav-dropdown-item"
                        id="nav-dropdown-admin"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/admin');
                        }}
                      >
                        <span className="nav-dropdown-item-icon">⚙️</span> Admin Panel
                      </button>
                    )}
                    <button
                      className="nav-dropdown-item"
                      id="nav-dropdown-profile"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <span className="nav-dropdown-item-icon">👤</span> Profile
                    </button>
                  </div>

                  {/* Logout */}
                  <div id="nav-dropdown-logout-wrap">
                    <button
                      className="nav-dropdown-logout"
                      id="nav-logout"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                    >
                      <span className="nav-dropdown-logout-icon">👋</span> Log out
                    </button>
                  </div>

                  {/* Notification sub-panel inside dropdown */}
                  <div
                    className={`nav-notif-panel ${notifPanelOpen ? '' : 'hidden'}`}
                    id="nav-notif-panel"
                  >
                    <div className="nav-notif-panel-hdr">
                      <button
                        className="nav-notif-back"
                        id="nav-notif-back"
                        onClick={() => setNotifPanelOpen(false)}
                      >
                        ← Back
                      </button>
                      <span>Notifications</span>
                      <button
                        className="nav-notif-mark"
                        id="nav-notif-mark-read"
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div id="notif-list">
                      {loadingNotifs ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#717171', fontSize: '13px' }}>
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#717171', fontSize: '13px' }}>
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((n, i) => (
                          <div key={n.id || i} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-msg">{n.message}</div>
                            <div className="notif-time">{relativeTime(n.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Guest links */
                <div className="nav-dropdown-section" id="nav-dropdown-guest">
                  <button
                    className="nav-dropdown-item"
                    id="nav-dropdown-login"
                    onClick={() => {
                      setDropdownOpen(false);
                      openAuthModal('login');
                    }}
                  >
                    <span className="nav-dropdown-item-icon">🔑</span> Log in
                  </button>
                  <button
                    className="nav-dropdown-item"
                    id="nav-dropdown-signup"
                    onClick={() => {
                      setDropdownOpen(false);
                      openAuthModal('register');
                    }}
                  >
                    <span className="nav-dropdown-item-icon">✨</span> Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        initialValues={{
          city: cityParam !== 'Anywhere' ? cityParam : '',
          checkIn: checkInParam || '',
          checkOut: checkOutParam || '',
          guests: guestsParam || '',
        }}
      />
    </>
  );
}
