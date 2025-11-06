import React from 'react';

const ChatInput: React.FC = () => (
  <div className="input-container">
    <input type="text" id="questionInput" placeholder="Ask me anything about your transformation..." />
    <button id="askButton">Ask</button>
  </div>
);

export default ChatInput;
