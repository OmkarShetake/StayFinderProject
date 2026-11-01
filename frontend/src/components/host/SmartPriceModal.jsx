import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function SmartPriceModal({
  isOpen,
  recommendationData,
  loading,
  error,
  onApply,
  onClose,
}) {
  if (!isOpen) return null;

  const conf = (recommendationData?.confidence || 'MEDIUM').toLowerCase();

  return (
    <div
      className="modal-overlay"
      id="smart-price-modal"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <h3 style={{ marginBottom: '16px' }}>✨ AI Smart Price Recommendation</h3>

        {loading && (
          <div className="price-rec-loading" style={{ textAlign: 'center', padding: '32px 0' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: 'var(--text-2)' }}>
              Analyzing market data, seasonal trends and generating recommendations...
            </p>
          </div>
        )}

        {error && (
          <div className="price-rec-loading" style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: 'var(--red)', fontWeight: 600 }}>❌ Failed to generate recommendation</p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '8px' }}>{error}</p>
            <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={onClose}>
              Close
            </button>
          </div>
        )}

        {!loading && !error && recommendationData && (
          <div>
            <div className="price-rec-grid">
              <div className="price-rec-card recommended">
                <div className="price-rec-card-label">Recommended</div>
                <div className="price-rec-card-value">
                  {formatCurrency(recommendationData.recommendedPrice)}
                </div>
                <div className={`price-rec-confidence ${conf}`}>
                  {recommendationData.confidence || 'MEDIUM'}
                </div>
              </div>
              <div className="price-rec-card">
                <div className="price-rec-card-label">Weekend</div>
                <div className="price-rec-card-value">
                  {formatCurrency(recommendationData.weekendPrice)}
                </div>
              </div>
              <div className="price-rec-card">
                <div className="price-rec-card-label">Min Price</div>
                <div className="price-rec-card-value">
                  {formatCurrency(recommendationData.minPrice)}
                </div>
              </div>
              <div className="price-rec-card">
                <div className="price-rec-card-label">Max Price</div>
                <div className="price-rec-card-value">
                  {formatCurrency(recommendationData.maxPrice)}
                </div>
              </div>
            </div>

            {recommendationData.reasoning && (
              <div className="price-rec-reasoning" style={{ marginTop: '20px' }}>
                <div className="price-rec-reasoning-title" style={{ fontWeight: 600, marginBottom: '6px' }}>
                  💡 Why this price?
                </div>
                <div className="price-rec-reasoning-text" style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  {recommendationData.reasoning}
                </div>
              </div>
            )}

            {recommendationData.tips && recommendationData.tips.length > 0 && (
              <div className="price-rec-tips" style={{ marginTop: '16px' }}>
                <div className="price-rec-tips-title" style={{ fontWeight: 600, marginBottom: '8px' }}>
                  🎯 Tips to increase bookings
                </div>
                {recommendationData.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="price-rec-tip"
                    style={{ display: 'flex', gap: '8px', fontSize: '13px', marginBottom: '6px' }}
                  >
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            <div
              className="price-rec-actions"
              style={{ display: 'flex', gap: '12px', marginTop: '24px' }}
            >
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => onApply(recommendationData.recommendedPrice)}
              >
                Apply Recommended Price
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
