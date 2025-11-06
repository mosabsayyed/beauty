
import React from 'react';

import './App.css';
import './legacy.css';
import './canvas.css';

import Header from './components/Header';
import ConversationsSidebar from './components/ConversationsSidebar';
import DebugPanel from './components/DebugPanel';
import SuggestionsBar from './components/SuggestionsBar';
import Chat from './components/Chat';
import CanvasManager from './CanvasManager';

function App() {
  return (
    <div className="container">
      <Header />
      <div className="main-content">
        <ConversationsSidebar />

        <div className="chat-section">
          <div className="chat-container" id="chatContainer">
            <SuggestionsBar />
            <Chat />
          </div>

          {/* ChatInput removed to avoid duplicate inputs (Chat contains its own input) */}
        </div>

        <DebugPanel />

        <CanvasManager />
      </div>
    </div>
  );
}

export default App;
