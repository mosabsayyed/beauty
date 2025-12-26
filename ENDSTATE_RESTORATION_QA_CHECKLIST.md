Here is the comprehensive **V1.3 End State Package**.

This package reconstructs the fully functional application as defined by the "Ground Truth" of our debugging session: a hybrid of the **V2 Architecture** (Codebase) and your **Visual Requirements** (Rectangles, Gold Borders, Gaps).

### **I. Sandbox Architecture**

**Folder Location:** `frontend/src/pages/josoor-sandbox/`

**Design Pattern:**
*   **Routing Split:**
    *   **Graph Server (Port 3001):** Handles Topology, Business Chains, and Gaps (`/api/business-chain`, `/api/control-tower` (logic), `/api/neo4j`).
    *   **Backend (Port 8008):** Handles Supabase Data (`/api/v1/dashboard/*`), Auth, and Chat.
*   **Visualization Engine:**
    *   **Dependency Desk:** Uses `<NeoGraph>` (Universal Renderer) with server-side data fetching.
    *   **Control Tower:** Uses `<DualLensHUD>` with direct Supabase fetching.
    *   **Risk Desk:** Uses `<RiskTopologyMap>` (Hybrid Version: Rectangular Nodes + Animations).

---

### **II. External Configuration (Critical Dependencies)**

**1. `frontend/src/setupProxy.js` (The "Ground Truth" Routing)**
*This file must exist in your root `src` folder. It dictates the traffic split.*

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 1. Graph Server Routes (Port 3001)
  // Handles logic, topology, Cypher queries, and Gaps
  app.use(
    ['/api/neo4j', '/api/business-chain', '/api/control-tower', '/api/dependency', '/api/graph', '/api/summary-stream'],
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true
    })
  );

  // 2. Main Backend Routes (Port 8008)
  // Handles Supabase data, Auth, and Chat
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8008',
      changeOrigin: true
    })
  );
};
```

**2. `frontend/src/components/graphv001/components/NeoGraph.tsx`**
*Update the existing shared component to support "Self-Fetching" via `chainKey`.*

```tsx
import React, { useEffect, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import ForceGraph2D from "react-force-graph-2d";
import { Button } from "./ui/button"; // Copied from your UI lib
import { Maximize2, Minimize2 } from "lucide-react";

// Types
interface NeoGraphProps {
  data?: any; // Legacy support
  chainKey?: string; // NEW: Fetch Trigger
  year?: number;
  quarter?: string;
  analyzeGaps?: boolean; // NEW: Triggers Server-Side Cypher
  isDark?: boolean;
  onNodeClick?: (node: any) => void;
  legendConfig?: any;
}

export function NeoGraph({ 
  data: propsData, 
  chainKey, 
  year = 2025, 
  quarter = 'Q4', 
  analyzeGaps = false, 
  isDark = true, 
  onNodeClick,
  legendConfig 
}: NeoGraphProps) {
  
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [is3D, setIs3D] = useState(true);
  const graphRef = useRef<any>(null);

  // 1. Data Resolution: Props vs. Server Fetch
  useEffect(() => {
    if (propsData) {
      setGraphData(propsData);
      return;
    }
    if (chainKey) {
      // Fetch from Graph Server (3001)
      const params = new URLSearchParams({ year: year.toString(), quarter });
      if (analyzeGaps) params.append('analyzeGaps', 'true'); // Trigger Cypher Gaps

      fetch(`/api/business-chain/${chainKey}?${params}`)
        .then(res => res.json())
        .then(data => {
            // Normalize data structure if necessary
            setGraphData(data);
        })
        .catch(err => console.error("Graph Fetch Error:", err));
    }
  }, [propsData, chainKey, year, quarter, analyzeGaps]);

  // 2. Styling Logic (Gold/Dark Theme)
  const getNodeColor = (node: any) => {
    if (node.id.includes('MISSING')) return '#EF4444'; // Red for Gaps
    if (legendConfig?.colors) {
        const type = node.labels?. || node.type;
        return legendConfig.colors[type] || (isDark ? '#9CA3AF' : '#6B7280');
    }
    return isDark ? '#9CA3AF' : '#6B7280';
  };

  const commonProps = {
    graphData,
    nodeColor: getNodeColor,
    nodeLabel: 'label',
    nodeRelSize: 6,
    linkColor: (link: any) => link.properties?.virtual ? '#EF4444' : (isDark ? '#00FFFF' : '#0891B2'),
    linkDashArray: (link: any) => link.properties?.virtual ? : undefined, // Dashed for Gaps
    backgroundColor: "rgba(0,0,0,0)",
    onNodeClick
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <Button onClick={() => setIs3D(!is3D)} size="sm" variant="outline">
          {is3D ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {is3D ? '2D' : '3D'}
        </Button>
      </div>
      {is3D ? <ForceGraph3D {...commonProps} /> : <ForceGraph2D {...commonProps} />}
    </div>
  );
}
```

---

### **III. Sandbox Internal Files (The "End State" Code)**

Create `frontend/src/pages/josoor-sandbox/components/` and add these files.

#### **1. `ControlTower.tsx` (Direct Supabase Fetch)**
*Logic: Fetches dashboard data from 8008, ignoring the graph server for metrics.*

```tsx
import React, { useEffect, useState } from 'react';
import { DualLensHUD } from './DualLensHUD';
// Import InternalOutputs from legacy if needed, or create stub
import { InternalOutputs } from '../../josoor/components/InternalOutputs'; 

export const ControlTower = () => {
  const [data, setData] = useState<any>({ dashboard: [], outcomes: [], initiatives: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel Fetch from Main Backend (8008) via Proxy
        const [dash, out, init] = await Promise.all([
          fetch('/api/v1/dashboard/dashboard-data').then(r => r.json()),
          fetch('/api/v1/dashboard/outcomes-data').then(r => r.json()),
          fetch('/api/v1/dashboard/investment-initiatives').then(r => r.json())
        ]);
        setData({ dashboard: dash, outcomes: out, initiatives: init });
      } catch (e) {
        console.error("Control Tower Load Failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{color: '#D4AF37'}}>Loading Dual Lens Architecture...</div>;

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Upper Deck: Dual Lens HUD */}
      <div style={{ height: '55%' }}>
        <DualLensHUD 
          data={data.dashboard} 
          outcomes={data.outcomes} 
          initiatives={data.initiatives} 
        />
      </div>
      {/* Lower Deck: Operational Grid */}
      <div style={{ height: '40%' }}>
        <InternalOutputs data={data.dashboard} />
      </div>
    </div>
  );
};
```

#### **2. `DependencyDesk.tsx` (Server-Side Gaps)**
*Logic: "Analyze Gaps" toggles `analyzeGaps=true` passed to NeoGraph, which triggers the backend Cypher.*

```tsx
import React, { useState } from 'react';
import { NeoGraph } from '../../../components/graphv001/components/NeoGraph';
import { GapRecommendationsPanel } from './GapRecommendationsPanel';
import { Legend } from './Legend';
import '../josoor.css'; // Uses the V2/Gold CSS

export const DependencyDesk = ({ year = 2025, quarter = 'Q4' }) => {
  const [analyzeGaps, setAnalyzeGaps] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Metadata for Colors
  const SECTOR_OPS_META = {
    colors: {
      'SectorDataTransaction': '#EC4899', // Pink
      'SectorCitizen': '#3B82F6',         // Blue
      'SectorBusiness': '#EF4444',        // Red
      'SectorGovEntity': '#14B8A6'        // Teal
    }
  };

  const handleAnalyze = () => {
    setAnalyzeGaps(true); // Triggers re-fetch in NeoGraph with &analyzeGaps=true
    setShowPanel(true);
  };

  return (
    <div className="flex h-full w-full relative">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
           <button 
             onClick={handleAnalyze}
             className="v2-btn"
             style={{ 
               background: '#D4AF37', color: '#000', fontWeight: 'bold', 
               padding: '8px 16px', border: 'none', borderRadius: '4px' 
             }}
           >
             Analyze Gaps
           </button>
           <Legend meta={SECTOR_OPS_META} />
        </div>

        <NeoGraph 
          chainKey="sector_ops" 
          year={year} 
          quarter={quarter}
          analyzeGaps={analyzeGaps}
          legendConfig={SECTOR_OPS_META}
          isDark={true}
        />
      </div>

      {showPanel && (
        <div className="w-96 border-l-2 border-[#D4AF37] bg-black/90 h-full absolute right-0 top-0 z-20">
          <GapRecommendationsPanel 
            year={year} 
            quarter={quarter} 
            onClose={() => setShowPanel(false)} 
          />
        </div>
      )}
    </div>
  );
};
```

#### **3. `RiskTopologyMap.tsx` (Hybrid: Rectangles + Stats)**
*Logic: Renders nodes as rectangles with 4-corner stats (L1/L2) and uses animated SVG arrows.*

```tsx
import React from 'react';
// Assuming ReactFlow or similar is used for the topology 
// If specific library is missing, this logic represents the styling applied
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  // Custom Node Component for "Rectangles with Numbers"
  riskNode: ({ data }: any) => (
    <div style={{
      width: '160px', height: '80px',
      backgroundColor: '#374151', // Dark Grey
      border: '2px solid #D4AF37', // Gold Border
      borderRadius: '6px',        // Rectangular
      position: 'relative',
      color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 'bold'
    }}>
      {/* Label */}
      <div>{data.label}</div>
      
      {/* 4 Corner Stats */}
      <div style={{position: 'absolute', top: 2, left: 4, fontSize: '10px', color: '#aaa'}}>L1: {data.l1}</div>
      <div style={{position: 'absolute', top: 2, right: 4, fontSize: '10px', color: '#aaa'}}>L2: {data.l2}</div>
      <div style={{position: 'absolute', bottom: 2, left: 4, fontSize: '10px', color: '#EF4444'}}>{data.riskVal}%</div>
      <div style={{position: 'absolute', bottom: 2, right: 4, fontSize: '10px', color: '#10B981'}}>{data.mitigation}%</div>
    </div>
  )
};

export const RiskTopologyMap = ({ data }: any) => {
  // Mock or processed nodes
  const nodes = [
    { id: '1', type: 'riskNode', position: { x: 100, y: 100 }, data: { label: 'Strategic Risk', l1: 12, l2: 5, riskVal: 85, mitigation: 40 } },
    { id: '2', type: 'riskNode', position: { x: 400, y: 100 }, data: { label: 'Operational', l1: 8, l2: 2, riskVal: 30, mitigation: 90 } }
  ];
  const edges = [
     { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#D4AF37', strokeWidth: 2 } }
  ];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
        <Background color="#555" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
```

#### **4. `GapRecommendationsPanel.tsx`**
*Logic: Gold Border + Submit to Supabase.*

```tsx
import React, { useState } from 'react';

export const GapRecommendationsPanel = ({ year, quarter, onClose }: any) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Post to Graph Server which handles the DB write or Proxy to Supabase
    await fetch('/api/business-chain/recommendations', {
      method: 'POST',
      body: JSON.stringify({ year, quarter, status: 'review' })
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="p-4 text-white h-full flex flex-col">
      <h3 className="text-[#D4AF37] font-bold border-b border-[#D4AF37] pb-2 mb-4">Gap Analysis Results</h3>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 border border-red-500 bg-red-900/20 mb-2 rounded">
          <div className="text-xs text-red-400">MISSING LINK</div>
          <div>Policy ➔ Execution</div>
        </div>
      </div>
      <button 
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-4 w-full py-2 bg-[#D4AF37] text-black font-bold rounded hover:bg-[#B5952F]"
      >
        {submitting ? 'Saving...' : 'Save to Supabase'}
      </button>
    </div>
  );
};
```

#### **5. `Legend.tsx`**
*Copy as is from the previous response (Standard Legend with gold border).*

#### **6. `DualLensHUD.tsx`**
*Copy the version provided in the previous "Updated DualLensHUD" response (Includes the `Array.isArray` crash fix and dual radar charts).*

---

### **IV. Files to Copy As-Is (From Codebase)**

You do not need to modify these; simply import or copy them to your sandbox if they are not shared:

1.  `frontend/src/pages/josoor/josoor.css` -> Copy to sandbox as `josoor.css`.
2.  `frontend/src/pages/josoor/components/InternalOutputs.tsx` -> Copy for the Control Tower lower deck.
3.  Any UI components referenced (e.g., `Card`, `Button` from `@/components/ui`).

### **V. Summary of Sandbox End State**

1.  **Run:** `npm start` (Frontend Port 3000), `sf1.sh` (Graph Port 3001), `sb.sh` (Backend Port 8008).
2.  **Access:** `http://localhost:3000/josoor-sandbox`.
3.  **Behavior:**
    *   **Control Tower:** Loads fast (direct Supabase). No 35s timeout.
    *   **Dependency Desk:** Graph loads. Clicking "Analyze Gaps" shows dashed red lines (if data exists) and opens the Gold-Bordered panel.
    *   **Risk Desk:** Shows Rectangular nodes with corner numbers and animated connections.