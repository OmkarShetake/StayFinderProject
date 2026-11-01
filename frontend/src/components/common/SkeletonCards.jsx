import React from 'react';

export default function SkeletonCards({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="prop-card">
          <div className="prop-card-img skeleton" style={{ borderRadius: '12px' }} />
          <div className="skeleton-line" style={{ width: '80%', marginTop: '10px' }} />
          <div className="skeleton-line" style={{ width: '60%', marginTop: '6px' }} />
          <div className="skeleton-line" style={{ width: '40%', marginTop: '6px' }} />
        </div>
      ))}
    </>
  );
}
