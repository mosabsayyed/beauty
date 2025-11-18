/**
 * ChatAppPage - Main Chat Application
 * 
 * Three-column layout (Claude-style):
 * - Left: Sidebar (conversations, account) - slides in/out with thin bar remaining
 * - Center: Chat interface
 * - Right: Canvas panel (artifacts, slide-out)
 * 
 * ✅ FIXED: Integrates all Phase 2 components with REAL BACKEND API (chatService)
 * ✅ FIXED: Implements proper Claude-style slide functionality
 */

import { useState, useEffect } from 'react';
import { Sidebar, ChatContainer, CanvasPanel } from '../components/chat';
import { chatService } from '../services/chatService';
import { getUser } from '../services/authService';
import type {
  ConversationSummary,
  Message as APIMessage,
  Artifact,
  ChatMessageRequest,
} from '../types/api';

interface ChatAppPageProps {
  language?: 'en' | 'ar';
}

export default function ChatAppPage({ language = 'en' }: ChatAppPageProps) {
  // State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<APIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasArtifacts, setCanvasArtifacts] = useState<Artifact[]>([]);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // ============================================================================
  // API INTERACTIONS (USING REAL BACKEND)
  // ============================================================================

  const loadConversations = async () => {
    try {
      // Use authenticated user id when available, fallback to demo user_id=1
      const currentUser = getUser();
      const userId = currentUser && currentUser.id ? currentUser.id : 1;
      const response = await chatService.getConversations(userId);
      // Adapt backend Conversation type to frontend ConversationSummary
      const adapted = response.conversations.map(conv => ({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        message_count: conv.message_count || 0,
        created_at: conv.created_at || new Date().toISOString(),
        updated_at: conv.updated_at || new Date().toISOString(),
      }));
      setConversations(adapted);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    try {
      const response = await chatService.getConversationMessages(conversationId);

      // Helper: robustly parse nested or double-escaped JSON strings into objects
      const tryParseJSON = (v: any, maxDepth = 10) => {
        if (v === null || v === undefined) return null;
        if (typeof v === 'object') return v;
        if (typeof v !== 'string') return null;

        const unescapeCommon = (s: string) => String(s).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
        const extractJsonSubstrings = (s: string) => {
          const matches: string[] = [];
          const re = /\{[\s\S]*?\}/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(s)) !== null) matches.push(m[0]);
          return matches;
        };

        let candidate: any = v;
        for (let depth = 0; depth < maxDepth; depth++) {
          if (typeof candidate !== 'string') return candidate;
          try {
            const parsed = JSON.parse(candidate);
            candidate = parsed;
            if (typeof candidate !== 'string') return candidate;
            continue;
          } catch (e) {
            const stripped = String(candidate).replace(/^\s*"([\s\S]*)"\s*$/,'$1');
            if (stripped !== candidate) candidate = stripped;
            const un = unescapeCommon(candidate);
            if (un !== candidate) candidate = un;
            const subs = extractJsonSubstrings(candidate);
            if (subs.length > 0) {
              for (const sub of subs) {
                try { return JSON.parse(sub); } catch (_) {
                  try { return JSON.parse(unescapeCommon(sub)); } catch (_) {}
                }
              }
              candidate = subs[0];
              continue;
            }
            return null;
          }
        }
        if (typeof candidate === 'string') {
          try { return JSON.parse(candidate); } catch (_) { return null; }
        }
        return candidate;
      };

      // Adapt backend ChatMessage to frontend Message (timestamp → created_at)
      const adapted = response.messages.map(msg => {
        const base: any = {
          id: msg.id ? parseInt(msg.id as string) : 0,
          role: msg.role,
          content: msg.content,
          created_at: msg.timestamp || new Date().toISOString(),
          metadata: msg.metadata,
        };

        // If this message looks like an error (either metadata.error or contains JSON/error text), format it for display
        const hasErrorFlag = msg.metadata && (msg.metadata.error === true || msg.metadata.is_error === true);
        const contentLooksLikeJSON = typeof msg.content === 'string' && /\{[\s\S]*\}/.test(msg.content);

        if (hasErrorFlag || contentLooksLikeJSON) {
          try {
            const err = new Error(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
            // Attach body from metadata if available, otherwise attempt to parse JSON from content
            (err as any).body = msg.metadata || tryParseJSON(msg.content) || undefined;
            base.content = chatService.formatErrorMessage(err as Error);
            base.metadata = { ...(base.metadata || {}), error: true };
          } catch (e) {
            // fallback - leave content as-is
          }
        }

        return base;
      });

      setMessages(adapted as any);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    // Optimistically show the user's message immediately for better UX
    const tempMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
      metadata: {},
    } as any;

    setMessages(prev => [...prev, tempMessage]);
    setIsLoading(true);

    try {
      // Convert null to undefined for backend API
      const request = {
        query: messageText,
        conversation_id: activeConversationId === null ? undefined : activeConversationId,
      };

      const response = await chatService.sendMessage(request as any);

      // Update or set active conversation
      if (!activeConversationId) {
        setActiveConversationId(response.conversation_id);
      }

      // Reload conversations list and messages from server to ensure canonical state
      await loadConversations();
      await loadConversationMessages(response.conversation_id);

      // Handle artifacts
      if (response.artifacts && response.artifacts.length > 0) {
        setCanvasArtifacts(response.artifacts);
        setIsCanvasOpen(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      try {
        const formatted = chatService.formatErrorMessage(error as Error);
        const errorMsg = {
          id: Date.now(),
          role: 'assistant',
          content: formatted,
          created_at: new Date().toISOString(),
          metadata: { error: true },
        } as any;
        setMessages(prev => [...prev.filter((m: any) => !String(m.id).startsWith('temp-')), errorMsg]);
      } catch (e) {
        // ignore formatting/display failures
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setCanvasArtifacts([]);
    setIsCanvasOpen(false);
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    setCanvasArtifacts([]);
    setIsCanvasOpen(false);
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await chatService.deleteConversation(conversationId);
      
      // If deleted conversation was active, clear it
      if (conversationId === activeConversationId) {
        handleNewChat();
      }
      
      // Reload conversations
      await loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleCloseCanvas = () => {
    setIsCanvasOpen(false);
    setIsCanvasExpanded(false);
    setIsSidebarOpen(true);
  };

  const handleQuickAction = (command: string) => {
    handleSendMessage(command);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => {
      const nv = !v;
      setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
      return nv;
    });
  };

  const toggleCanvas = () => {
    setIsCanvasExpanded(false);
    setIsCanvasOpen(prev => !prev);
  };


  // ============================================================================
  // RENDER
  // ============================================================================

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const conversationTitle = activeConversation?.title;

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'rgb(249, 250, 251)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        position: 'relative',
      }}
    >
      {/* Sidebar - Slides in/out from left */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: 'rgb(255, 255, 255)',
          borderRight: '1px solid rgb(229, 231, 235)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 30,
          width: isSidebarOpen ? '280px' : '64px',
        }}
      >
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onQuickAction={handleQuickAction}
          isCollapsed={!isSidebarOpen}
          onRequestToggleCollapse={toggleSidebar}
          language={language}
        />
      </div>

      {/* Main Chat Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: 'rgb(255, 255, 255)',
          minWidth: 0,
          zIndex: 20,
        }}
      >
        <ChatContainer
          conversationId={activeConversationId}
          conversationTitle={conversationTitle}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          language={language}
          onToggleSidebar={toggleSidebar}
          onToggleCanvas={toggleCanvas}
          onOpenArtifact={(artifact, artifacts) => {
            // When clicking an artifact in the message, open all artifacts in the canvas if provided
            if (artifacts && artifacts.length > 0) {
              setCanvasArtifacts(artifacts);
            } else if (artifact) {
              setCanvasArtifacts([artifact]);
            }
            setIsCanvasOpen(true);
            setIsCanvasExpanded(false);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
          }}
        />
      </div>

      {/* Canvas Panel - Right column that squeezes the chat area */}
      <div
        style={{
          flexShrink: 0,
          height: '100vh',
          backgroundColor: 'rgb(255, 255, 255)',
          borderLeft: '1px solid rgb(229, 231, 235)',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease',
          width: isCanvasOpen ? (isCanvasExpanded ? '840px' : '420px') : '0px',
          overflow: isCanvasOpen ? 'auto' : 'hidden',
          zIndex: 30,
          display: isCanvasOpen ? 'flex' : 'none',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <CanvasPanel
          artifacts={canvasArtifacts}
          isOpen={isCanvasOpen}
          onClose={handleCloseCanvas}
          language={language}
          inline={true}
          isExpanded={isCanvasExpanded}
          onToggleExpand={(val: boolean) => {
            if (val) {
              // Expand canvas to double size, keep layout responsive (pushes chat)
              setIsCanvasExpanded(true);
              setIsCanvasOpen(true);
              // keep sidebar state as-is
              setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
            } else {
              setIsCanvasExpanded(false);
              setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
            }
          }}
        />
      </div>
    </div>
  );
}
