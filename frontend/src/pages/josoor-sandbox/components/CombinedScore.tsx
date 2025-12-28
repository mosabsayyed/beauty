import React from 'react';

interface CombinedScoreProps {
    lensAScore: number;
    lensBScore: number;
}

export const CombinedScore: React.FC<CombinedScoreProps> = ({ lensAScore, lensBScore }) => {
    const combined = Math.round((lensAScore + lensBScore) / 2);

    return (
        <div className="panel v2-radar-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--component-bg-primary)' }}>
             <h3 className="v2-radar-title" style={{ textAlign: 'center', marginBottom: '20px' }}>Combined Health Index</h3>
             
             <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {/* Circle Background */}
                 <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                     <circle cx="50" cy="50" r="45" stroke="var(--component-panel-border)" strokeWidth="8" fill="none" />
                     {/* Progress Arc */}
                     <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        stroke="var(--component-text-accent)" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeDasharray="283" 
                        strokeDashoffset={283 - (283 * combined) / 100} 
                        strokeLinecap="round"
                    />
                 </svg>
                 
                 <div style={{ position: 'absolute', textAlign: 'center' }}>
                     <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--component-text-primary)' }}>{combined}</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--component-text-secondary)' }}>/ 100</div>
                 </div>
             </div>

             <div style={{ marginTop: '20px', display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
                 <div style={{ textAlign: 'center' }}>
                     <div style={{ color: 'var(--component-color-success)', fontWeight: 700 }}>{lensAScore}%</div>
                     <div style={{ color: 'var(--component-text-secondary)', fontSize: '0.7rem' }}>Health</div>
                 </div>
                 <div style={{ width: '1px', background: 'var(--component-panel-border)' }}></div>
                 <div style={{ textAlign: 'center' }}>
                     <div style={{ color: 'var(--component-color-success)', fontWeight: 700 }}>{lensBScore}%</div>
                     <div style={{ color: 'var(--component-text-secondary)', fontSize: '0.7rem' }}>Impact</div>
                 </div>
             </div>
        </div>
    );
};
