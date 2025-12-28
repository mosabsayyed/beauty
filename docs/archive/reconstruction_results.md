Based on the sources and our conversation history, here are the requested components and information.

### 1. Updated `NeoGraph.tsx`
This component acts as the "Universal Graph Renderer." It bridges the legacy interface (direct `data` injection) with the new V2 architecture (internal data fetching via `chainKey` and Server-Side Gap Analysis).

```tsx
import React, { useEffect, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react";

// Types
interface GraphNode {
  id: string;
  label?: string;
  color?: string;
  properties?: any;
}
interface GraphLink {
  source: string | any;
  target: string | any;
  properties?: any;
}
interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface NeoGraphProps {
  // --- OLD Interface ---
  data?: GraphData; // Optional now
  isDark?: boolean;
  language?: string;
  onNodeClick?: (node: any) => void;
  
  // --- NEW Interface (Self-Fetching) ---
  chainKey?: string;
  year?: number;
  quarter?: string;
  analyzeGaps?: boolean; // Triggers "Virtual Edge" injection from Backend
  legendConfig?: any;    // For coloring specific stakeholder types
  
  // --- Shared/Visuals ---
  highlightIds?: string[];
  nodeColor?: (node: any) => string;
}

export function NeoGraph({ 
  data: propsData, 
  chainKey,
  year = 2025,
  quarter = 'Q4',
  analyzeGaps = false,
  isDark = true, 
  language = 'en', 
  onNodeClick, 
  highlightIds,
  nodeColor,
  legendConfig
}: NeoGraphProps) {

  // State
  const [internalData, setInternalData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [hoverNode, setHoverNode] = useState<any>(null);
  
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // 1. Data Resolution Logic: Props vs. Fetch
  useEffect(() => {
    // If legacy data is provided, use it directly
    if (propsData) {
      setInternalData(propsData);
      return;
    }

    // Otherwise, fetch from Graph Server if chainKey exists
    if (chainKey) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Construct URL with Gap Analysis flag
          const url = new URL(`/api/business-chain/${chainKey}`, 'http://localhost:3001'); // Proxy handles domain in prod
          url.searchParams.append('year', year.toString());
          url.searchParams.append('quarter', quarter);
          if (analyzeGaps) {
            url.searchParams.append('analyzeGaps', 'true');
          }

          const res = await fetch(url.toString());
          const json = await res.json();
          
          // Basic normalization
          const nodes = json.nodes || [];
          const links = json.links || [];
          setInternalData({ nodes, links });
        } catch (error) {
          console.error("NeoGraph Fetch Error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [propsData, chainKey, year, quarter, analyzeGaps]);

  // 2. Responsive Sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 3. Coloring Logic (Supports Legend & Highlights)
  const resolveNodeColor = (node: any) => {
    // Explicit Highlight (Gap Analysis focus)
    if (highlightIds && highlightIds.length > 0) {
      return highlightIds.includes(node.id) ? '#EF4444' : (isDark ? 'rgba(75,85,99,0.2)' : 'rgba(200,200,200,0.2)');
    }

    // Custom Override
    if (nodeColor) return nodeColor(node);

    // Legend Config Match (Stakeholder Coloring)
    if (legendConfig && legendConfig.colors) {
      // Check node type/label against legend
      const type = node.labels?. || node.type; 
      if (type && legendConfig.colors[type]) {
        return legendConfig.colors[type];
      }
    }

    return node.color || (isDark ? '#9CA3AF' : '#6B7280');
  };

  // 4. Broken Link Visualization (Red/Dashed)
  const resolveLinkColor = (link: any) => {
    if (link.properties?.status === 'critical' || link.properties?.virtual) return '#EF4444'; // Red
    return isDark ? '#00FFFF' : '#0891B2';
  };

  const resolveLinkWidth = (link: any) => {
    return (link.properties?.status === 'critical' || link.properties?.virtual) ? 3 : 1;
  };

  // 5. Deep Clone to protect cache
  const graphData = React.useMemo(() => {
    return {
      nodes: internalData.nodes.map(n => ({ ...n })),
      links: internalData.links.map(l => ({ ...l }))
    };
  }, [internalData]);

  const commonProps = {
    ref: graphRef,
    width: dimensions.width,
    height: dimensions.height,
    graphData: graphData,
    nodeLabel: "label",
    nodeColor: resolveNodeColor,
    nodeRelSize: 6,
    linkColor: resolveLinkColor,
    linkWidth: resolveLinkWidth,
    linkDashArray: (link: any) => (link.properties?.virtual ? : undefined), // Dashed if virtual
    backgroundColor: "rgba(0,0,0,0)",
    onNodeHover: setHoverNode,
    onNodeClick: (node: any) => onNodeClick && onNodeClick(node),
    cooldownTicks: 100
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* View Toggle */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <Button onClick={() => setIs3D(!is3D)} size="sm" variant="outline">
          {is3D ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
          {is3D ? '2D View' : '3D View'}
        </Button>
      </div>

      {loading && <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff'}}>Loading Graph...</div>}

      {is3D ? <ForceGraph3D {...commonProps} /> : <ForceGraph2D {...commonProps} />}

      {/* Tooltip */}
      {hoverNode && (
        <Card className="absolute top-4 right-4 p-4 w-64 bg-black/80 text-white z-20 border-l-2 border-[#D4AF37]">
          <h3 className="font-bold">{hoverNode.properties?.name || hoverNode.id}</h3>
          <div className="text-xs mt-2">
             <p>Type: {hoverNode.labels?.join(', ')}</p>
             <p>Year: {hoverNode.properties?.year || year}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

### 2. GapRecommendationsPanel.tsx
This component was created to satisfy the requirement for submitting "Gap Analysis" results to Supabase. It features the specific "Gold Border" styling requested.

```tsx
import React, { useState } from 'react';
import '../josoor.css'; // Ensures V2 styles are applied

interface GapRecommendationsPanelProps {
  year: number;
  quarter: string;
  onClose: () => void;
}

export const GapRecommendationsPanel: React.FC<GapRecommendationsPanelProps> = ({ 
  year, 
  quarter, 
  onClose 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mocked detected gaps - in a real scenario, these might be passed in 
  // or fetched via a hook sharing the same 'analyzeGaps=true' context
  const detectedGaps = [
    { id: 'GAP-001', source: 'Strategic Obj', target: 'Ops Execution', type: 'Missing Process' },
    { id: 'GAP-002', source: 'Budget', target: 'Procurement', type: 'Broken Link' }
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // POST to the Graph Server/Backend endpoint
      const response = await fetch('/api/business-chain/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          quarter,
          items: detectedGaps,
          status: 'PENDING_APPROVAL'
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose(); // Close panel on success
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to submit recommendations", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="v2-panel" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      // CRITICAL: Gold Border per user requirement
      borderLeft: '2px solid #D4AF37',
      background: 'rgba(0, 0, 0, 0.85)',
      padding: '1.5rem',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#D4AF37' }}>Gap Recommendations</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
          The following gaps were detected in the <strong>{year} {quarter}</strong> topology:
        </p>
        
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {detectedGaps.map(gap => (
            <div key={gap.id} style={{ 
              padding: '0.75rem', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 'bold' }}>{gap.type}</div>
              <div style={{ fontSize: '0.85rem' }}>{gap.source} ➔ {gap.target}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {success ? (
          <div style={{ color: '#10B981', textAlign: 'center', padding: '0.5rem' }}>✓ Saved to Supabase</div>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="v2-btn"
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              backgroundColor: '#D4AF37', 
              color: '#000',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'wait' : 'pointer'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm & Save'}
          </button>
        )}
      </div>
    </div>
  );
};
```

---

### 3. Verify `DualLensHUD` Interface
Based on the final working state of `ControlTower.tsx` (Source 214, 215), the `DualLensHUD` component is designed to visualize the "Dual Lens" concept (Internal Operations vs. External Outcomes).

**Expected Props:**
It expects **three distinct data objects** corresponding to the three endpoints fetched by the Control Tower:
1.  **`dashboardData`** (or `data`): Internal operational metrics (KPIs, efficiency).
2.  **`outcomes`**: External impact data (Macroeconomic, Citizen Quality of Life).
3.  **`initiatives`**: Investment portfolio data (ROI, Risk, Alignment).

**Correct Interface:**
```tsx
interface DualLensHUDProps {
  data: any;        // from /api/v1/dashboard/dashboard-data
  outcomes: any;    // from /api/v1/dashboard/outcomes-data
  initiatives: any; // from /api/v1/dashboard/investment-initiatives
}
```
*Note: In some legacy code (Source 305), it was referred to as taking `{dashboardData}`, but the "End State" reconstruction explicitly fetches all three and passes them to populate the "Dual" view (Internal + External).*

---

### 4. List of ALL Files Changed (Dec 24-25)
This list encompasses every file modified, created, or touched during the reconstruction work documented in the logs.

**Core Infrastructure:**
1.  `setupProxy.js` (Heavily modified for routing restoration)
2.  `frontend/src/App.tsx` (Route registration for `/josoor` and `/josoor-v2`)
3.  `graph-server/routes.ts` (Endpoint fixes for `/api/dashboard/metrics`)
4.  `api_routing_map.md` (New documentation)

**Page Components (Josoor V10/Legacy Track):**
5.  `frontend/src/pages/josoor/JosoorPage.tsx` (Main entry point)
6.  `frontend/src/pages/josoor/components/DependencyDesk.tsx` (Layout, NeoGraph integration, CSS fixes)
7.  `frontend/src/pages/josoor/components/ControlTower.tsx` (Dual Lens integration, API fixes)
8.  `frontend/src/pages/josoor/components/RiskDesk.tsx` (Rectangular topology integration)
9.  `frontend/src/pages/josoor/josoor.css` (Updated with V2 styles)

**Shared/Sub-Components:**
10. `frontend/src/components/graphv001/components/NeoGraph.tsx` (Updated for hybrid data/fetching)
11. `frontend/src/pages/josoor/components/GapRecommendationsPanel.tsx` (Created new)
12. `frontend/src/pages/josoor/components/RiskTopologyMap.tsx` (Modified for Rectangles + L1/L2 stats)
13. `frontend/src/pages/josoor/components/DualLensHUD.tsx` (Fixed `rawData.filter` crash)
14. `frontend/src/pages/josoor/components/InternalOutputs.tsx` (Fixed `rawData.filter` crash)
15. `frontend/src/components/graphv001/components/ExecutiveSummary.tsx` (Identified as routing violator, patched)

**Documentation & Plans:**
16. `Implementation Plan` (Multiple versions)
17. `Walkthrough` (Multiple versions)
18. `PROTOCOL_STRICT.md` (Created)
19. `INVESTIGATION_TODOS.md` (Created)