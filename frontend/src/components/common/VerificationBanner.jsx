import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';

export default function VerificationBanner() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await authService.resendVerification(user.email);
      showToast('Verification email sent! Check your inbox.');
    } catch (err) {
      showToast(err.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-banner" id="verification-banner">
      <div className="verification-content">
        <span className="verification-icon">📧</span>
        <span className="verification-text">
          Please verify your email address to access all features.
        </span>
        <button
          className="verification-btn"
          id="resend-verification-btn"
          onClick={handleResend}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Resend email'}
        </button>
      </div>
      <button
        className="verification-close"
        id="close-verification-banner"
        onClick={() => setDismissed(true)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
