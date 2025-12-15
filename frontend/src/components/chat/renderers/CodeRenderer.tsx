/**
 * CodeRenderer - Professional code display with syntax highlighting
 * Supports Python, JavaScript, SQL, JSON, and more
 */

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import en from '../../../locales/en.json';
import ar from '../../../locales/ar.json';

interface CodeRendererProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export function CodeRenderer({ 
  code, 
  language: codeLanguage = 'python', 
  title,
  showLineNumbers = true 
}: CodeRendererProps) {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();
  const translations = language === 'ar' ? ar : en;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-renderer renderer-panel">
      {/* Header */}
      <div className="code-renderer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: 'var(--component-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {codeLanguage}
          </span>
          {title && (
            <span style={{ fontSize: 13, color: 'var(--component-text-secondary)' }}>
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
            background: copied ? 'var(--component-color-success)' : 'rgba(255,255,255,0.06)',
            color: 'var(--component-text-on-accent)',
            border: 'none',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          <span>{copied ? translations.copied : translations.copy}</span>
        </button>
      </div>

      {/* Code */}
      <div className="code-renderer-body">
          <SyntaxHighlighter
          language={codeLanguage}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'inherit',
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
