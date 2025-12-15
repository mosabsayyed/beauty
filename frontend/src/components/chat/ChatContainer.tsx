/**
 * ChatContainer Component
 * 
 * Main chat interface containing:
 * - Header with conversation title
 * - Messages list with auto-scroll
 * - Chat input fixed at bottom
 * - Welcome screen (when no messages)
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { MessageBubble, ThinkingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '../ui/scroll-area';
import { BarChart3, FileText, Table, MessageSquare } from 'lucide-react';
import type { Message as APIMessage } from '../../types/api';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/chat.css';
import '../../styles/message-bubble.css';
import '../../styles/sidebar.css';
import '../../styles/chat-container.css';

interface ChatContainerProps {
  conversationId: number | null;
  conversationTitle?: string;
  messages: APIMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  language?: 'en' | 'ar';
  onToggleSidebar?: () => void;
  onToggleCanvas?: () => void;
  onOpenArtifact?: (artifact: any, artifacts?: any[]) => void;
  streamingMessage?: APIMessage | null;
}

export function ChatContainer({
  conversationId,
  conversationTitle,
  messages,
  onSendMessage,
  isLoading = false,
  language = 'en',
  onToggleSidebar,
  onToggleCanvas,
  onOpenArtifact,
  streamingMessage,
}: ChatContainerProps) {
  const { language: ctxLanguage } = useLanguage();
  const effectiveLanguage = language ?? ctxLanguage;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const themeAttr = document.documentElement.getAttribute('data-theme');
    return (themeAttr as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      setTheme((themeAttr as 'light' | 'dark') || 'dark');
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Combine regular messages with streaming message
  const displayMessages = useMemo(() => {
    return streamingMessage ? [...messages, streamingMessage] : messages;
  }, [messages, streamingMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  const translations = {
    welcomeTitle: effectiveLanguage === 'ar' ? 'مرحباً بك، أنا نور' : 'Welcome, I am Noor',
    welcomeSubtitle: effectiveLanguage === 'ar' 
      ? 'مساعدك الذكي في رحلة التحول المعرفي'
      : 'Your AI guide to cognitive transformation',
    examplesTitle: effectiveLanguage === 'ar' ? 'جرب هذه الأمثلة:' : 'Try these examples:',
    examples: [
      {
        icon: BarChart3,
        text: effectiveLanguage === 'ar' 
          ? 'كيف يتقدم التحول حتى الآن؟'
          : 'How is the transformation progressing to date?',
      },
      {
        icon: Table,
        text: effectiveLanguage === 'ar'
          ? 'سرد القدرات الأكثر نضجاً حسب الوحدات التنظيمية'
          : 'List the most mature capabilities by organisational units',
      },
      {
        icon: FileText,
        text: effectiveLanguage === 'ar'
          ? 'إنشاء تقرير مشاريع الربع الثالث لعام 2025'
          : 'Generate Q3 Projects Report for 2025',
      },
      {
        icon: MessageSquare,
        text: effectiveLanguage === 'ar'
          ? 'ما هو إطار الحوكمة للوكالة؟'
          : 'What is the governance framework for the agency?',
      },
    ],
  };

  const hasMessages = displayMessages.length > 0;

  return (
    <div className="chat-container-root">
      <div className="chat-top-controls" style={{ display: "flex", alignItems: "center", fontWeight: "400", justifyContent: "space-between", padding: "8px 12px", gap: "12px", backgroundColor: theme === 'light' ? 'rgba(250, 236, 195, 0.7)' : 'rgba(31, 41, 55, 0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div dir={effectiveLanguage === 'ar' ? 'rtl' : 'ltr'} style={{ display: "flex", alignItems: "center", gap: "8px", color: theme === 'light' ? '#4B5563' : "white" }}>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Fba0373f666ef4d3a8e7df76c08d95b9f"
            style={{ aspectRatio: "1.21", objectFit: "cover", objectPosition: "center", width: "40px", minHeight: "20px", minWidth: "20px", overflow: "hidden", height: "36px", border: "4px hidden rgba(249, 250, 251, 0.07)" }}
          />
          <div style={{ font: "700 16px __Inter_d65c78, sans-serif", color: theme === 'light' ? '#4B5563' : "white" }}>
            AI Twin Tech
          </div>
          <div style={{ color: theme === 'light' ? '#4B5563' : "rgb(209, 213, 219)", font: "400 16px __Inter_d65c78, sans-serif" }}>
            JOSOOR
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      {/* Messages Area - Takes remaining space */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <ScrollArea
          style={{
            flex: 1,
            minHeight: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="chat-content-wrapper">
            {!hasMessages ? (
              /* Welcome Screen */
              <div className="welcome-screen">
                {onToggleCanvas && (
                  <div
                    style={{
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'auto',
                    }}
                  >
                    <div className="canvas-toggle-small-wrapper" style={{ justifyContent: effectiveLanguage === 'ar' ? 'flex-start' : 'flex-end' }}>
                      <button
                        onClick={onToggleCanvas}
                        className="sidebar-icon-button clickable"
                        title={effectiveLanguage === 'ar' ? 'تبديل اللوحة' : 'Toggle canvas'}
                        aria-label={effectiveLanguage === 'ar' ? 'تبديل اللوحة' : 'Toggle canvas'}
                      >
                        <img src="/icons/menu.svg" alt="Toggle canvas" className="sidebar-quickaction-icon sidebar-quickaction-small" />
                      </button>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <div className="welcome-avatar" style={{ backgroundImage: "url('/icons/josoor.svg')" }} />

                  <h1 className="welcome-title tajawal">{translations.welcomeTitle}</h1>
                  <p className="welcome-sub cairo">{translations.welcomeSubtitle}</p>

                  {/* Example Prompts */}
                  <div className="example-grid" dir={effectiveLanguage === 'ar' ? 'rtl' : 'ltr'}>
                    <p className="example-intro">{translations.examplesTitle}</p>
                    <div className="example-list">
                      {translations.examples.map((example, index) => {
                        const isRTL = effectiveLanguage === 'ar';
                        return (
                          <button
                            key={index}
                            onClick={() => onSendMessage(example.text)}
                            className={`example-button clickable ${isRTL ? 'rtl-mode' : ''}`}
                            style={{
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              justifyContent: 'flex-start',
                            } as React.CSSProperties}
                          >
                            <example.icon 
                              className="example-icon" 
                              style={{ order: isRTL ? 2 : 0 }}
                            />
                            <span className="example-text cairo" style={{ 
                              textAlign: isRTL ? 'right' : 'left',
                              width: '100%',
                              order: isRTL ? 1 : 0,
                            }}>
                              {example.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Messages List */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                }}
              >
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isUser={message.role === 'user'}
                    language={effectiveLanguage}
                    showAvatar={true}
                    onCopy={() => {
                      // Copy handled internally in MessageBubble
                    }}
                    onFeedback={() => {}}
                    onOpenArtifact={(artifact, artifacts) => {
                      if (onOpenArtifact) onOpenArtifact(artifact, artifacts);
                    }}
                    onRetry={() => {
                      // Retry sends a short 'Try Again' prompt through the parent onSendMessage
                      if (onSendMessage) onSendMessage('Try Again');
                    }}
                  />
                ))}

                {/* Thinking Indicator */}
                {isLoading && <ThinkingIndicator language={language} />}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div>
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
          language={effectiveLanguage}
        />
      </div>
    </div>
  );
}
