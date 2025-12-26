import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// --- DATA TYPES ---
interface RiskNode {
    id: string;
    label: string;
    count: number;
    val: number;
    stats: {
        red: number;
        amber: number;
        green: number;
    };
}

interface Edge {
    from: string;
    to: string;
    label?: string;
    fromHandle?: 't' | 'r' | 'b' | 'l';
    toHandle?: 't' | 'r' | 'b' | 'l';
}

// --- 1. COORDINATES (User Calibrated - Round 2) ---
const INITIAL_NODES: Record<string, { x: number, y: number, label: string }> = {
    "SectorObjective": {
      "x": 503.05554707845056,
      "y": 53.5630075505912,
      "label": "Objectives"
    },
    "SectorPolicyTool": {
      "x": 197.2222137451172,
      "y": 264.6872764215358,
      "label": "Policy Tools"
    },
    "SectorPerformance": {
      "x": 816.3888804117839,
      "y": 263.859338112238,
      "label": "Performance"
    },
    "SectorAdminRecord": {
      "x": 353.8888804117839,
      "y": 265.51521473083363,
      "label": "Admin Records"
    },

    "SectorCitizen": {
      "x": 502.2222137451172,
      "y": 181.8934454917536,
      "label": "Citizen"
    },
    "SectorBusiness": {
      "x": 505.55554707845056,
      "y": 263.03139980294014,
      "label": "Business"
    },
    "SectorGovEntity": {
      "x": 503.8888804117839,
      "y": 340.8576008769354,
      "label": "Government"
    },
    "SectorDataTransaction": {
      "x": 663.8888804117839,
      "y": 264.31930524332967,
      "label": "Transactions"
    },
    "EntityRisk": { "x": 503.88, "y": 440.67, "label": "Risks" },
    "EntityProject": { "x": 503.05, "y": 830.99, "label": "Projects" },
    "EntityCapability": { "x": 503.88, "y": 559.89, "label": "Capabilities" },
    "EntityVendor": { "x": 857.22, "y": 702.48, "label": "Vendor SLA" },
    "EntityCultureHealth": { "x": 143.88, "y": 701.93, "label": "Culture" },
    "EntityOrgUnit": { "x": 329.72, "y": 701.93, "label": "Organization" },
    "EntityProcess": { "x": 502.22, "y": 701.93, "label": "Processes" },
    "EntityITSystem": { "x": 681.38, "y": 702.48, "label": "IT Systems" },
    "EntityChangeAdoption": { "x": 503.05, "y": 970.91, "label": "Adoption" }
};

// --- 2. ONTOLOGY (User Calibrated Edges - Round 2) ---
// Filtered out self-loops (New Link to self)
const ONTOLOGY_EDGES: Edge[] = [
    { "from": "SectorPolicyTool", "to": "SectorAdminRecord", "label": "Refers To" },
    { "from": "SectorAdminRecord", "to": "SectorBusiness", "label": "Applied On" },
    { "from": "SectorAdminRecord", "to": "SectorGovEntity", "label": "Applied On" },
    { "from": "SectorAdminRecord", "to": "SectorCitizen", "label": "Applied On" },
    { "from": "SectorBusiness", "to": "SectorDataTransaction", "label": "Triggers" },
    { "from": "SectorGovEntity", "to": "SectorDataTransaction", "label": "Triggers" },
    { "from": "SectorCitizen", "to": "SectorDataTransaction", "label": "Triggers" },
    { "from": "SectorDataTransaction", "to": "SectorPerformance", "label": "Measured By" },
    { "from": "EntityCapability", "to": "EntityRisk", "label": "Monitors" },
    { "from": "EntityCapability", "to": "EntityOrgUnit", "label": "Role Gaps" },
    { "from": "EntityCapability", "to": "EntityProcess", "label": "Knw. Gaps" },
    { "from": "EntityCapability", "to": "EntityITSystem", "label": "Auto. Gaps" },
    { "from": "EntityOrgUnit", "to": "EntityCapability", "label": "Operates" },
    { "from": "EntityProcess", "to": "EntityCapability", "label": "Operates" },
    { "from": "EntityITSystem", "to": "EntityCapability", "label": "Operates" },
    { "from": "EntityCultureHealth", "to": "EntityOrgUnit", "label": "Monitors" },
    { "from": "EntityOrgUnit", "to": "EntityProcess", "label": "Apply" },
    { "from": "EntityProcess", "to": "EntityITSystem", "label": "Automate" },
    { "from": "EntityITSystem", "to": "EntityVendor", "label": "Depends" },
    { "from": "EntityOrgUnit", "to": "EntityProject", "label": "Scope" },
    { "from": "EntityProcess", "to": "EntityProject", "label": "Scope" },
    { "from": "EntityITSystem", "to": "EntityProject", "label": "Scope" },
    { "from": "EntityProject", "to": "EntityOrgUnit", "label": "Fixes" },
    { "from": "EntityProject", "to": "EntityProcess", "label": "Fixes" },
    { "from": "EntityProject", "to": "EntityITSystem", "label": "Fixes" },
    { "from": "EntityProject", "to": "EntityChangeAdoption", "label": "Risks" },
    { "from": "EntityChangeAdoption", "to": "EntityProject", "label": "Adoption" },
    // Custom / Calibrated Links
    { "from": "SectorBusiness", "to": "SectorBusiness", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "SectorCitizen", "to": "SectorCitizen", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "SectorCitizen", "to": "SectorCitizen", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "SectorBusiness", "to": "SectorBusiness", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "SectorDataTransaction", "to": "SectorDataTransaction", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "SectorGovEntity", "to": "SectorGovEntity", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "SectorPerformance", "to": "SectorPerformance", "fromHandle": "b", "toHandle": "b", "label": "Custom Link" },
    { "from": "EntityRisk", "to": "EntityRisk", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "SectorPolicyTool", "to": "SectorPolicyTool", "fromHandle": "b", "toHandle": "b", "label": "Custom Link" },
    { "from": "EntityRisk", "to": "EntityRisk", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "SectorPerformance", "to": "SectorPerformance", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "SectorPolicyTool", "to": "SectorPolicyTool", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "EntityOrgUnit", "to": "EntityOrgUnit", "fromHandle": "t", "toHandle": "t", "label": "Custom Link" },
    { "from": "EntityCapability", "to": "EntityCapability", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "EntityOrgUnit", "to": "EntityOrgUnit", "fromHandle": "b", "toHandle": "b", "label": "Custom Link" },
    { "from": "EntityProject", "to": "EntityProject", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "EntityProject", "to": "EntityProject", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "EntityITSystem", "to": "EntityITSystem", "fromHandle": "b", "toHandle": "b", "label": "Custom Link" },
    { "from": "EntityCapability", "to": "EntityCapability", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "SectorPolicyTool", "to": "SectorPolicyTool", "fromHandle": "t", "toHandle": "t", "label": "Custom Link" },
    { "from": "SectorObjective", "to": "SectorObjective", "fromHandle": "l", "toHandle": "l", "label": "Custom Link" },
    { "from": "SectorObjective", "to": "SectorObjective", "fromHandle": "r", "toHandle": "r", "label": "Custom Link" },
    { "from": "SectorPerformance", "to": "SectorPerformance", "fromHandle": "t", "toHandle": "t", "label": "Custom Link" }
];


interface RiskTopologyMapProps {
    year: string;
    quarter: string;
}

export const RiskTopologyMap: React.FC<RiskTopologyMapProps> = ({ year, quarter }) => {
    
    // --- STATE ---
    const [calibrationMode, setCalibrationMode] = useState(false);
    const [nodePositions, setNodePositions] = useState(INITIAL_NODES);
    const [edges, setEdges] = useState<Edge[]>(ONTOLOGY_EDGES);
    
    // Drag States
    const [dragNode, setDragNode] = useState<{ id: string, startX: number, startY: number } | null>(null);
    const [tempWire, setTempWire] = useState<{ fromId: string, fromHandle: 't'|'r'|'b'|'l', currX: number, currY: number } | null>(null);

    // --- DATA FETCH ---
    const { data: countsData } = useQuery({
        queryKey: ['businessChainCounts', year, quarter],
        queryFn: async () => {
            const res = await fetch(`/api/business-chain/counts?year=${year}&quarter=${quarter}`);
            if (!res.ok) throw new Error('Failed to fetch counts');
            return res.json();
        }
    });

    // --- UTILS ---
    const getCount = (label: string) => countsData?.nodeCounts?.[label] || 0;

    const getLinkStatus = (from: string, to: string) => {
        if (!countsData) return 'pending';
        const pairKey1 = `${from}-${to}`;
        const pairKey2 = `${to}-${from}`;
        const count = countsData.pairCounts?.[pairKey1] || countsData.pairCounts?.[pairKey2] || 0;
        return count > 0 ? 'active' : 'broken';
    };

    // --- GEOMETRY UTILS ---
    const getNodeRadius = (count: number) => Math.max(20, Math.min(60, Math.log(count + 1) * 7.5 + 20)); // Radius = Size / 2

    const getPortPosition = (nodeId: string, handle: 't'|'r'|'b'|'l', radius: number) => {
        const pos = nodePositions[nodeId];
        if (!pos) return { x: 0, y: 0 };
        
        // Scale Coordinate System (1000x1000)
        const r = radius; 

        switch (handle) {
            case 't': return { x: pos.x, y: pos.y - r };
            case 'r': return { x: pos.x + r, y: pos.y };
            case 'b': return { x: pos.x, y: pos.y + r };
            case 'l': return { x: pos.x - r, y: pos.y };
        }
    };

    // --- HANDLERS: NODE DRAG ---
    const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
        if (!calibrationMode) return;
        setDragNode({ id, startX: e.clientX, startY: e.clientY });
        e.stopPropagation();
    };

    const handleNodeMouseMove = (e: React.MouseEvent) => {
        // Handle Node Drag
        if (dragNode) {
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleX = 1000 / rect.width;
            const scaleY = 1000 / rect.height;
            const relX = (e.clientX - rect.left) * scaleX;
            const relY = (e.clientY - rect.top) * scaleY;
            
            setNodePositions(prev => ({
                ...prev,
                [dragNode.id]: { ...prev[dragNode.id], x: relX, y: relY }
            }));
            return;
        }

        // Handle Wire Drag
        if (tempWire) {
             const rect = e.currentTarget.getBoundingClientRect();
             const scaleX = 1000 / rect.width;
             const scaleY = 1000 / rect.height;
             const currX = (e.clientX - rect.left) * scaleX;
             const currY = (e.clientY - rect.top) * scaleY;
             
             setTempWire(prev => prev ? { ...prev, currX, currY } : null);
        }
    };
    
    const handleMouseUp = () => {
        if (dragNode) {
            setDragNode(null);
        }
        if (tempWire) {
            setTempWire(null); // Cancel wire if dropped on nothing
        }
    };

    // --- HANDLERS: PORT DRAG ---
    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, handle: 't'|'r'|'b'|'l') => {
        if (!calibrationMode) return;
        e.stopPropagation();
        e.preventDefault();
        
        // Start Wire
        const rect = e.currentTarget.closest('svg')?.getBoundingClientRect() || e.currentTarget.closest('.map-container')?.getBoundingClientRect(); // Fallback
        if (!rect) return;
        
        const scaleX = 1000 / rect.width;
        const scaleY = 1000 / rect.height;
        const startX = (e.clientX - rect.left) * scaleX;
        const startY = (e.clientY - rect.top) * scaleY;

        setTempWire({ fromId: nodeId, fromHandle: handle, currX: startX, currY: startY });
    };

    const handlePortMouseUp = (e: React.MouseEvent, targetId: string, targetHandle: 't'|'r'|'b'|'l') => {
        if (!tempWire) return;
        e.stopPropagation();
        
        // Complete Connection
        setEdges(prev => {
            const newEdges = [...prev];
            
            // FREE MODE LOGIC:
            // Check if this EXACT connection (same nodes, same handles) already exists.
            const exactMatchIndex = newEdges.findIndex(e => 
                e.from === tempWire.fromId && 
                e.to === targetId &&
                e.fromHandle === tempWire.fromHandle &&
                e.toHandle === targetHandle
            );

            if (exactMatchIndex >= 0) {
                // TOGGLE OFF: Deleting existing line
                newEdges.splice(exactMatchIndex, 1);
            } else {
                // TOGGLE ON: Adding new line
                newEdges.push({
                    from: tempWire.fromId,
                    to: targetId,
                    fromHandle: tempWire.fromHandle,
                    toHandle: targetHandle,
                    label: 'Custom Link' 
                });
            }
            return newEdges;
        });
        
        setTempWire(null);
    };

    // --- RENDER HELPERS ---
    const getNodeStyle = (id: string, x: number, y: number, count: number) => {
        const left = (x / 1000) * 100 + '%';
        const top = (y / 1000) * 100 + '%';
        const r = getNodeRadius(count);
        const size = r * 2;
        
        let color = '#10B981'; // Green
        if (count === 0) color = '#6B7280'; // Gray if 0
        
        return {
            left, top, width: size, height: size, backgroundColor: color
        };
    };

    // --- SVG PATH GENERATOR (Elbow / Orthogonal) ---
    const generatePath = (
        start: {x:number, y:number, h?: string}, 
        end: {x:number, y:number, h?: string}
    ) => {
        const path = [];
        path.push(`M ${start.x} ${start.y}`);
        
        // Midpoints
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Default logic if no handles (legacy)
        if (!start.h && !end.h) {
             if (Math.abs(end.y - start.y) > Math.abs(end.x - start.x)) {
                 path.push(`L ${start.x} ${midY} L ${end.x} ${midY}`);
             } else {
                 path.push(`L ${midX} ${start.y} L ${midX} ${end.y}`);
             }
        } 
        // Handle Logic (Port-based Elbow Routing)
        else {
            // Force exit direction with offset
            let p1 = { x: start.x, y: start.y };
            let p2 = { x: end.x, y: end.y };
            
            const offset = 20; // Stub length
            
            if (start.h === 't') p1.y -= offset;
            if (start.h === 'b') p1.y += offset;
            if (start.h === 'l') p1.x -= offset;
            if (start.h === 'r') p1.x += offset;

            if (end.h === 't') p2.y -= offset;
            if (end.h === 'b') p2.y += offset;
            if (end.h === 'l') p2.x -= offset;
            if (end.h === 'r') p2.x += offset;
            
            path.push(`L ${p1.x} ${p1.y}`);
            
            // Connect p1 to p2 using orthogonal steps
            const dX = p2.x - p1.x;
            const dY = p2.y - p1.y;
            
            // Heuristic matching handle orientation
            const startIsModV = start.h === 't' || start.h === 'b';
            
            if (startIsModV) {
                // Coming out Vertical
                path.push(`L ${p1.x} ${p1.y + dY/2}`); // Vertical half
                path.push(`L ${p2.x} ${p1.y + dY/2}`); // Horizontal full
            } else {
                // Coming out Horizontal
                 path.push(`L ${p1.x + dX/2} ${p1.y}`); // Horizontal half
                 path.push(`L ${p1.x + dX/2} ${p2.y}`); // Vertical full
            }
            
            path.push(`L ${p2.x} ${p2.y}`);
        }
        
        // Final endpoint
        path.push(`L ${end.x} ${end.y}`);
        const pathString = path.join(" ");
        
        // DEBUG: Log first 3 paths to console
        if (Math.random() < 0.1) {
            console.log('SVG Path:', pathString, 'Start:', start, 'End:', end);
        }
        
        return pathString;
    };

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#070b14', position: 'relative' }}>
            
            {/* TOOLBAR */}
            <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 100, padding: '10px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid #333', display: 'flex', gap: '10px' }}>
                 <button 
                    onClick={() => setCalibrationMode(!calibrationMode)}
                    style={{ padding: '5px 10px', background: calibrationMode ? '#EF4444' : '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                 >
                    {calibrationMode ? "Exit Calibration" : "Enter Calibration Mode"}
                 </button>
                 
                 {calibrationMode && (
                     <button
                        onClick={() => {
                            const config = JSON.stringify({ nodes: nodePositions, edges }, null, 2);
                            navigator.clipboard.writeText(config);
                            alert("Configuration copied to clipboard! Paste it into the chat.");
                            console.log("Configuration:", config);
                        }}
                        style={{ padding: '5px 10px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                     >
                        Copy Configuration
                     </button>
                 )}

                 <span style={{color: '#9CA3AF', fontSize: '0.8rem', alignSelf: 'center'}}>
                    {calibrationMode ? "Drag nodes/ports. Click 'Copy Config' when done." : "View Mode"}
                 </span>
            </div>

            {/* MAP CONTAINER */}
            <div 
                className="map-container"
                style={{ 
                    width: '100%', maxWidth: '1200px', aspectRatio: '1/1', 
                    margin: '0 auto', position: 'relative',
                    cursor: calibrationMode ? (tempWire ? 'crosshair' : 'default') : 'default'
                }}
                onMouseMove={handleNodeMouseMove}
                onMouseUp={handleMouseUp}
            >
                {/* 1. BACKGROUND */}
                <img 
                    src="/josoor_legacy/assets/risk_topology_clean.png" 
                    alt="Background" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', opacity: 1, zIndex: 0, position: 'relative' }} 
                />

                {/* 2. SVG LAYER (LINKS & WIRE) */}
                <svg viewBox="0 0 1000 1000" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                     <defs>
                        <marker id="arrow-green" viewBox="0 0 10 10" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#10B981" /></marker>
                        <marker id="arrow-red" viewBox="0 0 10 10" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#EF4444" /></marker>
                     </defs>
                     
                     {/* Existing Edges */}
                     {(() => {
                         console.log('🔍 EDGES DEBUG:', {
                             totalEdges: edges.length,
                             firstEdge: edges[0],
                             nodePositions: Object.keys(nodePositions)
                         });
                         return null;
                     })()}
                     {edges.map((edge, i) => {
                         const startNode = nodePositions[edge.from];
                         const endNode = nodePositions[edge.to];
                         if (!startNode || !endNode) {
                             console.warn(`⚠️ Missing node for edge ${i}:`, edge.from, '→', edge.to);
                             return null;
                         }
                         
                         const count = getCount(edge.from); // simplified sizing
                         const startR = getNodeRadius(count); // Not perfect as count varies, but close enough for anchor
                         const endCount = getCount(edge.to);
                         const endR = getNodeRadius(endCount);

                         const startPos = edge.fromHandle ? getPortPosition(edge.from, edge.fromHandle, startR) : startNode;
                         const endPos = edge.toHandle ? getPortPosition(edge.to, edge.toHandle, endR) : endNode;
                         
                         const status = getLinkStatus(edge.from, edge.to);
                         const isBroken = status === 'broken';
                         const color = isBroken ? '#EF4444' : '#10B981';
                         
                         const pathData = generatePath({ ...startPos, h: edge.fromHandle }, { ...endPos, h: edge.toHandle });
                         
                         if (i < 3) {
                             console.log(`📊 Edge ${i}:`, {
                                 from: edge.from,
                                 to: edge.to,
                                 color,
                                 opacity: isBroken ? 1.0 : 0.9,
                                 strokeWidth: isBroken ? 2 : 1.5,
                                 pathLength: pathData.length
                             });
                         }
                         
                         return (
                             <path 
                                key={i}
                                d={pathData} 
                                stroke={color} 
                                strokeWidth={isBroken ? 2 : 1.5} 
                                strokeDasharray={isBroken ? "5,5" : "0"}
                                fill="none"
                                opacity={isBroken ? 1.0 : 0.9}
                                markerEnd={`url(#arrow-${isBroken ? 'red' : 'green'})`}
                             />
                         );
                     })}

                     {/* Temporary Wire */}
                     {tempWire && (
                         <line 
                            x1={getPortPosition(tempWire.fromId, tempWire.fromHandle, getNodeRadius(getCount(tempWire.fromId))).x}
                            y1={getPortPosition(tempWire.fromId, tempWire.fromHandle, getNodeRadius(getCount(tempWire.fromId))).y}
                            x2={tempWire.currX}
                            y2={tempWire.currY}
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                         />
                     )}
                </svg>

                {/* 3. NODES & PORTS */}
                {Object.entries(nodePositions).map(([id, pos]) => {
                     const count = getCount(id);
                     const r = getNodeRadius(count);
                     const size = r * 2;
                     const { left, top, width, height, backgroundColor } = getNodeStyle(id, pos.x, pos.y, count);
                     
                     return (
                         <React.Fragment key={id}>
                             {/* The Component Node */}
                             <div 
                                onMouseDown={(e) => handleNodeMouseDown(e, id)}
                                style={{
                                    position: 'absolute',
                                    left, top, width, height,
                                    backgroundColor: calibrationMode ? '#3B82F6' : backgroundColor,
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 10,
                                    cursor: calibrationMode ? 'grab' : 'pointer',
                                    border: '2px solid rgba(255,255,255,0.2)'
                                }}
                                title={`${pos.label}`}
                             >
                                <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                                    <div style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>{pos.label}</div>
                                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}>{count}</div>
                                </div>
                             </div>

                             {/* Ports (Only in Calibration Mode) */}
                             {calibrationMode && (
                                 <>
                                     {['t', 'r', 'b', 'l'].map((h) => {
                                         const p = getPortPosition(id, h as any, r);
                                         return (
                                             <div
                                                key={h}
                                                onMouseDown={(e) => handlePortMouseDown(e, id, h as any)}
                                                onMouseUp={(e) => handlePortMouseUp(e, id, h as any)}
                                                style={{
                                                    position: 'absolute',
                                                    left: (p.x / 1000) * 100 + '%',
                                                    top: (p.y / 1000) * 100 + '%',
                                                    width: '12px', height: '12px',
                                                    backgroundColor: '#F59E0B', // Amber Ports
                                                    borderRadius: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: 20,
                                                    cursor: 'crosshair',
                                                    border: '1px solid white'
                                                }}
                                                title={`Port ${h.toUpperCase()}`}
                                             />
                                         );
                                     })}
                                 </>
                             )}
                         </React.Fragment>
                     );
                })}

            </div>
        </div>
    );
};
