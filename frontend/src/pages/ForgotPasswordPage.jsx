import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import authService from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: '440px', margin: '80px auto', padding: '0 24px', minHeight: '55vh' }}>
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Reset password</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
            Enter the email address associated with your StayFinder account and we'll send you a link to reset your password.
          </p>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
              <h3 style={{ marginBottom: '8px' }}>Check your email</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                We've sent a password reset link to <strong>{email}</strong> if an account exists.
              </p>
              <Link to="/" className="btn btn-primary btn-full">
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && <div className="auth-error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  id="fp-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                id="fp-btn"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/" style={{ color: 'var(--text-2)', fontSize: '13px', textDecoration: 'underline' }}>
                  Remember your password? Log in
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
