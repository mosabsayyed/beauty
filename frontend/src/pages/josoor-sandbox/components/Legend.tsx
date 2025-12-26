import React from 'react';

interface LegendProps {
  meta: {
    label: string;
    colors: Record<string, string>;
  };
}

export const Legend: React.FC<LegendProps> = ({ meta }) => {
  if (!meta || !meta.colors) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      background: 'rgba(0,0,0,0.8)',
      border: '1px solid #D4AF37',
      borderRadius: '4px',
      padding: '12px',
      zIndex: 10,
      minWidth: '200px'
    }}>
      <h4 style={{ 
        color: '#D4AF37', 
        margin: '0 0 8px 0', 
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {meta.label}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Object.entries(meta.colors).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: color,
              border: '1px solid rgba(255,255,255,0.3)'
            }} />
            <span style={{ 
              color: '#fff', 
              fontSize: '11px',
              fontFamily: 'monospace'
            }}>
              {type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
