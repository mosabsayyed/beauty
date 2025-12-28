import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface LensBAxis {
    label: string;
    value: number;
    plan?: number;
}

interface LensBData {
    axes: LensBAxis[];
}

// LENS B TRANSFORMATION
const getPlannedOutcomeTarget = (label: string, year: number, q: number): number => {
    if (year < 2025) return 0;
    if (year > 2030) return 100;
    
    const totalQuarters = 24; 
    const quarterIndex = (year - 2025) * 4 + q; 
    
    const isSurvey = label === 'UX' || label === 'Regulations';
    if (isSurvey) {
        const base = 60, cap = 90;
        const progress = quarterIndex / totalQuarters;
        return Math.min(base + (progress * (cap - base)), cap);
    }
    return Math.min((quarterIndex / totalQuarters) * 100, 100);
};

export const transformToLensB = (quarter: string, year: string): LensBData => {
    const isAll = quarter === 'All' || year === 'All';
    const qNum = isAll ? 4 : (parseInt(quarter.replace('Q', '')) || 4);
    const yNum = isAll ? 2029 : (parseInt(year) || 2025);
    
    const shortNameMap = ['GDP', 'Jobs', 'UX', 'Security', 'Regulations'];
    const axes: LensBAxis[] = shortNameMap.map(label => {
        const planPercent = getPlannedOutcomeTarget(label, yNum, qNum);
        const actualPercent = Math.max(planPercent - 10, 0); 
        return {
            label,
            value: Math.round(Math.min(actualPercent, 100)),
            plan: Math.round(planPercent)
        };
    });
    
    return { axes };
};

interface LensBRadarProps {
    data: LensBData | null;
    loading?: boolean;
}

export const LensBRadar: React.FC<LensBRadarProps> = ({ data, loading }) => {
    if (loading) return <div className="panel v2-radar-panel v2-loading">Loading Strategic Impact...</div>;

    const lensBTotal = data?.axes ? Math.round(data.axes.reduce((acc, curr) => acc + curr.value, 0) / data.axes.length) : 0;

    return (
        <div className="panel v2-radar-panel" style={{ height: '100%' }}>
            <div className="v2-radar-header">
                <h3 className="v2-radar-title">Strategic Impact</h3>
            </div>
            
            <div className="v2-radar-container" style={{ position: 'relative', height: 'calc(100% - 30px)' }}>
                {/* Total Score Overlay */}
                {data?.axes && (
                    <div className="v2-radar-total-score" style={{ 
                        position: 'absolute', 
                        top: '0px', 
                        right: '0px', 
                        fontSize: '1.8rem', 
                        fontWeight: 'bold', 
                        color: 'var(--component-color-success)' 
                    }}>
                        {lensBTotal}%
                    </div>
                )}

                {data?.axes && data.axes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                         {/* @ts-ignore */}
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.axes}>
                            <PolarGrid stroke="var(--component-panel-border)" />
                             {/* @ts-ignore */}
                            <PolarAngleAxis 
                                dataKey="label" 
                                tick={({ payload, x, y, textAnchor }) => {
                                    const dataPoint = data.axes.find(d => d.label === payload.value);
                                    const value = dataPoint ? Number(dataPoint.value.toFixed(1)) : 0;
                                    const plan = dataPoint?.plan || 0;
                                    const gap = plan - value;
                                    let trafficColor = 'var(--component-color-success)';
                                    if (gap >= 15) trafficColor = 'var(--component-color-danger)';
                                    else if (gap >= 5) trafficColor = 'var(--component-color-warning)';
                                    
                                    return (
                                        <g className="recharts-layer recharts-polar-angle-axis-tick">
                                            <text x={x} y={y} textAnchor={textAnchor} fill="var(--component-text-secondary)" fontSize={10}>
                                                <tspan x={x} dy="0em">{payload.value}</tspan>
                                                <tspan x={x} dy="1.2em" fill={trafficColor} fontWeight="bold">{value}%</tspan>
                                            </text>
                                        </g>
                                    );
                                }}
                            />
                             {/* @ts-ignore */}
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Planned" dataKey="plan" stroke="var(--component-text-accent)" fill="var(--component-text-accent)" fillOpacity={0.15} strokeDasharray="5 5" />
                            <Radar name="Actual" dataKey="value" stroke="var(--component-color-success)" fill="var(--component-color-success)" fillOpacity={0.3} />
                             {/* @ts-ignore */}
                            <Tooltip contentStyle={{ backgroundColor: 'var(--component-panel-bg)', borderColor: 'var(--component-panel-border)', color: 'var(--component-text-primary)' }} itemStyle={{ color: 'var(--component-color-success)' }} formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Score']} />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="v2-empty">No Impact data</div>
                )}
            </div>
        </div>
    );
};
