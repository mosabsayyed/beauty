import React, { useState } from 'react';
import '../josoor.css';

export const GapRecommendationsPanel = ({ year, quarter, onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  
  const panelStyle = {
    padding: '1rem',
    borderLeft: '2px solid #D4AF37', 
    height: '100%',
    color: '#fff'
  };

  const handleSubmit = async () => {
    try {
      await fetch('/api/business-chain/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, quarter, items: recommendations })
      });
      alert('Recommendations submitted successfully');
    } catch (e) {
      console.error('Submission failed', e);
    }
  };

  return (
    <div style={panelStyle}>
      <h3>Gap Analysis Recommendations</h3>
      <div className="gap-list">
        <p style={{ color: '#aaa' }}>Select missing links to generate recommendations.</p>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
        <button onClick={handleSubmit} className="v2-btn" style={{ width: '100%' }}>
          Submit to Supabase
        </button>
        <button onClick={onClose} className="v2-btn-ghost" style={{ width: '100%', marginTop: '0.5rem' }}>
          Close
        </button>
      </div>
    </div>
  );
};
