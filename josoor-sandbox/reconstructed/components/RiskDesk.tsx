import React from 'react';
import { RiskTopologyMap } from './RiskTopologyMap';

export const RiskDesk = ({ year, quarter }) => (
  <div style={{ height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
    <RiskTopologyMap year={year} quarter={quarter} />
  </div>
);
