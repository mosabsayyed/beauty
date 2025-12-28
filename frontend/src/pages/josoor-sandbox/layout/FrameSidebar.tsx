import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { 
    LayoutDashboard, 
    GitGraph, 
    ShieldAlert, 
    FileText, 
    PieChart, 
    Settings, 
    Activity,
    BookOpen,
    Cpu,
    Map
} from 'lucide-react';
import '../josoor.css'; // Expecting the global josoor styles

interface FrameSidebarProps {
    isCollapsed?: boolean;
}

export const FrameSidebar: React.FC<FrameSidebarProps> = ({ isCollapsed = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check active path for highlighting
    const isActive = (path: string) => location.pathname.includes(path);

    // ════════════════════════════════════════════════════════════════════
    // DYNAMIC NAVIGATION GROUPS
    // ════════════════════════════════════════════════════════════════════
    // Source: Sidebar.tsx (quickActions) + JosoorV2Page.tsx (Sidebar)
    
    // Quick Actions Label Mapping Helper
    const { language } = useLanguage();
    const getQA = (id: string, def: string) => {
        // We replicate the exact label logic from Sidebar.tsx quickActions
        const qaMap: Record<string, { en: string, ar: string }> = {
            'knowledge': { en: 'Twin Knowledge', ar: 'علوم التوأمة' },
            'demo': { en: 'Intelligent Dashboards', ar: 'لوحات القيادة الذكية' },
            'architecture': { en: 'Product Roadmap', ar: 'خارطة طريق المنتج' },
            'approach': { en: 'Plan Your Journey', ar: 'خطط رحلتك' }
        };
        return language === 'ar' ? (qaMap[id]?.ar || def) : (qaMap[id]?.en || def);
    };

    const groups = [
        {
            title: language === 'ar' ? "إدارة المؤسسة" : "Enterprise Management",
            items: [
                { label: language === 'ar' ? "برج التحكم" : "Executives Desk", icon: LayoutDashboard, path: "/josoor-sandbox/executives", color: "#FFD700" },
                { label: language === 'ar' ? "مكتب التبعيات" : "Dependency Desk", icon: GitGraph, path: "/josoor-sandbox/dependencies", color: "#60A5FA" },
                { label: language === 'ar' ? "مكتب المخاطر" : "Risk Desk", icon: ShieldAlert, path: "/josoor-sandbox/risks", color: "#F87171" },
                { label: language === 'ar' ? "مكتب التخطيط" : "Planning Desk", icon: Map, path: "/josoor-sandbox/planning", color: "#34D399" },
                { label: language === 'ar' ? "مكتب التقارير" : "Reporting Desk", icon: FileText, path: "/josoor-sandbox/reporting", color: "#A78BFA" }
            ]
        },
        {
            title: language === 'ar' ? "المعرفة التوأم" : "Twin Knowledge",
            items: [
                // EXACT MAPPING to Sidebar.tsx quickActions
                { label: getQA('knowledge', "Learning Hub"), icon: BookOpen, path: "/josoor-sandbox/knowledge/hub", color: "#E5E7EB" },
                { label: getQA('demo', "Intelligent Dashboards"), icon: PieChart, path: "/josoor-sandbox/knowledge/demo", color: "#E5E7EB" }, // Found missing 'demo'
                { label: getQA('architecture', "Product Roadmap"), icon: Cpu, path: "/josoor-sandbox/knowledge/design", color: "#E5E7EB" },
                { label: getQA('approach', "Plan Your Journey"), icon: Map, path: "/josoor-sandbox/knowledge/journey", color: "#E5E7EB" }
            ]
        },
        {
            title: language === 'ar' ? "المسؤول" : "Admin",
            items: [
                { label: language === 'ar' ? "الإعدادات" : "Settings", icon: Settings, path: "/josoor-sandbox/admin/settings", color: "#9CA3AF" },
                { label: language === 'ar' ? "المراقبة" : "Observability", icon: Activity, path: "/josoor-sandbox/admin/observability", color: "#9CA3AF" }
            ]
        }
    ];

    return (
        <div className={`v2-sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{
            width: isCollapsed ? '64px' : '260px',
            backgroundColor: '#0B0F19',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: 'width 0.3s ease',
            zIndex: 100
        }}>
            {/* Branding Area */}
            <div style={{ 
                padding: '1.5rem 1rem', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}>
                <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#000' }}>J</span>
                </div>
                {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}>JOSOOR</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Sandbox V2</span>
                    </div>
                )}
            </div>

            {/* Navigation Groups */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
                {groups.map((group, idx) => (
                    <div key={idx} style={{ marginBottom: '1.5rem' }}>
                        {!isCollapsed && (
                            <div style={{ 
                                padding: '0 1rem 0.5rem', 
                                color: 'rgba(255,255,255,0.3)', 
                                fontSize: '0.7rem', 
                                fontWeight: 700, 
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {group.title}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {group.items.map((item, itemIdx) => {
                                const active = isActive(item.path);
                                return (
                                    <div 
                                        key={itemIdx}
                                        onClick={() => navigate(item.path)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            margin: '0 0.5rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            backgroundColor: active ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                                            borderLeft: active ? '3px solid #FFD700' : '3px solid transparent',
                                            transition: 'all 0.2s ease',
                                            color: active ? '#FFD700' : 'rgba(255,255,255,0.6)',
                                            justifyContent: isCollapsed ? 'center' : 'flex-start'
                                        }}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <item.icon size={20} color={active ? '#FFD700' : (item.color || 'currentColor')} />
                                        {!isCollapsed && (
                                            <span style={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }}>{item.label}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / User Profile Stub */}
            <div style={{ 
                padding: '1rem', 
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={16} color="rgba(255,255,255,0.5)" />
                </div>
                {!isCollapsed && (
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>System Ready</div>
                )}
            </div>
        </div>
    );
};
