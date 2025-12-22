import React, { useEffect, useState } from 'react';
import './MissingInputs.css';

// V1.3 W3 Fields: entity_name, missing_type, days_overdue, stale_quarter
interface MissingInputItem {
    entity_name: string;
    missing_type: string;
    days_overdue: number;
    stale_quarter: string;
}

interface MissingInputsProps {
    quarter: string;
    year: string;
}

export const MissingInputs: React.FC<MissingInputsProps> = ({ quarter, year }) => {
    const [items, setItems] = useState<MissingInputItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/control-tower/missing-inputs?quarter=${quarter}&year=${year}`)
            .then(res => res.json())
            .then(data => {
                setItems(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [quarter, year]);

    return (
        <div className="panel v2-list-panel">
            <h3 className="v2-section-title">Data Hygiene</h3>
            
            {loading ? (
                <div className="v2-loading">Loading...</div>
            ) : items.length === 0 ? (
                <div className="v2-empty">No missing inputs detected</div>
            ) : (
                <ul className="v2-missing-list">
                    {items.map((item, idx) => {
                        // Handle Neo4j integer objects {low, high} and null
                        const daysOverdue = item.days_overdue == null 
                            ? 0
                            : typeof item.days_overdue === 'object' 
                                ? ((item.days_overdue as any)?.low ?? 0) 
                                : item.days_overdue;
                        
                        // Handle stale_quarter which might be Neo4j integer or string
                        const staleQuarter = item.stale_quarter == null 
                            ? 'Unknown'
                            : typeof item.stale_quarter === 'object' 
                                ? `Q${(item.stale_quarter as any)?.low ?? ''}`
                                : String(item.stale_quarter);
                        
                        return (
                            <li key={idx} className="v2-missing-item">
                                <div className="v2-missing-header">
                                    <span className="v2-missing-overdue">{daysOverdue} days o/d</span>
                                    <span className="v2-missing-type">{item.missing_type}</span>
                                </div>
                                <div className="v2-missing-entity">{item.entity_name}</div>
                                {/* V1.3 W3-4: stale_quarter field */}
                                <div className="v2-missing-quarter">Quarter: {staleQuarter}</div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
