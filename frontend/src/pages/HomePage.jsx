import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import VerificationBanner from '../components/common/VerificationBanner';
import AuthModal from '../components/auth/AuthModal';
import CategoryBar from '../components/search/CategoryBar';
import PropertyCard from '../components/property/PropertyCard';
import SkeletonCards from '../components/common/SkeletonCards';
import { useAuth } from '../hooks/useAuth';
import propertyService from '../services/propertyService';
import wishlistService from '../services/wishlistService';

const INSPIRATION_STAYS = [
  { city: 'Mumbai', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400' },
  { city: 'Goa', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400' },
  { city: 'Manali', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400' },
  { city: 'Jaipur', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400' },
  { city: 'Udaipur', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400' },
  { city: 'Bangalore', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400' },
  { city: 'Shimla', img: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=400' },
  { city: 'Rishikesh', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400' },
];

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const { isLoggedIn, openAuthModal } = useAuth();

  const [category, setCategory] = useState('');
  const [properties, setProperties] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const sentinelRef = useRef(null);

  // Check ?login=1 query param to open login modal on load
  useEffect(() => {
    if (searchParams.get('login') === '1' && !isLoggedIn) {
      openAuthModal('login');
    }
  }, [searchParams, isLoggedIn, openAuthModal]);

  // Load wishlist IDs when logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setWishlistIds(new Set());
      return;
    }
    wishlistService
      .getWishlist()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.content || [];
        setWishlistIds(new Set(list.map((p) => p.id)));
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Load properties
  const loadProperties = useCallback(
    async (pageNum, catKey, append = false) => {
      setLoading(true);
      try {
        const params = { page: pageNum, size: 12 };
        if (catKey) params.category = catKey;

        const data = await propertyService.searchProperties(params);
        const list = data.content || [];
        setTotalPages(data.totalPages || 0);

        setProperties((prev) => (append ? [...prev, ...list] : list));
      } catch (err) {
        console.error('Failed to load properties:', err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    []
  );

  // Initial load or category change
  useEffect(() => {
    setPage(0);
    setInitialLoading(true);
    loadProperties(0, category, false);
  }, [category, loadProperties]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages - 1) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadProperties(nextPage, category, true);
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, page, totalPages, category, loadProperties]);

  const handleCategorySelect = (catKey) => {
    setCategory(catKey);
  };

  return (
    <>
      <Navbar />
      <VerificationBanner />
      <AuthModal />

      <main>
        {/* Category bar */}
        <CategoryBar
          selectedCategory={category}
          onSelectCategory={handleCategorySelect}
        />

        {/* Property grid */}
        <div className="prop-grid" id="prop-grid" style={{ minHeight: '300px' }}>
          {initialLoading ? (
            <SkeletonCards count={8} />
          ) : properties.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1', padding: '60px 0' }}>
              <div className="empty-state-icon">🔍</div>
              <h3>No properties found</h3>
              <p>Try exploring a different category or destination.</p>
              <button
                className="btn btn-primary"
                onClick={() => setCategory('')}
                style={{ marginTop: '16px' }}
              >
                Show all homes
              </button>
            </div>
          ) : (
            properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isSaved={wishlistIds.has(p.id)}
              />
            ))
          )}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: '20px' }} />

        {loading && !initialLoading && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}

        {/* Inspiration Section */}
        <section className="inspiration-section">
          <div className="inspiration-inner">
            <h2 className="inspiration-title">Inspiration for future getaways</h2>
            <div className="inspiration-tabs">
              <button className="inspiration-tab active" data-type="stays">
                Stays
              </button>
            </div>
            <div className="inspiration-grid" id="inspiration-grid">
              {INSPIRATION_STAYS.map((stay) => (
                <Link
                  key={stay.city}
                  className="inspiration-card"
                  to={`/search?city=${encodeURIComponent(stay.city)}`}
                >
                  <div
                    className="inspiration-img"
                    style={{ backgroundImage: `url('${stay.img}')` }}
                  />
                  <div className="inspiration-info">
                    <div className="inspiration-city">{stay.city}</div>
                    <div className="inspiration-label">Stays</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
