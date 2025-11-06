import React, { useEffect, useState } from 'react';

const ConversationsSidebar: React.FC = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handler = () => setActive(a => !a);
    window.addEventListener('toggleConversations', handler as EventListener);
    return () => window.removeEventListener('toggleConversations', handler as EventListener);
  }, []);

  return (
    <aside className={`conversations-sidebar ${active ? 'active' : ''}`}>
      <div className="conversations-header">
        <h3>💬 Conversations</h3>
        <button
          onClick={() => setActive(false)}
          style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18}}
        >
          ✕
        </button>
      </div>
      <div className="conversations-list">
        <div className="loading">Loading conversations...</div>
      </div>
    </aside>
  );
};

export default ConversationsSidebar;
