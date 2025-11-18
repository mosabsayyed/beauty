/**
 * JOSOOR API Contract
 * 
 * This file defines the TypeScript interfaces for the backend API.
 * Frontend and backend must both adhere to this contract.
 * 
 * Version: 1.0.0
 * Date: November 14, 2024
 * 
 * Base URL: http://localhost:8000/api/v1
 */

// ============================================================================
// ARTIFACT TYPES
// ============================================================================

export type ArtifactType = 'CHART' | 'TABLE' | 'REPORT' | 'DOCUMENT';

/**
 * Base Artifact Interface
 * All artifact types extend this base structure
 */
export interface BaseArtifact {
  artifact_type: ArtifactType;
  title: string;
  description?: string;
  content: Record<string, any>;
}

/**
 * Chart Artifact
 * Backend returns Highcharts-style configuration
 * Frontend translates to Recharts
 */
export interface ChartArtifact extends BaseArtifact {
  artifact_type: 'CHART';
  content: {
    chart: {
      type: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'scatter';
    };
    title?: {
      text: string;
    };
    subtitle?: {
      text: string;
    };
    xAxis?: {
      categories?: string[];
      title?: { text: string };
    };
    yAxis?: {
      title?: { text: string };
      min?: number;
      max?: number;
    };
    series: Array<{
      name: string;
      data: number[] | Array<{ x: number; y: number }>;
      color?: string;
    }>;
    legend?: {
      enabled?: boolean;
    };
    tooltip?: {
      enabled?: boolean;
    };
  };
}

/**
 * Table Artifact
 */
export interface TableArtifact extends BaseArtifact {
  artifact_type: 'TABLE';
  content: {
    columns: string[];
    rows: any[][];
    total_rows: number;
  };
}

/**
 * Report Artifact
 */
export interface ReportArtifact extends BaseArtifact {
  artifact_type: 'REPORT';
  content: {
    format: 'markdown' | 'json' | 'html';
    body: string;
  };
}

/**
 * Document Artifact
 */
export interface DocumentArtifact extends BaseArtifact {
  artifact_type: 'DOCUMENT';
  content: {
    format: 'html' | 'markdown';
    body: string;
  };
}

/**
 * Union type for all artifacts
 */
export type Artifact = ChartArtifact | TableArtifact | ReportArtifact | DocumentArtifact;

// ============================================================================
// CHAT API
// ============================================================================

/**
 * POST /api/v1/chat/message
 * Send user query, receive AI response with artifacts
 */
export interface ChatMessageRequest {
  query: string;
  conversation_id: number | null;
  persona?: string; // default: "transformation_analyst"
}

export interface ChatMessageResponse {
  conversation_id: number;
  message: string;
  visualization: Record<string, any> | null; // LEGACY - use artifacts instead
  insights: string[];
  artifacts: Artifact[];
  clarification_needed?: boolean;
  clarification_questions?: string[];
  clarification_context?: string;
}

/**
 * GET /api/v1/chat/conversations
 * List all conversations for current user
 */
export interface ConversationSummary {
  id: number;
  title: string;
  message_count: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface ConversationsListResponse {
  conversations: ConversationSummary[];
}

/**
 * GET /api/v1/chat/conversations/{conversation_id}
 * Get full conversation with messages
 */
export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string; // ISO 8601
  metadata?: {
    artifacts?: Artifact[];
    [key: string]: any;
  };
}

export interface ConversationDetail {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface ConversationDetailResponse {
  conversation: ConversationDetail;
  messages: Message[];
}

/**
 * GET /api/v1/chat/conversations/{conversation_id}/messages
 * Get messages for a specific conversation
 * Limit: 100 messages
 */
export interface ConversationMessagesResponse {
  messages: Message[];
}

/**
 * DELETE /api/v1/chat/conversations/{conversation_id}
 * Delete a conversation
 */
export interface DeleteConversationResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// FILE UPLOAD (Future)
// ============================================================================

export interface FileUploadRequest {
  files: File[];
  conversation_id?: number;
}

export interface FileUploadResponse {
  success: boolean;
  file_ids: string[];
  message: string;
}

// ============================================================================
// AUTHENTICATION (Future - currently demo mode)
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
  message: string;
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export interface APIError {
  detail: string;
  status_code: number;
  error_code?: string;
}

// ============================================================================
// API CLIENT CONFIGURATION
// ============================================================================

export interface APIConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export const DEFAULT_API_CONFIG: APIConfig = {
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface APIResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * Pagination (for future use)
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
