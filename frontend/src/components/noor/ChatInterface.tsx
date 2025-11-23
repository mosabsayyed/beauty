import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Language } from '../../types';
import { cleanJsonString, parseSseMessages } from '../../utils/streaming';
import MessageBubble from '../../components/MessageBubble';


interface Message {
  id: string;
  role: 'user' | 'noor';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  language: Language;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  conversationId?: number;
  onReceiveAssistant?: (message: { content: string; metadata?: any }) => void;
}

export function ChatInterface({ language, messages, onSendMessage, isProcessing = false, conversationId, onReceiveAssistant }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      // Notify parent about the user message (persisting conversation)
      try {
        onSendMessage(inputValue.trim());
      } catch (err) {
        // ignore if parent hasn't provided a handler
      }

      // Start streaming assistant response (local UI only)
      startStreamingResponse(inputValue.trim());

      setInputValue('');
    }
  };

  // Streaming UI state
  const [streamingThinking, setStreamingThinking] = useState<string | null>(null);
  const [streamingAnswer, setStreamingAnswer] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStreamingResponse = async (userMessage: string) => {
    setStreamingThinking('');
    setStreamingAnswer(null);
    setIsStreaming(true);

    try {
      const bodyPayload: any = { query: userMessage }; // Use 'query' for non-streaming endpoint
      if (conversationId) bodyPayload.conversation_id = conversationId;

      const response = await fetch('/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      
      let ans = "";
      let artifacts: any[] = [];
      let llmPayload = data.llm_payload || data;

      // If llm_payload is a string, try to parse it
      if (typeof llmPayload === 'string') {
        try {
          llmPayload = JSON.parse(llmPayload);
        } catch (e) {}
      }

      if (llmPayload) {
        ans = llmPayload.answer || llmPayload.message || "";
        if (llmPayload.visualizations) artifacts = llmPayload.visualizations;
      }

      if (!ans) {
        ans = data.message || data.answer || "";
      }
      if (artifacts.length === 0 && data.artifacts) {
        artifacts = data.artifacts;
      }

      // Try to parse ans if it looks like JSON
      if (typeof ans === 'string' && (ans.trim().startsWith('{') || ans.trim().startsWith('['))) {
        try {
           const parsed = JSON.parse(ans);
           if (parsed.answer) ans = parsed.answer;
           if (parsed.visualizations) artifacts = parsed.visualizations;
           if (!llmPayload || typeof llmPayload !== 'object') llmPayload = parsed;
        } catch (e) {}
      }

      setStreamingAnswer(ans);
      
      // Build metadata payload
      const metadata: any = {};
      if (artifacts.length > 0) metadata.visualizations = artifacts;
      
      // Other metadata fields
      if (llmPayload.insights) metadata.analysis = llmPayload.insights;
      if (llmPayload.memory_process) metadata.memory_process = llmPayload.memory_process;
      
      metadata.raw_response = data;

      // call parent callback
      if (onReceiveAssistant) {
        onReceiveAssistant({ content: ans, metadata });
      }

    } catch (e) {
      console.error('Request failed', e);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#1A2435] text-white'
                  : 'bg-gray-100 text-[#1A2435]'
              }`}
            >
              {message.role === 'noor' && (
                <p className="text-sm opacity-70 mb-1">
                  {language === 'en' ? 'Noor' : 'نور'}
                </p>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-[#1A2435]/70">
                  {language === 'en' ? 'Noor is thinking...' : 'نور تفكر...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Streaming Assistant Bubble (local visual only) */}
      {(isStreaming || streamingAnswer) && (
        <div className="p-4">
          <MessageBubble
            role="assistant"
            content={streamingAnswer || undefined}
            thinking={streamingThinking || undefined}
            isThinking={isStreaming}
          />
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'en'
                ? 'Ask Noor anything about JOSOOR...'
                : 'اسأل نور أي شيء عن جسور...'
            }
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1A2435] focus:border-transparent"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="px-6 py-3 bg-[#1A2435] text-white rounded-lg hover:bg-[#1A2435]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {language === 'en' ? 'Press Enter to send, Shift+Enter for new line' : 'اضغط Enter للإرسال، Shift+Enter لسطر جديد'}
        </p>
      </form>
    </div>
  );
}

// Exported helper to perform streaming request and consume SSE tokens.
export async function handleStreamRequest(
  userMessage: string,
  history: any[] = [],
  onThought?: (thought: string) => void,
  onAnswer?: (answer: string) => void,
  onChunk?: (accumulatedRaw: string) => void
) {
  const response = await fetch('/api/v1/chat/message/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage, history }),
  });

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedRaw = '';
  let buffer = '';

  let thoughtTrace = '';
  let finalAnswer = '';
  let isThinking = true;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Split by double newline to get complete SSE messages
    const parts = buffer.split(/\r?\n\r?\n/);
    
    // The last part might be incomplete, so we keep it in the buffer
    // If the chunk ended exactly with \n\n, parts.pop() will be empty string, which is fine.
    buffer = parts.pop() || '';

    for (const msg of parts) {
      let line = msg.trim();
      if (!line) continue;

      if (line.startsWith('data:')) {
        line = line.replace(/^data:\s*/i, '').trim();
      }

      if (line === '[DONE]') {
        isThinking = false;
        break;
      }

      // Try parse as JSON token payload
      try {
        const payload = JSON.parse(line);
        if (payload.token) {
          accumulatedRaw += payload.token;
        }
      } catch (e) {
        // treat as raw text if it's not JSON
        // accumulatedRaw += line; // Optional: decide if we want to accumulate raw non-JSON lines
      }

      // Partial parsing for thought_trace
      const thoughtMatch = accumulatedRaw.match(/"thought_trace":\s*"((?:[^"\\]|\\.)*)/);
      if (thoughtMatch && thoughtMatch[1]) {
        thoughtTrace = cleanJsonString(thoughtMatch[1]);
        if (onThought) onThought(thoughtTrace);
      }

      const answerMatch = accumulatedRaw.match(/"answer":\s*"((?:[^"\\]|\\.)*)/);
      if (answerMatch && answerMatch[1]) {
        finalAnswer = cleanJsonString(answerMatch[1]);
        isThinking = false;
        if (onAnswer) onAnswer(finalAnswer);
      }

      if (onChunk) onChunk(accumulatedRaw);
    }
  }

  // Final parse
  try {
    const fullData = JSON.parse(accumulatedRaw);
    if (fullData.answer && !finalAnswer) {
      finalAnswer = fullData.answer;
      if (onAnswer) onAnswer(finalAnswer);
    }
    return fullData;
  } catch (e) {
    console.error('Final JSON parse failed', e);
    return null;
  }
}
