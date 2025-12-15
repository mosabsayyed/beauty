
import React from 'react';

interface NavButtonsProps {
  onNavigate: (view: 'dashboard' | 'business_chains' | 'graph') => void;
  currentView: 'dashboard' | 'business_chains' | 'graph';
  isDark: boolean;
  language: string;
}

const NavButtons: React.FC<NavButtonsProps> = ({ onNavigate, currentView, isDark, language }) => {
  const content = {
    indicators: { en: 'Indicators', ar: 'المؤشرات' },
    chains: { en: 'Chains', ar: 'السلاسل' },
    graph: { en: '3D Graph', ar: 'الرسم البياني' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  return (
    <div className="nav-btn-group">
      {/* INDICATORS BUTTON (Dashboard/Spider Chart) - FIRST */}
      <div 
        className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} 
        role="button" 
        tabIndex={0}
        onClick={() => onNavigate('dashboard')}
        data-testid="button-indicators"
      >
        <div className="nav-btn-content">
          <div className="nav-btn-icon-wrapper">
              <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      <radialGradient id="indicator-glow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                          <stop offset="100%" stopColor="#B45309" stopOpacity="0.3" />
                      </radialGradient>
                  </defs>
                  
                  {/* Spider web pattern */}
                  <g stroke="#FFD700" strokeWidth="1.5" fill="none" opacity="0.6">
                      {/* Outer hexagon */}
                      <polygon points="25,5 40,15 40,35 25,45 10,35 10,15" />
                      {/* Middle hexagon */}
                      <polygon points="25,12 35,18 35,32 25,38 15,32 15,18" />
                      {/* Inner hexagon */}
                      <polygon points="25,19 30,22 30,28 25,31 20,28 20,22" />
                      {/* Radial lines */}
                      <line x1="25" y1="25" x2="25" y2="5" />
                      <line x1="25" y1="25" x2="40" y2="15" />
                      <line x1="25" y1="25" x2="40" y2="35" />
                      <line x1="25" y1="25" x2="25" y2="45" />
                      <line x1="25" y1="25" x2="10" y2="35" />
                      <line x1="25" y1="25" x2="10" y2="15" />
                  </g>

                  {/* Data points */}
                  <circle cx="25" cy="25" r="5" fill="url(#indicator-glow)" />
                  <circle cx="25" cy="8" r="2.5" fill="#FFD700" />
                  <circle cx="37" cy="16" r="2.5" fill="#FFD700" />
                  <circle cx="37" cy="34" r="2.5" fill="#FFD700" />
                  <circle cx="13" cy="34" r="2.5" fill="#FFD700" />
              </svg>
          </div>
          <span>{t('indicators')}</span>
        </div>
      </div>

      {/* BUSINESS CHAINS BUTTON - SECOND */}
      <div 
        className={`nav-btn ${currentView === 'business_chains' ? 'active' : ''}`} 
        role="button" 
        tabIndex={0}
        onClick={() => onNavigate('business_chains')}
        data-testid="button-business-chains"
      >
        <div className="nav-btn-content">
          <div className="nav-btn-icon-wrapper">
               <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      {/* 3D Sphere Gradient */}
                      <radialGradient id="gold-sphere" cx="35%" cy="35%" r="60%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="#FFFBEB" />
                          <stop offset="40%" stopColor="#FFD700" />
                          <stop offset="100%" stopColor="#B45309" />
                      </radialGradient>
                      <linearGradient id="spoke-grad" x1="0" y1="0" x2="1" y2="1">
                           <stop offset="0%" stopColor="#FFD700" />
                           <stop offset="100%" stopColor="#92400E" />
                      </linearGradient>
                  </defs>
                  
                  {/* Spokes (Thick, Gold) */}
                  <g stroke="url(#spoke-grad)" strokeWidth="2" strokeLinecap="round">
                      <line x1="25" y1="25" x2="25" y2="5" />
                      <line x1="25" y1="25" x2="42" y2="15" />
                      <line x1="25" y1="25" x2="42" y2="35" />
                      <line x1="25" y1="25" x2="25" y2="45" />
                      <line x1="25" y1="25" x2="8" y2="35" />
                      <line x1="25" y1="25" x2="8" y2="15" />
                  </g>

                  {/* Satellite Nodes (Smaller Spheres) */}
                  <circle cx="25" cy="5" r="3" fill="url(#gold-sphere)" />
                  <circle cx="42" cy="15" r="3" fill="url(#gold-sphere)" />
                  <circle cx="42" cy="35" r="3" fill="url(#gold-sphere)" />
                  <circle cx="25" cy="45" r="3" fill="url(#gold-sphere)" />
                  <circle cx="8" cy="35" r="3" fill="url(#gold-sphere)" />
                  <circle cx="8" cy="15" r="3" fill="url(#gold-sphere)" />

                  {/* Central Hub (Large 3D Sphere) */}
                  <circle cx="25" cy="25" r="9" fill="url(#gold-sphere)" filter="drop-shadow(0px 4px 4px rgba(0,0,0,0.5))" />
              </svg>
          </div>
          <span>{t('chains')}</span>
        </div>
      </div>

      {/* 3D KNOWLEDGE GRAPH BUTTON - THIRD */}
      <div 
        className={`nav-btn ${currentView === 'graph' ? 'active' : ''}`} 
        role="button" 
        tabIndex={0}
        onClick={() => onNavigate('graph')}
        data-testid="button-3d-graph"
      >
        <div className="nav-btn-content">
          <div className="nav-btn-icon-wrapper">
              <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      <radialGradient id="gold-node-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                          <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient id="gold-line" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#D97706" stopOpacity="0.2" />
                      </linearGradient>
                  </defs>
                  
                  {/* Complex Network Web - RECTANGULAR TOPOLOGY */}
                  <g stroke="url(#gold-line)" strokeWidth="1.5">
                      {/* Central Cluster to Mid Points */}
                      <line x1="25" y1="25" x2="8" y2="25" />
                      <line x1="25" y1="25" x2="42" y2="25" />
                      <line x1="25" y1="25" x2="25" y2="8" />
                      <line x1="25" y1="25" x2="25" y2="42" />
                      
                      {/* Outer Square Connections */}
                      <line x1="8" y1="8" x2="42" y2="8" />
                      <line x1="42" y1="8" x2="42" y2="42" />
                      <line x1="42" y1="42" x2="8" y2="42" />
                      <line x1="8" y1="42" x2="8" y2="8" />
                      
                      {/* Diagonals / Cross links */}
                      <line x1="8" y1="8" x2="25" y2="25" />
                      <line x1="42" y1="8" x2="25" y2="25" />
                      <line x1="8" y1="42" x2="25" y2="25" />
                      <line x1="42" y1="42" x2="25" y2="25" />
                  </g>

                  {/* Nodes (Glowing Dots) */}
                  <g fill="url(#gold-node-glow)">
                      {/* Center (Massive) */}
                      <circle cx="25" cy="25" r="7" />
                      
                      {/* Corners */}
                      <circle cx="8" cy="8" r="4.5" />
                      <circle cx="42" cy="8" r="4.5" />
                      <circle cx="8" cy="42" r="4.5" />
                      <circle cx="42" cy="42" r="4.5" />
                      
                      {/* Mid Points */}
                      <circle cx="25" cy="8" r="4" />
                      <circle cx="42" cy="25" r="4" />
                      <circle cx="25" cy="42" r="4" />
                      <circle cx="8" cy="25" r="4" />
                      
                      {/* Extra tiny nodes on lines */}
                      <circle cx="16" cy="16" r="3" opacity="0.7"/>
                      <circle cx="34" cy="34" r="3" opacity="0.7"/>
                      <circle cx="16" cy="34" r="3" opacity="0.7"/>
                      <circle cx="34" cy="16" r="3" opacity="0.7"/>
                  </g>
              </svg>
          </div>
          <span>{t('graph')}</span>
        </div>
      </div>
    </div>
  );
};

export default NavButtons;