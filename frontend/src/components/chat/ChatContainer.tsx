/**
 * ChatContainer Component
 * 
 * Main chat interface containing:
 * - Header with conversation title
 * - Messages list with auto-scroll
 * - Chat input fixed at bottom
 * - Welcome screen (when no messages)
 */

import { useEffect, useRef, useMemo } from 'react';
import { MessageBubble, ThinkingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '../ui/scroll-area';
import { BarChart3, FileText, Table, MessageSquare } from 'lucide-react';
import type { Message as APIMessage } from '../../types/api';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine regular messages with streaming message
  const displayMessages = useMemo(() => {
    return streamingMessage ? [...messages, streamingMessage] : messages;
  }, [messages, streamingMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  const translations = {
    welcomeTitle: language === 'ar' ? 'مرحباً بك في نور' : 'Welcome to Noor',
    welcomeSubtitle: language === 'ar' 
      ? 'مساعدك الذكي في رحلة التحول المعرفي'
      : 'Your AI guide to cognitive transformation',
    examplesTitle: language === 'ar' ? 'جرب هذه الأمثلة:' : 'Try these examples:',
    examples: [
      {
        icon: BarChart3,
        text: language === 'ar' 
          ? 'اعرض لي تقدم التحول ��لرقمي'
          : 'Show me digital transformation progress',
      },
      {
        icon: Table,
        text: language === 'ar'
          ? 'قائمة الجهات الحكومية وحالة التحول'
          : 'List government entities and transformation status',
      },
      {
        icon: FileText,
        text: language === 'ar'
          ? 'أنشئ تقرير الربع الرابع 2024'
          : 'Generate Q4 2024 report',
      },
      {
        icon: MessageSquare,
        text: language === 'ar'
          ? 'أخبرني عن إطار حوكمة الذكاء الاصطناعي'
          : 'Tell me about the AI governance framework',
      },
    ],
  };

  const hasMessages = displayMessages.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        backgroundColor: 'rgb(249, 250, 251)',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
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
          <div
            style={{
              margin: '0 auto',
              width: '100%',
              maxWidth: '1100px',
              padding: '32px 24px',
            }}
          >
            {!hasMessages ? (
              /* Welcome Screen */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '60vh',
                }}
              >
                {onToggleCanvas && (
                  <div
                    style={{
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      overflow: 'auto',
                    }}
                  >
                    <button
                      onClick={onToggleCanvas}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                        borderRadius: '8px',
                        fontFamily: 'Arial',
                        fontWeight: '600',
                        height: '40px',
                        justifyContent: 'center',
                        transitionDuration: '0.2s',
                        width: '40px',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title={language === 'ar' ? 'تبديل اللوحة' : 'Toggle canvas'}
                    >
                      <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F8943a0e6569a48b6be2490eb6f9c1034" alt="Toggle canvas" className="sidebar-quickaction-icon" style={{ borderRadius: 2 }} />
                    </button>
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
                  <div
                    style={{
                      marginBottom: '24px',
                      height: '64px',
                      width: '64px',
                      borderRadius: '16px',
                      backgroundColor: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: "url('https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Fefbe50adfc8743cfa8a2c93570680bae')",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  />

                  <h1
                    style={{
                      marginBottom: '8px',
                      fontSize: '24px',
                      fontWeight: '600',
                      color: 'rgba(26, 36, 53, 1)',
                    }}
                  >
                    {translations.welcomeTitle}
                  </h1>
                  <p
                    style={{
                      color: 'rgba(107, 114, 128, 1)',
                      marginBottom: '32px',
                      maxWidth: '448px',
                    }}
                  >
                    {translations.welcomeSubtitle}
                  </p>

                  {/* Example Prompts */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '800px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'rgba(107, 114, 128, 1)',
                        marginBottom: '16px',
                      }}
                    >
                      {translations.examplesTitle}
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      {translations.examples.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => onSendMessage(example.text)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            borderRadius: '8px',
                            border: '1px solid rgb(229, 231, 235)',
                            backgroundColor: 'rgb(255, 255, 255)',
                            padding: '16px',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(26, 36, 53, 0.3)';
                            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(26, 36, 53, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgb(229, 231, 235)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <example.icon
                            style={{
                              marginTop: '2px',
                              height: '20px',
                              width: '20px',
                              flexShrink: 0,
                              color: 'rgba(107, 114, 128, 1)',
                              transition: 'color 0.2s ease',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '14px',
                              color: 'rgba(26, 36, 53, 1)',
                            }}
                          >
                            {example.text}
                          </span>
                        </button>
                      ))}
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
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isUser={message.role === 'user'}
                    language={language}
                    showAvatar={true}
                    onCopy={() => {
                      // Copy handled internally in MessageBubble
                    }}
                    onFeedback={(isPositive) => {

                    }}
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
          language={language}
        />
      </div>
    </div>
  );
}
