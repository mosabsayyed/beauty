import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NeoGraph } from '../../../components/graphv001/components/NeoGraph';
import { DependencyKnots } from './DependencyKnots';
import { MetricDetailsPanel } from './MetricDetailsPanel';
import '../josoor-v2.css';

interface DependencyDeskProps {
  quarter: string;
  year: string;
}

// Chain Filter Mapping (Internal Metadata for Legend/Style)
const CHAIN_META: Record<string, { labels: string[], colors: Record<string, string> }> = {
  '2.0_18': { 
      labels: ['SectorObjective', 'SectorPolicyTool', 'SectorAdminRecord', 'SectorStakeholder', 'SectorPerformance'], 
      colors: { 
        'SectorObjective': '#6366F1', // Indigo
        'SectorPolicyTool': '#8B5CF6', // Violet
        'SectorAdminRecord': '#64748B', // Slate
        'SectorStakeholder': '#94A3B8', // Light Slate
        'SectorPerformance': '#0EA5E9'  // Sky Blue
      } 
  },
  '2.0_19': { 
      labels: ['SectorObjective', 'SectorPolicyTool', 'EntityCapability', 'EntityProject', 'EntityChangeAdoption'], 
      colors: { 
        'SectorObjective': '#6366F1', 
        'SectorPolicyTool': '#8B5CF6', 
        'EntityCapability': '#14B8A6', // Teal
        'EntityProject': '#0D9488',    // Dark Teal
        'EntityChangeAdoption': '#D946EF' // Fuchsia
      } 
  },
  '2.0_20': { 
      labels: ['SectorObjective', 'SectorPerformance', 'EntityCapability', 'EntityProject', 'EntityChangeAdoption'], 
      colors: { 
        'SectorObjective': '#6366F1', 
        'SectorPerformance': '#0EA5E9', 
        'EntityCapability': '#14B8A6', 
        'EntityProject': '#0D9488', 
        'EntityChangeAdoption': '#D946EF' 
      } 
  },
  '2.0_21': { 
      labels: ['EntityChangeAdoption', 'EntityProject', 'EntityCapability', 'SectorPerformance', 'SectorPolicyTool', 'SectorObjective'], 
      colors: { 
        'EntityChangeAdoption': '#D946EF', 
        'EntityProject': '#0D9488', 
        'EntityCapability': '#14B8A6', 
        'SectorPerformance': '#0EA5E9', 
        'SectorPolicyTool': '#8B5CF6', 
        'SectorObjective': '#6366F1' 
      } 
  },
  '2.0_22': { 
      labels: ['EntityCapability', 'EntityRisk', 'SectorPolicyTool'], 
      colors: { 
        'EntityCapability': '#14B8A6', 
        'EntityRisk': '#94A3B8', 
        'SectorPolicyTool': '#8B5CF6' 
      } 
  },
  '2.0_23': { 
      labels: ['EntityCapability', 'EntityRisk', 'SectorPerformance'], 
      colors: { 
        'EntityCapability': '#14B8A6', 
        'EntityRisk': '#94A3B8', 
        'SectorPerformance': '#0EA5E9' 
      } 
  },
  '2.0_24': { 
      labels: ['EntityCultureHealth', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem', 'EntityVendor'], 
      colors: { 
        'EntityCultureHealth': '#6366F1', 
        'EntityOrgUnit': '#8B5CF6', 
        'EntityProcess': '#14B8A6', 
        'EntityITSystem': '#0D9488', 
        'EntityVendor': '#64748B' 
      } 
  }
};

const CHAIN_KEY_MAP: Record<string, string> = {
  '2.0_18': 'sector_ops',
  '2.0_19': 'strategy_to_tactics_priority',
  '2.0_20': 'strategy_to_tactics_targets',
  '2.0_21': 'tactical_to_strategy',
  '2.0_22': 'risk_build_mode',
  '2.0_23': 'risk_operate_mode',
  '2.0_24': 'internal_efficiency'
};

export const DependencyDesk: React.FC<DependencyDeskProps> = ({ quarter, year }) => {
  const [selectedChainId, setSelectedChainId] = useState<string>('2.0_18');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<any | null>(null);

  const { data: rawGraphData, isLoading: graphLoading, isError: graphError, isFetching: graphFetching, refetch: refetchGraph } = useQuery({
    queryKey: ['businessChain', selectedChainId, year, focusedNodeId],
    queryFn: async () => {
      const yearVal = (year === 'All' || !year) ? 'All' : year;
      const chainKey = CHAIN_KEY_MAP[selectedChainId] || 'sector_ops';
      
      const idParam = focusedNodeId ? `&id=${encodeURIComponent(focusedNodeId)}` : '';
      const url = `/api/business-chain/${chainKey}?year=${yearVal}${idParam}`;
      
      console.log(`[DependencyDesk] Fetching graph: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch chain trace');
      const result = await res.json();
      return result.nodes ? result : (result.results?.[0] || { nodes: [], links: [] });
    }
  });

  // Transform raw data (Apply colors from chainMeta)
  const graphData = React.useMemo(() => {
    if (!rawGraphData || !rawGraphData.nodes) return { nodes: [], links: [] };
    const meta = CHAIN_META[selectedChainId] || CHAIN_META['2.0_18'];
    
    // We strictly use base colors here. Highlighting is handled by NeoGraph via highlightIds.
    // However, we still want to flag "Challenged" nodes visibly if no KPI is active.
    
    const coloredNodes = (rawGraphData.nodes || []).map((n: any) => {
        const props = n.properties || {};
        
        // --- Red-for-Challenges Logic (Default View) ---
        const isChallenged = 
            (n.labels?.includes('SectorPerformance') && props.actual < props.target) ||
            (n.labels?.includes('EntityRisk') && (props.risk_score > 7 || props.status === 'Critical')) ||
            (n.labels?.includes('EntityProject') && props.status === 'Delayed') ||
            (props.status?.toLowerCase() === 'critical' || props.status?.toLowerCase() === 'high risk' || props.gap > 0);

        const primaryLabel = n.labels?.find((l: string) => meta.colors[l]) || n.labels?.[0];
        const baseColor = (meta && meta.colors && meta.colors[primaryLabel]) || 'var(--accent-gold)';
        
        // If NO KPI filter is active, show red for challenged. 
        // If KPI filter IS active, NeoGraph handles the red.
        const effectiveColor = (!activeKpiFilter && isChallenged) ? '#EF4444' : baseColor;

        return {
            ...n,
            color: effectiveColor,
            label: props.name || props.label || n.id,
            val: isChallenged ? 30 : 20
        };
    });

    return { nodes: coloredNodes, links: rawGraphData.links || [] };
  }, [rawGraphData, selectedChainId, activeKpiFilter]); 

  // No separate KPI query needed. KPIs come with the graph data now.
  const kpiData = rawGraphData?.kpis || [];
  const kpisLoading = graphLoading;
  const kpisError = graphError;
  const refetchKpis = refetchGraph;

  const chainOptions = [
    { id: '2.0_18', label: 'Sector Ops', desc: 'Objective → Policy → Records' },
    { id: '2.0_19', label: 'Strategy to Priority', desc: 'Strategy → Capability → Project' },
    { id: '2.0_20', label: 'Strategy to Targets', desc: 'Strategy → Performance → Project' },
    { id: '2.0_21', label: 'Tactical Feedback', desc: 'Adoption → Project → Strategy' },
    { id: '2.0_22', label: 'Risk (Build)', desc: 'Capability → Risk → Policy' },
    { id: '2.0_23', label: 'Risk (Operate)', desc: 'Capability → Risk → KPI' },
    { id: '2.0_24', label: 'Internal Efficiency', desc: 'Culture → Org → System → Vendor' },
  ];

  const handleKpiClick = (kpi: any) => {
      if (activeKpiFilter?.title === kpi.title) {
          setActiveKpiFilter(null);
      } else {
          setActiveKpiFilter(kpi);
      }
  };

  return (
    <div className="v2-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0, paddingBottom: '2rem' }}>
      
      {/* KPI STRIP */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {kpisLoading ? (
            [1,2,3].map(i => <div key={i} className="v2-panel v2-loading-skeleton" style={{ height: '40px', width: '200px', background: 'var(--component-panel-bg-alt)' }} />)
        ) : kpisError ? (
            <div className="v2-panel" style={{ flex: 1, padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', height: '40px' }}>
                <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>Failed to load health metrics.</span>
                <button onClick={() => refetchKpis()} className="v2-btn-sm" style={{ background: '#EF4444', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Retry</button>
            </div>
        ) : kpiData && Array.isArray(kpiData) ? kpiData.map((kpi: any, idx: number) => (
          <div 
            key={idx} 
            className={`v2-panel ${activeKpiFilter?.title === kpi.title ? 'v2-panel-active' : ''}`}
            onClick={() => handleKpiClick(kpi)}
            style={{ 
                padding: '0.4rem 1rem', 
                display: 'flex', 
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: `3px solid ${kpi.status === 'warning' ? '#F43F5E' : (activeKpiFilter?.title === kpi.title ? 'var(--accent-gold)' : 'transparent')}`,
                background: activeKpiFilter?.title === kpi.title ? 'rgba(239, 68, 68, 0.15)' : 'var(--component-panel-bg)',
                borderRadius: '4px',
                minWidth: '220px'
            }}
          >
            <div style={{ color: 'var(--component-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {kpi.title === 'Broken Links' && '⛓️'}
                {kpi.title === 'Overloaded Nodes' && '🔥'}
                {kpi.title === 'SPOF Nodes' && '⚡'}
                {kpi.title === 'Orphaned Nodes' && '🏚️'}
                {kpi.title}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: kpi.status === 'warning' ? '#F43F5E' : 'var(--accent-gold)' }}>
              {kpi.value}
            </div>
            <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: kpi.status === 'healthy' ? '#10B981' : '#F43F5E', boxShadow: `0 0 5px ${kpi.status === 'healthy' ? '#10B981' : '#F43F5E'}` }} />
          </div>
        ))
 : (
          <div className="v2-panel" style={{ flex: 1, padding: '0.5rem', textAlign: 'center', color: 'var(--component-text-muted)', fontSize: '0.8rem' }}>
              No health metrics available.
          </div>
        )}
      </div>

      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 320px', 
          gap: '0.75rem', 
          alignItems: 'start',
          height: '100%',
          overflow: 'visible' 
      }}>
        
        {/* GRAPH MAP */}
        <div className="v2-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '550px', minHeight: '550px' }}>
          <div className="v2-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
            <div>
                <h3 className="v2-panel-title">Cross-Cutting Dependency Map</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--component-text-muted)', margin: 0 }}>
                    {focusedNodeId ? `Focused on target node ${focusedNodeId}` : 'Tier 2 Resilient Logic View'}
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {focusedNodeId && (
                    <button 
                        onClick={() => setFocusedNodeId(null)}
                        className="btn btn-sm btn-outline-warning"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                    >
                        Reset Focus
                    </button>
                 )}
                <select 
                value={selectedChainId} 
                onChange={(e) => {
                    setSelectedChainId(e.target.value);
                    setFocusedNodeId(null);
                    setActiveKpiFilter(null);
                }}
                className="form-select v2-filter-select"
                style={{ width: 'auto', minWidth: '220px', background: 'var(--component-panel-bg-alt)' }}
                >
                {chainOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
                </select>
            </div>
          </div>
          
          <div style={{ flex: 1, position: 'relative', background: '#070b14', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            
            {(graphLoading || graphFetching) && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7, 11, 20, 0.9)', zIndex: 100, backdropFilter: 'blur(8px)', transition: 'opacity 0.3s ease' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <div className="v2-spinner" style={{ width: '60px', height: '60px', border: '4px solid rgba(212, 175, 55, 0.1)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'v2-spin 1s linear infinite' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--accent-gold)', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.2em', textShadow: '0 0 10px rgba(212,175,55,0.3)' }}>SYNCHRONIZING TRACE</div>
                            <div style={{ color: 'var(--component-text-muted)', fontSize: '0.7rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Traversing Business Chains...</div>
                        </div>
                    </div>
                </div>
            )}

            {graphError ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7, 11, 20, 0.8)', zIndex: 15 }}>
                     <div style={{ textAlign: 'center', padding: '2rem', background: '#0f172a', borderRadius: '1rem', border: '1px solid #ef4444', maxWidth: '300px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                        <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Trace Failed</h4>
                        <p style={{ color: 'var(--component-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>The graph engine encountered an error while traversing the business chain.</p>
                        <button onClick={() => refetchGraph()} className="v2-btn-sm" style={{ width: '100%', padding: '0.6rem', background: '#ef4444', border: 'none', color: 'white', fontWeight: 600, borderRadius: '0.4rem', cursor: 'pointer' }}>Retry Transaction</button>
                    </div>
                </div>
            ) : graphData && graphData.nodes.length > 0 ? (
                <NeoGraph 
                  data={graphData}
                  isDark={true}
                  language="en"
                  onNodeClick={(node) => setFocusedNodeId(node?.id || null)}
                  highlightIds={activeKpiFilter?.affected_ids || []}
                />
            ) : !graphFetching && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--component-text-muted)' }}>
                    No nodes found for this chain selection.
                </div>
            )}

            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Chain Composition</div>
                {(CHAIN_META[selectedChainId] || CHAIN_META['2.0_18']).labels.map(label => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ width: '10px', height: '10px', background: (CHAIN_META[selectedChainId] || CHAIN_META['2.0_18']).colors[label] || '#9CA3AF', borderRadius: '50%', boxShadow: `0 0 5px ${(CHAIN_META[selectedChainId] || CHAIN_META['2.0_18']).colors[label]}` }} /> 
                        {label.replace('Entity', '').replace('Sector', '')}
                    </div>
                ))}
                {!activeKpiFilter && (
                    <div key="challenge" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                        <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', boxShadow: '0 0 5px #EF4444' }} /> 
                        CHALLENGED / AT RISK
                    </div>
                )}
                {activeKpiFilter && (
                    <div key="affected" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                        <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', boxShadow: '0 0 5px #EF4444' }} /> 
                        AFFECTED BY {activeKpiFilter.title}
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* SIDE PANEL: CONDITIONAL */}
        <div style={{ height: '550px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {activeKpiFilter ? (
                 <MetricDetailsPanel 
                    metricTitle={activeKpiFilter.title}
                    affectedIds={activeKpiFilter.affected_ids || []}
                    nodes={graphData.nodes}
                    onNodeClick={(id) => setFocusedNodeId(id)}
                    onClose={() => setActiveKpiFilter(null)}
                 />
            ) : (
                <div className="v2-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--component-text-muted)', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem', opacity: 0.5 }}>📊</div>
                    <div style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                        Select a Health Metric<br/>to view affected nodes
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
