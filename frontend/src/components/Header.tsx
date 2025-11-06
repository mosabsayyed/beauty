import React from 'react';

const Header: React.FC = () => (
  <header className="header">
    <div className="header-left">
      <h1>JOSOOR - Transformation Analytics</h1>
      <p>Autonomous AI Agent for Enterprise Transformation Intelligence</p>
    </div>
    <div className="header-right">
      {/* Controls will be wired up here */}
      <button
        className="canvas-toggle-btn"
        onClick={() => window.dispatchEvent(new CustomEvent('toggleConversations'))}
      >
        📋 History
      </button>
      <button
        className="canvas-toggle-btn"
        onClick={() => window.dispatchEvent(new CustomEvent('newChat'))}
      >
        💬 New Chat
      </button>
      {/* Emit a window event so CanvasManager can toggle without lifting state yet */}
      <button
        className="canvas-toggle-btn"
        onClick={() => window.dispatchEvent(new CustomEvent('toggleCanvas'))}
      >
        📊 Canvas
      </button>
      <button
        id="debugToggle"
        className="canvas-toggle-btn"
        onClick={() => window.dispatchEvent(new CustomEvent('toggleDebug'))}
      >
        🔍 Show Debug
      </button>
    </div>
  </header>
);

export default Header;
