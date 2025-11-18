/**
 * Real API Service
 *                                                                                                              
 * Calls the actual backend API at http://localhost:8000/api/v1
 * Replaces mockApi for production use.
 *
 * Version: 1.0.0
 * Date: November 15, 2024
 */

import type {
  ChatMessageRequest,
  ChatMessageResponse,
  ConversationsListResponse,
  ConversationDetailResponse,
  ConversationMessagesResponse,
  DeleteConversationResponse,
  Artifact,
  ChartArtifact,
  TableArtifact,
  ReportArtifact,
  DocumentArtifact,
} from '../types/api';

// ============================================================================
// API CONFIGURATION (env-driven)
// - Use `REACT_APP_API_URL` when provided (e.g. http://localhost:8008/api/v1).
// - Otherwise use relative paths so the CRA dev proxy handles requests via /api/v1.
// ============================================================================

const RAW_API_BASE = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' && (window as any).EXPERIENCE_API_BASE_URL) || '') as string;
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/g, '');
const API_PATH_PREFIX = API_BASE_URL ? '' : '/api/v1';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${API_PATH_PREFIX}${path}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or other errors
    throw new APIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      'Network Error'
    );
  }
}

// ============================================================================
// API METHODS
// ============================================================================

export const api = {
  /**
   * POST /api/v1/chat/message
   */
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    return apiRequest<ChatMessageResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * GET /api/v1/chat/conversations
   */
  async getConversations(): Promise<ConversationsListResponse> {
    return apiRequest<ConversationsListResponse>('/chat/conversations');
  },

  /**
   * GET /api/v1/chat/conversations/{id}
   */
  async getConversation(id: number): Promise<ConversationDetailResponse> {
    return apiRequest<ConversationDetailResponse>(`/chat/conversations/${id}`);
  },

  /**
   * GET /api/v1/chat/conversations/{id}/messages
   */
  async getConversationMessages(id: number): Promise<ConversationMessagesResponse> {
    return apiRequest<ConversationMessagesResponse>(`/chat/conversations/${id}/messages`);
  },

  /**
   * DELETE /api/v1/chat/conversations/{id}
   */
  async deleteConversation(id: number): Promise<DeleteConversationResponse> {
    return apiRequest<DeleteConversationResponse>(`/chat/conversations/${id}`, {
      method: 'DELETE',
    });
  },
};