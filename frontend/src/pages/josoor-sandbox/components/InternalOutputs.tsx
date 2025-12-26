import React, { useState, useEffect } from 'react';
import DimensionModule from '../../../components/graphv001/components/DimensionModule';
import type { Dimension } from '../../../components/graphv001/types';
import '../../../components/graphv001/GraphDashboard.css'; // Required for DimensionModule styles
import './InternalOutputs.css';

interface InternalOutputsProps {
  quarter: string;
  year: string;
  dashboardData?: any[]; // Passed from ControlTower - avoids duplicate fetch
}

// Transform raw API response to Dimension type
// Backend returns ALL quarters so we filter client-side
const transformToDimensions = (rawData: any[], targetQuarter?: string): Dimension[] => {
  // If no target quarter specified, find the latest quarter in the data
  let quarterToUse = targetQuarter;
  if (!quarterToUse || quarterToUse === 'All All' || quarterToUse.includes('All')) {
    // Extract all unique quarters
    const quarters = [...new Set(rawData.map(r => r.quarter))];
    
    // Sort chronologically: Year then Quarter (e.g. "Q4 2025" < "Q1 2026")
    quarters.sort((a, b) => {
      const partsA = a.split(' ');
      const partsB = b.split(' ');
      
      // If formats don't match expected "Q# YYYY", fallback to string sort
      if (partsA.length < 2 || partsB.length < 2) return a.localeCompare(b);
      
      const yearA = parseInt(partsA[1]);
      const yearB = parseInt(partsB[1]);
      
      if (yearA !== yearB) return yearA - yearB;
      
      const qA = parseInt(partsA[0].replace('Q', ''));
      const qB = parseInt(partsB[0].replace('Q', ''));
      
      return qA - qB;
    });

    quarterToUse = quarters[quarters.length - 1]; // Latest quarter
  }
  
  // Filter by the determined quarter
  const filteredData = rawData.filter(row => row.quarter === quarterToUse);
  
  // Should have exactly 8 records (one per dimension) for the quarter
  // Sort explicitly by Lens A order
  const ORDER = [
    'Strategic Plan Alignment',
    'Operational Efficiency',
    'Risk Mitigation Rate',
    'Investment Portfolio ROI',
    'Active Investor Rate',
    'Employee Engagement Score',
    'Project Delivery Velocity',
    'Tech Stack SLA Compliance'
  ];

  filteredData.sort((a, b) => {
    const idxA = ORDER.indexOf(a.dimension_title);
    const idxB = ORDER.indexOf(b.dimension_title);
    // If not found, put last
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });
  

  // Determine Previous Quarter for Lookup
  // Format: "Q3 2026" -> "Q2 2026"
  let previousQuarter = "";
  if (quarterToUse) {
      const parts = quarterToUse.split(' ');
      if (parts.length >= 2) {
          const qStr = parts[0];
          const yNum = parseInt(parts[1]);
          const qNum = parseInt(qStr.replace('Q', ''));
          
          if (qNum === 1) {
              previousQuarter = `Q4 ${yNum - 1}`;
          } else {
              previousQuarter = `Q${qNum - 1} ${yNum}`;
          }
      }
  }

  return filteredData.map((row, index) => {
    const actual = Number(row.kpi_actual);
    const target = Number(row.kpi_planned);
    const finalTarget = Number(row.kpi_final_target);
    const deltaVal = Number(row.health_score);
    
    // Previous Value Lookup Logic
    // User Requirement: "Previous is the Actual for the previous quarter"
    // We look for a row in rawData with same title and previousQuarter
    let previousValue = Number(row.kpi_base_value); // Default fallback
    
    if (previousQuarter) {
        const prevRow = rawData.find(r => 
            r.dimension_title === row.dimension_title && 
            r.quarter === previousQuarter
        );
        if (prevRow) {
            previousValue = Number(prevRow.kpi_actual);
        } else {
             // If no exact Q-1, maybe fallback to previous_kpi if available, or keep base
             if (row.previous_kpi) previousValue = Number(row.previous_kpi);
        }
    }

    const trendDirection: 'up' | 'down' | 'steady' = 
        deltaVal > 0.001 ? 'up' : (deltaVal < -0.001 ? 'down' : 'steady');

    const maxVal = finalTarget > 0 ? Number(finalTarget) : 100;

    // Logic for percentage display based on dimension type
    // List of metrics that really should be percentages
    // Now including 'Score' to catch 'Employee Engagement Score' (9.4 -> 94%)
    const percentageMetrics = /(Rate|Alignment|Efficiency|Compliance|ROI|Velocity|Score)/i;
    
    // Check if we should format as percentage
    const isPercentage = percentageMetrics.test(row.dimension_title);
    
    let displayValue = actual;
    let displayBaseline = previousValue;
    let displayNextTarget = Number(row.kpi_next_target || target);
    
    // STRICT NORMALIZATION: Only normalize specific metrics as requested.
    // "Employee Engagement Score" and "Investment Portfolio ROI"
    // Heuristics removed.
    const needsNormalization = row.dimension_title.includes('Employee Engagement') || row.dimension_title.includes('Investment Portfolio ROI');

    if (isPercentage && finalTarget > 0) {
        if (needsNormalization) {
             // Score/Ratio mode -> Normalize
             displayValue = (actual / finalTarget) * 100;
             displayBaseline = (displayBaseline / finalTarget) * 100;
             displayNextTarget = (displayNextTarget / finalTarget) * 100;
        }
        // Else: Assume Native Percentage (e.g. Rate, Risk Mitigation) -> Keep raw.
        
        // Round all to 1 decimal
        displayValue = Number(displayValue.toFixed(1));
        displayBaseline = Number(displayBaseline.toFixed(1));
        displayNextTarget = Number(displayNextTarget.toFixed(1));
    }

    // Define missing variables for the transformed object
    const baseline = Number(row.kpi_base_value || 0);
    const normalizedActual = maxVal > 0 ? Math.min((actual / maxVal) * 100, 100) : 0;
    const normalizedPlanned = maxVal > 0 ? Math.min((target / maxVal) * 100, 100) : 0;

    const transformed = {
      id: row.dimension_id || `dim-${index}`,
      title: row.dimension_title,
      label: row.dimension_title,
      kpi: `${displayValue}${isPercentage ? '%' : ''}`,
      lastQuarterKpi: `${displayBaseline}${isPercentage ? '%' : ''}`,
      nextQuarterKpi: `${displayNextTarget}${isPercentage ? '%' : ''}`,
      delta: deltaVal,
      trendDirection,
      baseline,
      quarterlyTarget: target,
      quarterlyActual: actual,
      finalTarget,
      planned: normalizedPlanned,
      actual: normalizedActual,
      healthState: row.health_state,
      healthScore: Number(row.health_score || 0),
      trend: row.trend,
    };
    
    return transformed;
  });
};

export const InternalOutputs: React.FC<InternalOutputsProps> = ({ quarter, year, dashboardData }) => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Default to dark mode if not explicitly light - ensures visibility on dark backgrounds
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  // ════════════════════════════════════════════════════════════════════
  // USES dashboardData PROP FROM ControlTower - NO DUPLICATE FETCH
  // ════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!dashboardData) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let targetQuarter = undefined;
      
      if (quarter && quarter !== 'All' && year && year !== 'All') {
          targetQuarter = `${quarter} ${year}`;
      } else if (year && year !== 'All' && (!quarter || quarter === 'All')) {
          const yearData = dashboardData.filter((row: any) => row.quarter.includes(year));
          if (yearData.length > 0) {
              const uniqueQuarters = [...new Set(yearData.map((row: any) => row.quarter))];
              uniqueQuarters.sort((a: any, b: any) => {
                 const qA = parseInt(a.split(' ')[0].replace('Q', ''));
                 const qB = parseInt(b.split(' ')[0].replace('Q', ''));
                 return qA - qB;
              });
              targetQuarter = uniqueQuarters[uniqueQuarters.length - 1];
          }
      }

      const transformed = transformToDimensions(dashboardData, targetQuarter);
      setDimensions(transformed);
    } catch (err) {
      setError(err as Error);
      console.error('[InternalOutputs] Transform error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardData, quarter, year]);

  const accent = isDark ? '#FFD700' : '#D97706';
  const muted = isDark ? '#9CA3AF' : '#6B7280';
  const danger = '#EF4444';
  const borderColor = isDark ? '#374151' : '#D1D5DB';

  const content = {
    title: 'Internal Transformation Outputs',
    loading: 'Loading indicators...',
    failed: 'Failed to load indicators',
    retry: 'Retry'
  };
  const t = (key: keyof typeof content) => content[key];

  const Spinner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '1rem' }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: `3px solid ${borderColor}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: muted, fontSize: '0.875rem' }}>{t('loading')}</p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const ErrorState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '0.75rem', padding: '1rem' }}>
      <p style={{ color: danger, fontSize: '0.875rem', textAlign: 'center' }}>{t('failed')}</p>
      <p style={{ color: muted, fontSize: '0.75rem' }}>Reload page to retry</p>
    </div>
  );

  return (
    <section>
      <h2 className="section-title">{t('title')}</h2>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="grid-container internal-outputs-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1rem', 
          width: '100%',
          minHeight: '300px'
        }}>
          {dimensions.map(dim => (
            <DimensionModule key={dim.id} dimension={dim} isDark={isDark} language="en" />
          ))}
        </div>
      )}
    </section>
  );
};
