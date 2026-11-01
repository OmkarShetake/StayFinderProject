import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDateFull } from '../utils/formatters';
import adminService from '../services/adminService';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'bookings'
  const [propertyStatus, setPropertyStatus] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED'

  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProperties = useCallback(
    async (status) => {
      setLoading(true);
      try {
        const data = await adminService.adminGetProperties(status, 0);
        setProperties(data.content || []);
      } catch (err) {
        showToast('Failed to load properties: ' + err.message);
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.adminGetBookings(0);
      setBookings(data.content || []);
    } catch (err) {
      showToast('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'properties') {
      loadProperties(propertyStatus);
    } else {
      loadBookings();
    }
  }, [activeTab, propertyStatus, loadProperties, loadBookings]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this property? It will become visible to all guests.')) return;
    try {
      await adminService.adminApproveProperty(id);
      showToast('Property approved! 🎉');
      loadProperties(propertyStatus);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this property?')) return;
    try {
      await adminService.adminRejectProperty(id);
      showToast('Property rejected');
      loadProperties(propertyStatus);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Permanently delete "${title}"?\n\nThis cannot be undone.`)) return;
    try {
      await adminService.adminDeleteProperty(id);
      showToast('Property deleted 🗑');
      loadProperties(propertyStatus);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: '1120px', margin: '40px auto', padding: '0 24px', minHeight: '65vh' }}>
        <h1 style={{ marginBottom: '24px' }}>Admin Dashboard</h1>

        {/* Tab Buttons */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            Manage Properties
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            All Bookings Audit
          </button>
        </div>

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div>
            {/* Status filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm ${propertyStatus === st ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPropertyStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-muted">Loading properties...</p>
            ) : properties.length === 0 ? (
              <p className="text-muted">No {propertyStatus.toLowerCase()} properties found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {properties.map((p) => (
                  <div key={p.id} className="admin-card">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        className="property-img"
                        alt={p.title}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                      />
                    )}
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="admin-card-title" style={{ fontSize: '18px', fontWeight: 600 }}>
                          {p.title}
                        </div>
                        <div className="admin-card-meta" style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0' }}>
                          📍 {p.city}, {p.state}, {p.country} • {formatCurrency(p.pricePerNight)}/night •{' '}
                          {p.bedrooms} bed, {p.bathrooms} bath
                        </div>
                        <div className="admin-card-meta" style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>
                          👤 Host: {p.host?.fullName || 'N/A'} ({p.host?.email || ''}) • Created:{' '}
                          {formatDateFull(p.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          p.status === 'APPROVED'
                            ? 'badge-success'
                            : p.status === 'PENDING'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    {p.description && (
                      <div
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-2)',
                          marginBottom: '12px',
                          lineHeight: 1.5,
                        }}
                      >
                        {p.description}
                      </div>
                    )}

                    <div className="admin-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {p.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(p.id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReject(p.id)}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/properties/${p.id}`)}
                      >
                        👁 View
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: '#ff385c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        onClick={() => handleDelete(p.id, p.title)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            {loading ? (
              <p className="text-muted">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="text-muted">No bookings found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookings.map((b) => (
                  <div key={b.id} className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="admin-card-title" style={{ fontSize: '16px', fontWeight: 600 }}>
                          {b.property?.title || 'Property'}
                        </div>
                        <div className="admin-card-meta" style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0' }}>
                          📍 {b.property?.city || 'N/A'} • Ref: <code>{b.referenceId}</code> • {b.nights} night
                          {b.nights > 1 ? 's' : ''}, {b.guests} guest{b.guests > 1 ? 's' : ''}
                        </div>
                        <div className="admin-card-meta" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                          👤 Guest: {b.guest?.fullName || 'N/A'} ({b.guest?.email || ''}) • Host:{' '}
                          {b.property?.host?.fullName || 'N/A'}
                        </div>
                        <div className="admin-card-meta" style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
                          📅 {formatDateFull(b.checkIn)} → {formatDateFull(b.checkOut)} • Amount:{' '}
                          <strong>{formatCurrency(b.totalAmount)}</strong>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          b.status === 'CONFIRMED'
                            ? 'badge-success'
                            : b.status === 'PENDING'
                            ? 'badge-warning'
                            : b.status === 'COMPLETED'
                            ? 'badge-gray'
                            : 'badge-danger'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
