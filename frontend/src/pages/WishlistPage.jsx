import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import PropertyCard from '../components/property/PropertyCard';
import SkeletonCards from '../components/common/SkeletonCards';
import wishlistService from '../services/wishlistService';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [wishlistProperties, setWishlistProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistService
      .getWishlist()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.content || [];
        setWishlistProperties(list);
      })
      .catch((err) => {
        console.error('Failed to load wishlist:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleWishlistToggle = (propertyId, isNowSaved) => {
    if (!isNowSaved) {
      setWishlistProperties((prev) => prev.filter((p) => p.id !== propertyId));
    }
  };

  return (
    <>
      <Navbar />

      <main style={{ maxWidth: '1120px', margin: '40px auto', padding: '0 24px', minHeight: '65vh' }}>
        <h1 style={{ marginBottom: '28px' }}>Wishlists</h1>

        {loading ? (
          <div className="prop-grid" style={{ minHeight: '300px' }}>
            <SkeletonCards count={4} />
          </div>
        ) : wishlistProperties.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 0' }}>
            <div className="empty-state-icon" style={{ fontSize: '48px' }}>
              ♡
            </div>
            <h3>Nothing saved yet</h3>
            <p>Tap the heart on any property to save it to your wishlist.</p>
            <button
              type="button"
              className="btn btn-primary"
              id="btn-explore-empty"
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/')}
            >
              Explore properties
            </button>
          </div>
        ) : (
          <div className="prop-grid" id="wishlist-grid">
            {wishlistProperties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isSaved={true}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
