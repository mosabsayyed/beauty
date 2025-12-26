import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import InternalOutputs from '../../../components/graphv001/components/InternalOutputs';
import TransformationHealth from '../../../components/graphv001/components/TransformationHealth';
import SectorOutcomes from '../../../components/graphv001/components/SectorOutcomes';
import StrategicInsights from '../../../components/graphv001/components/StrategicInsights';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { DashboardData } from '../../../components/graphv001/types';

const ControlTower: React.FC = () => {
    const { language, isRTL } = useLanguage();
    // Default to dark mode for V10 consistency
    const isDark = true;
    const [selectedYear, setSelectedYear] = useState<string>('2025');

    // Fetch Dashboard Data (Metrics, Insights, Dimensions)
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboardMetrics', selectedYear],
        queryFn: async () => {
            const response = await fetch(`/api/dashboard/metrics?year=${selectedYear}`);
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard metrics');
            }
            return await response.json() as DashboardData;
        },
        retry: 1,
        staleTime: 5000, // 5 seconds
    });

    if (isLoading) return <LoadingSpinner />;
    
    // Error State
    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                <p>Failed to load dashboard data.</p>
                <button 
                    onClick={() => refetch()}
                    className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    // V10 Top Strip Metrics (Example)
    const kpiMetrics = [
        { title: 'Transformation Health', value: '88/100', status: 'healthy', trend: 'up' },
        { title: 'Strategic Alignment', value: '92%', status: 'healthy', trend: 'steady' },
        { title: 'Value Realized', value: '$45M', status: 'warning', trend: 'up' },
        { title: 'Risk Exposure', value: 'Low', status: 'healthy', trend: 'down' }
    ];

    return (
        <div className={`jd-control-tower ${language === 'ar' ? 'rtl-layout' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
             {/* 1. TOP STRIP - KPI CARDS (V10) */}
            <div className="jd-kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.5rem', flexShrink: 0 }}>
                {kpiMetrics.map((metric, idx) => (
                    <div key={idx} className="jd-kpi-card" style={{ background: '#111827', border: '1px solid #374151', padding: '1rem', borderRadius: '0.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '4rem', height: '4rem', background: 'linear-gradient(to bottom right, rgba(212, 175, 55, 0.2), transparent)', borderBottomLeftRadius: '100%', marginRight: '-2rem', marginTop: '-2rem' }}></div>
                        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.title}</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>{metric.value}</span>
                                <span style={{ 
                                    fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', marginBottom: '0.25rem',
                                    backgroundColor: metric.status === 'critical' ? 'rgba(239, 68, 68, 0.2)' : metric.status === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: metric.status === 'critical' ? '#EF4444' : metric.status === 'warning' ? '#F59E0B' : '#10B981'
                                }}>
                                    {metric.trend === 'up' ? '↑' : '↓'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. MAIN INSTRUMENT FRAME SCROLLABLE AREA */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 1.5rem 1.5rem 1.5rem' }}>
                
                {/* A. Transformation Health (Radar) + Internal Outputs (Grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
                    
                    {/* RADAR CHART (Image 2) - 4 Columns */}
                    <div style={{ gridColumn: 'span 4', height: '100%', minHeight: '400px' }}>
                        <TransformationHealth 
                            dimensions={data.dimensions || []}
                            isDark={isDark}
                            language={language}
                            selectedYear={selectedYear}
                            isLoading={isLoading}
                            onRetry={refetch}
                        />
                    </div>

                    {/* KPI GRID (Image 3) - 8 Columns */}
                    <div style={{ gridColumn: 'span 8', height: '100%', minHeight: '400px' }}>
                        <InternalOutputs 
                            dimensions={data.dimensions || []}
                            isDark={isDark}
                            language={language}
                            isLoading={isLoading}
                            onRetry={refetch}
                        />
                    </div>
                </div>

                {/* B. Strategic Insights + Sector Outcomes (Image 1) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', paddingBottom: '2rem' }}>
                     <StrategicInsights 
                        data={data}
                        isDark={isDark}
                        language={language}
                     />
                     
                     <SectorOutcomes 
                        data={data.outcomes}
                        isDark={isDark}
                        language={language}
                     />
                </div>

                 {/* Debug Data Visibility */}
                 {(!data.dimensions || data.dimensions.length === 0) && (
                    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #D97706', backgroundColor: 'rgba(146, 64, 14, 0.2)', color: '#F59E0B', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                        Warning: API returned simplified or empty dimensions. Backend query logic needs adjustment.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ControlTower;
