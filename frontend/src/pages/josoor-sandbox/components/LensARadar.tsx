import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface LensAAxis {
    label: string;
    value: number;
    plan?: number;
}

interface LensAData {
    axes: LensAAxis[];
    burnout_flag: boolean;
}

// LENS A TRANSFORMATION
// Same logic as DualLensHUD
export const transformToLensA = (rawData: any[], quarter: string, year: string): LensAData | null => {
    if (!rawData || rawData.length === 0) return null;
    
    const isAll = quarter === 'All' || year === 'All';
    let currentData = rawData;
    
    if (!isAll) {
        const targetQuarter = `${quarter} ${year}`;
        currentData = rawData.filter(row => row.quarter === targetQuarter);
    } else {
        const sortedByDate = [...rawData].sort((a, b) => {
             const getVal = (r: any) => {
                 if (!r.quarter) return 0;
                 const parts = r.quarter.split(' ');
                 if (parts.length < 2) return 0;
                 return parseInt(parts[1]) * 10 + parseInt(parts[0].replace('Q', ''));
             };
             return getVal(b) - getVal(a);
        });
        const latestQuarter = sortedByDate[0]?.quarter;
        if (latestQuarter) {
            currentData = rawData.filter(row => row.quarter === latestQuarter);
        }
    }
    
    const shortNameMap: Record<string, string> = {
        'Strategic Plan Alignment': 'Strategy',
        'Operational Efficiency': 'Ops',
        'Risk Mitigation Rate': 'Risk',
        'Investment Portfolio ROI': 'Investments',
        'Active Investor Rate': 'Investors',
        'Employee Engagement Score': 'Employees',
        'Project Delivery Velocity': 'Projects',
        'Tech Stack SLA Compliance': 'Tech'
    };
    
    let axes: LensAAxis[] = [];
    let totalScore = 0;
    
    for (const [dimName, label] of Object.entries(shortNameMap)) {
        let val = 0;
        let planVal = 0;

        const row = currentData.find((r: any) => r.dimension_title === dimName);
        const actual = row ? Number(row.kpi_actual) : 0;
        const target = row?.kpi_final_target ? Number(row.kpi_final_target) : 0;
        const planned = row?.kpi_planned ? Number(row.kpi_planned) : 0;
        
        if (target > 0) {
            val = (actual / target) * 100;
            planVal = (planned / target) * 100;
        }
        
        val = Math.max(0, Math.round(val));
        planVal = Math.max(0, Math.round(planVal));
        
        axes.push({ label, value: val, plan: planVal });
        totalScore += val;
    }
    
    return { axes, burnout_flag: (axes.length > 0 && totalScore / axes.length < 60) };
};

interface LensARadarProps {
    data: LensAData | null;
    loading?: boolean;
}

export const LensARadar: React.FC<LensARadarProps> = ({ data, loading }) => {
    if (loading) return <div className="panel v2-radar-panel v2-loading">Loading Transformation Health...</div>;
    
    const lensATotal = data?.axes ? Math.round(data.axes.reduce((acc, curr) => acc + curr.value, 0) / data.axes.length) : 0;

    return (
        <div className="panel v2-radar-panel" style={{ height: '100%' }}>
            <div className="v2-radar-header">
                <h3 className="v2-radar-title">Transformation Health</h3>
                {data?.burnout_flag && <span className="badge v2-badge-high">⚠️ BURNOUT RISK</span>}
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
                        color: 'var(--component-text-accent)' 
                    }}>
                        {lensATotal}%
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
                                    const value = dataPoint ? dataPoint.value : 0;
                                    const plan = dataPoint?.plan || 100;
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
                            <Tooltip contentStyle={{ backgroundColor: 'var(--component-panel-bg)', borderColor: 'var(--component-panel-border)', color: 'var(--component-text-primary)' }} itemStyle={{ color: 'var(--component-text-accent)' }} formatter={(value: number) => [`${Math.round(value)}%`, 'Score']} />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="v2-empty">No Health data</div>
                )}
            </div>
        </div>
    );
};
