import React, { useState, useRef, useEffect } from 'react';

interface AgentChatBarProps {
  context: string;
  selectedNode: {
    id: string;
    type: string;
    name: string;
    properties: Record<string, any>;
  } | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AgentChatBar: React.FC<AgentChatBarProps> = ({ context, selectedNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context-aware placeholder
  const placeholder = selectedNode 
    ? `Ask about ${selectedNode.name}...`
    : 'Ask a question about the dashboard...';

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsExpanded(true);

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      // Build context-aware query
      let fullQuery = userMessage;
      if (selectedNode) {
        fullQuery = `[Context: The user is viewing ${selectedNode.type} "${selectedNode.name}" with ID ${selectedNode.id}. Properties: ${JSON.stringify(selectedNode.properties)}]\n\nUser question: ${userMessage}`;
      }

      // Call chat API
      const response = await fetch('/api/v1/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('josoor_token') || ''}`
        },
        body: JSON.stringify({
          query: fullQuery,
          persona: 'noor'
        })
      });

      if (!response.ok) throw new Error('Chat request failed');
      
      const data = await response.json();
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.llm_payload?.answer || data.message || 'No response received',
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`agent-chat-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header / Input Bar */}
      <div 
        className="chat-bar-header"
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <span className="chat-bar-icon">💬</span>
        <input
          className="chat-bar-input"
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
        />
        <button 
          className="chat-bar-send"
          onClick={handleSend}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Send'}
        </button>
        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--jd-text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            ↓
          </button>
        )}
      </div>

      {/* Messages Area (only shown when expanded) */}
      {isExpanded && (
        <div className="chat-bar-body">
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: 'var(--jd-text-muted)',
              padding: '2rem'
            }}>
              {selectedNode ? (
                <>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                  <div>Ask questions about <strong>{selectedNode.name}</strong></div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    I have context about this {selectedNode.type.replace('Entity', '').replace('Sector', '')}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
                  <div>Ask questions about your dashboard data</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Select an element for context-aware answers
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: msg.role === 'user' 
                        ? 'var(--jd-cyan)' 
                        : 'var(--jd-bg-card)',
                      color: msg.role === 'user' 
                        ? 'var(--jd-bg-canvas)' 
                        : 'var(--jd-text-primary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}
                  >
                    {msg.content}
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--jd-text-muted)',
                    marginTop: '0.25rem'
                  }}>
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: 'var(--jd-text-muted)'
                }}>
                  <span className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
                  <span className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
                  <span className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentChatBar;
