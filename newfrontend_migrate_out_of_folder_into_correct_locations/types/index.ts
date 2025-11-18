export type Language = 'en' | 'ar';

export interface Episode {
  type: 'article' | 'video' | 'podcast' | 'guide';
  title: string;
  description: string;
  duration?: string;
}

export interface Chapter {
  id: number;
  title: string;
  episodes: Episode[];
}

// Legacy Message type - use types from api.ts for new chat interface
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Re-export API types for convenience
export * from './api';