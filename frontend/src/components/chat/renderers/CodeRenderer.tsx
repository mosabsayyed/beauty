/**
 * CodeRenderer - Professional code display with syntax highlighting
 * Supports Python, JavaScript, SQL, JSON, and more
 */

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface CodeRendererProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export function CodeRenderer({ 
  code, 
  language = 'python', 
  title,
  showLineNumbers = true 
}: CodeRendererProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e1e',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#2d2d2d',
        borderBottom: '1px solid #3e3e3e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {language}
          </span>
          {title && (
            <span style={{ fontSize: 13, color: '#888' }}>
              {title}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: copied ? '#10B981' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: '#1e1e1e',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
