import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'noor';
  content?: string | null;
  thinking?: string | null;
  isThinking?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content, thinking, isThinking = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (role === 'user') {
    return <div className="user-bubble">{content}</div>;
  }

  return (
    <div className="assistant-container">
      {/* THINKING BLOCK */}
      { (thinking !== undefined && thinking !== null) && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 p-2 text-xs font-medium text-indigo-600 hover:bg-indigo-100/50 transition-colors"
          >
            <BrainCircuit size={14} />
            <span>Cognitive Process {content ? "(Complete)" : "(Active...)"}</span>
            {isExpanded ? <ChevronDown size={14} className="ml-auto"/> : <ChevronRight size={14} className="ml-auto"/>}
          </button>

          {isExpanded && (
            <div className="p-3 pt-0 text-xs text-indigo-800 font-mono whitespace-pre-wrap border-t border-indigo-100/50 mt-1 bg-white/50">
               {thinking}
               {isThinking && !content && <span className="animate-pulse"> ▋</span>}
            </div>
          )}
        </div>
      )}

      {/* FINAL ANSWER */}
      {content && (
        <div className="markdown-body text-gray-800">
          {content}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
