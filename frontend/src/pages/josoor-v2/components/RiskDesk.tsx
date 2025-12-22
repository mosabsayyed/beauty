import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiskTopologyMap } from './RiskTopologyMap';
import '../josoor-v2.css';

interface RiskDeskProps {
  quarter: string;
  year: string;
}

export const RiskDesk: React.FC<RiskDeskProps> = ({ quarter, year }) => {
  // Simplified RiskDesk - Data fetching moved to TopologyMap
  return (
    <div className="v2-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', minHeight: 0 }}>
      {/* HEADER */}
      <div className="v2-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="v2-panel-title">System-Wide Risk Topology</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--component-text-muted)', margin: 0 }}>
                High-level architecture view showing entity volumes and relationships.
            </p>
          </div>
          <div>
               <span className="badge" style={{ background: '#EF4444', color: 'white' }}>Meta-View Active</span>
          </div>
      </div>

      {/* GRAPH AREA */}
      <div className="v2-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '500px' }}>
         <div style={{ flex: 1, position: 'relative', background: '#070b14', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <RiskTopologyMap year={year} quarter={quarter} />
            
            {/* Legend - Updated for Ontology Map */}
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.8)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', color: '#fff', pointerEvents: 'none' }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>ONTOLOGY LEGEND</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ width: 20, height: 2, background: '#10B981' }}></span> Active Link
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ width: 20, height: 2, background: '#EF4444', borderStyle: 'dashed' }}></span> Broken Link (Risk)
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
