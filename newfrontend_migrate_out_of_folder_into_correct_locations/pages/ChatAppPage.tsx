/**
 * ChatAppPage - Main Chat Application
 * 
 * Three-column layout (Claude-style):
 * - Left: Sidebar (conversations, account)
 * - Center: Chat interface
 * - Right: Canvas panel (artifacts, slide-out)
 * 
 * Integrates all Phase 2 components with mock API
 */

import { useState, useEffect } from 'react';
import { Sidebar, ChatContainer, CanvasPanel } from '../components/chat';
import { mockApi } from '../services/mockApi';
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
  // API INTERACTIONS
  // ============================================================================

  const loadConversations = async () => {
    try {
      const response = await mockApi.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    try {
      const response = await mockApi.getConversationMessages(conversationId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    setIsLoading(true);

    try {
      const request: ChatMessageRequest = {
        query: messageText,
        conversation_id: activeConversationId,
      };

      const response = await mockApi.sendMessage(request);

      // Update or set active conversation
      if (!activeConversationId) {
        setActiveConversationId(response.conversation_id);
      }

      // Reload conversations list
      await loadConversations();

      // Reload messages
      await loadConversationMessages(response.conversation_id);

      // Handle artifacts
      if (response.artifacts && response.artifacts.length > 0) {
        setCanvasArtifacts(response.artifacts);
        setIsCanvasOpen(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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
      await mockApi.deleteConversation(conversationId);
      
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
  };

  const handleQuickAction = (command: string) => {
    handleSendMessage(command);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const conversationTitle = activeConversation?.title;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-page">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onQuickAction={handleQuickAction}
        language={language}
      />

      {/* Chat Container */}
      <div className="flex-1 relative">
        <ChatContainer
          conversationId={activeConversationId}
          conversationTitle={conversationTitle}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          language={language}
        />
      </div>

      {/* Canvas Panel */}
      <CanvasPanel
        artifacts={canvasArtifacts}
        isOpen={isCanvasOpen}
        onClose={handleCloseCanvas}
        language={language}
      />
    </div>
  );
}