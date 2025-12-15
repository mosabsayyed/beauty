// Compatibility re-export for older import paths
export { chatService } from '../lib/services/chatService';

// Also export types if callers import them from services path
export * from '../lib/services/chatService';
