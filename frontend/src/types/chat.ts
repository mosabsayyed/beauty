export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  artifacts?: Artifact[];
  confidence?: {
    level: 'high' | 'medium' | 'low';
    score: number;
  };
  [key: string]: any;
}

export interface Artifact {
  id: string;
  artifact_type: 'CHART' | 'TABLE' | 'REPORT' | 'DOCUMENT';
  title: string;
  content: any;
  created_at: string;
  description?: string;
  groupId?: number;
}

export interface Conversation {
  id: number;
  title?: string;
  message_count: number;
  updated_at: string;
  created_at?: string;
}

export interface ChatRequest {
  query: string;
  persona?: string;
  conversation_id?: number;
  push_to_graph_server?: boolean;
}

export interface ChatResponse {
  message: string;
  conversation_id: number;
  clarification_needed?: boolean;
  clarification_questions?: string[];
  clarification_context?: string;
  artifacts?: Artifact[];  // Unified schema - removed dual visualization field
  analysis?: string[];
  insights?: string[];
  confidence?: number;
  data?: any;
  answer?: string;
  metadata?: MessageMetadata;
  llm_payload?: any;
}

export interface DebugLog {
  event_type: string;
  timestamp: string;
  data: any;
}

export interface DebugLayer {
  events: DebugLog[];
  [key: string]: any;
}

export interface DebugLogs {
  layers: {
    [layerName: string]: DebugLayer;
  };
}

export interface ChartData {
  type: 'radar' | 'spider' | 'bubble' | 'bullet' | 'column' | 'line' | 'combo';
  chart_title?: string;
  subtitle?: string;
  categories?: string[];
  series?: any[];
  [key: string]: any;
}

export interface TableData {
  columns: string[];
  rows: any[][];
  total_rows: number;
}