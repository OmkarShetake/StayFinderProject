import React from 'react';

export default function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
      }}
    >
      <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
      <span style={{ fontSize: '13px', color: 'var(--text-2, #717171)' }}>Loading StayFinder...</span>
    </div>
  );
}
