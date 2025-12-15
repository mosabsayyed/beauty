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

import { useState, useEffect, useCallback, memo, useContext, useRef } from "react";
import { useBlocker, useLocation, UNSAFE_DataRouterContext as DataRouterContext } from 'react-router-dom';
import { Sidebar, ChatContainer } from "../components/chat";
import { CanvasManager } from "../components/chat/CanvasManager";
import { chatService } from "../services/chatService";
import * as authService from '../services/authService';
// import { useLanguage } from "../contexts/LanguageContext"; // not used in this page
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type {
  ConversationSummary,
  Message as APIMessage,
} from "../types/api";
import { safeJsonParse } from "../utils/streaming";


import TwinKnowledge from '../components/content/TwinKnowledge';
import { TwinKnowledgeRenderer } from '../components/chat/renderers/TwinKnowledgeRenderer'; // Import added
import PlanYourJourney from '../components/content/PlanYourJourney';
import ProductRoadmap from '../components/content/ProductRoadmap';

import { LANDING_PAGES } from '../data/landingPages';

// ... (rest of imports)

// ... (inside handleQuickAction)



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

  const auth = useAuth();
  const { language } = useLanguage();
  const dataRouterCtx = useContext(DataRouterContext as any);
  const isDataRouter = !!(dataRouterCtx && (dataRouterCtx as any).router);
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);
  useEffect(() => { currentPathRef.current = location.pathname; }, [location.pathname]);

  // Track if we have performed the initial auto-selection of the most recent conversation
  const hasAutoSelectedRef = useRef(false);
  // Determine whether to block internal navigation (SPA) when guest has history
  // Use state so we can update on auth/localStorage events and re-run effects that register/unregister handlers.
  const [guestHasHistory, setGuestHasHistory] = useState<boolean>(() => {
    try {
      return authService.isGuestMode() && (authService.getGuestConversations() || []).length > 0;
    } catch (e) {
      return false;
    }
  });
  // Diagnostics - helpful when trying to reproduce beforeunload/confirm issues
  useEffect(() => {

  }, [guestHasHistory]);

  // Keep guestHasHistory in sync with localStorage/auth changes – this ensures beforeunload and other
  // navigation guards are registered/unregistered in reaction to guest state changes.
  useEffect(() => {
    const handler = () => {
      try {
        const val = authService.isGuestMode() && (authService.getGuestConversations() || []).length > 0;
        setGuestHasHistory(Boolean(val));

      } catch (e) {
        setGuestHasHistory(false);
      }
    };

    window.addEventListener('josoor_auth_change', handler as EventListener);
    window.addEventListener('storage', handler as EventListener);
    // Also update once on mount in case state changed since initial render
    handler();

    return () => {
      window.removeEventListener('josoor_auth_change', handler as EventListener);
      window.removeEventListener('storage', handler as EventListener);
    };
  }, []);

  // (initial load effect moved down below to ensure loadConversations is defined)

  // The data-router context is available only when using a Data Router
  // (createBrowserRouter / RouterProvider). The useBlocker hook requires that
  // context. To avoid runtime errors when the app uses a non-Data Router
  // (e.g., BrowserRouter), we render a small child component that uses
  // useBlocker only if the Data Router context is present.
  function RouterBlocker() {
    // Only render the inner blocker if we detected a Data Router at top-level
    if (!isDataRouter) return null;
    return <RouterBlockerInner when={guestHasHistory} />;
  }

  function RouterBlockerInner({ when }: { when: boolean }) {
    // This hook is safe to call only when inside a Data Router context (hence why
    // we're calling it from a component that's only rendered when the context exists).
    const blocker = useBlocker(when);
    useEffect(() => {
      if (blocker.state === 'blocked') {
        const promptMsg = 'If you leave now you will lose your guest conversation history and artifacts. Are you sure?';

        const proceed = window.confirm(promptMsg);
        if (proceed) {
          setTimeout(() => blocker.proceed(), 0);

        } else {
          blocker.reset();

        }
      }
    }, [blocker]);

    return null;
  }

  // NOTE: SPA navigation blocking is handled inside `RouterBlocker` which
  // is only mounted when a Data Router is available. This avoids runtime
  // errors when the app uses a BrowserRouter (non-data router).

  useEffect(() => {
    if (auth.user) {
      // Prefer the current guest conversations; fallback to backup in case they were cleared
      let guestConvos = authService.getGuestConversations();
      if (!guestConvos || guestConvos.length === 0) {
        try {
          const raw = localStorage.getItem('josoor_guest_conversations_backup');
          guestConvos = raw ? JSON.parse(raw) : [];
        } catch (e) {
          guestConvos = [];
        }
      }
      if (guestConvos && guestConvos.length > 0) {
        // Prompt the user to migrate guest history to their account
        const migrate = window.confirm('You used the app as a guest and have local history. Do you want to migrate this history to your account?');
        if (migrate) {
          (async () => {
            try {
              for (const g of guestConvos) {
                // Use first user message to create conversation with backend
                const firstUser = (g.messages || []).find((m: any) => m.role === 'user');
                if (!firstUser) continue;
                const createResp = await chatService.sendMessage({ query: firstUser.content, conversation_id: undefined });
                const newConvoId = createResp.conversation_id;
                // Add the rest of the messages (starting from the second)
                for (const msg of (g.messages || []).slice(1)) {
                  if (!newConvoId) break;
                  await chatService.addConversationMessage(newConvoId, msg.role, msg.content, msg.metadata || {});
                }
              }
              // Clear guest conversations after successful migration
              authService.clearGuestConversations();
              // Also clear backups, if present
              try { localStorage.removeItem('josoor_guest_conversations_backup'); localStorage.removeItem('josoor_guest_id_backup'); } catch (e) {}
              // Reload conversations
              await loadConversations();
            } catch (err) {

            }
          })();
        }
      }
    }
  }, [auth.user]);

  // Fallback for BrowserRouter (where useBlocker/data router is not available):
  // intercept internal anchor clicks and popstate to prevent losing guest data.
  useEffect(() => {
    if (isDataRouter || !guestHasHistory) return;
    const promptMsg = 'If you leave now you will lose your guest conversation history and artifacts. Are you sure?';

    const handleAnchorClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement;
        if (!target) return;
        const anchor = target.closest && (target.closest('a') as HTMLAnchorElement | null);
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (!href) return;
        const isInternal = href.startsWith('/') && !href.startsWith('//');
        if (!isInternal) return;
        if (!window.confirm(promptMsg)) {
          e.preventDefault();
          e.stopPropagation();
        }
      } catch (err) {
        // ignore
      }
    };

    const handlePopState = () => {
      if (!window.confirm(promptMsg)) {
        window.history.pushState(null, '', currentPathRef.current);
      }
    };


    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('popstate', handlePopState);

    };
  }, [isDataRouter, guestHasHistory, location.pathname]);

  // beforeunload prompt for guests who have local history -- guard against closing/refreshing the tab
  useEffect(() => {
    if (!guestHasHistory) return;
    const handler = (e: BeforeUnloadEvent) => {
      // Standard cross-browser approach: set returnValue to a non-empty string
      const message = 'If you leave now you will lose your guest conversation history and artifacts. Are you sure?';
      e.preventDefault();
      // Most browsers ignore the custom message but the presence of returnValue triggers the confirm dialog
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handler);

    return () => {
      window.removeEventListener('beforeunload', handler);

    };
  }, [guestHasHistory]);
              const loadConversations = useCallback(async () => {
                try {

                    // If guest mode, use localStorage first
                    if (authService.isGuestMode()) {
                      const guestConvos = authService.getGuestConversations();

                      const adaptedConversations = (guestConvos || []).map((c: any) => ({
                        id: c.id,
                        title: c.title || 'New Chat',
                        message_count: (c.messages || []).length,
                        created_at: c.created_at || new Date().toISOString(),
                        updated_at: c.updated_at || new Date().toISOString(),
                        _isGuest: true,
                      }));

                        setConversations(adaptedConversations as any);
                      return;
                    }

                    // If there's no token, treat as guest and avoid server call
                    if (!authService.getToken()) {
                      const guestConvos = authService.getGuestConversations();

                      const adaptedConversations = (guestConvos || []).map((c: any) => ({
                        id: c.id,
                        title: c.title || 'New Chat',
                        message_count: (c.messages || []).length,
                        created_at: c.created_at || new Date().toISOString(),
                        updated_at: c.updated_at || new Date().toISOString(),
                        _isGuest: true,
                      }));

                      setConversations(adaptedConversations as any);
                      return;
                    }

                    // Otherwise call the server API
                    const data = await chatService.getConversations();
                    try {


                    } catch (e) {

                    }
                    const adaptedConversations = (data.conversations || []).map((c: any) => ({
                      ...c,
                      title: c.title || "New Chat",
                      // Prefer actual messages array length when available; fall back to server-provided message_count.
                      message_count: Array.isArray(c.messages) ? c.messages.length : (typeof c.message_count === 'number' ? c.message_count : 0),
                      created_at: c.created_at || new Date().toISOString(),
                      updated_at: c.updated_at || new Date().toISOString(),
                    }));
                    try {

                    } catch (e) {

                    }
                    setConversations(adaptedConversations);
                } catch (error) {

                  // If the call failed due to not-authenticated, fall back to guest convos
                  try {
                    const guestConvos = authService.getGuestConversations();
                    if (guestConvos && guestConvos.length > 0) {
                      const adaptedConversations = (guestConvos || []).map((c: any) => ({
                        id: c.id,
                        title: c.title || 'New Chat',
                        message_count: (c.messages || []).length,
                        created_at: c.created_at || new Date().toISOString(),
                        updated_at: c.updatedAt || new Date().toISOString(),
                        _isGuest: true,
                      }));
                      setConversations(adaptedConversations as any);

                      return;
                    }
                  } catch (err) {

                  }
                }
              }, [guestHasHistory]);

  const loadConversationMessages = useCallback(async (conversationId: number) => {
    try {
      // If this is a guest conversation (guest convos have negative ids or flagged), load from localStorage
      if (authService.isGuestMode()) {
        const guestConvos = authService.getGuestConversations();
        const g = guestConvos.find((c: any) => c.id === conversationId);
        if (g) {
          setMessages(g.messages || []);
          return;
        }
      }
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
        } else if (msg.metadata && (msg.metadata.answer || msg.metadata.memory_process || msg.metadata.analysis || msg.metadata.visualizations || msg.metadata.data)) {
          // Backend sometimes stores the structured assistant payload in metadata
          const parsed = msg.metadata as any;
          // FIX: Ensure content is a string. If answer/message are missing/empty, fallback to thought or stringified JSON.
          // Do NOT set base.content to 'parsed' (object) as MessageBubble may fail to render it.
          base.content = parsed.answer || parsed.message || parsed.thought || JSON.stringify(parsed, null, 2);
          
          base.metadata = { 
            ...(base.metadata || {}), 
            ...(parsed || {}),
            artifacts: parsed.visualizations || parsed.artifacts || [] // Explicitly extract artifacts
          };
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
           const hasAssistantFields = parsed && (parsed.answer !== undefined || parsed.message !== undefined || parsed.thought !== undefined || parsed.visualizations);
           if (hasAssistantFields) {
             // FIX: Ensure content is a string. If answer/message are missing/empty, fallback to thought or stringified JSON.
             base.content = parsed.answer || parsed.message || parsed.thought || JSON.stringify(parsed, null, 2);
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
        }

        return base;
      });

      setMessages(adapted as any);

      
      // Auto-open canvas logic removed to prevent unwanted behavior on history load.
      // If the user wants to view an artifact, they can open it from the message bubble or it will render inline.
    } catch (error) {

    }
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadConversationMessages]);

  // Load conversation list on mount and whenever auth state changes
  useEffect(() => {
    (async () => {
      try {
        await loadConversations();
      } catch (e) {

      }
    })();
  }, [auth.user, auth.token, loadConversations]);

  // Auto-select most recent conversation ONLY on initial load
  useEffect(() => {
    if (!hasAutoSelectedRef.current && !activeConversationId && conversations.length > 0) {
      // Mark as selected so we don't do it again when user clicks "New Chat" (which sets activeId to null)
      hasAutoSelectedRef.current = true;
      
      // Use a timeout to avoid immediate state updates during render
      const timer = setTimeout(() => {
        setActiveConversationId(conversations[0].id as number);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [conversations, activeConversationId]);

  // NATIVE STREAMING IMPLEMENTATION
  const handleSendMessage = useCallback(async (messageText: string, options?: { push_to_graph_server?: boolean; suppress_canvas_auto_open?: boolean }) => {
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
      // If the user is anonymous (no token) but hasn't started a guest session, start one
      if (!authService.getToken() && !authService.isGuestMode()) {
        try {

          await authService.startGuestSession();
        } catch (e) {

        }
      }
      // If guest mode, ensure a guest conversation exists and persist messages locally
      if (authService.isGuestMode()) {
        try {
          const guestConvos = authService.getGuestConversations();
          let convo = guestConvos.find((c: any) => c.id === activeConversationId);
          if (!convo) {
            // Create a new guest conversation with a negative id
            const nextId = (guestConvos.reduce((min: number, c: any) => Math.min(min, c.id || 0), 0) - 1) || -1;
            convo = { id: nextId, title: messageText?.slice(0, 50) || 'Guest conversation', messages: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            guestConvos.unshift(convo);
            // Set as active conversation in the UI
            setActiveConversationId(convo.id);
          }

          // Save the user message locally
          const userMsg = {
            id: `guest-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            conversation_id: convo.id,
            role: 'user',
            content: messageText,
            created_at: new Date().toISOString(),
            metadata: {},
          };
          convo.messages.push(userMsg);
          convo.updated_at = new Date().toISOString();
          authService.saveGuestConversations(guestConvos);

          // Now let backend process (unauthenticated) for the actual assistant response
        } catch (e) {

        }
      }
      // Prepare payload
      const token = authService.getToken();
      const basics: any = { 
        query: messageText, 
        conversation_id: activeConversationId === null ? undefined : activeConversationId,
        push_to_graph_server: options?.push_to_graph_server
      };
      // If guest mode, include conversation history so the backend can respond with context
      if (authService.isGuestMode()) {
        try {
          const guestConvos = authService.getGuestConversations();
          const c = guestConvos.find((x: any) => x.id === (activeConversationId as number));
          if (c) {
            basics.history = (c.messages || []).map((m: any) => ({ role: m.role, content: m.content }));
          }
        } catch (e) {
          // ignore
        }
      }
      // Use non-streaming endpoint
      const response = await fetch("/api/v1/chat/message", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(basics),
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
        content = llmPayload.answer || llmPayload.message || llmPayload.thought || "";
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

      // 4. Final Fallback: If content is still empty but we have a payload, stringify it
      if (!content && llmPayload && typeof llmPayload === 'object') {
         content = JSON.stringify(llmPayload, null, 2);
      }



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

      setMessages(prev => {
        // Keep the user message, update ID to avoid "temp-" prefix so it persists
        const updatedPrev = prev.map((m: any) => {
           if (m.id === tempMessage.id) {
              return { ...m, id: `sent-${Date.now()}` }; 
           }
           return m;
        });
        return [...updatedPrev, assistantMsg];
      });

      // If guest mode, append assistant message to guest convo local storage too
      if (authService.isGuestMode()) {
        try {
          const guestConvos = authService.getGuestConversations();
          const convo = guestConvos.find((c: any) => c.id === activeConversationId);
          if (convo) {
            const assistantLocal = {
              id: `guest-${Date.now()}-${Math.floor(Math.random()*1000)}`,
              conversation_id: convo.id,
              role: 'assistant',
              content: assistantMsg.content,
              created_at: assistantMsg.created_at,
              metadata: assistantMsg.metadata,
            };
            convo.messages.push(assistantLocal);
            convo.updated_at = new Date().toISOString();
            authService.saveGuestConversations(guestConvos);
          }
        } catch (e) {

        }
      }

      // Handle artifacts for canvas
      console.log('[handleSendMessage] Artifacts check:', { 
        count: artifacts.length, 
        pushToGraph: options?.push_to_graph_server,
        options,
        backendDebug: data.graph_server_debug // Log debug info from backend
      });
      
      if (artifacts.length > 0 && !options?.push_to_graph_server && !options?.suppress_canvas_auto_open) {
         console.log('[handleSendMessage] Opening canvas for artifacts');
         setCanvasArtifacts(artifacts);
         setIsCanvasOpen(true);
      } else {
         console.log('[handleSendMessage] Skipping canvas open (pushing to graph server, suppressed, or no artifacts)');
      }

      // Update or set active conversation
      if (data.conversation_id && !activeConversationId) {
        setActiveConversationId(data.conversation_id);
      }

      // Reload conversations list to ensure canonical state; only call server if not guest
      if (!authService.isGuestMode()) {
        await loadConversations();
      } else {
        // If guest, we already updated local guest conversations; just reload from local storage
        await loadConversations();
      }
      
    } catch (error) {

      try {
        const formatted = chatService.formatErrorMessage(error as Error);
        const errorMsg = {
          id: Date.now(),
          role: "assistant",
          content: formatted,
          created_at: new Date().toISOString(),
          metadata: { error: true },
        } as any;
        setMessages(prev => {
           const updatedPrev = prev.map((m: any) => {
             if (m.id === tempMessage.id) return { ...m, id: `sent-${Date.now()}` };
             return m;
           });
           return [...updatedPrev, errorMsg];
        });
      } catch (e) {
        // ignore formatting/display failures
      }
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  }, [activeConversationId, authService, chatService, loadConversations]);

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

    }
  }, [activeConversationId, handleNewChat, loadConversations]);

  const handleCloseCanvas = () => {
    setIsCanvasOpen(false);
    setIsSidebarOpen(true);
  };

  const handleQuickAction = (action: any) => {


    // Check for Twin Knowledge action
    const isTwinKnowledge = (typeof action === 'object' && action.id === 'knowledge') ||
                            (typeof action === 'object' && action.command?.en === 'Show me the first use case') ||
                            (typeof action === 'string' && action === 'Show me the first use case');

    // Check for Graph Dashboard action
    const isGraphDashboard = (typeof action === 'object' && action.id === 'demo') ||
                             (typeof action === 'object' && action.command?.en === 'Explain Twin Science') ||
                             (typeof action === 'string' && action === 'Explain Twin Science');

    // Check for Architecture action
    const isArchitecture = (typeof action === 'object' && action.id === 'architecture') ||
                           (typeof action === 'object' && action.command?.en === 'Describe architecture') ||
                           (typeof action === 'string' && action === 'Describe architecture');

    // Check for Approach action
    const isApproach = (typeof action === 'object' && action.id === 'approach') ||
                       (typeof action === 'object' && action.command?.en === 'Tell me about approach') ||
                       (typeof action === 'string' && action === 'Tell me about approach');

    let targetArtifact = null;
    let landingPageId = null;

    if (isTwinKnowledge) {

      landingPageId = null;
      targetArtifact = {
        artifact_type: 'REACT',
        title: language === 'ar' ? 'علوم التوأمة' : 'Twin Knowledge Base',
        content: {
          reactElement: <TwinKnowledge onNavigate={(chapterId, episodeId) => {
            // Function to handle switching to renderer
            const content: any = {
              chapterId,
              episodeId,
            };

            const artifactId = `knowledge-${chapterId}-${episodeId}`;
            const detailArtifact = {
               id: artifactId,
               artifact_type: 'REACT',
               title: `Episode ${episodeId}`,
               content,
               forceZen: true,
               hideNavigation: true,
               isKnowledgeRenderer: true
            };
            
            // Assign the react element which needs the artifact prop
            content.reactElement = (
              <TwinKnowledgeRenderer 
                artifact={detailArtifact as any} 
                onBack={() => {
                  // Re-trigger the knowledge action to reload the landing page
                   handleQuickAction({id: 'knowledge'});
                }}
              />
            );

            setCanvasArtifacts([detailArtifact]);
          }} />
        },
        forceZen: true,
        hideNavigation: true
      };
    } else if (isGraphDashboard) {
      // GRAPH DASHBOARD:
      // Skip the landing page and open GraphDashboard directly.
      landingPageId = null;
      targetArtifact = {
        artifact_type: 'GRAPHV001',
        title: language === 'ar' ? 'التخطيط الاستراتيجي' : 'Strategic Planning',
        content: { mode: 'live' },
        forceZen: true,
        hideNavigation: true
      };
    } else if (isArchitecture) {
      // ARCHITECTURE / PRODUCT ROADMAP:
      // Skip the landing page and open ProductRoadmap directly.
      // Set landingPageId to null so the landing page artifact is not created.
      landingPageId = null;
      targetArtifact = {
        artifact_type: 'REACT',
        title: language === 'ar' ? 'خارطة طريق المنتج' : 'Product Roadmap',
        content: {
          reactElement: <ProductRoadmap />
        },
        forceZen: true,
        hideNavigation: true
      };
    } else if (isApproach) {
      // APPROACH / PLAN YOUR JOURNEY:
      // Skip the landing page and open PlanYourJourney directly.
      // Set landingPageId to null so the landing page artifact is not created.
      landingPageId = null;
      targetArtifact = {
        artifact_type: 'REACT',
        title: language === 'ar' ? 'خطط رحلتك' : 'Plan Your Journey',
        content: {
          reactElement: <PlanYourJourney />
        },
        forceZen: true,
        hideNavigation: true
      };
    }

    if (targetArtifact && landingPageId) {
      // FLOW A: Landing page → Target artifact (e.g., Twin Knowledge, Demo, Approach)
      // Creates a two-step flow where user sees a landing page first, then can proceed.
      const landingData = LANDING_PAGES[landingPageId];
      const landingArtifact = {
        artifact_type: 'LANDING_PAGE',
        title: landingData.title[language],
        content: landingData,
        forceZen: true,
        hideNavigation: true
      };

      setCanvasArtifacts([landingArtifact, targetArtifact]);
      setInitialCanvasIndex(0); // Start at Landing Page
      setIsCanvasOpen(true);
      if (!isCanvasOpen) setIsSidebarOpen(true);
      setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
    } else if (targetArtifact && !landingPageId) {
      // FLOW B: Direct artifact opening (e.g., Product Roadmap)
      // Opens the target artifact directly without an intermediate landing page.
      setCanvasArtifacts([targetArtifact]);
      setInitialCanvasIndex(0);
      setIsCanvasOpen(true);
      if (!isCanvasOpen) setIsSidebarOpen(true);
      setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
    } else {

      // Standard message
      const command = typeof action === 'string' ? action : action.command[language];
      handleSendMessage(command);
    }
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
    // Normalize artifact shape so downstream canvas/renderer get a predictable
    // `artifact.artifact_type` and `artifact.content` with `body`/`config.html_content`.
    const normalizeIfHtml = (a: any) => {
      if (!a || typeof a !== 'object') return a;
      const t = String(a.type || a.artifact_type || '').toLowerCase();
      const hasCfgHtml = !!(a.config && (typeof a.config.html_content === 'string' || typeof a.config.html === 'string'));
      const hasAnswerHtml = !!(a.answer && /<\/?[a-z][\s\S]*>/i.test(a.answer));
      const isHtmlCandidate = (t === 'html' || t === 'document' || hasCfgHtml || hasAnswerHtml);
      if (!isHtmlCandidate) return a; // do not touch non-HTML artifacts

      const art = { ...a };
      if (!art.artifact_type) {
        if (art.type) art.artifact_type = String(art.type).toUpperCase();
        else if (art.content && art.content.format) art.artifact_type = String(art.content.format).toUpperCase();
      }
      art.content = art.content || art.config || {};
      if (typeof art.content === 'string') art.content = { body: art.content };

      const candidate = art.content?.body || art.content?.html || art.content?.config?.html_content || art.answer || art.config?.html_content || art.config?.html || '';
      const looksLikePlaceholder = (s: string) => !s || /embedded in the 'answer' field|placeholder|<!--\s*The full HTML/i.test(s);

      if (looksLikePlaceholder(String(candidate))) {
        // Try to locate the originating message in the current page `messages` state
        // and use its `answer` field if it contains HTML.
        try {
          const match = messages.find((m: any) => {
            try {
              const mets = m.metadata?.artifacts || [];
              return mets.some((ma: any) => ma.id && art.id && ma.id === art.id) || (m.metadata?.artifacts || []).some((ma: any) => ma.title && ma.title === art.title);
            } catch (_) { return false; }
          });
          if (match && (match as any).answer && /<\/?[a-z][\s\S]*>/i.test((match as any).answer)) {
            art.content.body = (match as any).answer;
            art.content.config = { ...(art.content.config || {}), html_content: (match as any).answer };
            return art;
          }
        } catch (_) {}

        // If we couldn't find the message or it lacks HTML, but art.answer has HTML, use that
        if (hasAnswerHtml) {
          art.content.body = art.answer;
          art.content.config = { ...(art.content.config || {}), html_content: art.answer };
        }
      } else if (candidate && typeof candidate === 'string') {
        art.content.body = art.content.body || candidate;
        art.content.config = { ...(art.content.config || {}), html_content: art.content.config?.html_content || candidate };
      }

      return art;
    };

    const normalizedArtifacts = (artifacts || [artifact]).map(a => normalizeIfHtml(a));

    setCanvasArtifacts(normalizedArtifacts);
    setInitialCanvasIndex(index || 0);
    setIsCanvasOpen(true);
    if (!isCanvasOpen) setIsSidebarOpen(true);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
  };

  // Listen for messages from Graphv001 iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_ANALYSIS') {
        
        try {
          // 1. Fetch dashboard data
          const token = authService.getToken();
          const headers: any = { 
            "Content-Type": "application/json"
          };
          if (token) headers.Authorization = `Bearer ${token}`;
          
          const dashboardRes = await fetch("/api/v1/dashboard/dashboard-data", { headers });
          if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard data');
          const dashboardData = await dashboardRes.json();
          
          // 2. Construct prompt
          // Filter data to relevant fields
          let filteredData = Array.isArray(dashboardData) ? dashboardData.map((row: any) => ({
            quarter: row.quarter,
            dimension: row.dimension_title,
            actual: row.kpi_actual,
            planned: row.kpi_planned,
            trend: row.trend,
            status: row.health_state
          })) : dashboardData;

          // Apply year filter if present (UP TO the selected year)
          const selectedYear = event.data.selectedYear;
          if (selectedYear && Array.isArray(filteredData)) {
             filteredData = filteredData.filter((row: any) => {
                // Assuming quarter format "Qx YYYY" or similar containing 4 digits
                const match = String(row.quarter).match(/(\d{4})/);
                if (match) {
                   const year = parseInt(match[1]);
                   return year <= selectedYear;
                }
                return true; // Keep if no year found
             });
          }

          const isAr = event.data.language === 'ar';
          
          const promptEn = `Analyze the following hypothetical quarterly dashboard data as part of a planning exercise. Starting from the agency's status today, and looking at the dashboard data as future targets under evaluation, and assuming an aggressive but possible scenario:
          1- an introductory paragraph summarizing what the plan is trying to achieve differently from the current plans, where it is focusing and why this deviation could be under consideration. Anchor your assessment on the achievement of strategic objectives. Include your fair and polite assessment if this is the best path and what could be other areas if focused on can represent a better alternatives 
          2- per target, assess the feasibility of reaching them, make sure they are inline with the intro, justify each items with factual references
          3- if possible, provide an optimized set of targets that support reaching the strategic objectives 
          4- in either scenario, what are the actions that must be taken to hit the targets on time - highlight the top 3 at the start of the list in bold - and for each one  identify the departments that will hold the highest burden
          5- list the top 3 risks to the plan and their possible mitigations - justify the risks by linking them to the actions in point 4 and explaining the reasoning of the suggested mitigations - be action oriented and avoid generic narratives
          Utilize your graph memory, the chains and relations to uncover possibilities and risks humans are unable to see and list up to 3 maximum labelled as Un-Intended Important Analysis Outputs.
          IMPORTANT: As a special case - provide the entire answer under a special non-listed visualization "HTML" with the title "Strategic Planning Analysis". Do NOT generate any other visualizations, charts, or artifacts, and format for readability using HTML instead of Markdown`;

          const promptAr = `قم بتحليل بيانات لوحة القيادة الربع سنوية الافتراضية التالية كجزء من تمرين تخطيط. بدءاً من وضع الجهة اليوم، والنظر إلى بيانات لوحة القيادة كأهداف مستقبلية قيد التقييم، وبافتراض سيناريو طموح ولكنه ممكن:
          1- فقرة تمهيدية تلخص ما تحاول الخطة تحقيقه بشكل مختلف عن الخطط الحالية، وأين تركز ولماذا قد يكون هذا الانحراف قيد النظر. اربط تقييمك بتحقيق الأهداف الاستراتيجية. قم بتضمين تقييمك العادل والمهذب إذا كان هذا هو المسار الأفضل وما هي المجالات الأخرى التي إذا تم التركيز عليها يمكن أن تمثل بدائل أفضل.
          2- لكل هدف، قيم جدوى الوصول إليه، وتأكد من توافقها مع المقدمة، وبرر كل عنصر بمراجع واقعية.
          3- إذا أمكن، قدم مجموعة محسنة من الأهداف التي تدعم الوصول إلى الأهداف الاستراتيجية.
          4- في كلتا الحالتين، ما هي الإجراءات التي يجب اتخاذها لتحقيق الأهداف في الوقت المحدد - أبرز أهم 3 في بداية القائمة بالخط العريض - ولكل واحد حدد الإدارات التي ستتحمل العبء الأكبر.
          5- اذكر أهم 3 مخاطر للخطة وتخفيفاتها المحتملة - برر المخاطر بربطها بالإجراءات في النقطة 4 وشرح منطق التخفيفات المقترحة - كن موجهاً نحو العمل وتجنب السرد العام.
          استخدم ذاكرة الرسم البياني الخاصة بك، والسلاسل والعلاقات للكشف عن الاحتمالات والمخاطر التي لا يستطيع البشر رؤيتها واذكر بحد أقصى 3 تحت تسمية "مخرجات تحليل غير مقصودة ومهمة".
          هام: كحالة خاصة - قدم الإجابة الكاملة تحت تصور "HTML" خاص غير مدرج بعنوان "تحليل التخطيط الاستراتيجي".
          تعليمات إضافية مهمة جداً:
          1. تأكد من أن الرد (الرسالة في الدردشة) باللغة العربية ويقول: "إليك تقرير التخطيط الاستراتيجي" وليس "تقرير HTML".
          2. داخل التقرير الـ HTML، تأكد من إضافة تنسيقات CSS لجعل الجداول محاذاة لليمين (RTL). أضف <style> table { direction: rtl; text-align: right; } th, td { text-align: right; } </style> وقم بتغليف المحتوى بـ <div dir="rtl">.
          3. لا تقم بإنشاء أي تصورات أو مخططات أو قطع أثرية أخرى غير هذا التقرير.`;

          const prompt = (isAr ? promptAr : promptEn) + `\nData: ${JSON.stringify(filteredData, null, 2)}`;
          
          // 3. Send message to chat
          // We pass suppressCanvasOpen option if present
          const options = { 
            push_to_graph_server: !event.data.suppressCanvasOpen, // If suppressing, we don't push? 
            // WAIT. User said "sends the same content to the chat area".
            // If we don't push to graph server, ChatAppPage opens canvas by default.
            // We need a specific flag to NOT open canvas AND NOT push.
            suppress_canvas_auto_open: event.data.suppressCanvasOpen 
          };
          
          await handleSendMessage(prompt, options);
          
          // Notify source that analysis is complete
          const msg = { type: 'ANALYSIS_COMPLETE' };
          if (event.source && event.source !== window) {
             (event.source as Window).postMessage(msg, '*');
          } else {
             window.postMessage(msg, '*');
          }
          
        } catch (err) {
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleSendMessage]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="chat-app-shell">
      {/* Router aware SPA blocker — mounts only if Data Router exists */}
      <RouterBlocker />
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
          language={language}
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
