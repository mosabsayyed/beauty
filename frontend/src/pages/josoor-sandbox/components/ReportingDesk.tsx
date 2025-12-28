import React, { useState } from 'react';
import '../josoor.css';
import { FileText, Calendar, Layout, Download, Clock, Plus, Trash2, GripVertical } from 'lucide-react';

export const ReportingDesk: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'designer' | 'archive' | 'scheduled'>('designer');

    // MOCK DATA
    const ARCHIVE = [
        { id: 1, name: 'Q4 2025 Sector Performance', date: 'Dec 15, 2025', size: '2.4 MB', type: 'PDF' },
        { id: 2, name: 'Risk Assessment Brief', date: 'Dec 10, 2025', size: '1.1 MB', type: 'PDF' },
        { id: 3, name: 'Strategic Gap Analysis', date: 'Nov 28, 2025', size: '3.8 MB', type: 'PDF' }
    ];

    const SCHEDULED = [
        { id: 1, name: 'Weekly Executive Summary', frequency: 'Weekly (Sun)', nextRun: 'Dec 22, 2025', recipients: 'Exec Team' },
        { id: 2, name: 'Monthly KPI Digest', frequency: 'Monthly (1st)', nextRun: 'Jan 1, 2026', recipients: 'All Staff' }
    ];

    return (
        <div className="v2-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            
            {/* HEADER & TABS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="v2-panel-title" style={{ fontSize: '1.5rem', margin: 0 }}>Report Designer</h2>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                    {[
                        { id: 'designer', label: 'Designer', icon: Layout },
                        { id: 'archive', label: 'Archive', icon: FileText },
                        { id: 'scheduled', label: 'Scheduled', icon: Clock }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px',
                                background: activeTab === tab.id ? 'var(--accent-gold)' : 'transparent',
                                color: activeTab === tab.id ? '#000' : 'var(--component-text-muted)',
                                border: 'none', borderRadius: '6px', fontWeight: activeTab === tab.id ? 700 : 500,
                                cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="v2-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex' }}>
                
                {/* 1. DESIGNER VIEW */}
                {activeTab === 'designer' && (
                    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                        {/* WIDGETS SIDEBAR */}
                        <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                            <h4 style={{ color: 'var(--component-text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>Components</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {['KPI Scorecard', 'Bar Chart', 'Line Graph', 'Text Block', 'Image / Logo', 'Risk Matrix'].map(w => (
                                    <div key={w} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid transparent' }} className="hover:border-slate-500">
                                        <GripVertical size={14} color="#666" />
                                        <span style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>{w}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CANVAS AREA */}
                        <div style={{ flex: 1, background: '#1e293b', display: 'flex', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
                            <div style={{ width: '595px', minHeight: '842px', background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.5)', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* MOCK PAGE CONTENT */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                                    <h1 style={{ fontSize: '24px', color: '#000', margin: 0 }}>Executive Brief</h1>
                                    <span style={{ color: '#666' }}>Q4 2025</span>
                                </div>
                                <div style={{ height: '150px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    Drop Charts Here
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1, height: '200px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        KPIs
                                    </div>
                                    <div style={{ flex: 1, height: '200px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        Risks
                                    </div>
                                </div>
                                <p style={{ color: '#000', fontSize: '12px', lineHeight: '1.5' }}>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                                </p>
                            </div>
                        </div>

                        {/* PROPERTIES PANEL */}
                        <div style={{ width: '250px', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                             <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                 <button className="v2-btn" style={{ width: '100%' }}>Export PDF</button>
                             </div>
                        </div>
                    </div>
                )}

                {/* 2. ARCHIVE VIEW */}
                {activeTab === 'archive' && (
                    <div style={{ padding: '2rem', width: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Report Name</th>
                                    <th style={{ padding: '1rem' }}>Generated Date</th>
                                    <th style={{ padding: '1rem' }}>Size</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ARCHIVE.map(file => (
                                    <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FileText size={16} color="var(--accent-gold)" /> {file.name}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#9ca3af' }}>{file.date}</td>
                                        <td style={{ padding: '1rem', color: '#9ca3af' }}>{file.size}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Download size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 3. SCHEDULED VIEW */}
                {activeTab === 'scheduled' && (
                    <div style={{ padding: '2rem', width: '100%' }}>
                         <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                             <button className="v2-btn" style={{ fontSize: '0.8rem' }}><Plus size={14} /> New Schedule</button>
                         </div>
                         <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Job Name</th>
                                    <th style={{ padding: '1rem' }}>Frequency</th>
                                    <th style={{ padding: '1rem' }}>Next Run</th>
                                    <th style={{ padding: '1rem' }}>Recipients</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SCHEDULED.map(job => (
                                    <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{job.name}</td>
                                        <td style={{ padding: '1rem', color: '#9ca3af' }}>{job.frequency}</td>
                                        <td style={{ padding: '1rem', color: '#10B981' }}>{job.nextRun}</td>
                                        <td style={{ padding: '1rem', color: '#9ca3af' }}>{job.recipients}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
};
