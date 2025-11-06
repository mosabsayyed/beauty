import React from 'react';

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: 16, backgroundColor: '#ffebee', borderLeft: '4px solid #c62828', borderRadius: 4 }}>
    <div style={{ color: '#c62828', fontWeight: 'bold', marginBottom: 8 }}>⚠️ Error</div>
    <div style={{ color: '#666' }}>{message}</div>
    <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>Please try rephrasing your question or try again later.</div>
  </div>
);

export default ErrorBanner;
