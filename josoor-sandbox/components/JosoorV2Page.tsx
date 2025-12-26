import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ControlTower } from './components/ControlTower';
import { DependencyDesk } from './components/DependencyDesk';
import { RiskDesk } from './components/RiskDesk';
import './josoor-v2.css';

export const JosoorV2Page: React.FC = () => {
  const navigate = useNavigate();
  const [quarter, setQuarter] = useState<string>('Q4');
  const [year, setYear] = useState<string>('2025');
  const [activeDesk, setActiveDesk] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('desk') || 'control-tower';
  });

  const quarters = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
  const years = ['All', '2025', '2026', '2027', '2028', '2029'];

  const getPageTitle = () => {
    switch (activeDesk) {
      case 'control-tower': return 'Transformation Control Tower';
      case 'dependency-desk': return 'Dependency Desk';
      case 'risk-desk': return 'Risk Desk';
      default: return 'Josoor Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (activeDesk) {
      case 'control-tower': return 'Executive Overview & Decision Support';
      case 'dependency-desk': return 'Business Chains & Bottleneck Identification';
      case 'risk-desk': return 'Threat Vectors & Propagation Paths';
      default: return 'V1.3 Spec Implementation';
    }
  };

  return (
    <div className="app-shell">
        {/* Sidebar */}
        <div className="app-sidebar">
            <div style={{ padding: '1.5rem', paddingBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--component-text-primary)' }}>JOSOOR</h1>
                <div style={{ fontSize: '0.8rem', color: 'var(--component-text-muted)' }}>V1.3 Spec Implementation</div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 0.5rem', gap: '0.35rem', marginTop: '0.5rem' }}>
                <div 
                    className={`nav-link ${activeDesk === 'control-tower' ? 'active' : ''}`}
                    onClick={() => setActiveDesk('control-tower')}
                    style={{ cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                    Control Tower
                </div>
                <div 
                    className={`nav-link ${activeDesk === 'dependency-desk' ? 'active' : ''}`}
                    onClick={() => setActiveDesk('dependency-desk')}
                    style={{ cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                    Dependency Desk
                </div>
                <div 
                    className={`nav-link ${activeDesk === 'risk-desk' ? 'active' : ''}`}
                    onClick={() => setActiveDesk('risk-desk')}
                    style={{ cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                    Risk Desk
                </div>
            </nav>

            {/* Universal Filters */}
            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--component-panel-border)', marginTop: '0.75rem' }}>
                <div className="v2-filter-group" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="v2-filter-item">
                        <label className="v2-filter-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Quarter</label>
                        <select 
                            value={quarter} 
                            onChange={(e) => setQuarter(e.target.value)}
                            className="form-select v2-filter-select"
                            style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem' }}
                        >
                            {quarters.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </div>
                    <div className="v2-filter-item">
                        <label className="v2-filter-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Year</label>
                        <select 
                            value={year} 
                            onChange={(e) => setYear(e.target.value)}
                            className="form-select v2-filter-select v2-filter-select-year"
                            style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem' }}
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="v2-header-divider" style={{ margin: '0.75rem 0' }} />

                <div className="v2-action-buttons" style={{ flexDirection: 'column', gap: '0.4rem' }}>
                    <button className="btn-secondary v2-action-btn" style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}>
                        Export
                    </button>
                    <button className="btn-primary v2-action-btn" style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}>
                        Share
                    </button>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="app-main">
            <header className="header-container" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--component-panel-border)', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h2 className="section-title" style={{ border: 'none', padding: 0, marginBottom: 0 }}>{getPageTitle()}</h2>
                        <div className="v2-page-subtitle" style={{ fontSize: '0.8rem' }}>{getPageSubtitle()}</div>
                    </div>
                    <button className="badge" onClick={() => navigate('/josoor-dashboards')}>Back to V1</button>
                </div>
            </header>

            <div style={{ padding: '0.75rem 1.5rem', display: 'block', width: '100%', height: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden' }}>
                {activeDesk === 'control-tower' && <ControlTower quarter={quarter} year={year} />}
                {activeDesk === 'dependency-desk' && <DependencyDesk quarter={quarter} year={year} />}
                {activeDesk === 'risk-desk' && <RiskDesk quarter={quarter} year={year} />}
            </div>
        </div>
    </div>
  );
};
