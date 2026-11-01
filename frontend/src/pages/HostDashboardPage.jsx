import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AddListingModal from '../components/host/AddListingModal';
import AIListingAuditModal from '../components/host/AIListingAuditModal';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, categoryIcon } from '../utils/formatters';
import { CATEGORY_COLORS } from '../utils/constants';
import hostService from '../services/hostService';

export default function HostDashboardPage() {
  const navigate = useNavigate();
  const { user, isHost } = useAuth();
  const { addNotificationListener } = useWebSocket();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookings' | 'listings' | 'earnings'
  const [addListingOpen, setAddListingOpen] = useState(false);
  const [auditProperty, setAuditProperty] = useState(null);

  // Overview stats
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [listingsCount, setListingsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [overviewBookings, setOverviewBookings] = useState([]);

  // Bookings tab
  const [bookings, setBookings] = useState([]);
  const [bookingsPage, setBookingsPage] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Listings tab
  const [listings, setListings] = useState([]);
  const [listingsPage, setListingsPage] = useState(0);
  const [listingsTotalPages, setListingsTotalPages] = useState(0);
  const [loadingListings, setLoadingListings] = useState(false);

  // Earnings tab
  const [earningsMonth, setEarningsMonth] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      const [bookingsData, listingsData] = await Promise.all([
        hostService.getHostBookings(0),
        hostService.getMyProperties(0),
      ]);

      const allBookings = bookingsData.content || [];
      const allListings = listingsData.content || [];
      const pending = allBookings.filter((b) => b.status === 'PENDING');
      const completed = allBookings.filter((b) => b.status === 'COMPLETED');
      const totalEarn = completed.reduce((s, b) => s + Number(b.totalAmount || 0), 0);

      const now = new Date();
      const thisMonthEarn = completed
        .filter((b) => {
          const d = new Date(b.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, b) => s + Number(b.totalAmount || 0), 0);

      setEarningsTotal(totalEarn);
      setEarningsMonth(thisMonthEarn);
      setCompletedCount(completed.length);
      setBookingsCount(bookingsData.totalElements || allBookings.length);
      setListingsCount(listingsData.totalElements || allListings.length);
      setPendingCount(pending.length);
      setOverviewBookings(allBookings.slice(0, 5));
    } catch (err) {
      console.error('Failed to load overview:', err);
    }
  }, []);

  // Load Bookings
  const loadBookings = useCallback(
    async (p = 0) => {
      setLoadingBookings(true);
      try {
        const data = await hostService.getHostBookings(p);
        setBookings(data.content || []);
        setBookingsTotalPages(data.totalPages || 0);
        setBookingsPage(p);
      } catch (err) {
        showToast('Failed to load bookings');
      } finally {
        setLoadingBookings(false);
      }
    },
    [showToast]
  );

  // Load Listings
  const loadListings = useCallback(
    async (p = 0) => {
      setLoadingListings(true);
      try {
        const data = await hostService.getMyProperties(p);
        setListings(data.content || []);
        setListingsTotalPages(data.totalPages || 0);
        setListingsPage(p);
      } catch (err) {
        showToast('Failed to load listings');
      } finally {
        setLoadingListings(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings(0);
    if (activeTab === 'listings') loadListings(0);
    if (activeTab === 'earnings' || activeTab === 'overview') loadOverview();
  }, [activeTab, loadBookings, loadListings, loadOverview]);

  // Real-time booking request notification listener
  useEffect(() => {
    const unsubscribe = addNotificationListener((notif) => {
      if (notif.type === 'BOOKING_REQUEST') {
        setPendingCount((prev) => prev + 1);
        showToast('New booking request! 📩');
        loadOverview();
        if (activeTab === 'bookings') loadBookings(bookingsPage);
      }
    });
    return unsubscribe;
  }, [addNotificationListener, showToast, loadOverview, activeTab, bookingsPage, loadBookings]);

  const handleApprove = async (bookingId) => {
    try {
      await hostService.confirmBooking(bookingId);
      showToast('Booking approved! ✅');
      setPendingCount((prev) => Math.max(0, prev - 1));
      loadOverview();
      if (activeTab === 'bookings') loadBookings(bookingsPage);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleDecline = async (bookingId) => {
    if (!window.confirm('Decline this booking request?')) return;
    try {
      await hostService.rejectBooking(bookingId);
      showToast('Booking declined');
      setPendingCount((prev) => Math.max(0, prev - 1));
      loadOverview();
      if (activeTab === 'bookings') loadBookings(bookingsPage);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const renderBookingRows = (list, isOverview = false) => {
    if (!list.length) {
      return (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <div className="empty-state-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>Bookings will appear here once guests reserve your property.</p>
        </div>
      );
    }

    return (
      <div className="booking-list">
        {list.map((b) => (
          <div key={b.id} className="booking-row" id={`bk-${b.id}`}>
            <div className="booking-row-img" style={{ background: '#E2D5C3' }}>
              {b.property?.primaryImage || b.property?.images?.[0] ? (
                <img
                  src={b.property.primaryImage || b.property.images[0]}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '24px' }}>🏠</span>
              )}
            </div>

            <div className="booking-row-meta">
              <div className="booking-row-guest" style={{ fontWeight: 600 }}>
                {b.guest?.fullName || 'Guest'}
              </div>
              <div className="booking-row-prop" style={{ color: 'var(--text-2)' }}>
                {b.property?.title}
              </div>
              <div className="booking-row-dates" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} night
                {b.nights > 1 ? 's' : ''} · {b.guests} guest{b.guests > 1 ? 's' : ''}
              </div>
            </div>

            <div className="booking-row-price" style={{ fontWeight: 700 }}>
              {formatCurrency(b.totalAmount)}
            </div>

            {b.status === 'PENDING' ? (
              <div className="booking-row-btns" style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="booking-row-btn approve"
                  onClick={() => handleApprove(b.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="booking-row-btn decline"
                  onClick={() => handleDecline(b.id)}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="booking-row-btn"
                  onClick={() => navigate(`/chat/${b.id}`)}
                  title="Chat with guest"
                  style={{ background: 'none', border: '1px solid var(--border)' }}
                >
                  💬
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className={`badge ${
                    b.status === 'CONFIRMED'
                      ? 'badge-success'
                      : b.status === 'CANCELLED' || b.status === 'REJECTED'
                      ? 'badge-danger'
                      : 'badge-gray'
                  }`}
                >
                  {b.status}
                </span>
                {b.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${b.id}`)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                    title="Chat with guest"
                  >
                    💬
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />

      <main className="host-layout">
        {/* Sidebar Nav */}
        <aside className="host-sidebar">
          <div className="host-sidebar-title" style={{ padding: '0 24px 16px', fontWeight: 700, fontSize: '18px' }}>
            Host Dashboard
          </div>
          <div
            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="sidebar-nav-icon">📊</span> Overview
          </div>
          <div
            className={`sidebar-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span className="sidebar-nav-icon">📅</span> Bookings
          </div>
          <div
            className={`sidebar-nav-item ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <span className="sidebar-nav-icon">🏠</span> Listings
          </div>
          <div
            className={`sidebar-nav-item ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            <span className="sidebar-nav-icon">💰</span> Earnings
          </div>

          <div style={{ padding: '24px 16px' }}>
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => setAddListingOpen(true)}
            >
              + Add Property
            </button>
          </div>
        </aside>

        {/* Content area */}
        <div className="host-main">
          {/* Overview Section */}
          {activeTab === 'overview' && (
            <div className="host-section-page" id="section-overview">
              <h2 className="host-welcome">Welcome back, {user?.fullName || 'Host'}!</h2>
              <p className="host-welcome-sub">Here is what is happening with your listings today.</p>

              {/* Stats Row */}
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-card-lbl">Total Earnings</div>
                  <div className="stat-card-val green" id="stat-earnings">
                    {formatCurrency(earningsTotal)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-lbl">Total Bookings</div>
                  <div className="stat-card-val" id="stat-bookings">
                    {bookingsCount}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-lbl">Your Listings</div>
                  <div className="stat-card-val" id="stat-listings">
                    {listingsCount}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-lbl">Pending Requests</div>
                  <div
                    className={`stat-card-val ${pendingCount > 0 ? 'red' : ''}`}
                    id="stat-pending"
                  >
                    {pendingCount}
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="host-section">
                <div className="host-section-hdr">
                  <h3>Recent Booking Activity</h3>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setActiveTab('bookings')}
                  >
                    View all
                  </button>
                </div>

                {renderBookingRows(overviewBookings, true)}
              </div>
            </div>
          )}

          {/* Bookings Section */}
          {activeTab === 'bookings' && (
            <div className="host-section-page" id="section-bookings">
              <div className="host-section-hdr" style={{ marginBottom: '24px' }}>
                <h2 className="host-welcome" style={{ margin: 0 }}>Reservation Requests & Bookings</h2>
              </div>
              {loadingBookings ? (
                <p className="text-muted" style={{ padding: '24px 0' }}>Loading bookings...</p>
              ) : (
                renderBookingRows(bookings, false)
              )}

              {/* Pagination */}
              {bookingsTotalPages > 1 && (
                <div
                  className="pagination-bar"
                  style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}
                >
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={bookingsPage === 0}
                    onClick={() => loadBookings(bookingsPage - 1)}
                  >
                    ← Previous
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '13px' }}>
                    Page {bookingsPage + 1} of {bookingsTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={bookingsPage >= bookingsTotalPages - 1}
                    onClick={() => loadBookings(bookingsPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Listings Section */}
          {activeTab === 'listings' && (
            <div className="host-section-page" id="section-listings">
              <div className="host-section-hdr" style={{ marginBottom: '24px' }}>
                <h2 className="host-welcome" style={{ margin: 0 }}>Your Properties ({listingsCount})</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setAddListingOpen(true)}
                >
                  + Add Property
                </button>
              </div>

              {loadingListings ? (
                <p className="text-muted" style={{ padding: '24px 0' }}>Loading listings...</p>
              ) : listings.length === 0 ? (
                <div className="empty-state" style={{ padding: '60px 0' }}>
                  <div className="empty-state-icon">🏠</div>
                  <h3>No listings yet</h3>
                  <p>Start by adding your first property to StayFinder.</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '16px' }}
                    onClick={() => setAddListingOpen(true)}
                  >
                    Add your property
                  </button>
                </div>
              ) : (
                <div className="listing-grid" id="listings-grid">
                  {listings.map((p) => {
                    const bg = CATEGORY_COLORS[p.category] || '#E2D5C3';
                    return (
                      <div
                        key={p.id}
                        className="listing-card"
                        onClick={() => navigate(`/properties/${p.id}`)}
                      >
                        <div className="listing-card-img" style={{ background: bg }}>
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.title}
                            />
                          ) : (
                            <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                              {categoryIcon(p.category)}
                            </span>
                          )}
                        </div>

                        <div className="listing-card-body">
                          <div className="listing-card-name">
                            {p.title}
                          </div>
                          <div className="listing-card-meta">
                            {formatCurrency(p.pricePerNight)} / night
                            {p.avgRating > 0 ? ` · ★ ${Number(p.avgRating).toFixed(2)}` : ''}
                            {p.totalReviews ? ` · ${p.totalReviews} reviews` : ''}
                          </div>
                          <div className="listing-card-tags">
                            <span
                              className={`badge ${
                                p.status === 'APPROVED'
                                  ? 'badge-success'
                                  : p.status === 'PENDING'
                                  ? 'badge-warning'
                                  : 'badge-danger'
                              }`}
                            >
                              {p.status}
                            </span>
                            {p.instantBook && <span className="badge badge-gray">Instant book</span>}
                          </div>

                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{
                                flex: 1,
                                fontSize: '12px',
                                padding: '6px 10px',
                                border: '1px solid #6366F1',
                                color: '#4F46E5',
                                background: 'rgba(99, 102, 241, 0.08)',
                                borderRadius: '8px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAuditProperty(p);
                              }}
                            >
                              ✨ AI Audit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {listingsTotalPages > 1 && (
                <div
                  className="pagination-bar"
                  style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}
                >
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={listingsPage === 0}
                    onClick={() => loadListings(listingsPage - 1)}
                  >
                    ← Previous
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '13px' }}>
                    Page {listingsPage + 1} of {listingsTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={listingsPage >= listingsTotalPages - 1}
                    onClick={() => loadListings(listingsPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Earnings Section */}
          {activeTab === 'earnings' && (
            <div className="host-section-page" id="section-earnings">
              <div className="host-section-hdr" style={{ marginBottom: '24px' }}>
                <h2 className="host-welcome" style={{ margin: 0 }}>Earnings & Payout Overview</h2>
              </div>

              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-card-lbl">Lifetime Earnings</div>
                  <div className="stat-card-val green" id="earn-total">
                    {formatCurrency(earningsTotal)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-lbl">This Month</div>
                  <div className="stat-card-val" id="earn-month">
                    {formatCurrency(earningsMonth)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-lbl">Completed Bookings</div>
                  <div className="stat-card-val" id="earn-bookings">
                    {completedCount}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={addListingOpen}
        onClose={() => setAddListingOpen(false)}
        onSuccess={() => {
          loadOverview();
          loadListings(0);
        }}
      />

      {/* AI Listing Audit Modal */}
      <AIListingAuditModal
        isOpen={!!auditProperty}
        property={auditProperty}
        onClose={() => setAuditProperty(null)}
      />

      <Footer />
    </>
  );
}
