import React, { useState } from 'react';
import BusinessChains from '../../components/graphv001/components/BusinessChains';
import { useLanguage } from '../../contexts/LanguageContext';

const DependencyDesk: React.FC = () => {
    const { language } = useLanguage();
    const isDark = true; // V10 standard
    const [selectedYear, setSelectedYear] = useState<string>('2025');
    const [selectedQuarter, setSelectedQuarter] = useState<string>('all');

    // V10 Top Strip Metrics (Example)
    const kpiMetrics = [
        { title: 'Chain Health', value: '92%', status: 'healthy', trend: 'steady' },
        { title: 'Critical Dependencies', value: '14', status: 'warning', trend: 'down' },
        { title: 'Bottlenecks', value: '3', status: 'healthy', trend: 'down' }
    ];

    return (
        <div className={`jd-dependency-desk ${language === 'ar' ? 'rtl-layout' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
             {/* 1. TOP STRIP - KPI CARDS (V10) */}
            <div className="jd-kpi-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.5rem', flexShrink: 0 }}>
                {kpiMetrics.map((metric, idx) => (
                    <div key={idx} className="jd-kpi-card" style={{ background: '#111827', border: '1px solid #374151', padding: '1rem', borderRadius: '0.5rem', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '4rem', height: '4rem', background: 'linear-gradient(to bottom right, rgba(212, 175, 55, 0.2), transparent)', borderBottomLeftRadius: '100%', marginRight: '-2rem', marginTop: '-2rem' }}></div>
                        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.title}</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF' }}>{metric.value}</span>
                                <span style={{ 
                                    fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', marginBottom: '0.25rem',
                                    backgroundColor: metric.status === 'critical' ? 'rgba(239, 68, 68, 0.2)' : metric.status === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: metric.status === 'critical' ? '#EF4444' : metric.status === 'warning' ? '#F59E0B' : '#10B981'
                                }}>
                                    {metric.trend === 'up' ? '↑' : '↓'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. MAIN INSTRUMENT FRAME */}
            <div style={{ flex: 1, minHeight: 0, padding: '0 1.5rem 1.5rem 1.5rem', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative' }}>
                     {/* TOP LEFT LABEL */}
                     <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, pointerEvents: 'none' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <span style={{ color: '#D4AF37' }}>●-●</span> {language === 'ar' ? 'سلاسل الاعتماد' : 'Value Chains & Dependencies'}
                        </h3>
                     </div>

                     {/* FLOATING CONTROLS (V10 Style) */}
                     <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 20, display: 'flex', gap: '0.5rem' }}>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#D97706', border: '1px solid #475569', borderRadius: '0.25rem', backdropFilter: 'blur(4px)', outline: 'none' }}
                        >
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                        <select 
                            value={selectedQuarter} 
                            onChange={(e) => setSelectedQuarter(e.target.value)}
                             style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#D97706', border: '1px solid #475569', borderRadius: '0.25rem', backdropFilter: 'blur(4px)', outline: 'none' }}
                        >
                            <option value="all">All Quarters</option>
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                            <option value="Q4">Q4</option>
                        </select>
                     </div>

                     {/* EMBEDDED VERIFIED COMPONENT */}
                     <div style={{ width: '100%', height: '100%' }}>
                         <BusinessChains 
                            selectedYear={selectedYear}
                            selectedQuarter={selectedQuarter}
                            isDark={isDark}
                            language={language}
                         />
                     </div>
                </div>
            </div>
        </div>
    );
};

export default DependencyDesk;
