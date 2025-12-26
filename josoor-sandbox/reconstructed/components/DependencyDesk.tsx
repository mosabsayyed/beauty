import React, { useState } from 'react';
import { NeoGraph } from '../../../components/graphv001/components/NeoGraph';
import { GapRecommendationPanel } from './GapRecommendationPanel'; // New component
import { Legend } from './Legend';
import '../josoor.css'; // Corrected import

// CHAIN_META updates
const CHAIN_META = {
  sector_ops: {
    label: 'Sector Ops',
    colors: {
      SectorDataTransaction: '#EC4899', // Pink
      SectorCitizen: '#3B82F6',         // Blue
      SectorBusiness: '#EF4444',        // Red
      SectorGovEntity: '#14B8A6',       // Teal
      Objective: '#F59E0B',
      Outcome: '#10B981'
    }
  }
};

export const DependencyDesk = ({ activeView, year, quarter, selectedYear }) => {
  // State for Gap Analysis
  const [analyzeGapsMode, setAnalyzeGapsMode] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  // Layout changes
  const containerStyle = {
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
    display: activeView === 'dependencies' ? 'flex' : 'none',
    flexDirection: 'column' as const,
    padding: 0
  };

  const numericYear = parseInt(selectedYear) || year || 2025;

  const handleNodeClick = (nodeId: string) => {
    // Safety check
    if (nodeId) setFocusedNodeId(nodeId);
  };

  return (
    <div style={containerStyle} className="dependency-desk-container">
      {/* Content Grid */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', height: '100%' }}>
        
        {/* Graph Panel */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
           {/* Analyze Gaps Button */}
           <button 
             onClick={() => setAnalyzeGapsMode(!analyzeGapsMode)}
             className="v2-btn" 
             style={{ 
               position: 'absolute', top: 10, right: 10, zIndex: 10,
               background: analyzeGapsMode ? '#D4AF37' : undefined,
               color: analyzeGapsMode ? '#000' : undefined
             }}
           >
             {analyzeGapsMode ? 'Close Analysis' : 'Analyze Gaps'}
           </button>

           <NeoGraph
             chainKey="sector_ops" 
             year={numericYear} 
             quarter={quarter}
             analyzeGaps={analyzeGapsMode} // Triggers server-side Cypher
             onNodeClick={handleNodeClick}
             legendConfig={CHAIN_META['sector_ops']} 
           />
           <Legend meta={CHAIN_META['sector_ops']} />
        </div>

        {/* Gap Recommendation Panel Integration */}
        {analyzeGapsMode && (
          <div style={{ 
            width: '350px', 
            height: '100%',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.8)' 
          }}>
            <GapRecommendationPanel 
              year={numericYear}
              quarter={quarter}
              onClose={() => setAnalyzeGapsMode(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
