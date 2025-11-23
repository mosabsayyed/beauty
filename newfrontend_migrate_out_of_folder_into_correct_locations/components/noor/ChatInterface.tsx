import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Language } from '../../types';

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
}

export function ChatInterface({ language, messages, onSendMessage, isProcessing = false }: ChatInterfaceProps) {
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
      onSendMessage(inputValue.trim());
      setInputValue('');
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
