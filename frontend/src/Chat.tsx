import React, { useState } from 'react';
import './canvas.css';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1/chat/message';
const BACKUP_API_URL = 'http://localhost:8008/api/v1/chat/message';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [malformed, setMalformed] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const sendPrompt = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setMalformed(false);
    setLastPrompt(prompt);
    try {
      let response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt })
      });

      // If the local CRA dev server proxy isn't configured, try common backend port
      if (response.status === 404) {
        console.warn('Primary API returned 404, attempting backup API URL:', BACKUP_API_URL);
        response = await fetch(BACKUP_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt })
        });
      }

      const text = await response.text();
  let data: any;
      let malformedResp = false;
      try {
        data = JSON.parse(text);
        if (!data || typeof data !== 'object' || (!('message' in data) && !('error' in data))) {
          malformedResp = true;
        }
      } catch (e) {
        malformedResp = true;
      }
      if (malformedResp) {
        setMalformed(true);
        setLoading(false);
        return;
      }
      if (data.error) {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      } else if (data.message) {
        setMessages(prev => [...prev, { role: 'user', content: prompt }, { role: 'agent', content: data.message }]);
      }
    } catch (e) {
      setMalformed(true);
    }
    // ensure input area stays at bottom by giving the container a small timeout to reflow
    setTimeout(() => {
      const el = document.querySelector('.chat-container .messages') as HTMLElement | null;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendPrompt(input.trim());
    setInput('');
  };

  const handleRetry = () => {
    if (lastPrompt) {
      sendPrompt(lastPrompt);
    }
  };

  // Listen for global newChat event to clear messages (header -> new chat)
  React.useEffect(() => {
    const handler = () => {
      setMessages([]);
      setError(null);
      setMalformed(false);
      // focus the input if available
      setTimeout(() => {
        const inputEl = document.querySelector('.chat-container input') as HTMLInputElement | null;
        if (inputEl) inputEl.focus();
      }, 50);
    };
    window.addEventListener('newChat', handler as EventListener);
    return () => window.removeEventListener('newChat', handler as EventListener);
  }, []);

  return (
    <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="messages" style={{ flex: 1, overflowY: 'auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>{msg.content}</div>
        ))}
      </div>
      {error && <div className="error-message">{error}</div>}
      {malformed && (
        <div className="error-message">
          Connection error. <button onClick={handleRetry}>Click here to retry.</button>
        </div>
      )}
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
