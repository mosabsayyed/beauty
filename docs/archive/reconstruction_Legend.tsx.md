Based on the sources, the `Legend` component is referenced in the implementation plans (e.g., Diff 01, Diff 02) as a requirement to decode the specific node colors for the **Sector Ops** business chain (e.g., Pink for "Data Transaction", Blue for "Citizen"). Since it is not listed in the baseline documentation, it is treated as a component that needs to be created to support the visual requirements of the **Dependency Desk**.

Here is the reconstructed `Legend.tsx` file:

### `frontend/src/pages/josoor-v2/components/Legend.tsx`

```tsx
import React from 'react';
import '../josoor.css'; // Ensures Gold/Dark theme variables are available

interface ChainMeta {
  label?: string;
  colors: Record<string, string>;
  labels?: Record<string, string>; // Optional explicit mapping if keys aren't readable
}

interface LegendProps {
  meta?: ChainMeta;
}

export const Legend: React.FC<LegendProps> = ({ meta }) => {
  // 1. Safety Check: If no metadata or colors are provided, render nothing.
  if (!meta || !meta.colors) return null;

  // 2. Helper to format keys into readable labels (e.g., 'SectorDataTransaction' -> 'Data Transaction')
  // Sources require "Data Transaction", "Citizen", "Business" to appear.
  const getLabel = (key: string) => {
    if (meta.labels && meta.labels[key]) return meta.labels[key];
    
    return key
      .replace(/Sector/g, '')        // Remove 'Sector' prefix
      .replace(/([A-Z])/g, ' $1')    // Add space before capitals
      .trim();                       // 'DataTransaction' -> 'Data Transaction'
  };

  return (
    <div 
      className="v2-panel" 
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '1rem',
        backgroundColor: 'rgba(17, 24, 39, 0.9)', // Dark Grey matching Risk Desk
        border: '1px solid #D4AF37',             // Gold Border per theme
        borderRadius: '6px',
        maxWidth: '250px',
        zIndex: 10, // Ensure it sits above the NeoGraph canvas
        color: '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}
    >
      {/* 3. Title derived from Meta label (e.g., "Sector Ops") */}
      {meta.label && (
        <h4 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '0.9rem', 
          color: '#D4AF37', 
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          paddingBottom: '0.25rem'
        }}>
          {meta.label} Legend
        </h4>
      )}

      {/* 4. Color Swatches */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Object.entries(meta.colors).map(([key, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
            {/* Color Circle */}
            <span 
              style={{ 
                display: 'inline-block',
                width: '12px', 
                height: '12px', 
                backgroundColor: color, 
                borderRadius: '50%', 
                marginRight: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }} 
            />
            {/* Label */}
            <span>{getLabel(key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Explanation of Implementation
*   **Props Interface:** It accepts a `meta` object containing `colors` (mapping types like `SectorCitizen` to hex codes) and an optional `label` for the header.
*   **Label Formatting:** The `getLabel` function automatically strips the "Sector" prefix and adds spacing (e.g., `SectorDataTransaction` becomes "Data Transaction"), satisfying the requirement in **Diff 01** to verify specific human-readable labels exist.
*   **Styling:** It applies the **Gold Theme** (Dark Grey background `#111827`, Gold Border `#D4AF37`) consistent with the "Risk Desk" and "Gap Recommendation Panel" styles defined in the walkthrough and implementation plans.
*   **Positioning:** It uses absolute positioning (`bottom: 20px`, `left: 20px`) to float over the graph visualization, which is the standard layout for D3/Graph dashboards.