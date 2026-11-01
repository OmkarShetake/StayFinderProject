import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ModifyBookingModal from '../components/booking/ModifyBookingModal';
import ReviewModal from '../components/booking/ReviewModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import bookingService from '../services/bookingService';

export default function TripsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [allBookings, setAllBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedModifyBooking, setSelectedModifyBooking] = useState(null);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);

  const [selectedReviewBookingId, setSelectedReviewBookingId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookings(0);
      setAllBookings(data.content || []);
    } catch (err) {
      showToast('Failed to load trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingService.cancelBooking(id);
      showToast('Booking cancelled');
      loadBookings();
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const filteredBookings =
    filterStatus === 'all'
      ? allBookings
      : allBookings.filter((b) => {
          if (filterStatus === 'CANCELLED') {
            return b.status === 'CANCELLED' || b.status === 'REJECTED';
          }
          return b.status === filterStatus;
        });

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: '1120px', margin: '40px auto', padding: '0 24px', minHeight: '60vh' }}>
        <h1 style={{ marginBottom: '24px' }}>My Trips</h1>

        {/* Filter Tabs */}
        <div className="trips-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All trips' },
            { key: 'CONFIRMED', label: 'Confirmed' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-btn ${filterStatus === tab.key ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trips List */}
        {loading ? (
          <p className="text-muted">Loading your trips...</p>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="empty-state-icon">🧳</div>
            <h3>No trips found</h3>
            <p>When you book a stay, it will appear here.</p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/')}
            >
              Start exploring
            </button>
          </div>
        ) : (
          <div className="trips-list" id="trips-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredBookings.map((b) => (
              <div key={b.id} className="trip-card">
                <div
                  className="trip-img"
                  style={{
                    width: '180px',
                    height: '140px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#E2D5C3',
                    flexShrink: 0,
                  }}
                >
                  {b.property?.primaryImage || b.property?.images?.[0] ? (
                    <img
                      src={b.property.primaryImage || b.property.images[0]}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '48px', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      🏠
                    </span>
                  )}
                </div>

                <div className="trip-info" style={{ flex: 1 }}>
                  <div className="trip-title" style={{ fontSize: '18px', fontWeight: 600 }}>
                    {b.property?.title || 'Property'}
                  </div>
                  <div className="trip-loc" style={{ color: 'var(--text-2)', fontSize: '13px', margin: '4px 0 8px' }}>
                    {b.property?.city || ''}
                  </div>
                  <div className="trip-dates" style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>
                    {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} night
                    {b.nights > 1 ? 's' : ''} · {b.guests} guest{b.guests > 1 ? 's' : ''}
                  </div>
                  <div className="trip-price" style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>
                    {formatCurrency(b.totalAmount)}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      className={`badge ${
                        b.status === 'CONFIRMED'
                          ? 'badge-success'
                          : b.status === 'PENDING'
                          ? 'badge-warning'
                          : b.status === 'COMPLETED'
                          ? 'badge-gray'
                          : 'badge-danger'
                      }`}
                    >
                      {b.status}
                    </span>

                    {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCancel(b.id)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedModifyBooking(b);
                            setModifyModalOpen(true);
                          }}
                        >
                          Change dates
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/chat/${b.id}`)}
                        >
                          💬 Message host
                        </button>
                      </>
                    )}

                    {b.canReview && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSelectedReviewBookingId(b.id);
                          setReviewModalOpen(true);
                        }}
                      >
                        Write review
                      </button>
                    )}
                  </div>

                  <div className="trip-ref" style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
                    Ref: {b.referenceId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modify Dates Modal */}
      <ModifyBookingModal
        isOpen={modifyModalOpen}
        booking={selectedModifyBooking}
        onClose={() => {
          setModifyModalOpen(false);
          setSelectedModifyBooking(null);
        }}
        onSuccess={loadBookings}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        bookingId={selectedReviewBookingId}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedReviewBookingId(null);
        }}
        onSuccess={loadBookings}
      />

      <Footer />
    </>
  );
}
