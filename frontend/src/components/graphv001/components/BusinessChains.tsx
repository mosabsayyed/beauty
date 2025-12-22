import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// --- NODES with Neo4j label mapping (as spheres with radius) ---
const INITIAL_NODES = [
  // Top: Objectives (centered)
  { id: 'obj', type: 'dark', label: 'Objectives', x: 714, y: 156, r: 70, neoLabel: 'SectorObjective' },
  
  // Upper level: Performance (left) and Policy Tools (right)
  { id: 'perf', type: 'dark', label: 'Performance', x: 178, y: 546, r: 70, neoLabel: 'SectorPerformance' },
  { id: 'pol', type: 'dark', label: 'Policy Tools', x: 1250, y: 546, r: 70, neoLabel: 'SectorPolicyTool' },
  
  // Middle gray box: Sector entities (Citizen, Business, Gov, Data, Admin)
  { id: 'ent_cit', type: 'white', label: 'Citizen', x: 714, y: 364, r: 50, neoLabel: 'SectorCitizen' },
  { id: 'ent_bus', type: 'white', label: 'Business', x: 714, y: 546, r: 50, neoLabel: 'SectorBusiness' },
  { id: 'ent_gov', type: 'white', label: 'Gov. Entities', x: 714, y: 728, r: 50, neoLabel: 'SectorGovEntity' },
  { id: 'data', type: 'white', label: 'Data Transaction', x: 446, y: 546, r: 65, neoLabel: 'SectorDataTransaction' },
  { id: 'admin', type: 'white', label: 'Admin Records', x: 982, y: 546, r: 65, neoLabel: 'SectorAdminRecord' },
  
  // Below gray box: Risks (centered)
  { id: 'risks', type: 'dark', label: 'Risks', x: 714, y: 1027, r: 55, neoLabel: 'EntityRisk' },
  
  // Capability (centered, below dashed line)
  { id: 'cap', type: 'dark', label: 'Capability', x: 714, y: 1248, r: 75, neoLabel: 'EntityCapability' },
  
  // Bottom gray box: Entity nodes (IT Systems, Processes, Organization)
  { id: 'it', type: 'white', label: 'IT Systems', x: 496, y: 1599, r: 60, neoLabel: 'EntityITSystem' },
  { id: 'proc', type: 'white', label: 'Processes', x: 714, y: 1599, r: 60, neoLabel: 'EntityProcess' },
  { id: 'org', type: 'white', label: 'Organization', x: 933, y: 1599, r: 60, neoLabel: 'EntityOrgUnit' },
  
  // Outside bottom box: Vendor SLA (left) and Culture Health (right)
  { id: 'vend', type: 'light', label: 'Vendor SLA', x: 278, y: 1599, r: 55, neoLabel: 'EntityVendor' },
  { id: 'cult', type: 'light', label: 'Culture Health', x: 1151, y: 1599, r: 55, neoLabel: 'EntityCultureHealth' },
  
  // Bottom: Projects Outputs and Change Architecture (centered)
  { id: 'proj', type: 'dark', label: 'Projects Outputs', x: 714, y: 1950, r: 70, neoLabel: 'EntityProject' },
  { id: 'chg', type: 'dark', label: 'Change Adoption', x: 714, y: 2184, r: 65, neoLabel: 'EntityChangeAdoption' },
];

// --- EDGES with Neo4j relationship type mapping ---
const INITIAL_EDGES = [
  // Sector Flow
  { id: 'e1', from: 'obj', to: 'pol', type: 'static', label: 'Realized Via', sourceSide: 'bottom', targetSide: 'left', arrow: 'end', neoRelType: 'REALIZED_VIA', labelPos: 2.00, labelOffset: { x: -80, y: -50 } },
  { id: 'e2', from: 'obj', to: 'perf', type: 'static', label: 'Cascaded Via', sourceSide: 'left', targetSide: 'top', arrow: 'end', neoRelType: 'CASCADED_VIA', labelPos: 2.00, labelOffset: { x: 80, y: 50 } },
  { id: 'e3', from: 'pol', to: 'admin', type: 'static', label: 'Refers To', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'REFERS_TO', labelPos: 0.85, labelOffset: { x: 0, y: -50 } },
  { id: 'e4', from: 'admin', to: 'ent_bus', type: 'static', label: 'Applied On', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'APPLIED_ON', labelOffset: { x: 0, y: -20 } },
  { id: 'e5', from: 'admin', to: 'ent_gov', type: 'static', label: 'Applied On', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'APPLIED_ON', labelOffset: { x: 0, y: -20 } },
  { id: 'e6', from: 'admin', to: 'ent_cit', type: 'static', label: 'Applied On', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'APPLIED_ON', labelOffset: { x: 0, y: 20 } },
  { id: 'e7', from: 'ent_bus', to: 'data', type: 'static', label: 'Triggers Event', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'TRIGGERS_EVENT', labelOffset: { x: 0, y: -110 } },
  { id: 'e8', from: 'ent_gov', to: 'data', type: 'static', label: 'Triggers Event', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'TRIGGERS_EVENT', labelOffset: { x: 0, y: -50 } },
  { id: 'e9', from: 'ent_cit', to: 'data', type: 'static', label: 'Triggers Event', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'TRIGGERS_EVENT', labelOffset: { x: 0, y: 82 } },
  { id: 'e10', from: 'data', to: 'perf', type: 'static', label: 'Measured By', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'MEASURED_BY', labelOffset: { x: 0, y: -50 } },
  { id: 'e11', from: 'perf', to: 'obj', type: 'static', label: 'Aggregates To', sourceSide: 'top', targetSide: 'left', arrow: 'end', neoRelType: 'AGGREGATES_TO', labelPos: 1.00, labelOffset: { x: -100, y: 86 } },
  { id: 'e12', from: 'pol', to: 'obj', type: 'static', label: 'Governed By', sourceSide: 'top', targetSide: 'right', arrow: 'end', neoRelType: 'GOVERNED_BY', labelPos: 1.00, labelOffset: { x: 100, y: 86 } },
  
  // Risk Management
  { id: 'e13', from: 'risks', to: 'perf', type: 'active', label: 'Informs', sourceSide: 'right', targetSide: 'bottom', arrow: 'end', neoRelType: 'INFORMS' },
  { id: 'e14', from: 'risks', to: 'pol', type: 'active', label: 'Informs', sourceSide: 'left', targetSide: 'bottom', arrow: 'end', neoRelType: 'INFORMS' },
  { id: 'e15', from: 'cap', to: 'risks', type: 'active', label: 'Monitors', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'MONITORED_BY' },
  
  // Capability Connections
  { id: 'e16', from: 'pol', to: 'cap', type: 'active', label: 'Sets Priorities', sourceSide: 'right', targetSide: 'right', arrow: 'end', neoRelType: 'SETS_PRIORITIES', labelOffset: { x: 0, y: 16 } },
  { id: 'e17', from: 'perf', to: 'cap', type: 'active', label: 'Sets Targets', sourceSide: 'left', targetSide: 'left', arrow: 'end', neoRelType: 'SETS_TARGETS', labelOffset: { x: 0, y: 16 } },
  { id: 'e18', from: 'cap', to: 'org', type: 'active', label: 'Role Gaps', sourceSide: 'bottom', targetSide: 'top', arrow: 'end', neoRelType: 'ROLE_GAPS', labelOffset: { x: 80, y: 70 } },
  { id: 'e19', from: 'cap', to: 'proc', type: 'active', label: 'Knowledge Gaps', sourceSide: 'bottom', targetSide: 'top', arrow: 'end', neoRelType: 'KNOWLEDGE_GAPS', labelOffset: { x: 180, y: 70 } },
  { id: 'e20', from: 'cap', to: 'it', type: 'active', label: 'Automation Gaps', sourceSide: 'bottom', targetSide: 'top', arrow: 'end', neoRelType: 'AUTOMATION_GAPS', labelOffset: { x: -80, y: 70 } },
  { id: 'e21', from: 'org', to: 'cap', type: 'active', label: 'Operates', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'OPERATES', labelOffset: { x: 150, y: -40 } },
  { id: 'e22', from: 'proc', to: 'cap', type: 'active', label: 'Operates', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'OPERATES', labelOffset: { x: 0, y: -40 } },
  { id: 'e23', from: 'it', to: 'cap', type: 'active', label: 'Operates', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'OPERATES', labelOffset: { x: -150, y: -40 } },
  { id: 'e24', from: 'cap', to: 'pol', type: 'active', label: 'Executes', sourceSide: 'right', targetSide: 'right', arrow: 'end', neoRelType: 'EXECUTES', labelOffset: { x: 0, y: 16 } },
  { id: 'e25', from: 'cap', to: 'perf', type: 'active', label: 'Reports', sourceSide: 'left', targetSide: 'left', arrow: 'end', neoRelType: 'REPORTS', labelOffset: { x: 0, y: 16 } },
  
  // Project and Change
  { id: 'e26', from: 'org', to: 'proj', type: 'active', label: 'Gaps Scope', sourceSide: 'bottom', targetSide: 'top', arrow: 'end', neoRelType: 'GAPS_SCOPE', labelOffset: { x: 120, y: -45 } },
  { id: 'e27', from: 'proc', to: 'proj', type: 'active', label: 'Gaps Scope', sourceSide: 'bottom', targetSide: 'top', arrow: 'end', neoRelType: 'GAPS_SCOPE', labelOffset: { x: 0, y: -45 } },
  { id: 'e28', from: 'it', to: 'proj', type: 'active', label: 'Gaps Scope', sourceSide: 'bottom', targetSide: 'top', arrow: 'end', neoRelType: 'GAPS_SCOPE', labelOffset: { x: -120, y: -45 } },
  { id: 'e29', from: 'proj', to: 'chg', type: 'active', label: 'Adoption Risks', sourceSide: 'bottom', targetSide: 'top', arrow: 'end', neoRelType: 'ADOPTION_ENT_RISKS', labelOffset: { x: -110, y: -14 } },
  { id: 'e30', from: 'chg', to: 'proj', type: 'active', label: 'Increase Adoption', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'INCREASE_ADOPTION', labelOffset: { x: 150, y: -14 } },
  { id: 'e31', from: 'proj', to: 'org', type: 'active', label: 'Close Gaps', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'CLOSE_GAPS', labelOffset: { x: 120, y: -45 } },
  { id: 'e32', from: 'proj', to: 'proc', type: 'active', label: 'Close Gaps', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'CLOSE_GAPS', labelOffset: { x: 0, y: -45 } },
  { id: 'e33', from: 'proj', to: 'it', type: 'active', label: 'Close Gaps', sourceSide: 'top', targetSide: 'bottom', arrow: 'end', neoRelType: 'CLOSE_GAPS', labelOffset: { x: -120, y: -45 } },
  
  // Entity Operations
  { id: 'e34', from: 'cult', to: 'org', type: 'active', label: 'Monitors For', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'MONITORS_FOR' },
  { id: 'e35', from: 'org', to: 'proc', type: 'active', label: 'Apply', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'APPLY' },
  { id: 'e36', from: 'proc', to: 'it', type: 'active', label: 'Automation', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'AUTOMATION' },
  { id: 'e37', from: 'it', to: 'vend', type: 'active', label: 'Depends On', sourceSide: 'left', targetSide: 'right', arrow: 'end', neoRelType: 'DEPENDS_ON' },
].map(edge => ({ ...edge, neoRelType: edge.neoRelType || null }));

interface BusinessChainsProps {
  chainId?: string;
  selectedYear?: string;
  selectedQuarter?: string;
  isDark: boolean;
  language: string;
}

const BusinessChains: React.FC<BusinessChainsProps> = ({ chainId, selectedYear, selectedQuarter, isDark, language }) => {
  // Theme-aware STYLES object
  const STYLES = {
    node: {
      dark: { 
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
        border: isDark ? '2px solid #FFD700' : '2px solid #D97706', 
        color: isDark ? '#F9FAFB' : '#111827', 
        boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.1)' 
      },
      light: { 
        backgroundColor: isDark ? '#1F2937' : '#F3F4F6', 
        border: isDark ? '2px solid #10B981' : '2px solid #059669', 
        color: isDark ? '#F9FAFB' : '#111827', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
      },
      white: { 
        backgroundColor: isDark ? '#F9FAFB' : '#FFFFFF', 
        border: isDark ? '2px solid #4B5563' : '2px solid #9CA3AF', 
        color: '#111827', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
      },
      selected: { boxShadow: isDark ? '0 0 0 4px #FFD700' : '0 0 0 4px #D97706', zIndex: 50 },
    },
    canvas: { 
      backgroundColor: isDark ? '#111827' : '#F9FAFB', 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden', 
      position: 'relative', 
      cursor: 'grab', 
      fontFamily: 'sans-serif', 
      touchAction: 'none' 
    },
    connector: {
      active: isDark ? '#FFD700' : '#D97706',
      static: isDark ? '#4B5563' : '#9CA3AF',
    }
  };

  const translations = {
    nodes: {
      obj: { en: 'Objectives', ar: 'الأهداف' },
      perf: { en: 'Performance', ar: 'الأداء' },
      pol: { en: 'Policy Tools', ar: 'أدوات السياسة' },
      ent_cit: { en: 'Citizen', ar: 'المواطن' },
      ent_bus: { en: 'Business', ar: 'الأعمال' },
      ent_gov: { en: 'Gov. Entities', ar: 'الجهات الحكومية' },
      data: { en: 'Data Transaction', ar: 'معاملة البيانات' },
      admin: { en: 'Admin Records', ar: 'السجلات الإدارية' },
      risks: { en: 'Risks', ar: 'المخاطر' },
      cap: { en: 'Capability', ar: 'القدرات' },
      it: { en: 'IT Systems', ar: 'أنظمة تقنية المعلومات' },
      proc: { en: 'Processes', ar: 'العمليات' },
      org: { en: 'Organization', ar: 'التنظيم' },
      vend: { en: 'Vendor SLA', ar: 'اتفاقيات الموردين' },
      cult: { en: 'Culture Health', ar: 'صحة الثقافة' },
      proj: { en: 'Projects Outputs', ar: 'مخرجات المشاريع' },
      chg: { en: 'Change Adoption', ar: 'تبني التغيير' },
    },
    edges: {
      e1: { en: 'Realized Via', ar: 'تتحقق عبر' },
      e2: { en: 'Cascaded Via', ar: 'تتسلسل عبر' },
      e3: { en: 'Refers To', ar: 'تشير إلى' },
      e4: { en: 'Applied On', ar: 'تطبق على' },
      e5: { en: 'Applied On', ar: 'تطبق على' },
      e6: { en: 'Applied On', ar: 'تطبق على' },
      e7: { en: 'Triggers Event', ar: 'تطلق حدث' },
      e8: { en: 'Triggers Event', ar: 'تطلق حدث' },
      e9: { en: 'Triggers Event', ar: 'تطلق حدث' },
      e10: { en: 'Measured By', ar: 'تقاس بـ' },
      e11: { en: 'Aggregates To', ar: 'تتجمع في' },
      e12: { en: 'Governed By', ar: 'تحكمها' },
      e13: { en: 'Informs', ar: 'تغذي' },
      e14: { en: 'Informs', ar: 'تغذي' },
      e15: { en: 'Monitors', ar: 'تراقب' },
      e16: { en: 'Sets Priorities', ar: 'تضع الأولويات' },
      e17: { en: 'Sets Targets', ar: 'تضع المستهدفات' },
      e18: { en: 'Role Gaps', ar: 'فجوات الأدوار' },
      e19: { en: 'Knowledge Gaps', ar: 'فجوات المعرفة' },
      e20: { en: 'Automation Gaps', ar: 'فجوات الأتمتة' },
      e21: { en: 'Operates', ar: 'تشغل' },
      e22: { en: 'Operates', ar: 'تشغل' },
      e23: { en: 'Operates', ar: 'تشغل' },
      e24: { en: 'Executes', ar: 'تنفذ' },
      e25: { en: 'Reports', ar: 'تبلغ' },
      e26: { en: 'Gaps Scope', ar: 'نطاق الفجوات' },
      e27: { en: 'Gaps Scope', ar: 'نطاق الفجوات' },
      e28: { en: 'Gaps Scope', ar: 'نطاق الفجوات' },
      e29: { en: 'Adoption Risks', ar: 'مخاطر التبني' },
      e30: { en: 'Increase Adoption', ar: 'زيادة التبني' },
      e31: { en: 'Close Gaps', ar: 'سد الفجوات' },
      e32: { en: 'Close Gaps', ar: 'سد الفجوات' },
      e33: { en: 'Close Gaps', ar: 'سد الفجوات' },
      e34: { en: 'Monitors For', ar: 'تراقب لـ' },
      e35: { en: 'Apply', ar: 'تطبق' },
      e36: { en: 'Automation', ar: 'الأتمتة' },
      e37: { en: 'Depends On', ar: 'تعتمد على' },
    }
  };

  const [view, setView] = useState({ x: 0, y: 0, k: 0.6 }); // Start zoomed out
  // const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);

  // Update labels when language changes
  useEffect(() => {
    setNodes(prevNodes => prevNodes.map(node => {
      const trans = translations.nodes[node.id as keyof typeof translations.nodes];
      return trans ? { ...node, label: language === 'ar' ? trans.ar : trans.en } : node;
    }));
    setEdges(prevEdges => prevEdges.map(edge => {
      const trans = translations.edges[edge.id as keyof typeof translations.edges];
      return trans ? { ...edge, label: language === 'ar' ? trans.ar : trans.en } : edge;
    }));
  }, [language]);

  // Remove separate zoom/pan states if we use 'view' object
  // const [zoom, setZoom] = useState(1);
  // const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false); 
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit on mount
  useEffect(() => {
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Graph bounds
        const graphWidth = 1500;
        const graphHeight = 2300;
        
        // Calculate scale to fit WIDTH only (as requested)
        const scaleX = width / graphWidth;
        const scale = Math.min(scaleX, 1) * 0.95; // 95% width fit
        
        // Center horizontally, start at top
        const x = (width - graphWidth * scale) / 2;
        const y = 20; // Slight top padding
        
        setView({ x, y, k: scale });
    }
  }, []);

  // Fetch count logic ... (omitted, stays same)
  // Fetch available years - REMOVED (handled by parent)
  /*
  const { data: yearsData } = useQuery({
    queryKey: ['neo4j-years'],
    queryFn: async () => {
      const response = await fetch('/api/neo4j/years');
      if (!response.ok) throw new Error('Failed to fetch years');
      return response.json();
    },
    staleTime: Infinity,
  });
  */

  // Fetch counts from Neo4j
  const { data: countsData } = useQuery({
    queryKey: ['businessChainCounts', selectedYear, selectedQuarter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedYear && selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedQuarter && selectedQuarter !== 'all') params.append('quarter', selectedQuarter);
      
      const url = `/api/business-chain/counts?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch counts');
      return response.json();
    },
    staleTime: Infinity,
  });

  // Fetch specific chain path if chainId is provided
  const { data: chainData } = useQuery({
    queryKey: ['businessChainPath', chainId, selectedYear, selectedQuarter],
    enabled: !!chainId,
    queryFn: async () => {
      const yearVal = (selectedYear === 'all' || !selectedYear) ? 2025 : selectedYear;
      
      const url = `/api/business-chain/${chainId}?year=${yearVal}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch chain path');
      return response.json();
    }
  });

  // Extract nodes and rels that are part of the active chain for highlighting
  const activeChainNodes = new Set<string>();
  const activeChainRels = new Set<string>();
  
  if (chainData) {
    // 1. New Flat Format Support (GraphOntology standard)
    if (chainData.nodes && Array.isArray(chainData.nodes)) {
        chainData.nodes.forEach((n: any) => {
            if (n.labels && Array.isArray(n.labels) && n.labels.length > 0) {
                 activeChainNodes.add(n.labels[0]);
            }
        });
    }
    if (chainData.links && Array.isArray(chainData.links)) {
        chainData.links.forEach((l: any) => {
            if (l.type) activeChainRels.add(l.type);
        });
    }

    // 2. Legacy Path Format Support (Fallback)
    if (chainData.results && Array.isArray(chainData.results)) {
        chainData.results.forEach((path: any) => {
        // Neo4j path format handling
        if (path.nodes) {
            path.nodes.forEach((n: any) => {
            if (n.labels && n.labels[0]) activeChainNodes.add(n.labels[0]);
            });
        }
        if (path.relationships) {
            path.relationships.forEach((r: any) => {
            if (r.type) activeChainRels.add(r.type);
            });
        }
        });
    }
  }

  // Debug logging
  useEffect(() => {
    if (countsData) {
      console.log('[BusinessChains] Counts data received:', {
        nodeCount: Object.keys(countsData.nodeCounts || {}).length,
        relCount: Object.keys(countsData.relCounts || {}).length,
        nodeCounts: countsData.nodeCounts,
        relCounts: countsData.relCounts,
        pairCounts: countsData.pairCounts, // Added for completeness
        specificRelCounts: countsData.specificRelCounts // Added for completeness
      });
    }
  }, [countsData]);

  // --- Helper: Calculate anchor points on the node circle ---
  const getAnchorPoint = (node: any, side: string) => {
    const { x, y, r } = node;
    switch (side) {
      case 'top': return { x, y: y - r };
      case 'bottom': return { x, y: y + r };
      case 'left': return { x: x - r, y };
      case 'right': return { x: x + r, y };
      default: return { x, y };
    }
  };

  // --- Event Handlers ---
  const screenToWorld = (sx: number, sy: number) => ({ x: (sx - view.x) / view.k, y: (sy - view.y) / view.k });

  const handleWheel = (e: any) => {
    e.preventDefault();
    const newK = Math.min(Math.max(0.1, view.k - e.deltaY * 0.001), 5);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Zoom towards mouse pointer
    const oldWorldX = (mx - view.x) / view.k;
    const oldWorldY = (my - view.y) / view.k;
    
    const newX = mx - oldWorldX * newK;
    const newY = my - oldWorldY * newK;
    
    setView({ x: newX, y: newY, k: newK });
  };

  const handleMouseDown = (e: any, id: string | null = null) => {
    // Middle mouse or background click -> Pan
    if (e.button === 1 || id === null) {
      if (!e.shiftKey && !e.ctrlKey) setSelectedIds([]);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setHasMoved(false);
      return;
    }
    // Node selection
    if (e.shiftKey || e.ctrlKey) {
      if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(sid => sid !== id));
      else setSelectedIds(prev => [...prev, id]);
    } else {
      if (!selectedIds.includes(id)) setSelectedIds([id]);
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging) return;
    e.preventDefault();
    setHasMoved(true);
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Determine if we are panning the view or moving nodes
    if (selectedIds.length > 0) {
      // Moving nodes
      const worldDx = dx / view.k;
      const worldDy = dy / view.k;
      setNodes(prev => prev.map(n => !selectedIds.includes(n.id) ? n : { ...n, x: n.x + worldDx, y: n.y + worldDy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Panning view
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (selectedIds.length > 0 && hasMoved) {
      setNodes(prev => prev.map(n => !selectedIds.includes(n.id) ? n : { ...n, x: Math.round(n.x / 10) * 10, y: Math.round(n.y / 10) * 10 }));
    }
  };

  const updateEdge = (edgeId: string, field: string, value: any) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, [field]: value } : e));
  };

  // --- Tools ---
  const alignVertical = () => {
    if (!selectedIds.length) return;
    setNodes(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, x: 600 } : n));
  };
  const alignHorizontal = () => {
    if (selectedIds.length < 2) return;
    const targetNode = nodes.find(n => n.id === selectedIds[0]);
    if (!targetNode) return;
    const targetY = targetNode.y;
    setNodes(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, y: targetY } : n));
  };
  const alignDistribute = () => {
    if (selectedIds.length < 3) return;
    const selected = nodes.filter(n => selectedIds.includes(n.id)).sort((a,b) => a.x - b.x);
    const start = selected[0].x;
    const end = selected[selected.length-1].x;
    const gap = (end - start) / (selected.length - 1);
    setNodes(prev => prev.map(n => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx === -1) return n;
      return { ...n, x: start + (gap * idx) };
    }));
  };

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current.cloneNode(true) as SVGSVGElement;
    const minX = Math.min(...nodes.map(n => n.x - (n.r || 50))) - 50;
    const minY = Math.min(...nodes.map(n => n.y - (n.r || 50))) - 50;
    const maxX = Math.max(...nodes.map(n => n.x + (n.r || 50))) + 50;
    const maxY = Math.max(...nodes.map(n => n.y + (n.r || 50))) + 50;
    svgElement.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
    const style = document.createElement('style');
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); text { font-family: 'Inter', sans-serif; }`;
    svgElement.prepend(style);
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "enterprise_architecture_diagram.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Helper: Generate path string and label position ---
  const getSmartPath = (start: any, end: any, side1: string, side2: string) => {
    const p1 = getAnchorPoint(start, side1);
    const p2 = getAnchorPoint(end, side2);
    
    // Offset for control points
    const gap = 40;
    
    let cp1 = { ...p1 };
    let cp2 = { ...p2 };

    if (side1 === 'top') cp1.y -= gap;
    if (side1 === 'bottom') cp1.y += gap;
    if (side1 === 'left') cp1.x -= gap;
    if (side1 === 'right') cp1.x += gap;

    if (side2 === 'top') cp2.y -= gap;
    if (side2 === 'bottom') cp2.y += gap;
    if (side2 === 'left') cp2.x -= gap;
    if (side2 === 'right') cp2.x += gap;

    let path = '';
    let labelPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    // Smart Join: Logic for "Same Side" loops (e.g. Right -> Right)
    if (side1 === 'right' && side2 === 'right') {
        const maxX = Math.max(cp1.x, cp2.x);
        path = `M ${p1.x} ${p1.y} L ${maxX} ${p1.y} L ${maxX} ${p2.y} L ${p2.x} ${p2.y}`;
        labelPoint = { x: maxX, y: (p1.y + p2.y) / 2 };
    }
    else if (side1 === 'left' && side2 === 'left') {
        const minX = Math.min(cp1.x, cp2.x);
        path = `M ${p1.x} ${p1.y} L ${minX} ${p1.y} L ${minX} ${p2.y} L ${p2.x} ${p2.y}`;
        labelPoint = { x: minX, y: (p1.y + p2.y) / 2 };
    }
    else if (side1 === 'top' && side2 === 'top') {
        const minY = Math.min(cp1.y, cp2.y);
        path = `M ${p1.x} ${p1.y} L ${p1.x} ${minY} L ${p2.x} ${minY} L ${p2.x} ${p2.y}`;
        labelPoint = { x: (p1.x + p2.x) / 2, y: minY };
    }
    else if (side1 === 'bottom' && side2 === 'bottom') {
        const maxY = Math.max(cp1.y, cp2.y);
        path = `M ${p1.x} ${p1.y} L ${p1.x} ${maxY} L ${p2.x} ${maxY} L ${p2.x} ${p2.y}`;
        labelPoint = { x: (p1.x + p2.x) / 2, y: maxY };
    }
    // Standard Orthogonal Routing for opposite/adjacent sides
    else {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Prioritize Vertical segments for Top/Bottom
        if ((side1 === 'top' || side1 === 'bottom') && (side2 === 'top' || side2 === 'bottom')) {
            path = `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
            labelPoint = { x: (p1.x + p2.x) / 2, y: midY };
        }
        // Prioritize Horizontal segments for Left/Right
        else if ((side1 === 'left' || side1 === 'right') && (side2 === 'left' || side2 === 'right')) {
            path = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
            labelPoint = { x: midX, y: (p1.y + p2.y) / 2 };
        }
        // Corner routing
        else if (side1 === 'left' || side1 === 'right') {
            path = `M ${p1.x} ${p1.y} L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
            // Label at corner for L-shapes
            labelPoint = { x: p2.x, y: p1.y };
        } else {
            path = `M ${p1.x} ${p1.y} L ${p1.x} ${p2.y} L ${p2.x} ${p2.y}`;
            labelPoint = { x: p1.x, y: p2.y };
        }
    }
    
    return { path, labelPoint };
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: isDark ? '#111827' : '#F9FAFB' }}
         onWheel={handleWheel}
         onMouseDown={(e) => handleMouseDown(e, null)}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
    >
      <div ref={containerRef} style={{ backgroundColor: isDark ? '#111827' : '#F9FAFB', width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}>
        <div style={{ 
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: '0 0', 
            position: 'absolute', 
            top: 0, 
            left: 0,
            width: '1500px', 
            height: '2300px',
            willChange: 'transform' // Optimize performance
        }}>
            <svg ref={svgRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              {/* Arrow markers for different colors */}
              <marker id="arrow-end" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" stroke="currentColor" strokeWidth="1.5" fill="none"/></marker>
              <marker id="arrow-both-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6" stroke="currentColor" strokeWidth="1.5" fill="none"/></marker>
            </defs>
            {edges.map((edge, i) => {
              const start = nodes.find(n => n.id === edge.from);
              const end = nodes.find(n => n.id === edge.to);
              if(!start || !end) return null;
              
              const color = edge.type === 'active' ? STYLES.connector.active : STYLES.connector.static;
              const { path, labelPoint } = getSmartPath(start, end, edge.sourceSide, edge.targetSide);
              
              const p1 = getAnchorPoint(start, edge.sourceSide);
              const p2 = getAnchorPoint(end, edge.targetSide);
              
              // Calculate label position
              let mx = labelPoint.x;
              let my = labelPoint.y;
              
              // Override if labelPos is specified (for simple cases or fine tuning)
              // But for L-shapes and C-shapes, labelPoint from getSmartPath is better.
              // We'll trust getSmartPath unless labelPos is extreme?
              // Actually, let's use labelPos to shift along the segment if needed, 
              // but for now, let's stick to the smart point.
              
              // Apply offset for horizontal labels to avoid covering arrows
              // If the segment is horizontal (y is constant), shift y up
              // We can check if the label point is on a horizontal segment
              // Simple heuristic: if source/target are left/right, it's likely horizontal
              if ((edge.sourceSide === 'left' || edge.sourceSide === 'right') && 
                  (edge.targetSide === 'left' || edge.targetSide === 'right')) {
                  my -= 10; // Shift up 10px
              }
              
              // Try to get count from specific relationship (source-relType-target) first
              let relCount: number | undefined;
              
              if (edge.neoRelType && start.neoLabel && end.neoLabel && countsData?.specificRelCounts) {
                const specificKey = `${start.neoLabel}-${edge.neoRelType}-${end.neoLabel}`;
                relCount = countsData.specificRelCounts[specificKey];
              }
              
              // Fallback to general relationship type count
              if (relCount === undefined && edge.neoRelType && countsData?.relCounts) {
                relCount = countsData.relCounts[edge.neoRelType];
              }
              
              // Fallback to node pair count (undirected)
              if (relCount === undefined && start.neoLabel && end.neoLabel && countsData?.pairCounts) {
                const pair1 = `${start.neoLabel}-${end.neoLabel}`;
                const pair2 = `${end.neoLabel}-${start.neoLabel}`;
                relCount = countsData.pairCounts[pair1] || countsData.pairCounts[pair2];
              }
              
              const labelText = edge.label || '';
              const countText = relCount !== undefined ? ` (${relCount})` : '';
              const fullLabel = labelText + countText;
              const labelWidth = fullLabel ? fullLabel.length * 7 + 16 : 0;

              // Use custom offset if defined, otherwise use default
              const offsetX = edge.labelOffset?.x || 0;
              const offsetY = edge.labelOffset?.y || -14;

              // Determine color, pattern, and animation based on relationship count
              // If part of active chain, use special highlighting
              const isChainActive = chainId && edge.neoRelType && activeChainRels.has(edge.neoRelType) && 
                                   start.neoLabel && activeChainNodes.has(start.neoLabel) &&
                                   end.neoLabel && activeChainNodes.has(end.neoLabel);

              let edgeColor: string;
              let strokeDasharray: string;
              let animationDuration: string;
              let strokeWidth = "2";
              
              if (isChainActive) {
                // Highlighted Active Chain: Gold/Glow, Fast animation
                edgeColor = '#FFD700';
                strokeDasharray = '10,5';
                animationDuration = '1.2s';
                strokeWidth = "3.5";
              } else if (relCount === undefined || relCount === 0) {
                // Red: Solid line, no animation
                edgeColor = '#EF4444';
                strokeDasharray = '0'; // Solid
                animationDuration = '0s'; // No animation
              } else if (relCount < 100) {
                // Yellow: Small dashes, Slow animation
                edgeColor = '#EAB308'; // Yellow-500
                strokeDasharray = '2,4'; // Small dashes
                animationDuration = '3s'; // Slow animation
              } else {
                // Green: Long dashed line, Fast animation
                edgeColor = '#22c55e';
                strokeDasharray = '10,5'; // Long dashed
                animationDuration = '1.5s'; // Fast animation
              }

              return (
                <g key={i} style={{ color: edgeColor }}>
                  <path d={path} stroke={edgeColor} strokeWidth={strokeWidth} fill="none" 
                    strokeDasharray={strokeDasharray}
                    markerEnd={edge.arrow === 'both' || edge.arrow === 'end' ? `url(#arrow-end)` : ''}
                    markerStart={edge.arrow === 'both' ? `url(#arrow-both-start)` : ''}
                    strokeLinecap="round" strokeLinejoin="round" 
                    id={`path-${i}`} />
                  
                  {(isChainActive || (relCount !== undefined && relCount > 0)) && (
                    <>
                      <circle r={isChainActive ? "4" : "3"} fill={edgeColor}>
                        <animateMotion dur={animationDuration} repeatCount="indefinite">
                          <mpath href={`#path-${i}`} />
                        </animateMotion>
                      </circle>
                    </>
                  )}
                  
                  {fullLabel && (
                    <g transform={`translate(${mx - labelWidth/2 + offsetX}, ${my + offsetY + 4})`}>
                      <rect width={labelWidth} height="20" rx="4" fill={isDark ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)'} stroke={edgeColor} strokeWidth={isChainActive ? "2" : "1"} />
                      <text x={labelWidth/2} y="14" fill={isDark ? '#F9FAFB' : '#1F2937'} fontSize="11" textAnchor="middle" fontWeight="600">{fullLabel}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {nodes.map(node => {
              const count = node.neoLabel && countsData?.nodeCounts?.[node.neoLabel];
              const isNodeActive = chainId && node.neoLabel && activeChainNodes.has(node.neoLabel);
              const r = node.r || 50;
              return (
                <g key={`svg-${node.id}`}>
                  {/* Sphere with gradient for 3D effect */}
                  <defs>
                    <radialGradient id={`gradient-${node.id}`} cx="35%" cy="35%">
                      <stop offset="0%" stopColor={node.type === 'white' ? '#FFFFFF' : node.type === 'dark' ? '#374151' : '#1F2937'} />
                      <stop offset="100%" stopColor={node.type === 'white' ? '#E5E7EB' : node.type === 'dark' ? '#1F2937' : '#111827'} />
                    </radialGradient>
                  </defs>
                  
                  {isNodeActive && (
                    <circle cx={node.x} cy={node.y} r={r + 6} fill="none" stroke="#FFD700" strokeWidth="2" strokeDasharray="4,2">
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${node.x} ${node.y}`} to={`360 ${node.x} ${node.y}`} dur="10s" repeatCount="indefinite" />
                    </circle>
                  )}

                  <circle cx={node.x} cy={node.y} r={r} 
                    fill={`url(#gradient-${node.id})`}
                    stroke={isNodeActive ? '#FFD700' : (node.type === 'dark' ? (isDark ? '#FFD700' : '#D97706') : node.type === 'light' ? (isDark ? '#10B981' : '#059669') : (isDark ? '#9CA3AF' : '#6B7280'))} 
                    strokeWidth={isNodeActive ? "5" : "3"}
                    filter={isNodeActive ? "drop-shadow(0 0 12px rgba(255, 215, 0, 0.6))" : "drop-shadow(0 4px 6px rgba(0,0,0,0.3))"}/>
                  <text x={node.x} y={count !== undefined ? node.y - 5 : node.y + 5} textAnchor="middle" 
                    fill={node.type === 'white' ? '#111827' : (isDark ? '#F9FAFB' : '#1F2937')} 
                    fontWeight="700" fontSize="13" fontFamily="'Inter', sans-serif">{node.label}</text>
                  {count !== undefined && (
                    <g transform={`translate(${node.x}, ${node.y + 18})`}>
                      <circle cx="0" cy="0" r="18" fill={isDark ? '#FFD700' : '#D97706'}/>
                      <text x="0" y="5" textAnchor="middle" fill="#111827" fontWeight="700" fontSize="12" fontFamily="'Inter', sans-serif">{count}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          {nodes.map(node => {
            const count = node.neoLabel && countsData?.nodeCounts?.[node.neoLabel];
            const levelData = node.neoLabel && countsData?.levelBreakdown?.[node.neoLabel];
            const isNodeActive = chainId && node.neoLabel && activeChainNodes.has(node.neoLabel);
            const r = node.r || 50;
            const diameter = r * 2;
            
            return (
              <div key={node.id} 
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  left: node.x - r, 
                  top: node.y - r, 
                  width: diameter, 
                  height: diameter, 
                  zIndex: 10,
                  borderRadius: '50%',
                  background: node.type === 'white' 
                    ? (isDark ? 'radial-gradient(circle at 35% 35%, #F9FAFB, #E5E7EB)' : 'radial-gradient(circle at 35% 35%, #FFFFFF, #F3F4F6)') 
                    : node.type === 'dark'
                    ? (isDark ? 'radial-gradient(circle at 35% 35%, #374151, #1F2937)' : 'radial-gradient(circle at 35% 35%, #FFFFFF, #F3F4F6)')
                    : (isDark ? 'radial-gradient(circle at 35% 35%, #1F2937, #111827)' : 'radial-gradient(circle at 35% 35%, #F3F4F6, #E5E7EB)'),
                  border: `3px solid ${isNodeActive ? '#FFD700' : (node.type === 'dark' ? (isDark ? '#FFD700' : '#D97706') : node.type === 'light' ? (isDark ? '#10B981' : '#059669') : (isDark ? '#9CA3AF' : '#6B7280'))}`,
                  boxShadow: isNodeActive ? '0 0 20px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)' : '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
                }}>
                <span style={{ textAlign: 'center', fontSize: '0.75rem', lineHeight: 1.25, pointerEvents: 'none', padding: '0 0.5rem', fontWeight: node.type === 'dark' ? 700 : node.type === 'white' ? 600 : 500, letterSpacing: node.type === 'dark' ? '0.025em' : 'normal', color: node.type === 'white' ? '#111827' : (isDark ? '#F9FAFB' : '#111827') }}>
                  {node.label}
                </span>
                {count !== undefined && (
                  <>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', padding: '0.125rem 0.5rem', backgroundColor: isDark ? '#FFD700' : '#D97706', color: '#111827', fontWeight: 700, pointerEvents: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      {count}
                    </span>
                    {levelData && (
                      <span style={{ fontSize: '9px', marginTop: '0.125rem', padding: '0 0.25rem', color: isDark ? '#9CA3AF' : '#6B7280', pointerEvents: 'none', fontFamily: 'monospace' }}>
                        L1:{levelData[1] || 0} L2:{levelData[2] || 0} L3:{levelData[3] || 0}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessChains;