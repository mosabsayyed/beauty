import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface Knot {
    knot_name: string;
    impact_count: number;
    status: string;
    knot_type: string;
    rank_score: number;
}

interface DependencyKnotsProps {
    year: string;
    chainKey?: string; // Add Chain Key for context-aware filtering
}

export const DependencyKnots: React.FC<DependencyKnotsProps> = ({ year, chainKey }) => {
  const { data: knots, isLoading } = useQuery<Knot[]>({
    queryKey: ['dependencyKnots', year, chainKey],
    queryFn: async () => {
      const yearVal = (year === 'all' || year === 'All' || !year) ? 'All' : year;
      const chainKeyParam = chainKey ? `&chainKey=${chainKey}` : '';
      const response = await fetch(`/api/control-tower/dependency-knots?year=${yearVal}${chainKeyParam}`);
      if (!response.ok) throw new Error('Failed to fetch knots');
      return response.json();
    }
  });

  return (
    <div className="v2-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="v2-panel-header">
        <h3 className="v2-panel-title">Top Dependency Knots (SPOF)</h3>
      </div>
      <div className="v2-list-container" style={{ 
          flex: 1, 
          padding: '0.75rem', 
          overflowY: 'auto', 
          maxHeight: '100%', 
          minHeight: 0,
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '0 0 0.8rem 0.8rem'
      }}>
        {isLoading ? (
          <div className="v2-loading-skeleton" style={{ height: '200px', width: '100%', background: 'var(--component-panel-bg-alt)', borderRadius: '0.5rem' }} />
        ) : knots && knots.length > 0 ? (
          knots.map((knot, idx) => (
            <div key={idx} className="v2-list-item" style={{ 
                marginBottom: '0.4rem', 
                padding: '0.5rem 0.6rem', 
                background: 'var(--component-panel-bg-alt)',
                border: '1px solid var(--component-panel-border)', 
                borderRadius: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                minWidth: 0
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.1rem' }}>
                    <span className="knot-name" style={{
                        fontWeight: 600,
                        color: 'var(--component-text-primary)',
                        fontSize: '0.75rem',
                        lineHeight: '1.2',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {knot.knot_name}
                    </span>
                    <span style={{ 
                        fontSize: '0.6rem', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '0.3rem',
                        background: knot.status.toLowerCase() === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: knot.status.toLowerCase() === 'critical' ? '#EF4444' : '#10B981',
                        border: `1px solid ${knot.status.toLowerCase() === 'critical' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                    }}>
                      {knot.status}
                    </span>
                  </div>
              
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--component-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: 'var(--accent-gold)', fontSize: '0.5rem' }}>●</span> {knot.knot_type.replace('Entity', '')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: '#EF4444', fontSize: '0.5rem' }}>▲</span> <strong>{knot.impact_count}</strong> Deps
                </span>
              </div>

              <div style={{ marginTop: '0.1rem' }}>
                  <div style={{ position: 'relative', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${Math.min(knot.impact_count * 15, 100)}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--accent-gold) 0%, #D97706 100%)',
                        borderRadius: '1px'
                    }} />
                  </div>
              </div>
            </div>
          ))
        ) : (
          <div className="v2-empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--component-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⛓️</div>
            No critical bottlenecks identified in current view
          </div>
        )}
      </div>
    </div>
  );
};
