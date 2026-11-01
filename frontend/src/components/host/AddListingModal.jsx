import React, { useState, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { CITY_COORDS, AMENITY_ICONS, CATEGORIES } from '../../utils/constants';
import hostService from '../../services/hostService';
import cloudinaryService from '../../services/cloudinaryService';
import SmartPriceModal from './SmartPriceModal';

export default function AddListingModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('ENTIRE_HOME');
  const [category, setCategory] = useState('CITY');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [instantBook, setInstantBook] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAiDesc, setGeneratingAiDesc] = useState(false);

  // Smart price recommendation state
  const [smartPriceOpen, setSmartPriceOpen] = useState(false);
  const [smartPriceLoading, setSmartPriceLoading] = useState(false);
  const [smartPriceData, setSmartPriceData] = useState(null);
  const [smartPriceError, setSmartPriceError] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 5) {
      showToast('Maximum 5 images allowed');
      return;
    }

    setUploadingImages(true);
    try {
      const urls = await cloudinaryService.uploadMultiple(files);
      setImages((prev) => [...prev, ...urls]);
      showToast(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded! ✅`);
    } catch (err) {
      showToast('Upload failed: ' + err.message);
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateAIDescription = async () => {
    if (!city.trim() || !state.trim()) {
      showToast('Please fill in City and State first');
      return;
    }
    setGeneratingAiDesc(true);
    try {
      const data = await hostService.generateDescription({
        propertyType,
        city: city.trim(),
        state: state.trim(),
        bedrooms: parseInt(bedrooms) || 1,
        bathrooms: parseInt(bathrooms) || 1,
        maxGuests: parseInt(maxGuests) || 1,
        amenities: selectedAmenities,
      });
      if (data && data.description) {
        setDescription(data.description);
        showToast('✨ Description generated!');
      } else {
        showToast(data?.error || 'AI service unavailable');
      }
    } catch (err) {
      showToast('Failed to generate description: ' + err.message);
    } finally {
      setGeneratingAiDesc(false);
    }
  };

  const handleOpenSmartPrice = async () => {
    if (!city.trim() || !state.trim() || !propertyType || !category) {
      showToast('Please fill in location, type, and category first');
      return;
    }

    setSmartPriceOpen(true);
    setSmartPriceLoading(true);
    setSmartPriceError('');
    setSmartPriceData(null);

    try {
      const data = await hostService.getPriceRecommendationPreview({
        city: city.trim(),
        state: state.trim(),
        propertyType,
        category,
        bedrooms: parseInt(bedrooms) || 1,
        bathrooms: parseInt(bathrooms) || 1,
        maxGuests: parseInt(maxGuests) || 2,
        amenities: selectedAmenities,
        currentPrice: pricePerNight ? parseFloat(pricePerNight) : null,
      });
      setSmartPriceData(data);
    } catch (err) {
      setSmartPriceError(err.message || 'Failed to generate recommendation');
    } finally {
      setSmartPriceLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!images.length) {
      showToast('Please upload at least one photo');
      return;
    }

    setSubmitting(true);
    const cityVal = city.trim();
    const coords = CITY_COORDS[cityVal.toLowerCase()] || null;

    try {
      await hostService.createProperty({
        title: title.trim(),
        description: description.trim(),
        propertyType,
        category,
        address: address.trim(),
        city: cityVal,
        state: state.trim(),
        country: 'India',
        pricePerNight: Number(pricePerNight),
        maxGuests: Number(maxGuests),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        beds: Number(beds),
        cleaningFee: 0,
        instantBook,
        amenities: selectedAmenities.length ? selectedAmenities : undefined,
        imageUrls: images,
        latitude: coords ? coords[0] : null,
        longitude: coords ? coords[1] : null,
      });

      showToast('Property submitted for review! 🎉');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="modal-overlay"
        id="add-listing-modal"
        onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) onClose();
        }}
      >
        <div className="modal" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
          <h3 style={{ marginBottom: '6px' }}>List your property</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginBottom: '20px' }}>
            Provide details about your space. Once submitted, it will be reviewed by admin.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Property Title</label>
              <input
                type="text"
                className="form-input"
                id="al-title"
                placeholder="e.g. Modern Sea-Facing Villa with Private Pool"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Type & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select
                  className="form-input"
                  id="al-type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="ENTIRE_HOME">Entire home</option>
                  <option value="PRIVATE_ROOM">Private room</option>
                  <option value="SHARED_ROOM">Shared room</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  id="al-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c.key).map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                id="al-address"
                placeholder="123 Ocean Drive"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  id="al-city"
                  placeholder="e.g. Goa, Mumbai, Manali"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  id="al-state"
                  placeholder="e.g. Goa, Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Price & Smart Price */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Price per night (₹)
                </label>
                <button
                  type="button"
                  id="btn-smart-price"
                  onClick={handleOpenSmartPrice}
                  style={{
                    background: 'none',
                    border: '1px solid var(--red)',
                    color: 'var(--red)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✨ AI Smart Pricing
                </button>
              </div>
              <input
                type="number"
                className="form-input"
                id="al-price"
                placeholder="2500"
                min="100"
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                required
              />
            </div>

            {/* Capacity & Rooms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Guests</label>
                <input
                  type="number"
                  className="form-input"
                  id="al-guests"
                  min="1"
                  max="30"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bedrooms</label>
                <input
                  type="number"
                  className="form-input"
                  id="al-bedrooms"
                  min="1"
                  max="20"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Beds</label>
                <input
                  type="number"
                  className="form-input"
                  id="al-beds"
                  min="1"
                  max="30"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Baths</label>
                <input
                  type="number"
                  className="form-input"
                  id="al-bathrooms"
                  min="1"
                  max="20"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description + AI Generator */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Description
                </label>
                <button
                  type="button"
                  id="ai-generate-desc-btn"
                  onClick={handleGenerateAIDescription}
                  disabled={generatingAiDesc}
                  style={{
                    background: 'none',
                    border: '1px solid var(--red)',
                    color: 'var(--red)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {generatingAiDesc ? '✨ Generating...' : '✨ Generate with AI'}
                </button>
              </div>
              <textarea
                className="form-input"
                id="al-description"
                rows="4"
                placeholder="Tell guests what makes your place unique..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Amenities */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Amenities</label>
              <div
                id="al-amenities-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px',
                }}
              >
                {Object.entries(AMENITY_ICONS).map(([key, icon]) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      name="amenities"
                      value={key}
                      checked={selectedAmenities.includes(key)}
                      onChange={() => handleAmenityToggle(key)}
                    />
                    <span>{icon}</span>
                    <span>{key.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Instant Book */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  id="al-instant"
                  checked={instantBook}
                  onChange={(e) => setInstantBook(e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>Enable Instant Book</span>
                <span style={{ color: 'var(--text-2)' }}>(Guests can book without host approval)</span>
              </label>
            </div>

            {/* Photos & Cloudinary Upload */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Photos ({images.length}/5)
                </label>
                <input
                  type="file"
                  id="al-image-input"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  id="al-upload-btn"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages || images.length >= 5}
                >
                  {uploadingImages ? 'Uploading...' : '+ Add photos'}
                </button>
              </div>

              {/* Photos preview */}
              <div
                id="al-image-preview"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '80px',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  padding: '8px',
                  alignItems: 'center',
                }}
              >
                {!images.length ? (
                  <p style={{ color: 'var(--text-3)', fontSize: '13px', textAlign: 'center', width: '100%' }}>
                    No photos uploaded yet (at least 1 required)
                  </p>
                ) : (
                  images.map((url, i) => (
                    <div key={url} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        style={{
                          width: '100px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: `2px solid ${i === 0 ? 'var(--red)' : 'var(--border)'}`,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#ff385c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                          lineHeight: '1',
                        }}
                      >
                        ✕
                      </button>
                      {i === 0 && (
                        <div
                          style={{
                            fontSize: '10px',
                            textAlign: 'center',
                            color: 'var(--red)',
                            fontWeight: 600,
                            marginTop: '2px',
                          }}
                        >
                          Cover photo
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              id="add-listing-btn"
              disabled={submitting || uploadingImages}
            >
              {submitting ? 'Creating...' : 'Submit listing'}
            </button>
          </form>
        </div>
      </div>

      {/* Smart Price Modal */}
      <SmartPriceModal
        isOpen={smartPriceOpen}
        loading={smartPriceLoading}
        error={smartPriceError}
        recommendationData={smartPriceData}
        onClose={() => setSmartPriceOpen(false)}
        onApply={(price) => {
          setPricePerNight(Math.round(price));
          showToast(`✓ Price applied: ₹${Math.round(price).toLocaleString('en-IN')}`);
          setSmartPriceOpen(false);
        }}
      />
    </>
  );
}
