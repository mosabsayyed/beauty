// JOSOOR API types (copied from migrated frontend contract)
export type ArtifactType = 'CHART' | 'TABLE' | 'REPORT' | 'DOCUMENT';

export interface BaseArtifact {
  artifact_type: ArtifactType;
  title: string;
  description?: string;
  content: Record<string, any>;
}

export interface ChartArtifact extends BaseArtifact {
  artifact_type: 'CHART';
  content: {
    chart: { type: string };
    title?: { text: string };
    subtitle?: { text: string };
    xAxis?: { categories?: string[] };
    yAxis?: any;
    series: Array<{ name: string; data: any[]; color?: string }>;
    legend?: { enabled?: boolean };
  };
}

export interface TableArtifact extends BaseArtifact {
  artifact_type: 'TABLE';
  content: { columns: string[]; rows: any[][]; total_rows: number };
}

export type Artifact = ChartArtifact | TableArtifact | BaseArtifact;

export interface ChatMessageRequest {
  query: string;
  conversation_id: number | null;
  persona?: string;
}

export interface ChatMessageResponse {
  conversation_id: number;
  message: string;
  visualization: Record<string, any> | null;
  insights: string[];
  artifacts: Artifact[];
  clarification_needed?: boolean;
}

export interface ConversationSummary {
  id: number;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: { artifacts?: Artifact[]; [key: string]: any };
}

export interface ConversationsListResponse {
  conversations: ConversationSummary[];
}

export interface ConversationMessagesResponse {
  messages: Message[];
}
