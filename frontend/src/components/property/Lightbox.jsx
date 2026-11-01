import React, { useEffect } from 'react';

export default function Lightbox({ isOpen, images = [], currentIndex = 0, onClose, onNavigate }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNavigate]);

  if (!isOpen || !images.length) return null;

  const currentImg = images[currentIndex] || '';

  return (
    <div className="lightbox-overlay" id="lightbox-overlay" onClick={onClose}>
      <div className="lightbox" id="lightbox" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" id="lightbox-close" onClick={onClose}>
          ✕
        </button>

        <div className="lightbox-counter" id="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </div>

        <button
          className="lightbox-nav lightbox-prev"
          id="lightbox-prev"
          disabled={images.length <= 1}
          onClick={() => onNavigate(-1)}
        >
          ‹
        </button>

        <img
          className="lightbox-img"
          id="lightbox-img"
          src={currentImg}
          alt={`Slide ${currentIndex + 1}`}
        />

        <button
          className="lightbox-nav lightbox-next"
          id="lightbox-next"
          disabled={images.length <= 1}
          onClick={() => onNavigate(1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
