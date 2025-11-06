import React, { useEffect, useState } from 'react';

const DebugPanel: React.FC = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handler = () => setActive(a => !a);
    window.addEventListener('toggleDebug', handler as EventListener);
    return () => window.removeEventListener('toggleDebug', handler as EventListener);
  }, []);

  return (
    <section className={`debug-section ${active ? 'active' : ''}`}>
      <div className="debug-header">
        🔍 RAW Debug Logs - Zero-Shot Orchestrator
      </div>
      <div className="debug-container">
        <div className="debug-empty">
          Send a message to see raw API communication logs
        </div>
      </div>
    </section>
  );
};

export default DebugPanel;
