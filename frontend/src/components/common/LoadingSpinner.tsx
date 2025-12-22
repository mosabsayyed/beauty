import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100%', 
    minHeight: '200px',
    color: 'var(--jd-text-dim, #6B7280)',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(255,255,255,0.1)',
      borderTop: '3px solid var(--jd-accent, #3B82F6)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <div style={{ fontSize: '0.9rem' }}>Loading real-time data...</div>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
  </div>
);

export default LoadingSpinner;
