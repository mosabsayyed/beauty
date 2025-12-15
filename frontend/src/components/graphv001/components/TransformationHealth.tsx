import React, { useMemo, useCallback } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { RefreshCw } from 'lucide-react';
import type { Dimension } from '../types';

interface TransformationHealthProps {
  dimensions: Dimension[];
  isDark: boolean;
  language: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  selectedYear?: string;
  selectedQuarter?: string;
}

const TransformationHealth: React.FC<TransformationHealthProps> = ({ 
  dimensions, 
  isDark,
  isLoading = false,
  error = null,
  selectedYear,
  selectedQuarter,
  language
}) => {
  const content = {
    analyzing: { en: 'Analyzing...', ar: 'جار التحليل...' },
    health: { en: 'Health', ar: 'الصحة' },
    ready: { en: 'READY', ar: 'جاهز' },
    generating: { en: 'Generating Strategic Review...', ar: 'جار إنشاء المراجعة الاستراتيجية...' },
    reviewDone: { en: 'Review generated in chat.', ar: 'تم إنشاء المراجعة في الدردشة.' },
    clickToGen: { en: "Click 'Health' button above to generate Strategic Review", ar: "انقر على زر 'الصحة' أعلاه لإنشاء المراجعة الاستراتيجية" },
    selectFuture: { en: "Select a future date (e.g. 2026) to enable Analysis", ar: "اختر تاريخاً مستقبلياً (مثل 2026) لتمكين التحليل" },
    error: { en: 'Error loading data', ar: 'خطأ في تحميل البيانات' },
    overallScore: { en: 'Overall Score', ar: 'النتيجة الإجمالية' },
    avgPerf: { en: 'Avg. Performance', ar: 'متوسط الأداء' },
    vsPlan: { en: 'vs Plan', ar: 'مقابل الخطة' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  // --- Analysis State Management ---
  const [analysisStatus, setAnalysisStatus] = React.useState<'IDLE' | 'ANALYZING' | 'DONE'>('IDLE');

  // Reset status when year or quarter changes
  React.useEffect(() => {
    setAnalysisStatus('IDLE');
  }, [selectedYear, selectedQuarter]);

  // Listen for completion signal from ChatAppPage
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ANALYSIS_COMPLETE') {
        setAnalysisStatus('DONE');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Use useMemo for future check
  const isFuture = useMemo(() => {
    if (!selectedYear || selectedYear === 'all') return false;
    const year = parseInt(selectedYear);
    return year > 2025;
  }, [selectedYear]);

  const handleAnalyze = useCallback(() => {
    if (!isFuture || analysisStatus !== 'IDLE') return;
    
    setAnalysisStatus('ANALYZING');

    // Trigger analysis in Chat
    window.parent.postMessage({
        type: 'REQUEST_ANALYSIS',
        source: 'graphv001',
        selectedYear: selectedYear,
        language: language,
        // Include Quarter in message if useful, though ChatAppPage parses current state
        suppressCanvasOpen: true 
    }, '*');
  }, [isFuture, selectedYear, analysisStatus]);

  const theme = {
    muted: isDark ? '#9CA3AF' : '#6B7280', // gray-400
    success: '#10B981', // green-500
    danger: '#EF4444', // red-500
    warning: '#F59E0B', // amber-500
    accent: isDark ? '#FFD700' : '#D97706', // Gold
    borderColor: isDark ? '#374151' : '#D1D5DB', // gray-700
    panelBorderColor: isDark ? '#374151' : '#D1D5DB', // gray-700
  };

  const getHealthColor = useCallback((healthState?: string) => {
    if (!healthState) return theme.muted;
    const state = healthState.toLowerCase();
    if (state === 'healthy') return theme.success;
    if (state === 'at risk') return theme.warning;
    if (state === 'distressed') return theme.danger;
    return theme.muted;
  }, [theme]);

  const getPointColor = useCallback((delta: number) => {
    // Logic: Gap < 5% (delta >= -5) is Green
    // Gap < 15% (delta >= -15) is Yellow
    // Gap > 15% (delta < -15) is Red
    if (delta >= -5) return theme.success;
    if (delta >= -15) return theme.warning;
    return theme.danger;
  }, [theme]);

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = payload.healthState ? getHealthColor(payload.healthState) : getPointColor(payload.delta);
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1} />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const style = {
        background: 'var(--component-bg-primary)',
        border: '1px solid var(--component-panel-border)',
        padding: '0.5rem',
      };
      return (
        <div style={style}>
          <p style={{fontWeight: 'bold', color: 'var(--component-text-primary)'}}>{label}</p>
          {payload.map((p: any, index: number) => (
            <div key={index} style={{ color: p.color || p.stroke || p.fill }}>
              {p.name}: {Number(p.value).toFixed(1)}%
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const { averageDelta } = useMemo(() => {
    if (dimensions.length === 0) return { averageDelta: 0 };
    const totalDelta = dimensions.reduce((acc, dim) => acc + dim.delta, 0);
    const averageDelta = parseFloat((totalDelta / dimensions.length).toFixed(1));
    return { averageDelta };
  }, [dimensions]);

  // Map long titles to short one-word labels for radar chart
  const shortenLabel = (title: string): string => {
    const labelMap: Record<string, string> = {
      'Employee Engagement Score': 'Culture',
      'Strategic Plan Alignment': 'Strategy',
      'Operational Efficiency': 'Operations',
      'Risk Mitigation Rate': 'Risk',
      'Investment Portfolio ROI': 'ROI',
      'Active Investor Rate': 'Investors',
      'Project Delivery Velocity': 'Delivery',
      'Tech Stack SLA Compliance': 'Tech',
    };
    
    const short = labelMap[title] || title.split(' ')[0];
    
    if (language === 'ar') {
      const arMap: Record<string, string> = {
        'Culture': 'الثقافة',
        'Strategy': 'الاستراتيجية',
        'Operations': 'العمليات',
        'Risk': 'المخاطر',
        'ROI': 'العائد',
        'Investors': 'المستثمرون',
        'Delivery': 'التسليم',
        'Tech': 'التقنية'
      };
      return arMap[short] || short;
    }
    return short;
  };

  const chartData = useMemo(() => 
    dimensions.map(d => ({
      name: shortenLabel(d.title), // d.title exists on Dimension
      actual: d.actual,
      planned: d.planned,
      healthState: d.healthState, // d.healthState exists on Dimension
      delta: d.delta,
      fullMark: 105 // Added fullMark for PolarRadiusAxis domain
    }))
  , [dimensions]); // chartData dependencies
  
  return (
    <section>
      {/* Health Title - Clickable if Future */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div 
            id="tour-analyze-btn"
            className={`nav-btn ${
                isFuture && analysisStatus === 'IDLE' ? 'active-interactive' : ''
            } ${
                analysisStatus === 'ANALYZING' ? 'nav-btn-wait' : ''
            } ${
                analysisStatus === 'DONE' ? 'nav-btn-not-allowed' : ''
            }`}
            role="button"
            tabIndex={isFuture && analysisStatus === 'IDLE' ? 0 : -1}
            onClick={handleAnalyze}
            style={{ 
              cursor: isFuture 
                  ? (analysisStatus === 'IDLE' ? 'pointer' : (analysisStatus === 'ANALYZING' ? 'wait' : 'not-allowed')) 
                  : 'default', 
              opacity: isFuture ? (analysisStatus === 'IDLE' ? 1 : 0.7) : 0.8,
              flex: 'none',
              width: '100%',
              height: '56px',
              minHeight: '56px',
              transition: 'all 0.3s ease',
              border: isFuture ? `1px solid ${theme.accent}` : `1px solid transparent`,
              background: isFuture ? (isDark ? 'rgba(217, 119, 6, 0.1)' : 'rgba(255, 215, 0, 0.1)') : undefined,
              borderRadius: '0.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* ANALYSIS COMPLETE TAG - Only shows when DONE */}
            {analysisStatus === 'DONE' && (
               <div style={{
                   position: 'absolute',
                   top: 0, right: 0,
                   background: theme.success,
                   color: '#FFF',
                   fontSize: '0.6rem',
                   fontWeight: 'bold',
                   padding: '2px 8px',
                   borderBottomLeftRadius: '0.5rem',
                   boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
               }}>
                   {t('ready')}
               </div>
            )}
            
            <div className="nav-btn-content">
              {/* Icon replaced by Spinner when Analyzing */}
              {analysisStatus === 'ANALYZING' ? (
                  <div className="nav-btn-icon-wrapper">
                    <RefreshCw className="animate-spin" size={20} color={theme.accent} />
                  </div>
              ) : (
                <div className="nav-btn-icon-wrapper">
                  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="health-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                        <stop offset="100%" stopColor="#B45309" stopOpacity="0.3" />
                      </radialGradient>
                    </defs>
                    <path 
                      d="M25 44C25 44 5 30 5 18C5 10 11 5 18 5C22 5 25 8 25 8C25 8 28 5 32 5C39 5 45 10 45 18C45 30 25 44 25 44Z" 
                      fill="url(#health-glow)" 
                      stroke="#FFD700" 
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {analysisStatus === 'ANALYZING' ? t('analyzing') : t('health')}
                  </span>
              </div>
            </div>
          </div>
          
          <div style={{ 
              fontSize: '0.85rem', // INCREASED FONT SIZE
              fontWeight: 500,
              color: isFuture 
                  ? (analysisStatus === 'DONE' ? theme.success : theme.accent) 
                  : theme.muted, 
              textAlign: 'center',
              padding: '0.5rem 0.5rem',
              background: isFuture ? (isDark ? 'rgba(17, 24, 39, 0.4)' : '#F3F4F6') : 'transparent',
              borderRadius: '0.375rem',
              minHeight: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
          }}>
              {isFuture 
                ? (analysisStatus === 'ANALYZING' 
                    ? t('generating') 
                    : (analysisStatus === 'DONE' ? t('reviewDone') : t('clickToGen'))) 
                : t('selectFuture')
              }
          </div>
      </div>

      <div className="th-container">
        {/* CHART PANEL - single bounding box */}
        <div className="th-chart-panel" style={{ 
          background: 'var(--component-panel-bg)', 
          border: '2px solid var(--component-panel-border)', 
          borderRadius: '0.75rem', 
          padding: '1rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="chart-container radar-height">
            {isLoading ? (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <RefreshCw className="animate-spin" size={24} color={theme.muted} />
               </div>
            ) : error ? (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: theme.danger }}>
                  {t('error')}
               </div>
            ) : (
              <div className="chart-absolute-fill">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="45%" outerRadius="80%" data={chartData}>
                          <PolarGrid stroke={theme.borderColor} />
                          <PolarAngleAxis 
                              dataKey="name" 
                              tick={{ fill: theme.muted, fontSize: 11 }} 
                              tickFormatter={(val) => val}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 105]} axisLine={false} tick={false} />
                          <Radar 
                              name="Actual" 
                              dataKey="actual" 
                              stroke={theme.accent}
                              fill={theme.accent}
                              fillOpacity={0.2} 
                              dot={<CustomizedDot />}
                          />
                          <Radar 
                              name="Planned" 
                              dataKey="planned" 
                              stroke={theme.muted} 
                              fill="transparent"
                              strokeDasharray="3 3"
                          />
                          <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
            )}
          </div>
          
          <div className="th-score-panel" style={{ textAlign: 'center', padding: '1rem' }}>
              <h3 style={{ 
                color: 'var(--component-text-primary)', 
                fontSize: '0.875rem', 
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>{t('overallScore')}</h3>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 800, 
                color: '#10B981',
                lineHeight: 1 
              }}>
                  {dimensions.length > 0 
                    ? `${(dimensions.reduce((acc, d) => acc + d.actual, 0) / dimensions.length).toFixed(1)}%`
                    : '0%'
                  }
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: averageDelta >= 0 ? '#10B981' : '#EF4444',
                marginTop: '0.25rem'
              }}>
                  {averageDelta >= 0 ? '+' : ''}{averageDelta} {t('vsPlan')}
              </div>
              <p style={{ 
                color: 'var(--component-text-muted)', 
                fontSize: '0.75rem',
                marginTop: '0.5rem',
                fontWeight: 500
              }}>{t('avgPerf')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransformationHealth;