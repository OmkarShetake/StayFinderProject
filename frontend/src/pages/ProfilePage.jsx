import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { initials } from '../utils/formatters';
import authService from '../services/authService';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isHost, isAdmin, updateUser, logout, becomeHost } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const updated = await authService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      updateUser({ fullName: updated.fullName, phone: updated.phone });
      setSuccess(true);
      showToast('Profile updated! ✅');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBecomeHost = async () => {
    if (!window.confirm('Become a host and start listing your property?')) return;
    try {
      await becomeHost();
      showToast('Welcome to hosting! 🏠');
      navigate('/host');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: '640px', margin: '40px auto', padding: '0 24px', minHeight: '65vh' }}>
        <h1 style={{ marginBottom: '28px' }}>Personal Profile</h1>

        {/* Profile Card */}
        <div
          className="profile-card"
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px',
          }}
        >
          {/* Avatar & Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
            <div
              className="profile-avatar"
              id="profile-avatar"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--red)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '26px',
              }}
            >
              {initials(user?.fullName)}
            </div>

            <div>
              <div id="profile-name" style={{ fontSize: '20px', fontWeight: 700 }}>
                {user?.fullName}
              </div>
              <div id="profile-email" style={{ color: 'var(--text-2)', fontSize: '14px', margin: '2px 0 6px' }}>
                {user?.email}
              </div>
              <div id="profile-role">
                {isAdmin ? (
                  <span className="badge badge-danger">Admin</span>
                ) : isHost ? (
                  <span className="badge badge-success">Host</span>
                ) : (
                  <span className="badge badge-gray">Guest</span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave}>
            {success && (
              <div
                style={{
                  background: '#E8F5E9',
                  color: 'var(--green)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                Profile saved successfully!
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                id="p-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                id="p-phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-input"
                id="p-email"
                value={user?.email || ''}
                readOnly
                disabled
                style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              id="save-profile-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Host Status Section */}
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>Hosting on StayFinder</div>
            <div id="host-status-text" style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
              {isHost
                ? 'You are an active host on StayFinder.'
                : 'List your property and start hosting guests from around the world.'}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            id="become-host-btn"
            onClick={isHost ? () => navigate('/host') : handleBecomeHost}
          >
            {isHost ? 'Go to dashboard' : 'Become a host'}
          </button>
        </div>

        {/* Sign Out */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            type="button"
            className="btn btn-outline"
            id="signout-btn"
            onClick={logout}
            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
          >
            Log out of StayFinder
          </button>
        </div>
      </main>

      <Footer />
    </>
  );
}
