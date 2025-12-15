import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar, Line, Label
} from 'recharts';
import Panel from './Panel';
import type { OutcomesData } from '../types';


interface SectorOutcomesProps {
  outcomes: OutcomesData;
  isDark: boolean;
  language: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
         const tooltipStyle = {
            backgroundColor: 'var(--component-bg-primary)',
            fontSize: '0.75rem',
            border: '1px solid var(--component-panel-border)',
            padding: '0.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            zIndex: 1000
        };
        return (
            <div style={tooltipStyle}>
                <p style={{ fontWeight: '700', color: 'var(--component-text-accent)', marginBottom: '0.25rem' }}>{label || payload[0]?.name}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} style={{ color: pld.color || pld.fill }}>
                        {`${pld.name}: ${pld.value}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const DoughnutChartWithLabel: React.FC<{
    data: { name: string, value: number }[];
    colors: string[];
    actual: number;
    target: number;
    isDark?: boolean;
    language?: string;
}> = ({ data, colors, actual, target, isDark, language }) => {
    const vsTarget = language === 'ar' ? `مقابل ${target}% مستهدف` : `vs ${target}% Target`;
    return (
        <div className="doughnut-row">
            <div className="doughnut-wrapper">
                {/* Fixed dimensions directly on PieChart - NO ResponsiveContainer */}
                {/* Outer Radius reduced to 36 (from 40) to prevent clipping in 80px container */}
                <PieChart width={80} height={80} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                        data={data}
                        cx={40} 
                        cy={40}
                        innerRadius={24}
                        outerRadius={36}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </div>
            <div className="doughnut-side-label">
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: isDark ? '#F9FAFB' : '#1F2937', lineHeight: 1 }}>{actual}%</div>
                <div style={{ fontSize: '0.75rem', color: isDark ? '#9CA3AF' : '#6B7280' }}>{vsTarget}</div>
            </div>
        </div>
    );
};


const SectorOutcomes: React.FC<SectorOutcomesProps> = ({ outcomes, isDark, language }) => {
  // Theme object with access to isDark
  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    accent: isDark ? '#FFD700' : '#D97706',
    borderColor: isDark ? '#374151' : '#D1D5DB',
    panelBorderColor: isDark ? '#374151' : '#D1D5DB',
  };

  const content = {
    title: { en: 'Sector-Level Outcomes', ar: 'المخرجات القطاعية' },
    netScale: { en: 'Network Scale Metrics', ar: 'مقاييس نطاق الشبكة' },
    connScore: { en: 'Connectivity Score', ar: 'نتيجة الاتصال' },
    netCov: { en: 'Network Coverage', ar: 'تغطية الشبكة' },
    intIndex: { en: 'Integration Index', ar: 'مؤشر التكامل' },
    jobs: { en: 'Jobs', ar: 'الوظائف' },
    fdi: { en: 'FDI', ar: 'الاستثمار الأجنبي' },
    target: { en: 'Target', ar: 'المستهدف' },
    cov: { en: 'Cov %', ar: 'التغطية %' },
    quality: { en: 'Qlty', ar: 'الجودة' },
    engaged: { en: 'Engaged', ar: 'متفاعل' },
    ppp: { en: 'PPP', ar: 'شراكة' },
    rest: { en: 'Rest', ar: 'الباقي' },
    coverage: { en: 'Coverage', ar: 'التغطية' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

    const outcome1Data = useMemo(() => 
        outcomes?.outcome1?.macro?.labels?.map((label, i) => ({
            name: label,
            'Jobs': outcomes.outcome1.macro.jobs.actual[i],
            'FDI': outcomes.outcome1.macro.fdi.actual[i],
            'Target': outcomes.outcome1.macro.fdi.target[i],
        })) || [], [outcomes]);

    const { actual: pppActual = 0, target: pppTarget = 0 } = outcomes?.outcome2?.partnerships || {};
    const outcome2Data = [{ name: t('ppp'), value: pppActual }, { name: t('rest'), value: Math.max(0, 100 - pppActual) }];

    const outcome3Data = useMemo(() => 
        outcomes?.outcome3?.qol?.labels?.map((label, i) => ({
            name: label,
            'Cov %': outcomes.outcome3.qol.coverage.actual[i],
            'Qlty': outcomes.outcome3.qol.quality.actual[i] * 10,
        })) || [], [outcomes]);
    
    const { actual: commActual = 0, target: commTarget = 0 } = outcomes?.outcome4?.community || {};
    const outcome4Data = [{ name: t('engaged'), value: commActual }, { name: t('rest'), value: Math.max(0, 100 - commActual) }];

    return (
    <section>
      <h2 className="section-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{t('title')}</h2>
      <div className="grid-container sector-outcomes-grid">
          {/* Panel 1: Bar/Line */}
          <Panel>
              <h3 className="insight-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{outcomes?.outcome1?.title || 'Network Scale Metrics'}</h3>
              <div className="chart-container">
                  <div className="chart-absolute-fill">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={outcome1Data} margin={{ top: 10, right: 10, bottom: 20, left: 15 }}>
                            <CartesianGrid stroke={theme.borderColor} vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 10 }} />
                            <YAxis yAxisId="left" tick={{ fill: theme.muted, fontSize: 10 }}>
                                <Label value={t('jobs')} angle={-90} position="insideLeft" style={{ fill: theme.muted, fontSize: '8px' }} />
                            </YAxis>
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: theme.muted, fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '10px', bottom: 0 }}/>
                            <Bar yAxisId="left" dataKey="Jobs" name={t('jobs')} barSize={16} fill={theme.accent} fillOpacity={0.8} />
                            <Line yAxisId="right" type="monotone" dataKey="FDI" name={t('fdi')} stroke={theme.success} strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                  </div>
              </div>
          </Panel>

          {/* Panel 2: Tiny Doughnut */}
          <Panel>
              <h3 className="insight-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{outcomes?.outcome2?.title || t('connScore')}</h3>
              <div className="chart-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DoughnutChartWithLabel 
                    data={outcome2Data}
                    colors={[theme.accent, theme.panelBorderColor]}
                    actual={pppActual}
                    target={pppTarget}
                    isDark={isDark}
                    language={language}
                />
              </div>
          </Panel>

          {/* Panel 3: Bar/Line */}
          <Panel>
              <h3 className="insight-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{outcomes?.outcome3?.title || t('netCov')}</h3>
              <div className="chart-container">
                  <div className="chart-absolute-fill">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={outcome3Data} margin={{ top: 10, right: 10, bottom: 20, left: 15 }}>
                            <CartesianGrid stroke={theme.borderColor} vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 10 }} />
                            <YAxis tick={{ fill: theme.muted, fontSize: 10 }}>
                                <Label value={t('coverage')} angle={-90} position="insideLeft" style={{ fill: theme.muted, fontSize: '8px' }} />
                            </YAxis>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '10px', bottom: 0 }} />
                            <Bar dataKey="Cov %" name={t('cov')} barSize={16} fill={theme.accent} fillOpacity={0.8} />
                            <Line type="monotone" dataKey="Qlty" name={t('quality')} stroke={theme.success} strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                  </div>
              </div>
          </Panel>

          {/* Panel 4: Tiny Doughnut */}
          <Panel>
              <h3 className="insight-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{outcomes?.outcome4?.title || t('intIndex')}</h3>
              <div className="chart-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <DoughnutChartWithLabel 
                    data={outcome4Data}
                    colors={[theme.accent, theme.panelBorderColor]}
                    actual={commActual}
                    target={commTarget}
                    isDark={isDark}
                    language={language}
                />
              </div>
          </Panel>
      </div>
    </section>
  );
};

export default SectorOutcomes;