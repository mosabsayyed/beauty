import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function WelcomeEntry() {
  const navigate = useNavigate();
  const [language] = useState<'en' | 'ar'>('en');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const location = useLocation();

  useEffect(() => {
    // Only auto-redirect when we are on the root path.
    if (location.pathname !== '/') return;

    // Check if user has seen cube before
    try {
      const seen = localStorage.getItem('josoor_seen_cube');
      if (seen === 'true') {
        const isAuthenticated = localStorage.getItem('josoor_authenticated') === 'true';
        if (isAuthenticated) {
          navigate('/chat', { replace: true });
        } else {
          navigate('/landing', { replace: true });
        }
        return;
      }
    } catch (_){
      // ignore localStorage errors
    }
  }, [navigate, location.pathname]);

  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    
    const style = doc.createElement('style');
    style.textContent = `
      html, body { background: #1A2435 !important; }
      .phase-overlay .phase-text-block h2,
      .finale-columns h2 { color: #D4AF37 !important; }
      .finale-left-column, .finale-right-column { border-color: rgba(212,175,55,0.3) !important; }
      .finale-columns li { border-bottom-color: rgba(212,175,55,0.2) !important; }
      .finale-enter-btn {
        background: linear-gradient(135deg, #D4AF37 0%, #B8960F 100%) !important;
        box-shadow: 0 4px 16px rgba(212,175,55,0.3) !important;
      }
      .finale-enter-btn:hover {
        background: linear-gradient(135deg, #B8960F 0%, #D4AF37 100%) !important;
        box-shadow: 0 6px 24px rgba(212,175,55,0.4) !important;
      }
      #stage { filter: sepia(0.75) hue-rotate(330deg) saturate(1.35) brightness(1.0) contrast(1.05); }
    `;
    doc.head.appendChild(style);
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      margin: 0, 
      padding: 0, 
      position: 'relative',
      backgroundColor: '#1A2435',
      overflow: 'hidden'
    }}>
      {/* Rubik's Cube iframe */}
      <iframe
        ref={iframeRef}
        onLoad={handleIframeLoad}
        src={language === 'ar' ? '/att/cube/index-ar.html' : '/att/cube/index.html'}
        title="Rubik's Cube Animation"
        className="rubiks-iframe interactive"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          border: 'none',
          display: 'block',
          margin: 0,
          padding: 0,
          zIndex: 9999,
        }}
        allowFullScreen
      />
    </div>
  );
}
