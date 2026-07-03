import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
        Synchronizing Live Telemetry feeds...
      </p>
    </div>
  );
};

export default Loading;
