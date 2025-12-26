import React, { useEffect, useState } from 'react';
import { DualLensHUD } from './DualLensHUD'; // Architecture upgrade
import '../josoor.css';

/**
 * ControlTower
 * Reconstructed to use Dual Lens architecture and direct Backend API calls.
 * Sources:,,
 */
export const ControlTower = ({ year, quarter }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // API Fix: Call Backend 8008 directly, replacing slow Graph Proxy
      // Parallel fetching logic
      try {
        const [dashboard, outcomes, initiatives] = await Promise.all([
          fetch('/api/v1/dashboard/dashboard-data').then(r => r.json()),
          fetch('/api/v1/dashboard/outcomes-data').then(r => r.json()),
          fetch('/api/v1/dashboard/investment-initiatives').then(r => r.json())
        ]);
        
        setData({ dashboard, outcomes, initiatives });
      } catch (error) {
        console.error("Failed to load Control Tower data", error);
      }
    };
    
    fetchData();
  }, [year, quarter]);

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
       {/* New Dual Lens Architecture */}
       <DualLensHUD 
         data={data?.dashboard} 
         outcomes={data?.outcomes}
         initiatives={data?.initiatives}
       />
    </div>
  );
};
