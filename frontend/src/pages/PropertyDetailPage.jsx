import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AuthModal from '../components/auth/AuthModal';
import Lightbox from '../components/property/Lightbox';
import AvailabilityCalendar from '../components/property/AvailabilityCalendar';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import {
  formatCurrency,
  formatDate,
  formatDateFull,
  propertyTypeLabel,
  initials,
  amenityIcon,
} from '../utils/formatters';
import propertyService from '../services/propertyService';
import bookingService from '../services/bookingService';
import reviewService from '../services/reviewService';
import wishlistService from '../services/wishlistService';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Booking & Dates
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);
  const [bookedDates, setBookedDates] = useState(new Set());
  const [pricePreview, setPricePreview] = useState(null);
  const [reserving, setReserving] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Load property details
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    propertyService
      .getProperty(id)
      .then((data) => {
        if (!mounted) return;
        setProperty(data);
        setIsSaved(!!data.wishlisted);
        document.title = `${data.title} — StayFinder`;
      })
      .catch((err) => {
        console.error('Failed to load property:', err);
        showToast('Failed to load property');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, showToast]);

  // Load 3-month availability
  useEffect(() => {
    if (!id) return;
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

    propertyService
      .getAvailability(id, from, to)
      .then((data) => {
        const booked = new Set(data.filter((a) => !a.available).map((a) => a.date));
        setBookedDates(booked);
      })
      .catch(() => {});
  }, [id]);

  // Load reviews & summary
  useEffect(() => {
    if (!id) return;
    Promise.all([reviewService.getReviews(id), reviewService.getRatingSummary(id)])
      .then(([revData, sumData]) => {
        setReviews(revData.content || []);
        setRatingSummary(sumData);
      })
      .catch(() => {});
  }, [id]);

  // Load price preview when dates change
  useEffect(() => {
    if (!checkIn || !checkOut || !id) {
      setPricePreview(null);
      return;
    }

    bookingService
      .pricePreview({
        propertyId: parseInt(id),
        checkIn,
        checkOut,
        guests,
      })
      .then((data) => {
        setPricePreview(data);
      })
      .catch(() => {
        setPricePreview(null);
      });
  }, [checkIn, checkOut, guests, id]);

  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      await wishlistService.toggleWishlist(id);
      showToast(nextSaved ? 'Saved to wishlist ❤️' : 'Removed from wishlist 🤍');
    } catch (err) {
      setIsSaved(!nextSaved);
      showToast('Error: ' + err.message);
    }
  };

  const handleReserve = async () => {
    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }
    if (!checkIn || !checkOut) {
      showToast('Please select your dates');
      return;
    }

    setReserving(true);
    try {
      const booking = await bookingService.createBooking({
        propertyId: parseInt(id),
        checkIn,
        checkOut,
        guests,
      });
      showToast(`Booking confirmed! Ref: ${booking.referenceId}`);
      setTimeout(() => {
        navigate('/trips');
      }, 1500);
    } catch (err) {
      showToast('Booking failed: ' + err.message);
    } finally {
      setReserving(false);
    }
  };

  const handleGuestsChange = (delta) => {
    const max = property?.maxGuests || 4;
    setGuests((prev) => Math.max(1, Math.min(max, prev + delta)));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: '1120px', margin: '40px auto', padding: '0 24px' }}>
          <div className="skeleton-line" style={{ width: '60%', height: '32px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ width: '100%', height: '420px', borderRadius: '16px' }} />
        </main>
        <Footer />
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: '1120px', margin: '80px auto', textAlign: 'center' }}>
          <h2>Property not found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>
            Go home
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const images = property.images || [];
  const maxG = property.maxGuests || 4;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  return (
    <>
      <Navbar />
      <AuthModal />

      <main className="prop-detail-page" style={{ maxWidth: '1120px', margin: '0 auto', padding: '24px' }}>
        {/* Title Header */}
        <div className="prop-detail-header" style={{ marginBottom: '16px' }}>
          <h1 id="detail-title" style={{ fontSize: '26px', fontWeight: 600, marginBottom: '8px' }}>
            {property.title}
          </h1>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
              {property.avgRating > 0 && (
                <span id="detail-rating" style={{ fontWeight: 600 }}>
                  ★ {Number(property.avgRating).toFixed(2)} ·{' '}
                  <span style={{ textDecoration: 'underline' }}>{property.totalReviews} reviews</span>
                </span>
              )}
              {property.host?.superhost && (
                <span className="badge" id="detail-superhost" style={{ background: '#FFF0F2', color: 'var(--red)' }}>
                  Superhost
                </span>
              )}
              <span id="detail-location" style={{ color: 'var(--text-2)' }}>
                {property.city}, {property.state}, {property.country}
              </span>
            </div>

            <button
              type="button"
              id="save-btn"
              onClick={handleWishlistToggle}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSaved ? '❤️ Saved' : '🤍 Save'}
            </button>
          </div>
        </div>

        {/* Photos Grid Mosaic */}
        <div className="photo-grid modern-photo-grid" id="photo-grid">
          <div
            className="photo-main"
            id="photo-main"
            onClick={() => {
              setLightboxIndex(0);
              setLightboxOpen(true);
            }}
          >
            {images[0] ? (
              <img src={images[0]} alt={property.title} />
            ) : (
              <div style={{ background: '#E2D5C3', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                🏠
              </div>
            )}
          </div>

          {images.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              className={`photo-thumb photo-thumb-${idx + 1}`}
              id={`photo-thumb-${idx + 1}`}
              onClick={() => {
                setLightboxIndex(idx + 1);
                setLightboxOpen(true);
              }}
            >
              <img src={img} alt="" />
            </div>
          ))}

          {images.length > 0 && (
            <button
              type="button"
              className="show-all-btn"
              id="show-all-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(6px)',
                borderRadius: '12px',
                padding: '9px 18px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #CBD5E1',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
            >
              📷 Show all {images.length} photos
            </button>
          )}
        </div>

        {/* Main Content Layout (Host Info & Details on left, Sticky Booking on right) */}
        <div
          className="detail-content-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '64px',
            marginTop: '36px',
          }}
        >
          {/* Left Column */}
          <div className="detail-left">
            {/* Host Section */}
            <div
              className="host-section"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h2 id="host-title" style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                  {propertyTypeLabel(property.propertyType)} hosted by {property.host?.fullName}
                </h2>
                <div id="host-sub" style={{ color: 'var(--text-2)', fontSize: '14px', marginTop: '4px' }}>
                  {property.maxGuests} guests · {property.bedrooms} bedroom
                  {property.bedrooms > 1 ? 's' : ''} · {property.beds} bed
                  {property.beds > 1 ? 's' : ''} · {property.bathrooms} bath
                  {property.bathrooms > 1 ? 's' : ''}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="host-chat-btn"
                    onClick={() => {
                      if (!isLoggedIn) {
                        openAuthModal('login');
                        return;
                      }
                      showToast(`You can chat directly with ${property.host?.fullName || 'the host'} through bookings & inquiries.`);
                    }}
                  >
                    💬 Contact Host
                  </button>
                </div>
              </div>

              <div
                className="host-avatar"
                id="host-avatar"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '20px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                }}
              >
                {initials(property.host?.fullName)}
              </div>
            </div>

            {/* Highlights */}
            <div style={{ padding: '24px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(property.amenities || []).some((a) => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('workspace')) && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '24px' }}>💻</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>Digital Nomad & Remote Work Ready</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                      Dedicated work desk and verified high-speed WiFi for remote workers.
                    </div>
                  </div>
                </div>
              )}
              {property.host?.superhost && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '24px' }}>⭐</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{property.host?.fullName} is a Superhost</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                      Superhosts are experienced, highly rated hosts committed to great stays.
                    </div>
                  </div>
                </div>
              )}
              {property.instantBook && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '24px' }}>⚡</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>Instant Book Available</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                      Reserve immediately without waiting for host confirmation.
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px' }}>🔑</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Self Check-in</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                    Check yourself in seamlessly with the smart lock or keypad.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>StayFinder Assurance</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                    Free cancellation up to 48 hours before check-in. 100% verified property.
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '12px' }}>About this space</h3>
              <p style={{ lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-line' }}>
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div style={{ padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '16px' }}>What this place offers</h3>
              <div
                className="amenity-grid"
                id="amenity-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                }}
              >
                {(property.amenities || []).map((a) => (
                  <div
                    key={a}
                    className="amenity-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}
                  >
                    <span className="amenity-icon" style={{ fontSize: '20px' }}>
                      {amenityIcon(a)}
                    </span>
                    <span>{a.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div style={{ padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '6px' }}>Select check-in & check-out dates</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '13px', marginBottom: '16px' }}>
                Add your travel dates to see exact pricing.
              </p>
              <AvailabilityCalendar
                checkIn={checkIn}
                checkOut={checkOut}
                bookedDates={bookedDates}
                onDateRangeChange={(ci, co) => {
                  setCheckIn(ci);
                  setCheckOut(co);
                }}
              />
            </div>
          </div>

          {/* Right Column: Sticky Reservation Card */}
          <div className="detail-right">
            <div className="booking-card modern-sticky-booking">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '16px',
                }}
              >
                <div id="bk-price" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
                  {formatCurrency(property.pricePerNight)}{' '}
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-2)' }}>
                    / night
                  </span>
                </div>
                {property.avgRating > 0 && (
                  <div id="bk-rating" style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    <span style={{ color: '#F59E0B' }}>★</span> {Number(property.avgRating).toFixed(2)} · {property.totalReviews} reviews
                  </div>
                )}
              </div>

              {/* Date cells picker */}
              <div
                className="date-picker-box"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ padding: '8px 12px', borderRight: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Check-in
                    </div>
                    <div style={{ fontSize: '13px', color: checkIn ? 'var(--text)' : 'var(--text-3)' }}>
                      {checkIn ? formatDate(checkIn) : 'Add date'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Check-out
                    </div>
                    <div style={{ fontSize: '13px', color: checkOut ? 'var(--text)' : 'var(--text-3)' }}>
                      {checkOut ? formatDate(checkOut) : 'Add date'}
                    </div>
                  </div>
                </div>

                {/* Guest counter */}
                <div
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Guests
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      {guests} {guests === 1 ? 'guest' : 'guests'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-counter"
                      onClick={() => handleGuestsChange(-1)}
                      disabled={guests <= 1}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid var(--border)',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span>{guests}</span>
                    <button
                      type="button"
                      className="btn-counter"
                      onClick={() => handleGuestsChange(1)}
                      disabled={guests >= maxG}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid var(--border)',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              {pricePreview ? (
                <div
                  id="price-breakdown"
                  style={{ marginBottom: '16px', fontSize: '14px', lineHeight: 2 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span id="pb-label">
                      {formatCurrency(pricePreview.pricePerNight)} × {pricePreview.nights} night
                      {pricePreview.nights > 1 ? 's' : ''}
                    </span>
                    <span id="pb-base">{formatCurrency(pricePreview.baseAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cleaning fee</span>
                    <span id="pb-cleaning">{formatCurrency(pricePreview.cleaningFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>StayFinder service fee</span>
                    <span id="pb-service">{formatCurrency(pricePreview.serviceFee)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                      borderTop: '1px solid var(--border)',
                      paddingTop: '10px',
                      marginTop: '6px',
                    }}
                  >
                    <span>Total before taxes</span>
                    <span id="pb-total">{formatCurrency(pricePreview.totalAmount)}</span>
                  </div>
                </div>
              ) : (
                <div
                  id="pb-placeholder"
                  style={{
                    color: 'var(--text-3)',
                    fontSize: '13px',
                    textAlign: 'center',
                    marginBottom: '16px',
                  }}
                >
                  You won't be charged yet
                </div>
              )}

              {/* Reserve Button */}
              <button
                type="button"
                className="btn btn-primary btn-full"
                id="reserve-btn"
                onClick={handleReserve}
                disabled={reserving}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF385C 0%, #E31C5F 50%, #D70466 100%)',
                  boxShadow: '0 4px 14px rgba(227, 28, 95, 0.35)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {reserving ? (
                  <div className="spinner" />
                ) : property.instantBook ? (
                  '⚡ Instant Reserve'
                ) : (
                  'Request to Book'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-2)' }}>
                You won't be charged yet · 100% Secure
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="reviews-section" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
          <h2 id="rating-hdr" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
            {property.avgRating > 0
              ? `★ ${Number(property.avgRating).toFixed(2)} · ${property.totalReviews} reviews`
              : 'No reviews yet'}
          </h2>

          {/* Gemini AI Review Summary */}
          {property.reviewSummary && (
            <div
              className="review-summary-highlight"
              id="review-summary-text"
              style={{
                background: 'linear-gradient(135deg, #FF385C15, #E31C5F15)',
                borderLeft: '4px solid var(--red)',
                padding: '14px 18px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                lineHeight: 1.6,
              }}
            >
              ✨ {property.reviewSummary}
            </div>
          )}

          {/* Rating Breakdown Bars */}
          {ratingSummary && ratingSummary.totalReviews > 0 && (
            <div
              className="rating-bars-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 32px',
                marginBottom: '32px',
              }}
            >
              {[
                { label: 'Cleanliness', val: ratingSummary.cleanliness },
                { label: 'Accuracy', val: ratingSummary.accuracy },
                { label: 'Communication', val: ratingSummary.communication },
                { label: 'Location', val: ratingSummary.location },
                { label: 'Check-in', val: ratingSummary.checkin },
                { label: 'Value', val: ratingSummary.value },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '140px' }}>
                    <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(val ? Number(val) / 5 : 0) * 100}%`,
                          height: '100%',
                          background: 'var(--text)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, width: '22px' }}>
                      {val ? Number(val).toFixed(1) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews list */}
          <div
            id="reviews-container"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
            }}
          >
            {reviews.length === 0 ? (
              <p className="text-muted" style={{ gridColumn: '1/-1' }}>
                No reviews yet. Be the first to review!
              </p>
            ) : (
              visibleReviews.map((r) => (
                <div key={r.id} className="review-item">
                  <div className="review-header" style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <div
                      className="reviewer-avatar"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#222',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {initials(r.guestName)}
                    </div>
                    <div>
                      <div className="reviewer-name" style={{ fontWeight: 600, fontSize: '14px' }}>
                        {r.guestName}
                      </div>
                      <div className="review-date" style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                        {formatDateFull(r.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="review-comment" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    {r.comment}
                  </div>
                </div>
              ))
            )}
          </div>

          {reviews.length > 4 && !showAllReviews && (
            <button
              type="button"
              className="btn btn-outline show-more-reviews-btn"
              style={{ marginTop: '24px' }}
              onClick={() => setShowAllReviews(true)}
            >
              Show all {reviews.length} reviews
            </button>
          )}
        </section>
      </main>

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        images={images}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(dir) => {
          setLightboxIndex((prev) => (prev + dir + images.length) % images.length);
        }}
      />

      <Footer />
    </>
  );
}
