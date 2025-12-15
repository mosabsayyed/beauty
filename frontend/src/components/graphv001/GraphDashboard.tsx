import { useEffect, useState, useRef } from "react";
import { NeoGraph } from "./components/NeoGraph";
import { Button } from "../ui/button";
import { Database, Download, CircleHelp } from "lucide-react";
import './GraphDashboard.css';
import '../../canvas.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { useQuery } from "@tanstack/react-query";
import { GraphFilters } from "./components/GraphFilters";
import NavButtons from "./components/NavButtons";
import TransformationHealth from "./components/TransformationHealth";
import StrategicInsights from "./components/StrategicInsights";
import InternalOutputs from "./components/InternalOutputs";
import SectorOutcomes from "./components/SectorOutcomes";
import BusinessChains from "./components/BusinessChains";
import DashboardOnboarding from "./components/DashboardOnboarding";
import { DASHBOARD_DATA } from "./constants";
import FULL_GRAPH_DATA from './full_graph_snapshot.json';
import { STATIC_SCHEMA } from './static_schema';

type ViewState = 'dashboard' | 'business_chains' | 'graph';

interface GraphData {
  nodes: Array<{
    id: string;
    group: string;
    label: string;
    val: number;
    color?: string;
    health?: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
    type: string;
  }>;
}

export function GraphDashboard() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>([]);
  const [dashboardYear, setDashboardYear] = useState<string>('2025');
  const [searchQuarter, setSearchQuarter] = useState<string>('Q4');
  const [limit, setLimit] = useState<number>(200);
  const [showGuide, setShowGuide] = useState(false); // Onboarding guide state

  useEffect(() => {
    console.log('[GraphDashboard] Component Mounted');
    // Optional: Auto-show guide on first visit
    const hasSeenGuide = localStorage.getItem('hasSeenDashboardGuide');
    if (!hasSeenGuide) {
       setShowGuide(true);
       localStorage.setItem('hasSeenDashboardGuide', 'true');
    }
  }, []);

  // Responsive: detect container width for narrow mode
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        console.log('[GraphDashboard] Container width:', width, 'isNarrow:', width < 700);
        setIsNarrow(width < 700);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);
  
  // Read theme from data-theme attribute (managed by Sidebar)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const attr = document.documentElement.getAttribute('data-theme');
    return (attr as 'dark' | 'light') || 'dark';
  });
  
  // Watch for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const attr = document.documentElement.getAttribute('data-theme');
      console.log('[GraphDashboard] Theme changed:', attr);
      setTheme((attr as 'dark' | 'light') || 'dark');
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  
  const isDark = theme === 'dark';
  console.log('[GraphDashboard] Current theme:', theme, 'isDark:', isDark);
  const { language, isRTL } = useLanguage();
  
  // Use static schema instead of API query
  const schema = STATIC_SCHEMA;

  const content = {
    title: { en: 'NEO4JOSOOR', ar: 'نيو فور جسور' },
    subtitle: { en: 'INSIGHT', ar: 'إنسايت' },
    tagline: { en: 'Strategic Transformation Ontology', ar: 'أنطولوجيا التحول الاستراتيجي' },
    year: { en: 'YEAR:', ar: 'السنة:' },
    qtr: { en: 'QTR:', ar: 'الربع:' },
    allYears: { en: 'All Years', ar: 'كل السنوات' },
    allQuarters: { en: 'All Quarters', ar: 'كل الأرباع' },
    connecting: { en: 'Neo4j: Connecting...', ar: 'نيو فور جي: جار الاتصال...' },
    connected: { en: 'Neo4j:', ar: 'نيو فور جي:' },
    export: { en: 'Export Data', ar: 'تصدير البيانات' },
    showGuide: { en: 'Show Onboarding Guide', ar: 'عرض دليل الاستخدام' },
    loading: { en: 'Loading graph data from Neo4j...', ar: 'جار تحميل بيانات الرسم البياني...' },
    failed: { en: 'Failed to load Neo4j data', ar: 'فشل تحميل البيانات' },
    checkConn: { en: 'Please check your database connection', ar: 'يرجى التحقق من اتصال قاعدة البيانات' }
  };

  const t = (key: keyof typeof content) => {
    return language === 'ar' ? content[key].ar : content[key].en;
  };



  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics', dashboardYear, searchQuarter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dashboardYear && dashboardYear !== 'all') params.append('year', dashboardYear);
      if (searchQuarter && searchQuarter !== 'all') params.append('quarter', searchQuarter);
      
      const url = `/api/dashboard/metrics?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    },
    staleTime: 60000,
  });

  const buildGraphUrl = () => {
    const params = new URLSearchParams();
    if (selectedLabels.length > 0) {
      params.append('labels', selectedLabels.join(','));
    }
    if (selectedRelationships.length > 0) {
      params.append('relationships', selectedRelationships.join(','));
    }
    // Use dashboardYear and searchQuarter from main filter
    if (dashboardYear && dashboardYear !== 'all') {
      params.append('years', dashboardYear);
    }
    if (searchQuarter && searchQuarter !== 'all') {
      params.append('quarter', searchQuarter);
    }
    params.append('limit', limit.toString());
    return `/api/graph?${params.toString()}`;
  };
  
  
  
  const { data: graphData, isLoading: graphLoading, error: graphError, refetch } = useQuery<GraphData>({
    queryKey: ['neo4j-graph', selectedLabels, selectedRelationships, dashboardYear, searchQuarter, limit],
    queryFn: async () => {
      const url = buildGraphUrl();
      console.log('[GRAPH QUERY] Fetching:', url);
      console.log('[GRAPH QUERY] Current view:', currentView);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      const data = await response.json();
      // Debug: Check data structure
      console.log('[GRAPH DEBUG] Nodes count:', data.nodes?.length);
      console.log('[GRAPH DEBUG] Links count:', data.links?.length);
      if (data.nodes?.length > 0) {
        console.log('[GRAPH DEBUG] First node:', JSON.stringify(data.nodes[0]).substring(0, 200));
        console.log('[GRAPH DEBUG] Node IDs sample:', data.nodes.slice(0, 5).map((n: any) => n.id));
      }
      if (data.links?.length > 0) {
        console.log('[GRAPH DEBUG] First link:', data.links[0]);
        console.log('[GRAPH DEBUG] Links source/target sample:', data.links.slice(0, 3).map((l: any) => ({ s: l.source, t: l.target })));
      }
      return data;
    },
    staleTime: 60000,
    enabled: currentView === 'graph',
  });

  const { data: healthData } = useQuery({
    queryKey: ['neo4j-health'],
    queryFn: async () => {
      const response = await fetch('/api/neo4j/health');
      if (!response.ok) {
        throw new Error('Failed to check Neo4j health');
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: currentView === 'graph' || currentView === 'business_chains',
  });
  
  // Use demo data during onboarding for impressive 3D graph visualization
  const displayGraphData = (showGuide && currentView === 'graph') ? FULL_GRAPH_DATA : graphData;

  const handleExport = async () => {
    // Determine data to export based on view
    let dataToExport = null;
    let filename = 'dashboard_data.json';

    try {
      if (currentView === 'graph') {
        dataToExport = graphData;
        filename = 'graph_data.json';
      } else if (currentView === 'dashboard') {
        dataToExport = metricsData || DASHBOARD_DATA;
        filename = 'dashboard_metrics.json';
      } else if (currentView === 'business_chains') {
        // Business chains export - fetch dynamic data
        filename = 'business_chains_data.json';
        
        const params = new URLSearchParams();
        if (dashboardYear && dashboardYear !== 'all') params.append('year', dashboardYear);
        if (searchQuarter && searchQuarter !== 'all') params.append('quarter', searchQuarter);
        
        const url = `/api/business-chain/counts?${params.toString()}`;
        const response = await fetch(url);
        
        if (response.ok) {
           const countsData = await response.json();
           dataToExport = {
             metadata: {
               year: dashboardYear,
               quarter: searchQuarter,
               timestamp: new Date().toISOString()
             },
             ...countsData
           };
        } else {
           console.error("Failed to fetch business chain data for export");
           alert("Failed to fetch business chain data for export. Please try again.");
           return;
        }
      }

      if (!dataToExport) {
        alert("No data available to export.");
        return;
      }

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
      
    } catch (error) {
      console.error("Export failed:", error);
      alert("An error occurred while exporting data.");
    }
  };

  return (
    <div ref={containerRef} className={`graph-dashboard-root ${isNarrow ? 'narrow-mode' : ''} ${isRTL ? 'rtl-layout' : ''}`} style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: isDark ? '#111827' : '#F9FAFB', overflow: 'hidden' }}>
      {/* WARNING: DO NOT USE TAILWIND - IT IS NOT INSTALLED. USE INLINE STYLES OR GraphDashboard.css CLASSES ONLY */}
      {/* Header - Fixed at Top with Offset (64px to clear Canvas Header) */}
      <div style={{ position: 'sticky', top: 0, width: '100%', height: '64px', backgroundColor: isDark ? '#111827' : '#FFFFFF', borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, padding: '0 1.5rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', zIndex: 50 }}>
        {/* LOGO & TITLE */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <img src="/icons/josoor.svg" alt="Josoor Logo" style={{ height: '40px', width: 'auto', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: language === 'ar' ? '4px' : '0' }}>
            <h1 
              style={{ color: isDark ? '#FFFFFF' : '#111827', margin: 0, lineHeight: language === 'ar' ? 1.2 : 1, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.025em', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onClick={() => setCurrentView('dashboard')}
              data-testid="link-dashboard-home"
            >
              {t('title')} <span style={{ color: isDark ? '#FFD700' : '#D97706' }}>{t('subtitle')}</span>
            </h1>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: isDark ? '#D1D5DB' : '#9CA3AF', margin: 0, lineHeight: language === 'ar' ? 1.4 : 1.2 }}>{t('tagline')}</p>
          </div>
        </div>
        
        {/* RIGHT ACTIONS */}
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div id="tour-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ color: isDark ? '#FFD700' : '#D97706', fontSize: '0.75rem', fontWeight: 600 }}>{t('year')}</label>
                 <select
                     value={dashboardYear}
                     onChange={(e) => setDashboardYear(e.target.value)}
                     style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem', cursor: 'pointer', backgroundColor: isDark ? '#1F2937' : '#FFFFFF', border: isDark ? '1px solid #374151' : '1px solid #D1D5DB', color: isDark ? '#F9FAFB' : '#111827', minWidth: '100px', transition: 'background-color 0.2s' }}
                 >
                     <option value="2025">2025</option>
                     <option value="2026">2026</option>
                     <option value="2027">2027</option>
                     <option value="2028">2028</option>
                     <option value="2029">2029</option>
                     <option value="all">{t('allYears')}</option>
                 </select>
             </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ color: isDark ? '#FFD700' : '#D97706', fontSize: '0.75rem', fontWeight: 600 }}>{t('qtr')}</label>
                 <select
                     value={searchQuarter}
                     onChange={(e) => setSearchQuarter(e.target.value)}
                     style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem', cursor: 'pointer', backgroundColor: isDark ? '#1F2937' : '#FFFFFF', border: isDark ? '1px solid #374151' : '1px solid #D1D5DB', color: isDark ? '#F9FAFB' : '#111827', minWidth: '100px', transition: 'background-color 0.2s' }}
                 >
                     <option value="Q1">Q1</option>
                     <option value="Q2">Q2</option>
                     <option value="Q3">Q3</option>
                     <option value="Q4">Q4</option>
                     <option value="all">{t('allQuarters')}</option>
                 </select>
             </div>
          </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', border: isDark ? '1px solid #374151' : '1px solid #D1D5DB', backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: healthData?.status === 'connected' ? '#10B981' : '#EF4444' }}></div>
             <span style={{ fontSize: '0.75rem', color: isDark ? '#9CA3AF' : '#6B7280' }}>
              {healthData?.status === 'connected' 
                ? `${t('connected')} ${healthData.database}` 
                : t('connecting')}
            </span>
          </div>
           <Button id="tour-help-btn" onClick={() => setShowGuide(true)} variant="ghost" size="sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280', marginRight: '0.5rem' }} title={t('showGuide')}>
             <CircleHelp style={{ width: '20px', height: '20px' }} />
           </Button>
           <Button onClick={handleExport} variant="outline" size="sm" style={{ borderColor: isDark ? '#FFD700' : '#D97706', color: isDark ? '#FFD700' : '#D97706' }}>
             <Download style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Frame 1: Left Sidebar (30%) - Transformation Health + Strategic Planning */}
       <aside id="tour-health-panel" className="iframe-left" style={{ borderRight: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, backgroundColor: isDark ? '#111827' : '#FFFFFF' }}>
         <TransformationHealth 
           dimensions={metricsData?.dimensions || DASHBOARD_DATA.dimensions} 
           isLoading={metricsLoading}
           error={metricsError}
           onRetry={refetchMetrics}
           isDark={isDark}
           language={language}
           selectedYear={dashboardYear}
           selectedQuarter={searchQuarter === 'all' ? undefined : searchQuarter}
         />
       </aside>

      {/* Frame 2: Main Content (70%) - Tab Bar + Active Content */}
      <main className="iframe-right" style={{ backgroundColor: isDark ? '#111827' : '#F9FAFB' }}>
        {/* Tab Bar at top */}
        <div id="tour-views">
          <NavButtons 
            onNavigate={setCurrentView} 
            currentView={currentView}
            isDark={isDark}
            language={language}
          />
        </div>

        {/* Active Content below tabs */}
        <div className="dashboard-content-area">
          {/* DASHBOARD VIEW */}
          {currentView === 'dashboard' && (
            <>
              <InternalOutputs
                dimensions={metricsData?.dimensions || DASHBOARD_DATA.dimensions}
                isLoading={metricsLoading}
                error={metricsError}
                onRetry={refetchMetrics}
                isDark={isDark}
                language={language}
              />
              <StrategicInsights data={metricsData || DASHBOARD_DATA} isDark={isDark} language={language} />
              <SectorOutcomes outcomes={metricsData?.outcomes || DASHBOARD_DATA.outcomes} isDark={isDark} language={language} />
            </>
          )}

          {/* GRAPH VIEW */}
          {currentView === 'graph' && (
            <div style={{ height: '100%', width: '100%', overflow: 'hidden', position: 'relative', minHeight: '600px', border: isDark ? '1px solid #374151' : '1px solid #D1D5DB', backgroundColor: isDark ? '#111827' : '#F9FAFB' }}>
              {schema && (
                <GraphFilters
                  schema={schema}
                  selectedLabels={selectedLabels}
                  selectedRelationships={selectedRelationships}
                  limit={limit}
                  onLabelsChange={setSelectedLabels}
                  onRelationshipsChange={setSelectedRelationships}
                  onLimitChange={setLimit}
                  onApply={() => refetch()}
                  isDark={isDark}
                />
              )}
              {graphLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ animation: 'spin 1s linear infinite', height: '3rem', width: '3rem', borderBottom: '2px solid #FFD700', margin: '0 auto 1rem auto' }}></div>
                    <p style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{t('loading')}</p>
                  </div>
                </div>
              ) : graphError ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#EF4444', marginBottom: '0.5rem' }}>{t('failed')}</p>
                    <p style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: '0.875rem' }}>{t('checkConn')}</p>
                  </div>
                </div>
              ) : null}
              {displayGraphData && <NeoGraph data={displayGraphData} isDark={isDark} language={language} />}
              {graphData && (
                <div style={{ position: 'absolute', top: '1rem', right: isRTL ? 'auto' : '1rem', left: isRTL ? '1rem' : 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: isDark ? '1px solid #FFD700' : '1px solid #D97706', color: isDark ? '#FFD700' : '#D97706', backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(243, 244, 246, 0.9)' }}>
                  {language === 'ar' ? `مباشر: ${graphData.nodes.length} عقد، ${graphData.links.length} روابط` : `Live: ${graphData.nodes.length} nodes, ${graphData.links.length} edges`}
                </div>
              )}
            </div>
          )}

          {/* BUSINESS CHAINS VIEW */}
          {currentView === 'business_chains' && (
            <div style={{ height: '100%', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', minHeight: '500px', border: isDark ? '1px solid #374151' : '1px solid #D1D5DB', backgroundColor: isDark ? '#111827' : '#F9FAFB' }}>
              <BusinessChains selectedYear={dashboardYear} selectedQuarter={searchQuarter === 'all' ? undefined : searchQuarter} isDark={isDark} language={language} />
            </div>
          )}
        </div>
      </main>
      <DashboardOnboarding 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
        isDark={isDark} 
        onViewChange={setCurrentView}
        language={language}
      />
    </div>
  );
}
