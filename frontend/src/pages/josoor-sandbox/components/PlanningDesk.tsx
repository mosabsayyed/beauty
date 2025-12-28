import React, { useState } from 'react';
import '../josoor.css'; // Use shared styles

// Mock Capability Data for Matrix View (L1 -> L2)
const CAPABILITIES = [
    {
        id: 'cap_1',
        title: 'Strategy & Governance',
        children: [
            { id: 'c1_1', title: 'Startups Policy Framework', score: 3, maturity: 'High' },
            { id: 'c1_2', title: 'Digital Regulations', score: 2, maturity: 'Medium' },
            { id: 'c1_3', title: 'Investment Strategy', score: 3, maturity: 'High' }
        ]
    },
    {
        id: 'cap_2',
        title: 'Operational Excellence',
        children: [
            { id: 'c2_1', title: 'Process Automation', score: 2, maturity: 'Medium' },
            { id: 'c2_2', title: 'Service Integration', score: 1, maturity: 'Low' },
            { id: 'c2_3', title: 'Quality Assurance', score: 2, maturity: 'Medium' }
        ]
    },
    {
        id: 'cap_3',
        title: 'Technology & Data',
        children: [
            { id: 'c3_1', title: 'Cloud Infrastructure', score: 3, maturity: 'High' },
            { id: 'c3_2', title: 'Data Analytics', score: 1, maturity: 'Low' },
            { id: 'c3_3', title: 'Cybersecurity', score: 2, maturity: 'Medium' }
        ]
    },
    {
        id: 'cap_4',
        title: 'Human Capital',
        children: [
            { id: 'c4_1', title: 'Digital Skills', score: 2, maturity: 'Medium' },
            { id: 'c4_2', title: 'Leadership Dev', score: 2, maturity: 'Medium' },
        ]
    }
];

export const PlanningDesk: React.FC = () => {
    const [selectedCap, setSelectedCap] = useState<any | null>(null);

    const getScoreColor = (score: number) => {
        if (score === 3) return 'bg-[#10B981]'; // High
        if (score === 2) return 'bg-[#D97706]'; // Medium
        return 'bg-[#EF4444]'; // Low
    };

    return (
        <div className="v2-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <h2 className="v2-panel-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Capability Matrix</h2>
            <div style={{ display: 'flex', gap: '1rem', height: '100%', minHeight: 0 }}>
                
                {/* MATRIX VIEW */}
                <div className="v2-panel" style={{ flex: 2, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {CAPABILITIES.map(l1 => (
                            <div key={l1.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
                                <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                    {l1.title}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {l1.children.map(l2 => (
                                        <div 
                                            key={l2.id} 
                                            onClick={() => setSelectedCap(l2)}
                                            style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center', 
                                                padding: '0.75rem', 
                                                background: selectedCap?.id === l2.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.2)', 
                                                borderRadius: '6px',
                                                border: selectedCap?.id === l2.id ? '1px solid var(--accent-gold)' : '1px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            className="hover:bg-[#1f2937]"
                                        >
                                            <span style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>{l2.title}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{l2.maturity}</span>
                                                <div className={`w-3 h-3 rounded-full ${getScoreColor(l2.score)}`} style={{ boxShadow: '0 0 5px rgba(0,0,0,0.5)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DETAILS PANEL */}
                <div className="v2-panel" style={{ flex: 1, padding: '1.5rem', borderLeft: '3px solid var(--accent-gold)' }}>
                    {selectedCap ? (
                        <div className="animate-in fade-in duration-300">
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span className={`px-2 py-1 rounded text-xs font-bold text-black ${
                                    selectedCap.score === 3 ? 'bg-[#10B981]' : selectedCap.score === 2 ? 'bg-[#D97706]' : 'bg-[#EF4444]'
                                }`}>
                                    MATURITY LEVEL: {selectedCap.score}/3
                                </span>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>{selectedCap.title}</h2>
                            <p style={{ color: '#9ca3af', lineHeight: '1.6', marginBottom: '2rem' }}>
                                Detailed capability assessment attributes and gap analysis would appear here. This capability is critical for achieving the sector's strategic objectives.
                            </p>
                            
                            <h4 style={{ color: 'var(--accent-gold)', fontWeight: 700, marginBottom: '1rem' }}>Key Initiatives</h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <li style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '4px', borderLeft: '2px solid #6366F1' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>Initiative 1: Foundation Upgrade</div>
                                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Status: In Progress | Owner: IT Ops</div>
                                </li>
                                <li style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '4px', borderLeft: '2px solid #6366F1' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>Initiative 2: Staff Training</div>
                                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Status: Planned | Owner: HR</div>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🎯</div>
                            <p style={{ textAlign: 'center' }}>Select a capability from the matrix<br/>to view detailed assessment.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
