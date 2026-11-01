import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITIES } from '../../utils/constants';

export default function SearchModal({ isOpen, onClose, initialValues = {} }) {
  const navigate = useNavigate();
  const [city, setCity] = useState(initialValues.city || '');
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || '');
  const [guests, setGuests] = useState(initialValues.guests || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityInputRef = useRef(null);

  useEffect(() => {
    if (initialValues.city !== undefined) setCity(initialValues.city);
    if (initialValues.checkIn !== undefined) setCheckIn(initialValues.checkIn);
    if (initialValues.checkOut !== undefined) setCheckOut(initialValues.checkOut);
    if (initialValues.guests !== undefined) setGuests(initialValues.guests);
  }, [initialValues]);

  const handleCityChange = (e) => {
    const val = e.target.value;
    setCity(val);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = CITIES.filter(
      (c) => c.name.toLowerCase().startsWith(trimmed) || c.state.toLowerCase().startsWith(trimmed)
    ).slice(0, 6);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const handleSelectCity = (cityName) => {
    setCity(cityName);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);

    onClose();
    navigate(`/search?${params.toString()}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      id="search-modal"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h3 style={{ marginBottom: '20px' }}>Search properties</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Where</label>
            <input
              type="text"
              className="form-input"
              id="sm-city"
              placeholder="Mumbai, Goa, Manali..."
              autoComplete="off"
              ref={cityInputRef}
              value={city}
              onChange={handleCityChange}
              onFocus={() => {
                if (city.trim() && suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="city-suggestions" id="city-suggestions">
                {suggestions.map((c) => (
                  <div
                    key={c.name}
                    className="city-suggestion-item"
                    onClick={() => handleSelectCity(c.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{c.icon}</span>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: '12px', color: '#717171', marginLeft: '4px' }}>
                      {c.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Check in</label>
              <input
                type="date"
                className="form-input"
                id="sm-checkin"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Check out</label>
              <input
                type="date"
                className="form-input"
                id="sm-checkout"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Guests</label>
            <input
              type="number"
              className="form-input"
              id="sm-guests"
              min="1"
              max="16"
              placeholder="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" id="search-modal-btn">
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
