import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import authService from '../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: '440px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '16px', padding: '36px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h2>Invalid Token</h2>
            <p style={{ color: 'var(--text-2)', margin: '12px 0 24px' }}>
              The password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password" className="btn btn-primary btn-full">
              Request a new reset link
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password');
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
          <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Create new password</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
            Your new password must be at least 8 characters long.
          </p>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ marginBottom: '8px' }}>Password updated!</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '24px' }}>
                Your password has been reset successfully. You can now log in with your new credentials.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => navigate('/?login=1')}
              >
                Log in to StayFinder
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && <div className="auth-error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  id="rp-password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  id="rp-confirm"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                id="rp-btn"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
