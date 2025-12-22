import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface DeepDivePanelProps {
  isOpen: boolean;
  node: {
    id: string;
    type: string;
    name: string;
    properties: Record<string, any>;
  } | null;
  year: string;
  onClose: () => void;
  onAskAgent: (question: string) => void;
}

const DeepDivePanel: React.FC<DeepDivePanelProps> = ({ 
  isOpen, 
  node, 
  year, 
  onClose, 
  onAskAgent 
}) => {
  // Fetch impact trace (bottom-up path to objective)
  const { data: impactTrace } = useQuery({
    queryKey: ['impact-trace', node?.id, year],
    queryFn: async () => {
      if (!node) return [];
      
      // Try to fetch the path to objectives
      const response = await fetch(`/api/neo4j/graph?nodeId=${node.id}&year=${year}&trace=true`);
      if (!response.ok) return [];
      
      const data = await response.json();
      // Extract the trace path
      return data.trace || [
        { type: node.type, name: node.name, current: true },
        { type: 'EntityCapability', name: 'Capability X', current: false },
        { type: 'SectorPerformance', name: 'KPI 2.1', current: false },
        { type: 'SectorObjective', name: 'Strategic Goal 1', current: false },
      ];
    },
    enabled: !!node && isOpen,
    staleTime: 30000
  });

  // Fetch related evidence
  const { data: evidence } = useQuery({
    queryKey: ['evidence', node?.id, year],
    queryFn: async () => {
      if (!node) return [];
      
      const response = await fetch(`/api/neo4j/graph?relatedTo=${node.id}&nodeType=SectorAdminRecord&year=${year}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.properties?.record_type || 'Document',
        content: n.properties?.content || n.label,
        date: n.properties?.publication_date || 'Unknown'
      }));
    },
    enabled: !!node && isOpen,
    staleTime: 30000
  });

  if (!node) return null;

  // Format property value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Key properties to highlight
  const keyProperties = [
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress' },
    { key: 'progress_percentage', label: 'Progress' },
    { key: 'owner', label: 'Owner' },
    { key: 'risk_owner', label: 'Owner' },
    { key: 'end_date', label: 'End Date' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'risk_score', label: 'Risk Score' },
    { key: 'priority_level', label: 'Priority' },
    { key: 'maturity_level', label: 'Maturity' },
  ];

  const displayedProperties = keyProperties
    .filter(p => node.properties[p.key] !== undefined)
    .map(p => ({ label: p.label, value: formatValue(node.properties[p.key]) }));

  return (
    <>
      {/* Overlay */}
      <div 
        className={`deep-dive-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`deep-dive-panel ${isOpen ? 'open' : ''}`}>
        <div className="deep-dive-header">
          <div>
            <div className="deep-dive-title">{node.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--jd-text-muted)', marginTop: '0.25rem' }}>
              {node.type.replace('Entity', '').replace('Sector', '')}
            </div>
          </div>
          <button className="deep-dive-close" onClick={onClose}>×</button>
        </div>

        <div className="deep-dive-body">
          {/* Properties Section */}
          <div className="deep-dive-section">
            <div className="deep-dive-section-title">Properties</div>
            <div className="property-grid">
              {displayedProperties.map((prop, i) => (
                <div key={i} className="property-item">
                  <div className="property-label">{prop.label}</div>
                  <div className="property-value">{prop.value}</div>
                </div>
              ))}
              <div className="property-item">
                <div className="property-label">ID</div>
                <div className="property-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {node.id}
                </div>
              </div>
              <div className="property-item">
                <div className="property-label">Type</div>
                <div className="property-value">{node.type}</div>
              </div>
            </div>
          </div>

          {/* Impact Trace Section */}
          <div className="deep-dive-section">
            <div className="deep-dive-section-title">Impact Trace (to Objective)</div>
            <div className="impact-trace">
              {impactTrace?.map((item: any, i: number) => (
                <div 
                  key={i} 
                  className={`trace-item ${item.current ? 'current' : ''}`}
                  style={{ 
                    background: item.current ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    borderRadius: '6px',
                    marginBottom: '0.5rem'
                  }}
                >
                  <div style={{ fontWeight: item.current ? 600 : 400 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--jd-text-muted)' }}>
                    {item.type.replace('Entity', '').replace('Sector', '')}
                  </div>
                </div>
              )) || (
                <div style={{ color: 'var(--jd-text-muted)', fontSize: '0.85rem' }}>
                  Loading trace...
                </div>
              )}
            </div>
          </div>

          {/* Evidence Section */}
          <div className="deep-dive-section">
            <div className="deep-dive-section-title">Related Evidence</div>
            {evidence?.length === 0 ? (
              <div style={{ color: 'var(--jd-text-muted)', fontSize: '0.85rem' }}>
                No linked evidence records
              </div>
            ) : (
              evidence?.map((doc: any, i: number) => (
                <div 
                  key={i}
                  style={{
                    background: 'var(--jd-bg-card)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📄</span>
                    <span style={{ flex: 1, fontSize: '0.85rem' }}>{doc.content}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--jd-text-muted)', marginTop: '0.25rem' }}>
                    {doc.type} • {doc.date}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* All Properties (Collapsible) */}
          <details className="deep-dive-section">
            <summary style={{ 
              cursor: 'pointer', 
              color: 'var(--jd-text-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              All Properties ({Object.keys(node.properties).length})
            </summary>
            <div style={{ marginTop: '1rem' }}>
              {Object.entries(node.properties).map(([key, value]) => (
                <div 
                  key={key}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--jd-border-soft)',
                    fontSize: '0.8rem'
                  }}
                >
                  <span style={{ color: 'var(--jd-text-muted)' }}>{key}</span>
                  <span style={{ color: 'var(--jd-text-secondary)', maxWidth: '60%', textAlign: 'right' }}>
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Ask Agent Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--jd-border-soft)',
          background: 'var(--jd-glass-bg)'
        }}>
          <button
            onClick={() => onAskAgent(`Tell me more about ${node.name} (${node.type})`)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--jd-cyan)',
              color: 'var(--jd-bg-canvas)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            💬 Ask Agent about this
          </button>
        </div>
      </div>
    </>
  );
};

export default DeepDivePanel;
