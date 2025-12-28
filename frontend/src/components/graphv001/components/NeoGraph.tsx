import React, { useEffect, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import ForceGraph2D from "react-force-graph-2d";
import { GraphData } from "../types"; // Presumed path based on context
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react"; // Imported in source [2]

interface NeoGraphProps {
  // OLD Interface (backward compatible)
  data?: GraphData;
  highlightPath?: string | null;
  highlightIds?: string[]; // NEW: Explicit ID highlighting per Source [2]
  showHealth?: boolean;
  isDark?: boolean;
  language?: string;
  onNodeClick?: (node: any) => void;
  nodeColor?: (node: any) => string; // NEW: Allow custom color function per Source [2]
  
  // NEW Interface (for chain-based fetching)
  chainKey?: string;
  year?: number;
  quarter?: string;
  analyzeGaps?: boolean;
  legendConfig?: any;
}

export function NeoGraph({ 
  data, 
  highlightPath: _highlightPath, 
  highlightIds, 
  showHealth: _showHealth, 
  isDark = true, 
  language = 'en', 
  onNodeClick, 
  nodeColor,
  chainKey,
  year,
  quarter,
  analyzeGaps = false,
  legendConfig
}: NeoGraphProps) {
  
  // State for fetched data
  const [internalData, setInternalData] = useState<GraphData>(data || { nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  
  // Fetch data if chainKey provided (NEW interface)
  useEffect(() => {
    if (chainKey) {
      setLoading(true);
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (quarter) params.append('quarter', quarter);
      if (analyzeGaps) params.append('analyzeGaps', 'true');
      
      fetch(`/api/business-chain/${chainKey}?${params}`)
        .then(r => r.json())
        .then(result => {
          setInternalData(result);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch chain data:', err);
          setLoading(false);
        });
    } else if (data) {
      // Use provided data (OLD interface)
      setInternalData(data);
    }
  }, [chainKey, year, quarter, analyzeGaps, data]);

  // Localization content per Source [3]
  const content = {
    switchTo2D: { en: 'Switch to 2D', ar: 'تبديل إلى 2D' },
    switchTo3D: { en: 'Switch to 3D', ar: 'تبديل إلى 3D' },
    controls3D: { en: 'Right Click + Drag: Rotate | Scroll: Zoom', ar: 'زر الماوس الأيمن + سحب: تدوير | التمرير: تكبير' },
    controls2D: { en: 'Click + Drag: Pan | Scroll: Zoom', ar: 'انقر واسحب: تحريك | التمرير: تكبير' }
  };

  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [is3D, setIs3D] = useState(true);

  // Resize handler per Source [4, 5]
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
      const type = node.labels?.[0] || node.type; 
      if (type && legendConfig.colors[type]) {
        return legendConfig.colors[type];
      }
    }

    return node.color || (isDark ? '#9CA3AF' : '#6B7280');
  };

  // 4. Broken Link Visualization (Red/Dashed)
  const resolveLinkColor = (link: any) => {
    if (link.properties?.status === 'critical' || link.properties?.virtual) return '#EF4444';
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
    linkDirectionalArrowLength: 3,
    linkDirectionalArrowRelPos: 1,
    linkCurvature: 0.1,
    backgroundColor: "rgba(0,0,0,0)",
    onNodeHover: setHoverNode,
    onNodeClick: (node: any) => onNodeClick && onNodeClick(node),
    cooldownTicks: 100,
    linkLineDash: (link: any) => (link.properties?.status === 'critical' || link.properties?.virtual) ? [5, 5] : null, // NEW: Support dashed lines for virtual/gap edges
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* View Toggle */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <Button onClick={() => setIs3D(!is3D)} size="sm" variant="outline">
          {is3D ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
          {is3D ? t('switchTo2D') : t('switchTo3D')}
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
