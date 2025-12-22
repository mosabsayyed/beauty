import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SectorOutcomes from '../../components/graphv001/components/SectorOutcomes';
import type { DashboardData } from '../../components/graphv001/types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, AlertTriangle, Shield, TrendingUp, Activity } from "lucide-react";

// Mock detailed data for deep dive (in a real app, this would fetch from API)
const RISK_DETAILS: Record<string, any> = {
    'outcome1': {
        title: 'Macroeconomic Instability',
        riskLevel: 'High',
        probability: '65%',
        impact: '$120M',
        description: 'Fluctuations in global markets affecting FDI inflow and trade balance stability.',
        mitigations: [
            { id: 1, action: 'Hedging Strategy', status: 'In Progress', owner: 'Finance Dept' },
            { id: 2, action: 'Diversify Trade Partners', status: 'Planned', owner: 'Trade Ministry' }
        ],
        history: [
            { date: '2024 Q4', score: 78 },
            { date: '2025 Q1', score: 82 },
            { date: '2025 Q2', score: 65 } // improving
        ]
    },
    'outcome2': {
        title: 'Partnership Churn',
        riskLevel: 'Medium',
        probability: '40%',
        impact: '$45M',
        description: 'Risk of private sector partners withdrawing due to regulatory complexity.',
        mitigations: [
            { id: 1, action: 'Simplify Compliance', status: 'Completed', owner: 'Legal' },
            { id: 2, action: 'Partner Incentives Program', status: 'In Progress', owner: 'Partnerships' }
        ]
    },
    // Default fallback
    'default': {
        title: 'Operational Risk',
        riskLevel: 'Low',
        probability: '20%',
        impact: '$10M',
        description: 'Standard operational variance risk within acceptable limits.',
        mitigations: [
            { id: 1, action: 'Regular Audits', status: 'Ongoing', owner: 'Internal Audit' }
        ]
    }
};

const RiskDesk: React.FC = () => {
    const { language } = useLanguage();
    const isDark = true;
    const [selectedYear, setSelectedYear] = useState<string>('2025');
    const [selectedView, setSelectedView] = useState<'overview' | 'detail'>('overview');
    const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

    // Fetch Dashboard Data (reusing the same endpoint as ControlTower for consistent data)
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
        staleTime: 5000,
    });

    // MOCK TRANSFORMATION: Map outcomes to Risk Categories for visualization
    const riskData = React.useMemo(() => {
        if (!data?.outcomes) return null;
        // Map available outcomes to the 4 slots SectorOutcomes expects
        // outcome1: Bar/Line (Macro -> Macro Risks)
        // outcome2: Doughnut (Partnerships -> Operational)
        // outcome3: Bar/Line (QoL -> Tech Risks)
        // outcome4: Doughnut (Community -> People Risks)
        
        // Use 'any' cast to access outcome5 if it exists in runtime but not types, 
        // or just fallback to outcome1/2/3/4.
        const d = data.outcomes as any;
        
        return {
            'outcome1': { ...d.outcome1, title: language === 'ar' ? 'مخاطر الاقتصاد الكلي' : 'Macro Risks' },
            'outcome2': { ...d.outcome2, title: language === 'ar' ? 'مخاطر التشغيل' : 'Operational Risks' },
            'outcome3': { ...d.outcome3, title: language === 'ar' ? 'مخاطر التقنية' : 'Tech Risks' },
            'outcome4': { ...d.outcome4, title: language === 'ar' ? 'مخاطر الموارد البشرية' : 'People Risks' }
        } as any;
    }, [data, language]);

    // Handler when a chart element is clicked (passed down to SectorOutcomes or handled via overlay)
    // For now, we simulate clicking a risk via the list or adding interactive elements.
    // Since SectorOutcomes is verified/complex, we'll wrap it and add a "Deep Dive" side panel.
    
    const handleRiskSelect = (riskId: string) => {
        setSelectedRiskId(riskId);
        setSelectedView('detail');
    };

    const handleBack = () => {
        setSelectedView('overview');
        setSelectedRiskId(null);
    };

    const activeRisk = selectedRiskId && RISK_DETAILS[selectedRiskId] ? RISK_DETAILS[selectedRiskId] : RISK_DETAILS['default'];

    return (
        <div className={`jd-risk-desk h-full flex flex-col ${language === 'ar' ? 'rtl' : 'ltr'}`}>
             {/* 1. TOP STRIP - KPI CARDS */}
            <div className="jd-kpi-strip grid grid-cols-4 gap-4 mb-6 shrink-0 h-32 pl-6 pr-6 pt-6">
                {[
                    { title: 'Total Risk Exposure', value: '$142M', status: 'critical', trend: 'up' },
                    { title: 'Active Mitigations', value: '24', status: 'good', trend: 'up' },
                    { title: 'Residual Risk', value: 'Low', status: 'good', trend: 'down' },
                    { title: 'Emerging Threats', value: '3', status: 'warning', trend: 'new' }
                ].map((metric, idx) => (
                    <div key={idx} className="bg-[#111827] border border-slate-700 p-4 rounded-lg relative overflow-hidden group hover:border-[#D4AF37] transition-colors cursor-pointer"
                         onClick={() => handleRiskSelect(`outcome${idx+1}`)}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="text-slate-400 text-sm font-medium uppercase">{metric.title}</div>
                            <div className="flex items-end gap-3">
                                <span className={`text-3xl font-bold ${metric.status === 'critical' ? 'text-red-500' : 'text-white'}`}>{metric.value}</span>
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                                    {metric.trend === 'up' ? '↑ +5%' : '↓ -2%'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. MAIN SPLIT VIEW */}
            <div className="flex-1 min-h-0 relative px-6 pb-6 flex gap-6">
                
                {/* LEFT: RISK HEATMAP AREA (Embed Verified Component) */}
                <div className="col-span-8 bg-[#111827] border border-slate-700 rounded-lg p-5 flex flex-col h-full relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0 z-10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                             <span className="text-[#D4AF37]">■</span> {language === 'ar' ? 'مصفوفة المخاطر' : 'Risk & Outcomes Matrix'}
                        </h3>
                    </div>
                    
                    {/* EMBEDDED VERIFIED COMPONENT: SectorOutcomes */}
                    {/* Ensure explicit dimensions for Recharts by using relative parent and absolute child */}
                    <div className="flex-1 min-h-0 relative w-full">
                         <div className="absolute inset-0 overflow-visible">
                             <SectorOutcomes 
                                data={riskData}
                                isDark={isDark}
                                language={language}
                             />
                         </div>
                    </div>
                </div>
                {/* RIGHT: DEEP DIVE PANEL (Sliding in) */}
                {selectedView === 'detail' && (
                    <div className="w-1/2 h-full animate-in slide-in-from-right duration-300">
                        <Card className="h-full bg-[#1F2937] border-gold-500/50 border overflow-hidden flex flex-col">
                            <CardHeader className="bg-slate-900/50 border-b border-slate-700 pb-4">
                                <div className="flex justify-between items-start text-white">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/30">
                                                {activeRisk.riskLevel.toUpperCase()} RISK
                                            </span>
                                            <span className="text-slate-400 text-xs">Prob: {activeRisk.probability}</span>
                                        </div>
                                        <CardTitle className="text-2xl text-white">{activeRisk.title}</CardTitle>
                                        <CardDescription className="text-slate-400 mt-1">{activeRisk.description}</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={handleBack} className="text-slate-400 hover:text-white">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Impact Section */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                                        <div className="text-slate-400 text-xs uppercase mb-1">Potential Impact</div>
                                        <div className="text-2xl font-mono text-red-400">{activeRisk.impact}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                                        <div className="text-slate-400 text-xs uppercase mb-1">Exposure Trend</div>
                                        <div className="flex items-center gap-2 text-2xl font-mono text-amber-400">
                                            <TrendingUp className="w-5 h-5" /> Rising
                                        </div>
                                    </div>
                                </div>

                                {/* Mitigation Plan */}
                                <div>
                                    <h4 className="text-gold-500 font-bold mb-3 flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Mitigation Actions
                                    </h4>
                                    <div className="space-y-3">
                                        {activeRisk.mitigations.map((m: any) => (
                                            <div key={m.id} className="bg-slate-900 p-3 rounded flex justify-between items-center border-l-2 border-gold-500">
                                                <div>
                                                    <div className="text-white font-medium text-sm">{m.action}</div>
                                                    <div className="text-slate-500 text-xs">Owner: {m.owner}</div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded ${
                                                    m.status === 'Completed' ? 'bg-green-500/20 text-green-500' :
                                                    m.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' :
                                                    'bg-slate-700 text-slate-300'
                                                }`}>{m.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Insight Mock */}
                                <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded">
                                    <h4 className="text-indigo-400 font-bold mb-2 text-sm flex items-center gap-2">
                                        ✨ AI Recommendation
                                    </h4>
                                    <p className="text-indigo-200/80 text-sm leading-relaxed">
                                        Based on historical patterns, this risk factor tends to correlate with Q3 regulatory updates. 
                                        Recommended to accelerate "Diversify Trade Partners" initiative to minimize Q3 exposure.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskDesk;
