import React, { useEffect, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import ForceGraph2D from "react-force-graph-2d";
import { GraphData } from "../types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react";

interface NeoGraphProps {
  data: GraphData;
  highlightPath?: string | null;
  showHealth?: boolean;
  isDark: boolean;
  language: string;
}

export function NeoGraph({ data, highlightPath: _highlightPath, showHealth: _showHealth, isDark, language }: NeoGraphProps) {
  const content = {
    switchTo2D: { en: 'Switch to 2D', ar: 'تبديل إلى 2D' },
    switchTo3D: { en: 'Switch to 3D', ar: 'تبديل إلى 3D' },
    controls3D: { en: 'Right Click + Drag: Rotate | Scroll: Zoom', ar: 'زر الماوس الأيمن + سحب: تدوير | التمرير: تكبير' },
    controls2D: { en: 'Click + Drag: Pan | Scroll: Zoom', ar: 'انقر واسحب: تحريك | التمرير: تكبير' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;
  const graphRef = useRef<any>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [is3D, setIs3D] = useState(true);

  useEffect(() => {
    if (containerRef.current) {
      setContainerDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }

    const handleResize = () => {
       if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Color logic - theme-aware
  const getNodeColor = (node: any) => {
    return node.color || (isDark ? '#9CA3AF' : '#6B7280');
  };

  // Deep clone data to prevent force-graph from mutating React Query cache
  // force-graph replaces link source/target strings with node object references
  const clonedData = React.useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    return {
      nodes: data.nodes.map(node => ({ ...node })),
      links: data.links.map(link => ({
        ...link,
        source: typeof link.source === 'object' ? link.source.id : link.source,
        target: typeof link.target === 'object' ? link.target.id : link.target
      }))
    };
  }, [data]);

  const commonProps: any = {
    ref: graphRef,
    width: containerDimensions.width,
    height: containerDimensions.height,
    graphData: clonedData,
    nodeLabel: "label",
    nodeColor: getNodeColor,
    nodeRelSize: 6,
    linkColor: () => isDark ? "#00FFFF" : "#0891B2",
    linkOpacity: 1,
    linkWidth: 2,
    backgroundColor: "rgba(0,0,0,0)",
    onNodeHover: setHoverNode,
    enableNavigationControls: true,
  };


  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}>
      {/* 2D/3D Toggle */}
      <div style={{ position: 'absolute', top: '1rem', right: '15rem', zIndex: 10 }}>
        <Button
          onClick={() => setIs3D(!is3D)}
          size="sm"
          style={{ 
            borderColor: isDark ? '#FFD700' : '#D97706', 
            color: isDark ? '#FFD700' : '#D97706',
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)'
          }}
          data-testid="button-toggle-dimension"
        >
          {is3D ? <Minimize2 style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} /> : <Maximize2 style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />}
          {is3D ? t('switchTo2D') : t('switchTo3D')}
        </Button>
      </div>

      {is3D ? (
        <ForceGraph3D
          {...commonProps}
          showNavInfo={false}
          onNodeClick={(node) => {
            // Zoom to node in 3D
            const distance = 40;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

            graphRef.current.cameraPosition(
              { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
              node,
              3000
            );
          }}
        />
      ) : (
        <ForceGraph2D
          {...commonProps}
          onNodeClick={(node) => {
            // Center on node in 2D
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(3, 1000);
          }}
        />
      )}
      
      {/* Custom Tooltip Overlay */}
      {hoverNode && (
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', pointerEvents: 'none', zIndex: 50 }}>
          <Card style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(212,175,55,0.5)', color: 'white', minWidth: '200px', maxWidth: '350px', maxHeight: '400px', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: isDark ? '#D4AF37' : '#B8860B', marginBottom: '0.5rem' }}>
              {hoverNode.label || hoverNode.id}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontFamily: 'monospace', color: isDark ? '#cbd5e1' : '#64748b' }}>
              {Object.entries(hoverNode)
                .filter(([key, value]) => {
                  // Skip internal graph properties
                  if (['id', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', '__indexColor', 'val', 'color', '__threeObj', '__lineObj', '__arrowObj', 'group', 'label'].includes(key)) return false;
                  // Skip properties starting with __ (internal)
                  if (key.startsWith('__')) return false;
                  // Skip object/function values
                  if (typeof value === 'object' || typeof value === 'function') return false;
                  return true;
                })
                .map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ opacity: 0.7 }}>{key}:</span>
                    <span style={{ textAlign: 'right', wordBreak: 'break-word' }}>
                      {value != null ? String(value) : 'N/A'}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', pointerEvents: 'none' }}>
        {is3D ? t('controls3D') : t('controls2D')}
      </div>
    </div>
  );
}
