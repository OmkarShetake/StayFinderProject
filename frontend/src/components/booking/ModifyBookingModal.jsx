import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import bookingService from '../../services/bookingService';

export default function ModifyBookingModal({ isOpen, booking, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [priceData, setPriceData] = useState(null);

  useEffect(() => {
    if (booking) {
      setCheckIn(booking.checkIn || '');
      setCheckOut(booking.checkOut || '');
      setGuests(booking.guests || 1);
      setPriceData(null);
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handlePreview = async () => {
    if (!checkIn || !checkOut) {
      showToast('Please select dates');
      return;
    }
    setPreviewLoading(true);
    try {
      const data = await bookingService.pricePreview({
        propertyId: booking.property?.id,
        checkIn,
        checkOut,
        guests: parseInt(guests),
      });
      setPriceData(data);
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      showToast('Please select dates');
      return;
    }
    setSubmitLoading(true);
    try {
      await bookingService.modifyBooking(booking.id, {
        checkIn,
        checkOut,
        guests: parseInt(guests),
      });
      showToast('Booking updated! ✅');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      id="modify-modal"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h3 style={{ marginBottom: '6px' }}>Change dates & guests</h3>
        <p style={{ color: 'var(--text-2)', fontSize: '13px', marginBottom: '20px' }}>
          {booking.property?.title}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Check-in</label>
              <input
                type="date"
                className="form-input"
                id="modify-checkin"
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  setPriceData(null);
                }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Check-out</label>
              <input
                type="date"
                className="form-input"
                id="modify-checkout"
                value={checkOut}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  setPriceData(null);
                }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Guests</label>
            <input
              type="number"
              className="form-input"
              id="modify-guests"
              min="1"
              max={booking.property?.maxGuests || 16}
              value={guests}
              onChange={(e) => {
                setGuests(e.target.value);
                setPriceData(null);
              }}
              required
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-full"
            id="modify-preview-btn"
            style={{ marginBottom: '16px' }}
            onClick={handlePreview}
            disabled={previewLoading}
          >
            {previewLoading ? 'Loading...' : 'Preview new price'}
          </button>

          {priceData && (
            <div
              id="modify-price-preview"
              style={{
                background: 'var(--bg)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>
                  {formatCurrency(priceData.pricePerNight)} × {priceData.nights} night
                  {priceData.nights > 1 ? 's' : ''}
                </span>
                <span>{formatCurrency(priceData.baseAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Cleaning fee</span>
                <span>{formatCurrency(priceData.cleaningFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Service fee</span>
                <span>{formatCurrency(priceData.serviceFee)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  borderTop: '1px solid var(--border)',
                  paddingTop: '6px',
                }}
              >
                <span>Total</span>
                <span>{formatCurrency(priceData.totalAmount)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            id="modify-submit-btn"
            disabled={submitLoading}
          >
            {submitLoading ? 'Saving...' : 'Confirm change'}
          </button>
        </form>
      </div>
    </div>
  );
}
