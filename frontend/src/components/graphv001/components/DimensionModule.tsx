import React from 'react';
import Panel from './Panel';
import type { Dimension } from '../types';


interface DimensionModuleProps {
  dimension: Dimension;
  isDark: boolean;
  language: string;
}

const TrendArrow: React.FC<{ direction: 'up' | 'down' | 'steady'; isDark?: boolean; language?: string }> = ({ direction, isDark, language }) => {
  // Theme object with access to isDark
  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    accent: isDark ? '#FFD700' : '#D97706',
    borderColor: isDark ? '#374151' : '#D1D5DB',
    panelBorderColor: isDark ? '#374151' : '#D1D5DB',
  };
    if (direction === 'steady') {
        const color = theme.muted;
        return (
            <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="steady trend">
                <div style={{ width: '14px', height: '3px', backgroundColor: color, }} />
            </div>
        );
    }

    const path = direction === 'up' 
        ? "M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z" // Material Icons chevron_up
        : "M12 16l-6-6 1.41-1.41L12 13.17l4.59-4.58L18 10l-6 6z"; // Material Icons chevron_down
    
    const color = direction === 'up' ? theme.success : theme.danger;

    return (
        <svg
            width="24"
            height="24"
            fill={color}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={`${direction} trend`}
        >
            <path d={path}></path>
        </svg>
    );
};


const HorizontalBar: React.FC<{ label: string; value: number; max: number; target?: number; isDark?: boolean; language?: string }> = ({ label, value, max, target, isDark, language }) => {
  // Theme object with access to isDark
  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    accent: isDark ? '#FFD700' : '#D97706',
    borderColor: isDark ? '#374151' : '#D1D5DB',
    panelBorderColor: isDark ? '#374151' : '#D1D5DB',
  };
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const targetPercentage = target && max > 0 ? (target / max) * 100 : undefined;
    
    return (
        <div className="hb-container">
            <span className="hb-label">{label}</span>
            <div className="hb-bar-wrapper">
                <div 
                    className="hb-bar-fill"
                    style={{ width: `${percentage}%` }}
                ></div>
                {targetPercentage !== undefined && (
                    <div 
                        className="hb-bar-target"
                        style={{ left: `${targetPercentage}%` }}
                    ></div>
                )}
            </div>
            <span className="hb-value">{value}</span>
        </div>
    );
};


const DimensionModule: React.FC<DimensionModuleProps> = ({ dimension, isDark, language }) => {
  // Theme object with access to isDark
  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    accent: isDark ? '#FFD700' : '#D97706',
    borderColor: isDark ? '#374151' : '#D1D5DB',
    panelBorderColor: isDark ? '#374151' : '#D1D5DB',
  };
  const { title, kpi, lastQuarterKpi, nextQuarterKpi, delta, trendDirection, baseline, quarterlyTarget, quarterlyActual, finalTarget } = dimension;

  const getDeltaColor = (d: number) => {
    const absD = Math.abs(d);
    if (absD > 15) return theme.danger;
    if (absD > 5) return theme.warning;
    return theme.success;
  }

  return (
    <Panel className="dm-panel">
        {/* Top Section: Title and Trend Arrow */}
        <div className="dm-top-section">
            <h3 style={{ color: isDark ? '#F9FAFB' : '#1F2937', fontSize: '0.9rem', fontWeight: 600 }}>{title}</h3>
            <div>
                <TrendArrow direction={trendDirection} />
            </div>
        </div>

        {/* KPI Values Row: Previous - Current - Next */}
        <div className="dm-kpi-values" style={{ 
            display: 'flex', 
            alignItems: 'baseline', 
            justifyContent: 'flex-start',
            gap: '0.5rem',
            marginTop: '0.5rem'
        }}>
            <span style={{ fontSize: '1rem', color: isDark ? '#9CA3AF' : '#6B7280' }}>{lastQuarterKpi}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: isDark ? '#F9FAFB' : '#1F2937' }}>{kpi}</span>
            <span style={{ fontSize: '1rem', color: isDark ? '#9CA3AF' : '#6B7280' }}>{nextQuarterKpi}</span>
        </div>

        {/* Delta Value */}
        <div style={{ 
            color: getDeltaColor(delta), 
            fontSize: '0.875rem',
            marginTop: '0.25rem'
        }}>
            {delta > 0 ? `+${delta}` : delta}
        </div>

        {/* Health Score Label */}
        <div style={{ 
            color: isDark ? '#9CA3AF' : '#6B7280', 
            fontSize: '0.75rem',
            marginTop: '0.25rem',
            marginBottom: '0.5rem'
        }}>
            {language === 'ar' ? 'قيم الصحة الربعية' : 'Quarterly Health Values'}
        </div>
      
        {/* Bar Section */}
        <div className="dm-bar-section">
            <HorizontalBar label={language === 'ar' ? 'الأساس' : 'Baseline'} value={baseline} max={finalTarget} isDark={isDark} language={language} />
            <HorizontalBar label={language === 'ar' ? 'المستهدف' : 'Target'} value={quarterlyTarget} max={finalTarget} isDark={isDark} language={language} />
            <HorizontalBar label={language === 'ar' ? 'الفعلي' : 'Actual'} value={quarterlyActual} max={finalTarget} target={quarterlyTarget} isDark={isDark} language={language} />
            <HorizontalBar label={language === 'ar' ? 'النهائي' : 'Final'} value={finalTarget} max={finalTarget} isDark={isDark} language={language} />
        </div>
    </Panel>
  );
};

export default DimensionModule;