import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, propertyTypeLabel } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import wishlistService from '../../services/wishlistService';

export default function PropertyCard({ property, isSaved = false, onWishlistToggle }) {
  const navigate = useNavigate();
  const { isLoggedIn, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [saved, setSaved] = useState(isSaved);
  const [animating, setAnimating] = useState(false);

  const {
    id,
    title,
    city,
    state,
    images = [],
    propertyType,
    category,
    beds = 0,
    avgRating = 0,
    pricePerNight = 0,
    host,
    amenities = [],
  } = property;

  const imgSrc = images && images.length > 0 ? images[0] : '';
  const ratingNum = Number(avgRating) || 0;
  const isSuperhost = host?.superhost || ratingNum >= 4.85;
  const isNomadReady =
    category === 'WORKATION' ||
    (Array.isArray(amenities) &&
      amenities.some((a) => {
        const str = typeof a === 'string' ? a.toLowerCase() : (a.name || '').toLowerCase();
        return str.includes('wifi') || str.includes('workspace');
      }));

  const handleHeartClick = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }
    setAnimating(true);
    setTimeout(() => setAnimating(false), 500);

    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      await wishlistService.toggleWishlist(id);
      showToast(nextSaved ? 'Saved to wishlist ❤️' : 'Removed from wishlist 🤍');
      if (onWishlistToggle) onWishlistToggle(id, nextSaved);
    } catch (err) {
      setSaved(!nextSaved);
      showToast('Error: ' + err.message);
    }
  };

  const handleCardClick = () => {
    navigate(`/properties/${id}`);
  };

  return (
    <div className="prop-card modern-card" data-id={id} onClick={handleCardClick}>
      <div className="prop-card-img">
        {imgSrc ? (
          <img className="prop-card-img-inner" src={imgSrc} alt={title} loading="lazy" />
        ) : (
          <div
            className="prop-card-img-placeholder"
            style={{ background: '#E2D5C3', fontSize: '52px' }}
          >
            🏠
          </div>
        )}

        <div
          className={`prop-heart ${animating ? 'heart-bounce' : ''}`}
          data-id={id}
          title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={handleHeartClick}
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(4px)',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          {saved ? '❤️' : '🤍'}
        </div>

        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 3 }}>
          {isSuperhost && (
            <div className="prop-badge" style={{ position: 'static', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', color: '#0F172A', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              ✨ Guest Favorite
            </div>
          )}
          {isNomadReady && (
            <div className="prop-badge" style={{ position: 'static', background: '#0F172A', color: '#38BDF8', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
              ⚡ Nomad Ready
            </div>
          )}
        </div>
      </div>

      <div className="prop-card-info" style={{ paddingTop: '12px' }}>
        <div className="prop-card-row1">
          <div className="prop-card-loc" style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
            {city}
            {state ? `, ${state}` : ''}
          </div>
          {ratingNum > 0 && (
            <div className="prop-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#0F172A' }}>
              <span style={{ color: '#F59E0B' }}>★</span> {ratingNum.toFixed(2)}
            </div>
          )}
        </div>
        <div className="prop-card-type" style={{ color: '#64748B', fontSize: '13px', marginTop: '2px' }}>
          {title.length > 32 ? `${title.slice(0, 32)}...` : title}
        </div>
        <div className="prop-card-type" style={{ color: '#94A3B8', fontSize: '12px', marginTop: '1px' }}>
          {propertyTypeLabel(propertyType)} · {beds} bed{beds !== 1 ? 's' : ''}
        </div>
        <div className="prop-card-price" style={{ marginTop: '6px', fontSize: '15px', color: '#0F172A' }}>
          <strong style={{ fontWeight: 800 }}>{formatCurrency(pricePerNight)}</strong> <span style={{ color: '#64748B', fontWeight: 500, fontSize: '13px' }}>/ night</span>
        </div>
      </div>
    </div>
  );
}
