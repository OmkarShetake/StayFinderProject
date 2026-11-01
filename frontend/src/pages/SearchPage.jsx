import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AuthModal from '../components/auth/AuthModal';
import PropertyCard from '../components/property/PropertyCard';
import SkeletonCards from '../components/common/SkeletonCards';
import LeafletMap from '../components/search/LeafletMap';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { CITIES, CATEGORIES } from '../utils/constants';
import propertyService from '../services/propertyService';
import wishlistService from '../services/wishlistService';

const PROPERTY_TYPES = [
  { key: '', label: 'All types' },
  { key: 'ENTIRE_HOME', label: 'Entire home' },
  { key: 'PRIVATE_ROOM', label: 'Private room' },
  { key: 'SHARED_ROOM', label: 'Shared room' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();

  // Filters state
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  // UI state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [properties, setProperties] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // City autocomplete
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef(null);

  // Gemini AI Natural Language Search
  const [nlQuery, setNlQuery] = useState('');
  const [nlLoading, setNlLoading] = useState(false);

  // Gemini AI Personalized Recommendations
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [showAiRecBanner, setShowAiRecBanner] = useState(false);

  // Wishlist
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

  // Load Personalized Recommendations
  useEffect(() => {
    if (!isLoggedIn) return;
    propertyService
      .getPersonalizedRecommendations(city)
      .then((data) => {
        if (data && data.recommendation && data.hasHistory) {
          setAiRecommendation(data.recommendation);
          setShowAiRecBanner(true);
        }
      })
      .catch(() => {});
  }, [isLoggedIn, city]);

  // Execute search
  const executeSearch = useCallback(
    async (pageToLoad = 0, currentFilters = null) => {
      setLoading(true);
      const f = currentFilters || {
        city: city.trim() || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: guests || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        propertyType: propertyType || undefined,
        category: category || undefined,
      };

      try {
        const params = {
          ...f,
          page: pageToLoad,
          size: 12,
        };
        const data = await propertyService.searchProperties(params);
        setProperties(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || (data.content || []).length);
        setCurrentPage(pageToLoad);

        // Update URL query parameters
        const newParams = new URLSearchParams();
        Object.entries(f).forEach(([k, v]) => {
          if (v) newParams.set(k, v);
        });
        setSearchParams(newParams, { replace: true });
      } catch (err) {
        console.error('Search error:', err);
        showToast('Failed to load search results');
      } finally {
        setLoading(false);
      }
    },
    [city, checkIn, checkOut, guests, minPrice, maxPrice, propertyType, category, setSearchParams, showToast]
  );

  // Initial search based on query params
  useEffect(() => {
    executeSearch(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // City autocomplete handler
  const handleCityInput = (val) => {
    setCity(val);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    const matches = CITIES.filter(
      (c) => c.name.toLowerCase().startsWith(trimmed) || c.state.toLowerCase().startsWith(trimmed)
    ).slice(0, 6);
    setCitySuggestions(matches);
    setShowCitySuggestions(matches.length > 0);
  };

  const handleSelectCity = (cityName) => {
    setCity(cityName);
    setShowCitySuggestions(false);
  };

  // Natural Language Search with Gemini
  const handleNaturalSearch = async (customQuery = null) => {
    const q = (typeof customQuery === 'string' ? customQuery : nlQuery).trim();
    if (!q) {
      showToast('Please enter a search query');
      return;
    }

    setNlLoading(true);
    try {
      const interpretation = await propertyService.interpretNaturalSearch(q);

      const nextCity = interpretation.CITY || city;
      const nextCategory = interpretation.CATEGORY || category;
      const nextType = interpretation.PROPERTY_TYPE || propertyType;
      const nextGuests = interpretation.GUESTS || guests;

      if (interpretation.CITY) setCity(interpretation.CITY);
      if (interpretation.CATEGORY) setCategory(interpretation.CATEGORY);
      if (interpretation.PROPERTY_TYPE) setPropertyType(interpretation.PROPERTY_TYPE);
      if (interpretation.GUESTS) setGuests(interpretation.GUESTS);

      const parts = [];
      if (interpretation.CITY) parts.push(`📍 ${interpretation.CITY}`);
      if (interpretation.CATEGORY) parts.push(`🏖️ ${interpretation.CATEGORY}`);
      if (interpretation.GUESTS) parts.push(`👥 ${interpretation.GUESTS} guests`);

      showToast(parts.length > 0 ? `Found: ${parts.join(' • ')}` : `Searching for: ${q}`);

      executeSearch(0, {
        city: nextCity.trim() || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: nextGuests || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        propertyType: nextType || undefined,
        category: nextCategory || undefined,
      });
    } catch (err) {
      showToast('Search failed: ' + err.message);
    } finally {
      setNlLoading(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setCity('');
    setCheckIn('');
    setCheckOut('');
    setGuests('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setCategory('');
    setNlQuery('');

    executeSearch(0, {
      city: undefined,
      checkIn: undefined,
      checkOut: undefined,
      guests: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      propertyType: undefined,
      category: undefined,
    });
  };

  return (
    <>
      <Navbar />
      <AuthModal />

      <main className="search-layout">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar">
          <h3>
            <span>Filters</span>
            <button type="button" className="filter-clear" onClick={handleClearFilters}>
              Clear all
            </button>
          </h3>

          {/* City */}
          <div className="filter-section" style={{ position: 'relative' }}>
            <label className="filter-label">Destination</label>
            <input
              type="text"
              className="filter-input"
              id="f-city"
              placeholder="Where are you going?"
              value={city}
              ref={cityInputRef}
              onChange={(e) => handleCityInput(e.target.value)}
              onFocus={() => {
                if (city.trim() && citySuggestions.length > 0) setShowCitySuggestions(true);
              }}
            />
            {showCitySuggestions && (
              <div
                className="city-suggestions"
                id="f-city-suggestions"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: 'var(--white)',
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: '12px',
                  marginTop: '6px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                {citySuggestions.map((c) => (
                  <div
                    key={c.name}
                    onClick={() => handleSelectCity(c.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '18px' }}>{c.icon}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', marginLeft: 'auto' }}>{c.state}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="filter-section">
            <label className="filter-label">Trip Dates</label>
            <div className="filter-price-row">
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Check-in</span>
                <input
                  type="date"
                  className="filter-input"
                  id="f-checkin"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Check-out</span>
                <input
                  type="date"
                  className="filter-input"
                  id="f-checkout"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="filter-section">
            <label className="filter-label">Guests</label>
            <input
              type="number"
              className="filter-input"
              id="f-guests"
              min="1"
              max="16"
              placeholder="Number of guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
          </div>

          {/* Price range */}
          <div className="filter-section">
            <label className="filter-label">Price Range (per night)</label>
            <div className="filter-price-row">
              <input
                type="number"
                className="filter-input"
                id="f-min-price"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                className="filter-input"
                id="f-max-price"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="filter-section">
            <label className="filter-label">Place Type</label>
            <div className="filter-type-grid">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`filter-type-btn ${propertyType === t.key ? 'active' : ''}`}
                  onClick={() => setPropertyType(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="filter-section">
            <label className="filter-label">Collection & Style</label>
            <div className="filter-category-grid">
              {CATEGORIES.slice(0, 8).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`filter-cat-btn ${category === c.key ? 'active' : ''}`}
                  onClick={() => setCategory(category === c.key ? '' : c.key)}
                >
                  <span className="filter-cat-icon">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button
            type="button"
            className="filter-apply-btn"
            onClick={() => executeSearch(0)}
          >
            Apply Filters
          </button>
        </aside>

        {/* Results section */}
        <section className="search-results-section">
          {/* Natural language AI Search */}
          <div className="nl-search-bar" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              id="nl-search-input"
              className="form-input"
              placeholder="✨ Try AI search: 'Luxury villa in Goa near beach for 6 guests'..."
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNaturalSearch();
              }}
              style={{ paddingRight: '110px' }}
            />
            <button
              type="button"
              id="nl-search-btn"
              className="btn btn-primary btn-sm"
              onClick={() => handleNaturalSearch()}
              disabled={nlLoading}
              style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px' }}
            >
              {nlLoading ? (
                <div className="spinner" style={{ width: '14px', height: '14px' }} />
              ) : (
                '✨ AI Search'
              )}
            </button>
          </div>

          {/* Quick AI Search Prompts */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              💡 Suggestions:
            </span>
            {[
              '🏖️ Luxury Goa Beachfront Villa',
              '💻 Bangalore Nomad Stay with Fast WiFi',
              '🏔️ Scenic Manali Cabin for 4',
              '🏊 Villa with Private Pool under ₹6000',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setNlQuery(chip);
                  handleNaturalSearch(chip);
                }}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1';
                  e.currentTarget.style.color = '#4F46E5';
                  e.currentTarget.style.background = '#EEF2FF';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.color = '#334155';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* AI Personalized Recommendations Banner */}
          {showAiRecBanner && aiRecommendation && (
            <div
              className="ai-recommendations-banner"
              id="ai-recommendations-banner"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #FF385C15, #E31C5F25)',
                border: '1px solid var(--red-light)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>✨</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--red)' }}>
                    Personalized AI Recommendation
                  </div>
                  <div id="ai-rec-text" style={{ fontSize: '13px', color: 'var(--text)' }}>
                    {aiRecommendation}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiRecBanner(false)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Header & View Switcher */}
          <div
            className="search-results-hdr"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div id="results-count" style={{ fontSize: '15px', fontWeight: 600 }}>
              {loading
                ? 'Searching properties...'
                : totalElements === 0
                ? 'No properties found'
                : `${totalElements} propert${totalElements === 1 ? 'y' : 'ies'} found`}
            </div>

            <div className="view-toggle" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                id="btn-grid-view"
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button
                type="button"
                id="btn-map-view"
                className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('map')}
              >
                🗺️ Map
              </button>
            </div>
          </div>

          {/* Results Grid / Map */}
          {viewMode === 'map' ? (
            <LeafletMap properties={properties} />
          ) : (
            <div className="prop-grid" id="results-grid" style={{ minHeight: '350px' }}>
              {loading ? (
                <SkeletonCards count={8} />
              ) : properties.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1/-1', padding: '60px 0' }}>
                  <div className="empty-state-icon">🔍</div>
                  <h3>No properties found</h3>
                  <p>Try adjusting your search filters or clearing some criteria.</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleClearFilters}
                    style={{ marginTop: '16px' }}
                  >
                    Clear filters
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="pagination-bar"
              id="pagination"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '32px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={currentPage === 0}
                onClick={() => executeSearch(currentPage - 1)}
              >
                ← Previous
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                // Show pages around current
                if (i !== 0 && i !== totalPages - 1 && Math.abs(i - currentPage) > 2) {
                  return null;
                }
                return (
                  <button
                    key={i}
                    type="button"
                    className={`btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => executeSearch(i)}
                  >
                    {i + 1}
                  </button>
                );
              })}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => executeSearch(currentPage + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
