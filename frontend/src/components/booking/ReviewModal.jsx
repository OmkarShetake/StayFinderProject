import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import reviewService from '../../services/reviewService';

export default function ReviewModal({ isOpen, bookingId, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [cleanliness, setCleanliness] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [checkin, setCheckin] = useState(5);
  const [location, setLocation] = useState(5);
  const [value, setValue] = useState(5);
  const [accuracy, setAccuracy] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reviewService.createReview({
        bookingId: parseInt(bookingId),
        cleanliness: parseInt(cleanliness),
        communication: parseInt(communication),
        checkin: parseInt(checkin),
        location: parseInt(location),
        value: parseInt(value),
        accuracy: parseInt(accuracy),
        comment,
      });
      showToast('Review submitted! ⭐');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRatingSelect = (label, valueState, setValueState) => (
    <div className="form-group" style={{ marginBottom: '12px' }}>
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{valueState} ★</span>
      </label>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={valueState}
        onChange={(e) => setValueState(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--red)' }}
      />
    </div>
  );

  return (
    <div
      className="modal-overlay"
      id="review-modal"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h3 style={{ marginBottom: '6px' }}>Leave a review</h3>
        <p style={{ color: 'var(--text-2)', fontSize: '13px', marginBottom: '20px' }}>
          Share your experience to help the host and future guests.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {renderRatingSelect('Cleanliness', cleanliness, setCleanliness)}
            {renderRatingSelect('Accuracy', accuracy, setAccuracy)}
            {renderRatingSelect('Communication', communication, setCommunication)}
            {renderRatingSelect('Location', location, setLocation)}
            {renderRatingSelect('Check-in', checkin, setCheckin)}
            {renderRatingSelect('Value', value, setValue)}
          </div>

          <div className="form-group" style={{ marginTop: '12px', marginBottom: '16px' }}>
            <label className="form-label">Your comments</label>
            <textarea
              className="form-input"
              rows="4"
              placeholder="What made your stay special? Any tips for future guests?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            id="review-submit-btn"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  );
}
