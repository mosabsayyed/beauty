import React, { useState } from 'react';
import '../josoor.css';

/**
 * GapRecommendationPanel
 * Displays gaps found by server-side analysis and allows submission to Supabase.
 * Sources:,
 */
export const GapRecommendationPanel = ({ year, quarter, onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  
  // Styling: Gold Border per Source
  const panelStyle = {
    padding: '1rem',
    borderLeft: '2px solid #D4AF37', 
    height: '100%',
    color: '#fff'
  };

  const handleSubmit = async () => {
    // Submission logic to /api/business-chain/recommendations
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
        {/* Placeholder for gap items loaded from parent/query */}
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
