import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FrameSidebar } from './FrameSidebar';
import { FrameHeader } from './FrameHeader';
import '../josoor.css'; // Global styles

export const JosoorFrame: React.FC = () => {
    // Global State for the Sandbox
    const [year, setYear] = useState('2025');
    const [quarter, setQuarter] = useState('Q4');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const location = useLocation();

    // Determine Title/Subtitle based on route
    const getPageInfo = () => {
        if (location.pathname.includes('executives')) return { title: 'Transformation Control Tower', subtitle: 'Executive Overview & Decision Support' };
        if (location.pathname.includes('dependencies')) return { title: 'Dependency Desk', subtitle: 'Business Chains & Bottleneck Identification' };
        if (location.pathname.includes('risks')) return { title: 'Risk Desk', subtitle: 'Threat Vectors & Propagation Paths' };
        if (location.pathname.includes('planning')) return { title: 'Planning Desk', subtitle: 'Capability Matrix & Resource Allocation' };
        if (location.pathname.includes('reporting')) return { title: 'Reporting Desk', subtitle: 'AI-Generated Insights & PDFs' };
        if (location.pathname.includes('knowledge')) {
             if (location.pathname.includes('demo')) return { title: 'Intelligent Dashboards', subtitle: 'Investor Demo & Twin Science' };
             if (location.pathname.includes('design')) return { title: 'Product Roadmap', subtitle: 'Architecture & Features' };
             if (location.pathname.includes('journey')) return { title: 'Plan Your Journey', subtitle: 'Approach & Utilization' };
             return { title: 'Twin Knowledge', subtitle: 'Enterprise Logic & Data Models' };
        }
        if (location.pathname.includes('admin')) return { title: 'Platform Admin', subtitle: 'System Observability & Configuration' };
        return { title: 'Josoor Sandbox', subtitle: 'V2 Environment' };
    };

    const { title, subtitle } = getPageInfo();

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#050912', // Deepest background
            overflow: 'hidden',
            fontFamily: '"Inter", sans-serif'
        }}>
            {/* Sidebar (Left) */}
            <FrameSidebar isCollapsed={isSidebarCollapsed} />

            {/* Main Content Area (Right) */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                overflow: 'hidden'
            }}>
                {/* Header (Top) */}
                <FrameHeader 
                    year={year} 
                    quarter={quarter} 
                    onYearChange={setYear} 
                    onQuarterChange={setQuarter}
                    title={title}
                    subtitle={subtitle}
                />

                {/* Desk Content (Scrollable) */}
                {/* Desk Content (Scrollable) */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '1.5rem',
                    position: 'relative'
                }}>
                    {/* 
                        CONTEXT PROPAGATION:
                        Desks receive Year/Quarter via Outlet Context.
                        See FrameHeader.tsx for the dual-mode filtering logic documentation.
                    */}
                    <Outlet context={{ year, quarter }} />
                </div>
            </div>
        </div>
    );
};
