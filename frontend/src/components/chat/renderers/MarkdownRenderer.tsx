/**
 * MarkdownRenderer - Full-featured markdown with GFM support
 * Renders markdown documents with professional styling
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import '../MessageBubble.css';

interface MarkdownRendererProps {
  content: string;
  title?: string;
}

export function MarkdownRenderer({ content, title }: MarkdownRendererProps) {
  return (
    <div style={{ 
      padding: 24,
      background: '#fff',
      height: '100%',
      overflow: 'auto',
    }}>
      {title && (
        <h1 style={{ 
          fontSize: 24, 
          fontWeight: 600, 
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '2px solid var(--border-default)',
        }}>
          {title}
        </h1>
      )}
      <div className="markdown-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeRaw]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
