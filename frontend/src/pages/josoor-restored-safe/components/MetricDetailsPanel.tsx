import React from 'react';
import '../josoor.css';

interface MetricDetailsPanelProps {
  metricTitle: string;
  affectedIds: string[];
  nodes: any[]; // Pass full node list to lookup names
  onNodeClick: (id: string) => void;
  onClose: () => void;
}

export const MetricDetailsPanel: React.FC<MetricDetailsPanelProps> = ({ metricTitle, affectedIds, nodes, onNodeClick, onClose }) => {
  // Lookup node details
  const affectedNodes = affectedIds.map(id => {
      const node = nodes.find(n => n.id === id);
      return {
          id,
          name: node?.properties?.name || node?.label || id,
          type: node?.labels?.[0] || 'Node'
      };
  });

  return (
    <div className="v2-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--component-panel-bg)', borderRadius: '8px', border: '1px solid var(--component-panel-border)', overflow: 'hidden' }}>
      {/* Header */}
      <div className="v2-panel-header" style={{ padding: '1rem', borderBottom: '1px solid var(--component-panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="v2-panel-title" style={{ fontSize: '1rem', color: '#EF4444' }}>{metricTitle}</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--component-text-muted)' }}>
                {affectedNodes.length} Items requiring attention
            </div>
          </div>
          <button onClick={onClose} className="v2-btn-sm" style={{ padding: '0.3rem 0.6rem', background: 'transparent', border: '1px solid var(--component-panel-border)' }}>
            Close
          </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {affectedNodes.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--component-text-muted)', fontSize: '0.8rem' }}>
                  No items found.
              </div>
          ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {affectedNodes.map((node, i) => (
                      <div 
                        key={node.id}
                        onClick={() => onNodeClick(node.id)}
                        style={{ 
                            padding: '0.75rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            borderLeft: '3px solid #EF4444',
                            transition: 'background 0.2s'
                        }}
                        className="v2-list-item"
                      >
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                              {i + 1}. {node.name}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};
