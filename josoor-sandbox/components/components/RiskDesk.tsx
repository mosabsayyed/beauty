import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiskTopologyMap } from './RiskTopologyMap'; // Importing the map with Rectangles
// import SectorOutcomes from '../../../components/graphv001/components/SectorOutcomes'; // Removed
import { useLanguage } from '../../../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, AlertTriangle, Shield, TrendingUp, Activity } from "lucide-react";

interface RiskDeskProps {
    quarter: string;
    year: string;
}

export const RiskDesk: React.FC<RiskDeskProps> = ({ quarter, year }) => {
    const { language } = useLanguage();
    // Simplified RiskDesk to focus on the Topology Map (V1.3 Spec)
    // This matches the pattern in V2 where the Map is the main feature.
    
    return (
        <div className={`jd-risk-desk h-full flex flex-col ${language === 'ar' ? 'rtl' : 'ltr'}`}>
             {/* HEADER */}
             <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', borderBottom: '1px solid #374151' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>System-Wide Risk Topology</h3>
                    <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>
                        High-level architecture view showing entity volumes and relationships.
                    </p>
                  </div>
                  <div>
                       <span style={{ background: '#EF4444', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>Meta-View Active</span>
                  </div>
              </div>

            {/* MAIN MAP AREA */}
            <div className="flex-1 min-h-0 relative px-6 pb-6 pt-4 flex gap-6">
                <div className="flex-1 bg-[#111827] border border-slate-700 rounded-lg p-1 flex flex-col h-full relative overflow-hidden">
                    {/* EMBEDDED TOPOLOGY MAP */}
                    <div className="flex-1 min-h-0 relative w-full bg-[#070b14] rounded overflow-hidden">
                         <RiskTopologyMap year={year} quarter={quarter} />
                         
                         {/* Legend */}
                         <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.8)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', color: '#fff', pointerEvents: 'none', zIndex: 100 }}>
                            <div style={{ marginBottom: '0.5rem', fontWeight: 800, color: '#D4AF37' }}>ONTOLOGY LEGEND</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <span style={{ width: 20, height: 2, background: '#10B981' }}></span> Active Link
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <span style={{ width: 20, height: 2, background: '#EF4444', borderStyle: 'dashed' }}></span> Broken Link (Risk)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
