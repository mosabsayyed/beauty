import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, ScatterChart, XAxis, YAxis, ZAxis, Tooltip, Legend,
  CartesianGrid, Bar, Line, Scatter, Cell, Label
} from 'recharts';
import Panel from './Panel';
import type { DashboardData } from '../types';

interface StrategicInsightsProps {
  data: DashboardData;
  isDark: boolean;
  language: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const tooltipStyle = {
            backgroundColor: 'var(--component-bg-primary)',
            fontSize: '0.875rem',
            border: '1px solid var(--component-panel-border)',
            padding: '0.75rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            zIndex: 1000
        };
        return (
            <div style={tooltipStyle}>
                <p style={{ fontWeight: '700', color: 'var(--component-text-accent)', marginBottom: '0.5rem' }}>{label || payload[0]?.payload?.name}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value}`}
                        {pld.dataKey === 'z' && ` (Budget)`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const StrategicInsights: React.FC<StrategicInsightsProps> = ({ data, isDark, language }) => {
  // Theme object now inside component with access to isDark
  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280', // gray-400
    success: '#10B981', // green-500
    danger: '#EF4444', // red-500
    warning: '#F59E0B', // amber-500
    accent: isDark ? '#FFD700' : '#D97706', // Gold
    borderColor: isDark ? '#374151' : '#D1D5DB', // gray-700
    panelBorderColor: isDark ? '#374151' : '#D1D5DB', // gray-700
  };

  const content = {
    title: { en: 'Strategic Insights', ar: 'الرؤى الاستراتيجية' },
    nodeDist: { en: 'Node Distribution', ar: 'توزيع العقد' },
    growthTrend: { en: 'Growth Trend', ar: 'اتجاه النمو' },
    netImpact: { en: 'Network Impact', ar: 'تأثير الشبكة' },
    risk: { en: 'Risk Level', ar: 'مستوى المخاطر' },
    alignment: { en: 'Alignment', ar: 'المواءمة' },
    efficiency: { en: 'Efficiency', ar: 'الكفاءة' },
    impact: { en: 'Impact', ar: 'التأثير' },
    velocity: { en: 'Project Velocity', ar: 'سرعة المشاريع' },
    opsEff: { en: 'Ops Efficiency', ar: 'الكفاءة التشغيلية' },
    citizenQoL: { en: 'Citizen QoL', ar: 'جودة حياة المواطن' },
    jobs: { en: 'Jobs Created (k)', ar: 'وظائف (ألف)' },
    initiatives: { en: 'Initiatives', ar: 'المبادرات' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  const { insight1, insight2, insight3 } = data || {};

  const insight1Data = useMemo(() => 
    insight1?.initiatives?.map(d => ({
        x: d.risk,
        y: d.alignment,
        z: d.budget,
        name: d.name,
    })) || [], [insight1]);

  const insight2Data = useMemo(() =>
    insight2?.labels?.map((label, i) => ({
        name: label,
        'Project Velocity': insight2.projectVelocity[i],
        'Ops Efficiency': insight2.operationalEfficiency[i],
    })) || [], [insight2]);

  const insight3Data = useMemo(() => 
    insight3?.labels?.map((label, i) => ({
        name: label,
        'Ops Efficiency': insight3.operationalEfficiency[i],
        'Citizen QoL': insight3.citizenQoL[i],
        'Jobs Created (k)': insight3.jobsCreated[i],
    })) || [], [insight3]);

  return (
    <section>
      <h2 className="section-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{t('title')}</h2>
      <div className="grid-container strategic-insights-grid">
        {/* CHART 1 */}
        <Panel>
            <div className="insight-header">
                <h3 className="insight-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{insight1?.title || t('nodeDist')}</h3>
            </div>
            <div className="chart-container">
                <div className="chart-absolute-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid stroke={theme.borderColor} />
                        <XAxis type="number" dataKey="x" name="Risk" unit="" domain={[0, 5]} tick={{ fill: theme.muted, fontSize: 12 }}>
                            <Label value={t('risk')} offset={0} position="insideBottom" style={{ fill: theme.muted, fontSize: '10px' }} />
                        </XAxis>
                        <YAxis type="number" dataKey="y" name="Alignment" unit="" domain={[0, 5]} tick={{ fill: theme.muted, fontSize: 12 }}>
                             <Label value={t('alignment')} angle={-90} position="insideLeft" style={{ fill: theme.muted, fontSize: '10px' }} />
                        </YAxis>
                        <ZAxis type="number" dataKey="z" name="Budget" range={[60, 400]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        <Scatter name={t('initiatives')} data={insight1Data} fillOpacity={0.7}>
                          {insight1Data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={theme.accent} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Panel>

        {/* CHART 2 */}
        <Panel>
            <div className="insight-header">
                <h3 className="insight-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{insight2?.title || t('growthTrend')}</h3>
            </div>
            <div className="chart-container">
                <div className="chart-absolute-fill">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={insight2Data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                          <CartesianGrid stroke={theme.borderColor} vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 12 }} />
                          <YAxis tick={{ fill: theme.muted, fontSize: 12 }}>
                             <Label value={t('efficiency')} angle={-90} position="insideLeft" style={{ fill: theme.muted, fontSize: '10px' }} />
                          </YAxis>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '12px', bottom: 0 }} />
                          <Bar dataKey="Project Velocity" name={t('velocity')} barSize={20} fill={theme.accent} fillOpacity={0.7} />
                          <Line type="monotone" dataKey="Ops Efficiency" name={t('opsEff')} stroke={theme.success} strokeWidth={2} dot={{r: 3}} />
                      </ComposedChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </Panel>

        {/* CHART 3 */}
        <Panel>
             <div className="insight-header">
                <h3 className="insight-title" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>{insight3?.title || t('netImpact')}</h3>
            </div>
            <div className="chart-container">
                <div className="chart-absolute-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={insight3Data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                        <CartesianGrid stroke={theme.borderColor} vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fill: theme.muted, fontSize: 12 }}>
                            <Label value={t('impact')} angle={-90} position="insideLeft" style={{ fill: theme.muted, fontSize: '10px' }} />
                        </YAxis>
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: theme.muted, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', bottom: 0 }} />
                        <Bar yAxisId="left" dataKey="Ops Efficiency" name={t('opsEff')} barSize={20} fill={theme.accent} fillOpacity={0.7} />
                        <Line yAxisId="right" type="monotone" dataKey="Citizen QoL" name={t('citizenQoL')} stroke={theme.success} strokeWidth={2} dot={{r: 3}} />
                      </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Panel>
      </div>
    </section>
  );
};

export default StrategicInsights;