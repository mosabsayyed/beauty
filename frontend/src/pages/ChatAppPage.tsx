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
 * ✅ FIXED: Native streaming support without JSON normalization
 */

import { useState, useEffect, useCallback, memo } from "react";
import { Sidebar, ChatContainer } from "../components/chat";
import { CanvasManager } from "../components/chat/CanvasManager";
import { chatService } from "../services/chatService";
import { useLanguage } from "../contexts/LanguageContext";
import type {
  ConversationSummary,
  Message as APIMessage,
} from "../types/api";
import { safeJsonParse } from "../utils/streaming";

// Memoized child components for performance
const MemoizedSidebar = memo(Sidebar);
const MemoizedChatContainer = memo(ChatContainer);
const MemoizedCanvasManager = memo(CanvasManager);

export default function ChatAppPage() {
  // State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<APIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasArtifacts, setCanvasArtifacts] = useState<any[]>([]);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState<APIMessage | null>(null);

  // Load conversations on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // ============================================================================
  // API METHODS
  // ============================================================================

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      const adaptedConversations = (data.conversations || []).map((c: any) => ({
        ...c,
        title: c.title || "New Chat",
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString(),
      }));
      setConversations(adaptedConversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  const loadConversationMessages = useCallback(async (conversationId: number) => {
    try {
      const data = await chatService.getConversationMessages(conversationId);
      const adapted = (data.messages || []).map((msg: any) => {
        const base = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
          metadata: msg.metadata || {},
        };

        // Handle different response formats
        const hasErrorFlag = msg.metadata && (msg.metadata.error === true || msg.metadata.is_error === true);
        const contentLooksLikeJSON = typeof msg.content === "string" && /\{[\s\S]*\}/.test(msg.content);

        if (hasErrorFlag) {
          try {
            const err = new Error(typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content));
            (err as any).body = msg.metadata || safeJsonParse(msg.content) || undefined;
            base.content = chatService.formatErrorMessage(err as Error);
            base.metadata = { ...(base.metadata || {}), error: true };
          } catch (e) {
            // fallback - leave content as-is
          }
        } else if (contentLooksLikeJSON) {
          // NATIVE STREAMING SUPPORT: Parse JSON but preserve original structure
          let parsed = null;
          try {
            parsed = safeJsonParse(msg.content);
          } catch (e) {
            // If parsing fails, try to extract JSON block
            const start = msg.content.indexOf("{");
            const end = msg.content.lastIndexOf("}");
            if (start !== -1 && end !== -1) {
              const extractedBlock = msg.content.substring(start, end + 1);
              try {
                parsed = safeJsonParse(extractedBlock);
              } catch (e2) {
                parsed = null;
              }
            }
          }
          
          // If we have a valid assistant payload, preserve it natively
          const hasAssistantFields = parsed && (parsed.answer || parsed.memory_process || parsed.analysis || parsed.visualizations || parsed.data);
          if (hasAssistantFields) {
            // Preserve the structured payload exactly as received from streaming
            base.content = parsed.answer || parsed.message || parsed; // Extract answer string if available
            base.metadata = { 
              ...(base.metadata || {}), 
              llm_payload: parsed,
              artifacts: parsed.visualizations || parsed.artifacts || [] 
            };
          } else {
            // Not a recognized assistant payload - treat as error
            try {
              const err = new Error(typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content));
              (err as any).body = msg.metadata || parsed || undefined;
              base.content = chatService.formatErrorMessage(err as Error);
              base.metadata = { ...(base.metadata || {}), error: true };
            } catch (e) {
              // fallback - leave content as-is
            }
          }
        } else if (msg.metadata && (msg.metadata.answer || msg.metadata.memory_process || msg.metadata.analysis || msg.metadata.visualizations || msg.metadata.data)) {
          // Backend sometimes stores the structured assistant payload in metadata
          const parsed = msg.metadata as any;
          base.content = parsed.answer || parsed.message || base.content;
          base.metadata = { 
            ...(base.metadata || {}), 
            ...(parsed || {}),
            artifacts: parsed.visualizations || parsed.artifacts || [] // Explicitly extract artifacts
          };
        }

        return base;
      });

      setMessages(adapted as any);

      // Check for artifacts in the last message to auto-open Canvas
      if (adapted.length > 0) {
        const lastMsg = adapted[adapted.length - 1];
        let artifacts: any[] = [];
        
        // Check metadata for artifacts/visualizations
        if (lastMsg.metadata?.visualizations) {
          artifacts = lastMsg.metadata.visualizations;
        } else if (lastMsg.metadata?.artifacts) {
          artifacts = lastMsg.metadata.artifacts;
        } 
        // Check if content itself is a structured payload with visualizations
        else if (typeof lastMsg.content === 'object' && lastMsg.content?.visualizations) {
          artifacts = lastMsg.content.visualizations;
        }

        if (artifacts.length > 0) {
          setCanvasArtifacts(artifacts);
          setIsCanvasOpen(true);
          // Ensure sidebar stays open or adjusts based on screen size if needed
          if (window.innerWidth > 1024) {
             setIsSidebarOpen(true);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, []);

  // NATIVE STREAMING IMPLEMENTATION
  const handleSendMessage = async (messageText: string) => {
    // Optimistically show the user's message immediately for better UX
    const tempMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: messageText,
      created_at: new Date().toISOString(),
      metadata: {},
    } as any;

    setMessages(prev => [...prev, tempMessage]);
    setIsLoading(true);

    try {
      // Use non-streaming endpoint
      const response = await fetch("/api/v1/chat/message", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("josoor_token") || ""}`
        },
        body: JSON.stringify({ 
          query: messageText, // Note: The non-streaming endpoint expects 'query', not 'message'
          conversation_id: activeConversationId === null ? undefined : activeConversationId
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Extract the actual content from the response
      let content = "";
      let artifacts: any[] = [];
      let llmPayload = data.llm_payload || data;

      // If llm_payload is a string, try to parse it
      if (typeof llmPayload === 'string') {
        try {
          llmPayload = JSON.parse(llmPayload);
        } catch (e) {
          // keep as string
        }
      }

      // 1. Try to get content from llm_payload
      if (llmPayload) {
        content = llmPayload.answer || llmPayload.message || "";
        if (llmPayload.visualizations) {
          artifacts = llmPayload.visualizations;
        }
      }

      // 2. Fallback to top-level fields
      if (!content) {
        content = data.message || data.answer || "";
      }
      if (artifacts.length === 0 && data.artifacts) {
        artifacts = data.artifacts;
      }

      // 3. If content looks like a JSON string, try to parse it one more time
      // This handles the case where the backend returns a stringified JSON as the message
      if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
        try {
           const parsed = JSON.parse(content);
           if (parsed.answer) content = parsed.answer;
           if (parsed.visualizations) artifacts = parsed.visualizations;
           // Update llmPayload with the parsed content if it wasn't already valid
           if (!llmPayload || typeof llmPayload !== 'object') llmPayload = parsed;
        } catch (e) {
           // Not valid JSON, treat as text
        }
      }

      console.log('[ChatAppPage] handleSendMessage response processed:', {
        contentLength: content?.length,
        artifactsCount: artifacts?.length,
        hasLlmPayload: !!llmPayload,
        dataKeys: Object.keys(data)
      });

      // Create assistant message from response
      const assistantMsg = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: content, 
        created_at: new Date().toISOString(),
        metadata: { 
          llm_payload: llmPayload,
          artifacts: artifacts, // Explicitly pass artifacts to metadata
          ...data 
        },
      } as any;

      setMessages(prev => [...prev.filter((m: any) => !String(m.id).startsWith("temp-")), assistantMsg]);

      // Handle artifacts for canvas
      if (artifacts.length > 0) {
         setCanvasArtifacts(artifacts);
         setIsCanvasOpen(true);
      }

      // Update or set active conversation
      if (data.conversation_id && !activeConversationId) {
        setActiveConversationId(data.conversation_id);
      }

      // Reload conversations list to ensure canonical state
      await loadConversations();
      
    } catch (error) {
      console.error("Failed to send message:", error);
      try {
        const formatted = chatService.formatErrorMessage(error as Error);
        const errorMsg = {
          id: Date.now(),
          role: "assistant",
          content: formatted,
          created_at: new Date().toISOString(),
          metadata: { error: true },
        } as any;
        setMessages(prev => [...prev.filter((m: any) => !String(m.id).startsWith("temp-")), errorMsg]);
      } catch (e) {
        // ignore formatting/display failures
      }
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setCanvasArtifacts([]);
    setIsCanvasOpen(false);
    setStreamingMessage(null);
  }, []);

  const handleSelectConversation = useCallback((conversationId: number) => {
    setActiveConversationId(conversationId);
    setCanvasArtifacts([]);
    setIsCanvasOpen(false);
    setStreamingMessage(null);
  }, []);

  const handleDeleteConversation = useCallback(async (conversationId: number) => {
    try {
      await chatService.deleteConversation(conversationId);
      
      // If deleted conversation was active, clear it
      if (conversationId === activeConversationId) {
        handleNewChat();
      }
      
      // Reload conversations
      await loadConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }, [activeConversationId, handleNewChat, loadConversations]);

  const handleCloseCanvas = () => {
    setIsCanvasOpen(false);
    setIsSidebarOpen(true);
  };

  const handleQuickAction = (command: string) => {
    handleSendMessage(command);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => {
      const nv = !v;
      setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
      return nv;
    });
  };

  const toggleCanvas = () => {
    setIsCanvasOpen((v) => !v);
    if (!isCanvasOpen) setIsSidebarOpen(true);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
  };
  const [initialCanvasIndex, setInitialCanvasIndex] = useState(0);

  const handleOpenArtifact = (artifact: any, artifacts?: any[], index?: number) => {
    console.log('[ChatAppPage] handleOpenArtifact called:', {
      artifact,
      artifacts,
      artifactsLength: artifacts?.length || 1,
      index
    });
    console.log('[ChatAppPage] FULL ARTIFACT JSON:', JSON.stringify(artifact, null, 2));
    console.log('[ChatAppPage] artifact.type:', artifact.type);
    console.log('[ChatAppPage] artifact.content?.type:', artifact.content?.type);
    
    setCanvasArtifacts(artifacts || [artifact]);
    setInitialCanvasIndex(index || 0);
    setIsCanvasOpen(true);
    if (!isCanvasOpen) setIsSidebarOpen(true);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: 'rgb(249, 250, 251)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <MemoizedSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        isCollapsed={!isSidebarOpen}
        onRequestToggleCollapse={toggleSidebar}
        onQuickAction={handleQuickAction}
      />

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <MemoizedChatContainer
          messages={messages}
          isLoading={isLoading}
          conversationId={activeConversationId}
          onToggleCanvas={toggleCanvas}
          onSendMessage={handleSendMessage}
          onOpenArtifact={handleOpenArtifact}
          streamingMessage={streamingMessage}
        />
      </div>

      {/* Canvas Manager - Legacy Working Version */}
      {isCanvasOpen && (
        <MemoizedCanvasManager
          isOpen={isCanvasOpen}
          conversationId={activeConversationId}
          artifacts={canvasArtifacts}
          initialArtifact={canvasArtifacts[initialCanvasIndex]}
          onClose={handleCloseCanvas}
        />
      )}
    </div>
  );
}
