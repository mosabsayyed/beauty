import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LensARadar, transformToLensA } from './LensARadar';
import { LensBRadar, transformToLensB } from './LensBRadar';
import { TrendsChart, transformToTrend } from './TrendsChart';
import { CombinedScore } from './CombinedScore';
import { InternalOutputs } from './InternalOutputs';
import { DecisionsList } from './DecisionsList';
import { MissingInputs } from './MissingInputs';
import { RiskSignals } from './RiskSignals';
import { StrategicInsights } from './StrategicInsights';
import { SectorOutcomes } from './SectorOutcomes';

import './ControlTower.css'; // Keep existing styles for now, but will override with simpler grid

interface JosoorContext {
    year: string;
    quarter: string;
}

export const ControlTower: React.FC = () => {
  const { year, quarter } = useOutletContext<JosoorContext>();
  
  const [dashboardData, setDashboardData] = useState<any[] | null>(null);
  
  // Lens Data State
  const [lensA, setLensA] = useState<any>(null);
  const [lensB, setLensB] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/dashboard/dashboard-data');
        if (res.ok) {
          const json = await res.json();
          setDashboardData(json);
        }
      } catch (e) {
        console.error('Dashboard fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // TRANSFORM DATA
  useEffect(() => {
      if (!dashboardData) return;
      
      const la = transformToLensA(dashboardData, quarter, year);
      const lb = transformToLensB(quarter, year);
      const tr = transformToTrend(dashboardData, quarter, year);
      
      setLensA(la);
      setLensB(lb);
      setTrends(tr);

  }, [dashboardData, quarter, year]);

  // Scores
  const scoreA = lensA?.axes ? Math.round(lensA.axes.reduce((acc: any, curr: any) => acc + curr.value, 0) / lensA.axes.length) : 0;
  const scoreB = lensB?.axes ? Math.round(lensB.axes.reduce((acc: any, curr: any) => acc + curr.value, 0) / lensB.axes.length) : 0;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ROW 1: RADARS & SCORE (Height ~ 380px) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 1fr', gap: '16px', height: '380px' }}>
            {/* Col 1: Lens A */}
            <LensARadar data={lensA} loading={loading} />
            
            {/* Col 2: Score */}
            <CombinedScore lensAScore={scoreA} lensBScore={scoreB} />
            
            {/* Col 3: Lens B */}
            <LensBRadar data={lensB} loading={loading} />
        </div>

        {/* ROW 2: DETAILS (Height ~ 500px+) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', minHeight: '500px' }}>
            
            {/* Col 1: Internal Outputs (2 Cols Grid) */}
            <div style={{ background: 'var(--component-panel-bg)', borderRadius: '12px', padding: '16px', border: '1px solid var(--component-panel-border)' }}>
                <InternalOutputs quarter={quarter} year={year} dashboardData={dashboardData || undefined} columns={2} />
            </div>

            {/* Col 2: Stacked Operational */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ flex: 1, minHeight: '220px' }}>
                     <TrendsChart data={trends} loading={loading} />
                 </div>
                 <div style={{ flex: 1 }}>
                     <DecisionsList />
                 </div>
                 <div style={{ flex: 1 }}>
                     <RiskSignals quarter={quarter} year={year} />
                 </div>
                 <div style={{ flex: 1 }}>
                     <MissingInputs quarter={quarter} year={year} />
                 </div>
            </div>

            {/* Col 3: Stacked Strategic */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ flex: 1, minHeight: '200px' }}>
                    <StrategicInsights />
                </div>
                <div style={{ flex: 1, minHeight: '200px' }}>
                    <SectorOutcomes />
                </div>
            </div>
            
        </div>

    </div>
  );
};
