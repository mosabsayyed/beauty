import React, { useEffect, useState } from 'react';
import './RiskSignals.css';

// V1.3 W4 Fields: signal_name, severity, trend, category, severity_band
interface RiskSignal {
    signal_name: string;
    severity: number;
    category: string;
    trend: number;
    severity_band: string; // 'High', 'Medium', 'Low'
}

interface RiskSignalsProps {
    quarter: string;
    year: string;
}

export const RiskSignals: React.FC<RiskSignalsProps> = ({ quarter, year }) => {
    const [risks, setRisks] = useState<RiskSignal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/control-tower/risk-signals?quarter=${quarter}&year=${year}`)
            .then(res => res.json())
            .then(data => {
                setRisks(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [quarter, year]);

    // Get CSS class for severity band
    const getSeverityClass = (band: string): string => {
        if (band === 'High') return 'v2-severity-high';
        if (band === 'Medium') return 'v2-severity-medium';
        return 'v2-severity-low';
    };

    return (
        <div className="panel v2-list-panel">
            <h3 className="v2-section-title">Leading Signals</h3>
            
            {loading ? (
                <div className="v2-loading">Loading...</div>
            ) : risks.length === 0 ? (
                <div className="v2-empty">No risk signals detected</div>
            ) : (
                <div className="v2-risk-list">
                    {risks.map((r, idx) => (
                        <div key={idx} className="v2-risk-item">
                            <div className="v2-risk-name">{r.signal_name}</div>
                            <div className="v2-risk-details">
                                <span className="v2-risk-category">{r.category}</span>
                                {/* V1.3 W4-5: severity_band field */}
                                <span className={`v2-risk-band ${getSeverityClass(r.severity_band)}`}>
                                    {r.severity_band}
                                </span>
                            </div>
                            <div className="v2-risk-metrics">
                                <span>Score: {(r.severity * 10).toFixed(1)}/10</span>
                                <span>Likelihood: {(r.trend * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
