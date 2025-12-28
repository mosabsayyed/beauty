import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';

interface TrendData {
    name: string;
    Investments: number;
    GDP: number;
}

// TREND TRANSFORMATION
// Uses separate getPlannedOutcomeTarget definition internally to stay self-contained or import from LensB if shared
const getPlannedOutcomeTarget = (label: string, year: number, q: number): number => {
    if (year < 2025) return 0;
    if (year > 2030) return 100;
    const totalQuarters = 24; 
    const quarterIndex = (year - 2025) * 4 + q; 
    return Math.min((quarterIndex / totalQuarters) * 100, 100);
};

export const transformToTrend = (rawData: any[], quarter: string, year: string): TrendData[] => {
    const targetQ = parseInt(quarter.replace('Q', '')) || 4;
    const targetY = parseInt(year) || 2025;
    
    const periods: { q: number; y: number; label: string }[] = [];
    for (let y = 2025; y <= targetY; y++) {
        for (let q = 1; q <= 4; q++) {
            if (y === 2025 && q < 3) continue; 
            if (y === targetY && q > targetQ) break;
            periods.push({ q, y, label: `Q${q} ${y}` });
        }
    }
    
    return periods.map(period => {
        const investmentRows = rawData.filter(row => 
            row.quarter === period.label && 
            (row.dimension_title?.toLowerCase().includes('investment') || row.dimension_id === 'investment')
        );
        
        let investmentValue: number;
        if (investmentRows.length > 0) {
            const totalActual = investmentRows.reduce((sum, row) => sum + (Number(row.kpi_actual) || 0), 0);
            const totalTarget = investmentRows.reduce((sum, row) => sum + (Number(row.kpi_final_target) || 1), 0);
            investmentValue = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
        } else {
            investmentValue = Math.round(getPlannedOutcomeTarget('GDP', period.y, period.q) + 5);
        }
        
        const gdpPercent = getPlannedOutcomeTarget('GDP', period.y, period.q);
        
        return {
            name: period.label,
            Investments: Math.min(investmentValue, 100),
            GDP: Math.round(gdpPercent)
        };
    });
};

interface TrendsChartProps {
    data: TrendData[];
    loading?: boolean;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ data, loading }) => {
    if (loading) return <div className="panel v2-trend-panel v2-loading">Loading Trends...</div>;

    return (
        <div className="panel v2-trend-panel" style={{ height: '100%' }}>
            <div className="v2-radar-header">
                <h3 className="v2-radar-title">Investments vs GDP Contribution</h3>
            </div>
            <div className="v2-trend-container" style={{ height: 'calc(100% - 30px)' }}>
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                         {/* @ts-ignore */}
                        <LineChart data={data} margin={{ top: 20, right: 15, left: -15, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--component-panel-border)" vertical={false} opacity={0.5} />
                            <XAxis dataKey="name" tick={{ fill: 'var(--component-text-secondary)', fontSize: 9 }} axisLine={{ stroke: 'var(--component-panel-border)' }} tickLine={false} dy={10} />
                            <YAxis domain={[0, 100]} tick={{ fill: 'var(--component-text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} dx={-5} />
                             {/* @ts-ignore */}
                            <Tooltip contentStyle={{ backgroundColor: 'var(--component-panel-bg)', border: '1px solid var(--component-panel-border)', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ padding: '2px 0' }} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px', right: 0 }} />
                            <Line type="monotone" dataKey="Investments" name="Investments" stroke="var(--component-text-accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--component-panel-bg)', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="GDP" name="GDP" stroke="var(--component-color-success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--component-panel-bg)', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="v2-empty">Trend data unavailable</div>
                )}
            </div>
        </div>
    );
};
