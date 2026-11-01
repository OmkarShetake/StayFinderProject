import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import authService from '../services/authService';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('Invalid verification link. Please check your email and try again.');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setSuccess(true);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Verification failed. The link may have expired.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center', minHeight: '55vh' }}>
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '36px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {loading ? (
            <div>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <h3>Verifying your email...</h3>
            </div>
          ) : success ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ marginBottom: '8px' }}>Email Verified!</h2>
              <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '24px' }}>
                Your email address has been successfully verified. You now have full access to StayFinder.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => navigate('/')}
              >
                Continue to StayFinder
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ marginBottom: '8px' }}>Verification Failed</h2>
              <p style={{ color: 'var(--red)', fontSize: '14px', marginBottom: '24px' }}>
                {errorMsg}
              </p>
              <Link to="/" className="btn btn-outline btn-full">
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
