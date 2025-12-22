import React, { useEffect, useState } from 'react';
import './DecisionsList.css';

// V1.3 W2 Fields: decision_id, title, status, priority, linked_project, due_date, rank_score
interface Decision {
    id: string;
    title: string;
    status: string;
    priority: string;
    linked_project_name: string;
    due_date: string;
}

export const DecisionsList: React.FC = () => {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('/api/control-tower/decisions')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDecisions(data);
                } else {
                    console.error("Decisions API returned non-array:", data);
                    setDecisions([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Decisions fetch error:", err);
                setDecisions([]);
                setLoading(false);
            });
    }, []);

    // Get priority class for badge
    const getPriorityClass = (priority: string): string => {
        if (priority === 'high') return 'v2-priority-high';
        if (priority === 'medium') return 'v2-priority-medium';
        return 'v2-priority-low';
    };

    return (
        <div className="panel v2-list-panel">
            <h3 className="v2-section-title">Decisions Needed</h3>
            
            {loading ? (
                <div className="v2-loading">Loading...</div>
            ) : decisions.length === 0 ? (
                <div className="v2-empty">No pending decisions</div>
            ) : (
                <div className="v2-decisions-list">
                    {decisions.map((d) => (
                        <div key={d.id} className="v2-decision-item">
                            <div className="v2-decision-content">
                                <div className="v2-decision-title">{d.title}</div>
                                <div className="v2-decision-meta">
                                    {d.due_date && new Date(d.due_date).toLocaleDateString()} 
                                    {d.linked_project_name && ` • ${d.linked_project_name}`}
                                </div>
                            </div>
                            <div className="v2-decision-badges">
                                <span className={`v2-priority-badge ${getPriorityClass(d.priority)}`}>
                                    {d.priority ? d.priority.toUpperCase() : 'NORMAL'}
                                </span>
                                <span className="v2-status-badge">
                                    {d.status ? d.status.toUpperCase() : 'PENDING'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
