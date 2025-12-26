import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import './DualLensHUD.css';

// V1.3 Strict Typings
interface LensAAxis {
    label: string;
    value: number;
    plan?: number;  // For traffic light comparison
    axis_id?: string;
}

interface LensBAxis {
    label: string;
    value: number;
    plan?: number;  // For traffic light comparison
    kpi_part: number;
    proj_part: number;
}

interface LensAData {
    axes: LensAAxis[];
    burnout_flag: boolean;
}

interface LensBData {
    axes: LensBAxis[];
}

interface TrendData {
    name: string;
    Investments: number;
    GDP: number;
}

interface DualLensHUDProps {
    quarter: string;
    year: string;
    dashboardData?: any[]; // Raw dashboard data from InternalOutputs - avoids extra API call
}

// ════════════════════════════════════════════════════════════════════
// LENS A TRANSFORMATION - Converts raw dashboard data to radar format
// Uses same logic as graph-server hud-lens-a but computed locally
// ════════════════════════════════════════════════════════════════════
const transformToLensA = (rawData: any[], quarter: string, year: string): LensAData | null => {
    if (!rawData || rawData.length === 0) return null;
    
    const isAll = quarter === 'All' || year === 'All';
    let currentData = rawData;
    
    if (!isAll) {
        const targetQuarter = `${quarter} ${year}`;
        currentData = rawData.filter(row => row.quarter === targetQuarter);
    } else {
        // Find LATEST quarter
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

        // Logic is now identical (we always work with a slice of data for one quarter)
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
// ════════════════════════════════════════════════════════════════════
// LENS B TRANSFORMATION - Synthetic Strategic Outcomes
// Exactly matches backend control_tower.py logic
// ════════════════════════════════════════════════════════════════════
const getPlannedOutcomeTarget = (label: string, year: number, q: number): number => {
    if (year < 2026) return 0;
    if (year > 2030) return 100;
    
    const totalQuarters = 20; // Q1 2026 → Q4 2030
    const quarterIndex = (year - 2026) * 4 + q; // 1-indexed
    
    const isSurvey = label === 'UX' || label === 'Regulations';
    if (isSurvey) {
        const base = 60, cap = 90;
        const progress = quarterIndex / totalQuarters;
        return Math.min(base + (progress * (cap - base)), cap);
    }
    return Math.min((quarterIndex / totalQuarters) * 100, 100);
};

const transformToLensB = (quarter: string, year: string): LensBData => {
    // If All, default to End State (2029) and Q4
    const isAll = quarter === 'All' || year === 'All';
    const qNum = isAll ? 4 : (parseInt(quarter.replace('Q', '')) || 4);
    const yNum = isAll ? 2029 : (parseInt(year) || 2025);
    
    const shortNameMap = ['GDP', 'Jobs', 'UX', 'Security', 'Regulations'];
    const axes: LensBAxis[] = shortNameMap.map(label => {
        const planPercent = getPlannedOutcomeTarget(label, yNum, qNum);
        const actualPercent = Math.max(planPercent - 10, 0); // Actual trails plan by 10%
        return {
            label,
            value: Math.round(Math.min(actualPercent, 100)),
            plan: Math.round(planPercent),
            kpi_part: Math.round(Math.min(actualPercent, 100)),
            proj_part: 0
        };
    });
    
    return { axes };
};

// ════════════════════════════════════════════════════════════════════
// TREND TRANSFORMATION - Investments (from dashboardData) + GDP (synthetic)
// ════════════════════════════════════════════════════════════════════
const transformToTrend = (rawData: any[], quarter: string, year: string): TrendData[] => {
    const targetQ = parseInt(quarter.replace('Q', '')) || 4;
    const targetY = parseInt(year) || 2025;
    
    // Generate quarter range from Q3 2025 to target
    const periods: { q: number; y: number; label: string }[] = [];
    for (let y = 2025; y <= targetY; y++) {
        for (let q = 1; q <= 4; q++) {
            if (y === 2025 && q < 3) continue; // Start from Q3 2025
            if (y === targetY && q > targetQ) break;
            periods.push({ q, y, label: `Q${q} ${y}` });
        }
    }
    
    return periods.map(period => {
        // Investments: Find from dimension containing "Investment"
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
            // Fallback synthetic
            investmentValue = Math.round(getPlannedOutcomeTarget('GDP', period.y, period.q) + 5);
        }
        
        // GDP: Always synthetic
        const gdpPercent = getPlannedOutcomeTarget('GDP', period.y, period.q);
        
        return {
            name: period.label,
            Investments: Math.min(investmentValue, 100),
            GDP: Math.round(gdpPercent)
        };
    });
};


export const DualLensHUD: React.FC<DualLensHUDProps> = ({ quarter, year, dashboardData }) => {
    const [lensA, setLensA] = useState<LensAData | null>(null);
    const [lensB, setLensB] = useState<LensBData | null>(null);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);

    // ════════════════════════════════════════════════════════════════════
    // ALL DATA COMPUTED LOCALLY - NO API CALLS ON FILTER CHANGE
    // Data sources:
    // - Lens A: dashboardData from ControlTower (Supabase)
    // - Lens B: Synthetic (computed locally)
    // - Trend: Investments from dashboardData + GDP synthetic
    // ════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!dashboardData) {
            setLoading(true);
            return;
        }
        
        // All computed locally - instant!
        setLensA(transformToLensA(dashboardData, quarter, year));
        setLensB(transformToLensB(quarter, year));
        setTrendData(transformToTrend(dashboardData, quarter, year));
        setLoading(false);
    }, [dashboardData, quarter, year]);

    // US-1: Loading state
    if (loading) {
        return (
            <div className="v2-hud-grid">
                <div className="panel v2-radar-panel v2-loading">Loading Transformation Health...</div>
                <div className="panel v2-trend-panel v2-loading">Loading Investments vs GDP Contribution...</div>
                <div className="panel v2-radar-panel v2-loading">Loading Strategic Impact...</div>
            </div>
        );
    }

    // (No error state needed - all data computed locally)

    // Calculate Total Scores
    const lensATotal = lensA?.axes ? Math.round(lensA.axes.reduce((acc, curr) => acc + curr.value, 0) / lensA.axes.length) : 0;
    const lensBTotal = lensB?.axes ? Math.round(lensB.axes.reduce((acc, curr) => acc + curr.value, 0) / lensB.axes.length) : 0;

    return (
        <div className="v2-hud-grid">
            
            {/* LENS A: Operational Health */}
            <div className="panel v2-radar-panel">
                <div className="v2-radar-header">
                    <h3 className="v2-radar-title">Transformation Health (Are We Fit?)</h3>
                    {lensA?.burnout_flag && <span className="badge v2-badge-high">⚠️ BURNOUT RISK</span>}
                </div>
                
                <div className="v2-radar-container" style={{ position: 'relative' }}>
                    {/* Total Score Overlay */}
                    {lensA?.axes && (
                        <div className="v2-radar-total-score" style={{ 
                            position: 'absolute', 
                            top: '10px', 
                            right: '10px', 
                            fontSize: '2rem', 
                            fontWeight: 'bold', 
                            color: 'var(--component-text-accent)' 
                        }}>
                            {lensATotal}%
                        </div>
                    )}

                    {lensA?.axes && lensA.axes.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            {/* @ts-ignore */}
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={lensA.axes}>
                                <PolarGrid stroke="var(--component-panel-border)" />
                                {/* @ts-ignore */}
                                <PolarAngleAxis 
                                    dataKey="label" 
                                    tick={({ payload, x, y, textAnchor }) => {
                                        const dataPoint = lensA.axes.find(d => d.label === payload.value);
                                        const value = dataPoint ? dataPoint.value : 0;
                                        // Traffic light: gap from target (100% or plan if available)
                                        const plan = dataPoint?.plan || 100;
                                        const gap = plan - value;
                                        let trafficColor = 'var(--component-color-success)'; // green
                                        if (gap >= 15) {
                                            trafficColor = 'var(--component-color-danger)'; // red
                                        } else if (gap >= 5) {
                                            trafficColor = 'var(--component-color-warning)'; // yellow
                                        }
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
                                {/* Ensure scale is always 0-100 */}
                                {/* @ts-ignore */}
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                {/* Plan Overlay (Gold - Target) */}
                                <Radar
                                    name="Planned"
                                    dataKey="plan"
                                    stroke="var(--component-text-accent)"
                                    fill="var(--component-text-accent)"
                                    fillOpacity={0.15}
                                    strokeDasharray="5 5"
                                />
                                {/* Actual Overlay (Teal - Current) */}
                                <Radar
                                    name="Actual"
                                    dataKey="value"
                                    stroke="var(--component-color-success)"
                                    fill="var(--component-color-success)"
                                    fillOpacity={0.3}
                                />
                                {/* @ts-ignore */}
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--component-panel-bg)', borderColor: 'var(--component-panel-border)', color: 'var(--component-text-primary)' }}
                                    itemStyle={{ color: 'var(--component-text-accent)' }}
                                    formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="v2-empty">No Health data available</div>
                    )}
                </div>
            </div>

            {/* STRATEGIC TREND: Health vs Outcomes */}
            <div className="panel v2-trend-panel">
                <div className="v2-radar-header">
                    <h3 className="v2-radar-title">Investments vs GDP Contribution</h3>
                </div>
                <div className="v2-trend-container">
                    {trendData && trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            {/* @ts-ignore */}
                            <LineChart data={trendData} margin={{ top: 20, right: 15, left: -15, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--component-panel-border)" vertical={false} opacity={0.5} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: 'var(--component-text-secondary)', fontSize: 9 }} 
                                    axisLine={{ stroke: 'var(--component-panel-border)' }}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    domain={[0, 100]} 
                                    tick={{ fill: 'var(--component-text-secondary)', fontSize: 9 }} 
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-5}
                                />
                                {/* @ts-ignore */}
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--component-panel-bg)', 
                                        border: '1px solid var(--component-panel-border)', 
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ padding: '2px 0' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '10px', paddingBottom: '20px', right: 0 }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="Investments" 
                                    name="Investments (Health)"
                                    stroke="var(--component-text-accent)" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: 'var(--component-panel-bg)', strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="GDP" 
                                    name="GDP Contribution (Impact)"
                                    stroke="var(--component-color-success)" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: 'var(--component-panel-bg)', strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="v2-empty">Trend data unavailable</div>
                    )}
                </div>
            </div>

            {/* LENS B: Strategic Impact */}
            <div className="panel v2-radar-panel">
                <div className="v2-radar-header">
                    <h3 className="v2-radar-title">Strategic Impact (Are We Winning?)</h3>
                </div>
                
                <div className="v2-radar-container" style={{ position: 'relative' }}>
                    {/* Total Score Overlay */}
                    {lensB?.axes && (
                        <div className="v2-radar-total-score" style={{ 
                            position: 'absolute', 
                            top: '10px', 
                            right: '10px', 
                            fontSize: '2rem', 
                            fontWeight: 'bold', 
                            color: 'var(--component-color-success)' 
                        }}>
                            {lensBTotal}%
                        </div>
                    )}

                    {lensB?.axes && lensB.axes.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            {/* @ts-ignore */}
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={lensB.axes}>
                                <PolarGrid stroke="var(--component-panel-border)" />
                                {/* @ts-ignore */}
                                <PolarAngleAxis 
                                    dataKey="label" 
                                    tick={({ payload, x, y, textAnchor }) => {
                                        const dataPoint = lensB.axes.find(d => d.label === payload.value);
                                        const value = dataPoint ? Number(dataPoint.value.toFixed(1)) : 0;
                                        const plan = dataPoint?.plan || 0;
                                        // Traffic light: gap = plan - actual
                                        // <5 green, <15 yellow, >=15 red
                                        const gap = plan - value;
                                        let trafficColor = 'var(--component-color-success)'; // green
                                        if (gap >= 15) {
                                            trafficColor = 'var(--component-color-danger)'; // red
                                        } else if (gap >= 5) {
                                            trafficColor = 'var(--component-color-warning)'; // yellow
                                        }
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
                                {/* Ensure scale is always 0-100 */}
                                {/* @ts-ignore */}
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                {/* Plan Overlay (Gold - Target) */}
                                <Radar
                                    name="Planned"
                                    dataKey="plan"
                                    stroke="var(--component-text-accent)"
                                    fill="var(--component-text-accent)"
                                    fillOpacity={0.15}
                                    strokeDasharray="5 5"
                                />
                                {/* Actual Overlay (Green - Achievement) */}
                                <Radar
                                    name="Actual"
                                    dataKey="value"
                                    stroke="var(--component-color-success)"
                                    fill="var(--component-color-success)"
                                    fillOpacity={0.3}
                                />
                                {/* @ts-ignore */}
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--component-panel-bg)', borderColor: 'var(--component-panel-border)', color: 'var(--component-text-primary)' }}
                                    itemStyle={{ color: 'var(--component-color-success)' }}
                                    formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Score']}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="v2-empty">No Impact data available</div>
                    )}
                </div>
            </div>

        </div>
    );
};
