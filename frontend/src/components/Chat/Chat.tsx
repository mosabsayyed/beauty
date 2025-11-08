  // Remove misplaced hooks outside ChatRebuild
import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './Chat.module.css';
import { chatService } from '../../services/chatService';
import { Artifact } from '../../types/chat';  

// Import marked and dompurify properly
let marked: any = (s: string) => s;
let DOMPurify: any = { sanitize: (s: string) => s };

// Try to import marked (v16+ uses { marked } named export)
try {
  const markedLib = require('marked');
  if (markedLib.marked && typeof markedLib.marked === 'function') {
    marked = markedLib.marked;
  } else if (markedLib.parse && typeof markedLib.parse === 'function') {
    marked = markedLib.parse;
  } else if (typeof markedLib === 'function') {
    marked = markedLib;
  }
} catch (e) {
  console.warn('marked library not available, using plain text');
}

// Try to import DOMPurify
try {
  const dompurifyLib = require('dompurify');
  if (dompurifyLib && dompurifyLib.sanitize) {
    DOMPurify = dompurifyLib;
  }
} catch (e) {
  console.warn('dompurify library not available, skipping sanitization');
}

// Fallback for Message type
type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  htmlContent?: string;
  artifactDescriptions?: string[];
};

interface ChatRebuildProps {
  conversationId?: number | null;
}

function ChatRebuild({ conversationId }: ChatRebuildProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [malformed, setMalformed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation messages when conversationId changes
  const loadConversationMessages = useCallback(async (convId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatService.getConversationMessages(convId);
      if (response && response.messages) {
        // Convert ChatMessage[] to Message[]
        const loadedMessages: Message[] = response.messages.map(msg => {
          let content = msg.content;
          
          // Append insights for assistant messages
          if (msg.role === 'assistant' && msg.metadata?.insights && Array.isArray(msg.metadata.insights) && msg.metadata.insights.length > 0) {
            content += '\n\n**Key Insights:**\n' + msg.metadata.insights.map((insight: string, idx: number) => `${idx + 1}. ${insight}`).join('\n');
          }
          
          const message: Message = {
            id: msg.id || Date.now().toString(),
            role: msg.role === 'assistant' ? 'agent' : msg.role,
            content: content,
            createdAt: msg.timestamp || new Date().toISOString(),
            artifactDescriptions: msg.metadata?.artifacts?.map(a => a.title) || []
          };
          
          // Only apply markdown rendering for assistant messages if marked is available
          if (msg.role === 'assistant') {
            // Preprocess: convert newlines to <br> tags
            let processedContent = content.replace(/\n/g, '<br>');
            
            if (typeof marked === 'function') {
              try {
                const markedHtml = marked(processedContent);
                message.htmlContent = typeof DOMPurify.sanitize === 'function' 
                  ? DOMPurify.sanitize(markedHtml) 
                  : markedHtml;
              } catch (e) {
                console.warn('Markdown rendering failed:', e);
                // Keep the preprocessed content
                message.htmlContent = processedContent;
              }
            } else {
              // Use preprocessed content if marked is not available
              message.htmlContent = processedContent;
            }
            
            // Debug logging
            console.log('History message content:', content);
            console.log('Processed content:', processedContent);
            console.log('History message htmlContent:', message.htmlContent);
          }
          
          return message;
        });
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error('Error loading conversation messages:', err);
      setError('Failed to load conversation messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversationMessages(conversationId);
    } else {
      // New conversation - clear messages
      setMessages([]);
    }
  }, [conversationId, loadConversationMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for new chat event from header
  useEffect(() => {
    const handleNewChat = () => {
      setMessages([]);
      setInput('');
      setError(null);
      setMalformed(false);
    };
    window.addEventListener('newChat', handleNewChat);
    return () => window.removeEventListener('newChat', handleNewChat);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);
    setMalformed(false);

    try {
      // Use chatService to send message
      const data = await chatService.sendMessage({
        query: input,
        conversation_id: conversationId ?? undefined,
        persona: 'transformation_analyst'
      });

      if (!data || typeof data !== 'object') {
        setMalformed(true);
        return;
      }

      // Main agent message - backend returns 'message' field
      let agentMessage: Message | null = null;
      if (data.message && typeof data.message === 'string') {
        let content = data.message;
        
        // Append insights if available
        const insights = data.insights || data.analysis || [];
        if (Array.isArray(insights) && insights.length > 0) {
          content += '\n\n**Key Insights:**\n' + insights.map((insight: string, idx: number) => `${idx + 1}. ${insight}`).join('\n');
        }
        
        agentMessage = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: content,
          createdAt: new Date().toISOString(),
          artifactDescriptions: Array.isArray(data.artifacts) ? (data.artifacts as any[]).map((a: any) => typeof a === 'string' ? a : a.title || String(a)) : []
        };
        // Preprocess: convert newlines to <br> tags
        let processedContent = data.message.replace(/\n/g, '<br>');
        
        // Apply markdown rendering if available
        if (typeof marked === 'function') {
          try {
            const markedHtml = marked(processedContent);
            agentMessage.htmlContent = typeof DOMPurify.sanitize === 'function'
              ? DOMPurify.sanitize(markedHtml)
              : markedHtml;
          } catch (e) {
            console.warn('Markdown rendering failed:', e);
            // Keep the preprocessed content
            agentMessage.htmlContent = processedContent;
          }
        } else {
          // Use preprocessed content if marked is not available
          agentMessage.htmlContent = processedContent;
        }
        
        // Debug logging
        console.log('New message content:', data.message);
        console.log('Processed content:', processedContent);
        console.log('New message htmlContent:', agentMessage.htmlContent);
      }

      if (agentMessage) {
        const updatedMessages = [...newMessages, agentMessage];
        setMessages(updatedMessages);
      } else {
        setMalformed(true);
      }

      // Canvas artifact handling - dispatch artifacts to canvas
      if (data.artifacts && Array.isArray(data.artifacts) && data.artifacts.length > 0) {
        window.dispatchEvent(new CustomEvent('chat:artifacts', { detail: { artifacts: data.artifacts } }));
      }
    } catch (e) {
      console.error('Chat error:', e);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setInput(messages[messages.length - 1].content);
      setMessages(messages.slice(0, -1));
      setError(null);
      setMalformed(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.meta}>{msg.role === 'user' ? 'You' : 'Assistant'}</div>
            <div className={styles.content}>
              {msg.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: msg.htmlContent }} />
              ) : (
                <div>{msg.content}</div>
              )}
            </div>
            {msg.artifactDescriptions && msg.artifactDescriptions.length > 0 && (
              <div className={styles.artifacts}>
                <div className={styles.artifactsLabel}>📊 Generated Artifacts:</div>
                <div className={styles.artifactsList}>
                  {msg.artifactDescriptions.map((description, artIdx) => (
                    <div key={artIdx} className={styles.artifactItem}>
                      {description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && (
        <div className={styles.error}>
          {error} <button onClick={handleRetry}>Retry</button>
        </div>
      )}
      {malformed && (
        <div className={styles.error}>
          Connection error. <button onClick={handleRetry}>Click here to retry.</button>
        </div>
      )}
      <div className={styles.inputRow}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={loading}
          autoFocus
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export { ChatRebuild };
