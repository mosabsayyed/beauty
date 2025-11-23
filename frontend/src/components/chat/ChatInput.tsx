/**
 * ChatInput Component
 * 
 * Message composer with:
 * - Auto-growing textarea
 * - Send button
 * - Attachment button (future)
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  language?: 'en' | 'ar';
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
  language = 'en',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRTL = language === 'ar';

  const defaultPlaceholder = language === 'ar' 
    ? 'اكتب رسالتك إلى نور...'
    : 'Message Noor...';

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        borderTop: '1px solid rgb(229, 231, 235)',
        backgroundColor: 'rgb(255, 255, 255)',
        padding: '12px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: '900px',
            alignItems: 'center',
            gap: '8px',
            padding: '0 20px',
            margin: '0 auto',
          }}
        >
          {/* Attachment Button (Future) */}
          <button
            style={{
              flexShrink: 0,
              borderRadius: '8px',
              padding: '10px',
              transition: 'background-color 0.2s ease',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            disabled={disabled}
            title={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}
            onMouseEnter={(e) => {
              if (!disabled) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(249, 250, 251, 1)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <Paperclip style={{ width: '20px', height: '20px', color: 'rgba(107, 114, 128, 1)' }} />
          </button>

          {/* Textarea */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || defaultPlaceholder}
              disabled={disabled}
              dir={isRTL ? 'rtl' : 'ltr'}
              rows={1}
              style={{
                width: '100%',
                minHeight: '48px',
                maxHeight: '120px',
                borderRadius: '8px',
                border: '1px solid rgba(74,74,74,1)',
                backgroundColor: 'rgb(255, 255, 255)',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                transition: 'all 0.2s ease',
                outline: 'none',
                minWidth: 0,
                maxWidth: '100%',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'auto',
              }}
              onFocus={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = 'rgba(26, 36, 53, 1)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(26, 36, 53, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgb(229, 231, 235)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            style={{
              display: 'flex',
              height: '48px',
              width: '48px',
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              backgroundColor: canSend ? 'rgba(26, 36, 53, 1)' : 'rgba(229, 231, 235, 1)',
              color: canSend ? 'rgba(255, 255, 255, 1)' : 'rgba(156, 163, 175, 1)',
              marginLeft: 'auto',
            }}
            title={language === 'ar' ? 'إرسال' : 'Send'}
            onMouseEnter={(e) => {
              if (canSend) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(26, 36, 53, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (canSend) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(26, 36, 53, 1)';
              }
            }}
          >
            <Send style={{ width: '20px', height: '20px', color: canSend ? 'rgba(255,255,255,1)' : 'rgba(74,74,74,1)' }} />
          </button>
        </div>
      </div>

      {/* Keyboard Hint */}
      <div
        style={{
          marginTop: '8px',
          fontSize: '12px',
          color: 'rgba(156, 163, 175, 1)',
          textAlign: isRTL ? 'right' : 'left',
          maxWidth: '900px',
          padding: '0 20px',
          margin: '8px auto 0 auto',
        }}
      >
        {language === 'ar'
          ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد'
          : 'Press Enter to send, Shift+Enter for new line'}
      </div>
    </div>
  );
}
