import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export default function AuthModal() {
  const { authModalOpen, authModalMode, openAuthModal, closeAuthModal, login, register } = useAuth();
  const { showToast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      showToast('Welcome back! 👋');
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      await register({
        fullName: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      showToast('Account created! Welcome to StayFinder 🎉');
    } catch (err) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      id="auth-modal"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) closeAuthModal();
      }}
    >
      <div className="modal auth-modal">
        <button className="modal-close" onClick={closeAuthModal}>
          ✕
        </button>
        <h3 id="auth-modal-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
          {authModalMode === 'login' ? 'Log in to StayFinder' : 'Join StayFinder'}
        </h3>

        <div className="auth-modal-tabs">
          <div
            className={`auth-modal-tab ${authModalMode === 'login' ? 'active' : ''}`}
            onClick={() => openAuthModal('login')}
          >
            Log in
          </div>
          <div
            className={`auth-modal-tab ${authModalMode === 'register' ? 'active' : ''}`}
            onClick={() => openAuthModal('register')}
          >
            Sign up
          </div>
        </div>

        {/* Login form */}
        {authModalMode === 'login' && (
          <form id="login-form" onSubmit={handleLoginSubmit}>
            {loginError && <div className="auth-error">{loginError}</div>}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                id="login-email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                id="login-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              id="login-submit"
              disabled={loginLoading}
            >
              {loginLoading ? <div className="spinner" /> : 'Log in'}
            </button>
            <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
              <Link
                to="/forgot-password"
                onClick={closeAuthModal}
                style={{ color: 'var(--text-2)', textDecoration: 'underline' }}
              >
                Forgot password?
              </Link>
            </p>
            <p style={{ fontSize: '12px', color: '#717171', textAlign: 'center', marginTop: '8px' }}>
              Demo: guest@stayfinder.com / Guest@123
            </p>
          </form>
        )}

        {/* Register form */}
        {authModalMode === 'register' && (
          <form id="register-form" onSubmit={handleRegisterSubmit}>
            {regError && <div className="auth-error">{regError}</div>}
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                type="text"
                className="form-input"
                id="reg-name"
                placeholder="Your name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                id="reg-email"
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                id="reg-phone"
                placeholder="+91 98765 43210"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                id="reg-password"
                placeholder="Min 8 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              id="register-submit"
              disabled={regLoading}
            >
              {regLoading ? <div className="spinner" /> : 'Sign up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
