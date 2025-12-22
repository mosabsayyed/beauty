import React, { useState, useEffect } from 'react';
import { DualLensHUD } from './DualLensHUD';
import { InternalOutputs } from './InternalOutputs';
import { DecisionsList } from './DecisionsList';
import { MissingInputs } from './MissingInputs';
import { RiskSignals } from './RiskSignals';
import './ControlTower.css';

interface ControlTowerProps {
    year: string;
    quarter: string;
}

export const ControlTower: React.FC<ControlTowerProps> = ({ year, quarter }) => {
  // ════════════════════════════════════════════════════════════════════
  // SINGLE DATA FETCH - dashboardData shared by DualLensHUD and InternalOutputs
  // This avoids duplicate API calls for Lens A data
  // ════════════════════════════════════════════════════════════════════
  const [dashboardData, setDashboardData] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/v1/dashboard/dashboard-data');
        if (res.ok) {
          setDashboardData(await res.json());
        }
      } catch (e) {
        console.error('Dashboard fetch failed:', e);
      }
    };
    fetchDashboard();
  }, []);  // Fetch once on mount - filters handled client-side

  return (
    <div className="v2-control-tower">
        
        {/* W0: Dual-Lens HUD */}
        <section className="v2-section">
            <DualLensHUD quarter={quarter} year={year} dashboardData={dashboardData || undefined} />
        </section>

        {/* W1: Health Grid */}
        <section className="v2-section">
            <InternalOutputs quarter={quarter} year={year} dashboardData={dashboardData || undefined} />
        </section>

        {/* Lower Deck: W2/W3/W4 */}
        <div className="v2-lower-deck">
            <DecisionsList />
            <MissingInputs quarter={quarter} year={year} />
            <RiskSignals quarter={quarter} year={year} />
        </div>

    </div>
  );
};
