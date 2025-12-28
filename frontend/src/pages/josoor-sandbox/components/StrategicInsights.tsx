import React, { useState, useEffect } from 'react';
import { Lightbulb, ArrowRight, ExternalLink } from 'lucide-react';
import './ControlTowerViews.css'; // Shared CSS

interface StrategicInsight {
    id: string;
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    category: 'Opportunity' | 'Risk' | 'Optimization';
    description: string;
}

export const StrategicInsights: React.FC = () => {
    const [insights, setInsights] = useState<StrategicInsight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // MOCK FETCH - Replace with /api/v1/dashboard/strategic-insights when ready
        const fetchInsights = async () => {
            try {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Mock Data derived from "Strategic Planning Desk" concept
                setInsights([
                    {
                        id: 'SI-001',
                        title: 'AI Adoption Acceleration',
                        impact: 'High',
                        category: 'Opportunity',
                        description: 'Sector-wide AI readiness has jumped 15% due to new policy tools.'
                    },
                    {
                        id: 'SI-002',
                        title: 'Infrastructure Bottleneck',
                        impact: 'High',
                        category: 'Risk',
                        description: 'Cloud compute capacity in Zone A is nearing 90% utilization.'
                    },
                    {
                        id: 'SI-003',
                        title: 'Talent Density Gap',
                        impact: 'Medium',
                        category: 'Optimization',
                        description: 'Data Science roles are unfilled for >3 months on average.'
                    }
                ]);
            } catch (e) {
                console.error("Failed to fetch strategic insights", e);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, []);

    return (
        <div className="ct-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="ct-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={16} color="#FFD700" />
                <span>Strategic Insights</span>
            </div>
            
            <div className="ct-list" style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div className="ct-muted">Loading insights...</div>
                ) : (
                    insights.map(insight => (
                        <div key={insight.id} className="ct-row" style={{ display: 'block', padding: '10px', marginBottom: '8px', cursor: 'default' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--component-text-primary)' }}>
                                    {insight.title}
                                </span>
                                <span className={`ct-badge ${insight.impact === 'High' ? 'v2-badge-high' : ''}`}>
                                    {insight.impact}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--component-text-secondary)', lineHeight: '1.4' }}>
                                {insight.description}
                            </div>
                        </div>
                    ))
                )}
            </div>
             <button className="ct-action-link" style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#FFD700', background: 'none', border: 'none', cursor: 'pointer' }}>
                View All Insights <ArrowRight size={14} />
            </button>
        </div>
    );
};
