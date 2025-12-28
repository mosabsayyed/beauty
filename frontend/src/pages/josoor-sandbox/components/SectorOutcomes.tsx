import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './ControlTowerViews.css'; // Shared CSS

interface SectorOutcome {
    id: string;
    title: string;
    progress: number;
    trend: 'up' | 'down' | 'steady';
    target_year: string;
}

export const SectorOutcomes: React.FC = () => {
    const [outcomes, setOutcomes] = useState<SectorOutcome[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // MOCK FETCH - Replace with /api/v1/dashboard/sector-outcomes
        const fetchOutcomes = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 600));
                
                setOutcomes([
                    { id: 'SO-01', title: 'Digital GDP Contr.', progress: 78, trend: 'up', target_year: '2026' },
                    { id: 'SO-02', title: 'Citizen Trust Index', progress: 92, trend: 'steady', target_year: '2025' },
                    { id: 'SO-03', title: 'Carbon Neutrality', progress: 45, trend: 'down', target_year: '2030' },
                    { id: 'SO-04', title: 'SME Digitization', progress: 60, trend: 'up', target_year: '2027' },
                ]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchOutcomes();
    }, []);

    const getIcon = (trend: string) => {
        if (trend === 'up') return <TrendingUp size={14} color="#10B981" />;
        if (trend === 'down') return <TrendingDown size={14} color="#EF4444" />;
        return <Minus size={14} color="#9CA3AF" />;
    };

    return (
        <div className="ct-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="ct-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={16} color="#60A5FA" />
                <span>Sector Outcomes</span>
            </div>

            <div className="ct-list" style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div className="ct-muted">Loading outcomes...</div>
                ) : (
                    outcomes.map(outcome => (
                        <div key={outcome.id} className="ct-row" style={{ alignItems: 'center', padding: '8px 10px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                                    {outcome.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--component-text-secondary)' }}>
                                    Target: {outcome.target_year}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: '#fff' }}>{outcome.progress}%</div>
                                </div>
                                {getIcon(outcome.trend)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
