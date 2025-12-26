import React, { useState } from 'react';
import '../josoor.css';

interface RiskBubbleProps {
    data: {
        nodes: any[];
        links: any[];
    };
}

export const RiskBubbleChart: React.FC<RiskBubbleProps> = ({ data }) => {
    const [hoveredNode, setHoveredNode] = useState<any | null>(null);

    // 1. Sort nodes (Biggest errors first, then volume)
    const nodes = [...data.nodes].sort((a, b) => {
        // High Red% comes first
        const aRed = a.stats.red || 0;
        const bRed = b.stats.red || 0;
        return bRed - aRed; 
    });

    // 2. Layout Calculation (Simple Grid/Pack)
    // We'll use a flex-wrap container instead of complex D3 packing for robust responsiveness
    
    // Helper: Calculate Color based on R/G/Y saturation
    const getHealthColor = (stats: any) => {
        const total = (stats.red || 0) + (stats.amber || 0) + (stats.green || 0);
        if (total === 0) return '#64748B'; // Gray

        const redRatio = (stats.red || 0) / total;
        const amberRatio = (stats.amber || 0) / total;

        if (redRatio > 0.1) return '#EF4444'; // >10% Critical is Red
        if (redRatio > 0.05 || amberRatio > 0.2) return '#F59E0B'; // Warning
        return '#10B981'; // Healthy
    };

    // Helper: Font size based on volume
    const getScale = (val: number) => {
        return Math.max(0.6, Math.min(1.5, Math.log10(val + 1) * 0.5));
    };

    return (
        <div style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'center', height: '100%', overflowY: 'auto' }}>
            {nodes.map(node => {
                const color = getHealthColor(node.stats);
                const size = 80 + (Math.log(node.val + 1) * 20); // Base 80px + Log scale
                
                return (
                    <div 
                        key={node.id}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '50%',
                            background: `radial-gradient(circle at 30% 30%, ${color}, #000)`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 15px ${color}40`,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            border: '1px solid rgba(255,255,255,0.1)',
                            position: 'relative'
                        }}
                        className="v2-bubble-node"
                    >
                        <div style={{ fontSize: `${getScale(node.val)}rem`, fontWeight: 800, color: 'white', textShadow: '0 2px 4px black', textAlign: 'center', lineHeight: 1.2 }}>
                            {node.val}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.2rem', textAlign: 'center', maxWidth: '90%' }}>
                            {node.label.replace('Entity', '').replace('Sector', '')}
                        </div>

                        {/* Tooltip Overlay (Only visible on hover) */}
                        {hoveredNode?.id === node.id && (
                            <div style={{
                                position: 'absolute',
                                bottom: '110%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(15, 23, 42, 0.95)',
                                border: `1px solid ${color}`,
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                minWidth: '180px',
                                zIndex: 50,
                                backdropFilter: 'blur(4px)',
                                pointerEvents: 'none',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}>
                                <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>
                                    {node.label}
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem', color: '#EF4444' }}>
                                    <span>Needs Attention:</span>
                                    <strong>{node.stats.red}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem', color: '#F59E0B' }}>
                                    <span>At Risk:</span>
                                    <strong>{node.stats.amber}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#10B981' }}>
                                    <span>Healthy:</span>
                                    <strong>{node.stats.green}</strong>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {nodes.length === 0 && (
                <div style={{ color: 'var(--component-text-muted)' }}>No data found.</div>
            )}
        </div>
    );
};
