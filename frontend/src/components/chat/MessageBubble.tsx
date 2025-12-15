/**
 * MessageBubble Component
 * 
 * Displays individual chat messages with:
 * - User/Assistant styling
 * - Avatar
 * - Timestamp
 * - Action buttons (copy, edit, feedback)
 * - Artifact previews
 */

import { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, CheckCheck, Edit2, Loader2 } from 'lucide-react';
import type { Message as APIMessage } from '../../types/api';
import '../../styles/message-bubble.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UniversalCanvas } from './UniversalCanvas';

interface MessageBubbleProps {
  message: APIMessage;
  isUser: boolean;
  onCopy?: () => void;
  onEdit?: () => void;
  onFeedback?: (isPositive: boolean) => void;
  onOpenArtifact?: (artifact: any, artifacts?: any[]) => void;
  onRetry?: () => void;
  language?: 'en' | 'ar';
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  isUser,
  onCopy,
  onEdit,
  onFeedback,
  onOpenArtifact,
  onRetry,
  language = 'en',
  showAvatar = true,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const isRTL = language === 'ar';

  const handleCopy = () => {
    if (onCopy) onCopy();
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (isPositive: boolean) => {
    const newFeedback = isPositive ? 'up' : 'down';
    setFeedback(feedback === newFeedback ? null : newFeedback);
    if (onFeedback) onFeedback(isPositive);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [showActionsHover, setShowActionsHover] = useState(false);

  // Helper: attempt to parse JSON from strings (including double-escaped JSON)
  const tryParseJSON = (value: any) => {
    if (!value && value !== 0) return null;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return null;
    try {
      return JSON.parse(value);
    } catch (_) {
      const m = value.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch (_) {
          // try unescaping common sequences
          const unescaped = value.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
          try {
            return JSON.parse(unescaped);
          } catch (_) {
            return null;
          }
        }
      }
      return null;
    }
  };

  // Render content smartly: if structured (failed_generation/tool), render as readable blocks
  // Render content smartly: if structured (failed_generation/tool), render as readable blocks
  const renderFormattedContent = (rawContent: any) => {
    const parsed = tryParseJSON(rawContent) || null;

    // Helper to render blocks from a plain string using double-newline separation
    const renderStringBlocks = (text: string) => {
      return String(text).split(/\n\s*\n/).map((block, idx) => {
        if (/^Questions?:/i.test(block.trim())) {
          const lines = block.split(/\n/).slice(1).map(l => l.trim()).filter(Boolean);
          return (
            <div key={idx} style={{ marginTop: 6 }}>
              <strong>Questions:</strong>
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {lines.map((l, i) => <li key={i} style={{ marginBottom: 4 }}>{l}</li>)}
              </ul>
            </div>
          );
        }
        if (/^Tool attempted:/i.test(block.trim())) {
          return <p key={idx} style={{ margin: '6px 0', fontWeight: 600 }}>{block.replace(/^Tool attempted:\s*/i, '')}</p>;
        }
        return <p key={idx} style={{ margin: '6px 0' }}>{block}</p>;
      });
    };

    // If parsed is an object/array
    if (parsed && typeof parsed === 'object') {
      // Check for specific tool structure
      const fg = parsed.failed_generation || parsed;
      const obj = typeof fg === 'string' ? tryParseJSON(fg) || fg : fg;
      
      let title = 'JSON Data';
      if (obj && typeof obj === 'object') {
         if (obj.name || obj.tool) {
            title = `Tool: ${obj.name || obj.tool}`;
         } else if (Array.isArray(obj)) {
            title = `Array (${obj.length})`;
         } else if (parsed.failed_generation) {
            title = 'Tool Execution Failed';
         }
      }

      return <JSONCollapsible data={parsed} title={title} expanded={showRaw} onToggle={() => setShowRaw(!showRaw)} />;
    }

    // If not parsed JSON, but content looks like JSON or an error
    const rawAsString = String(rawContent || '');
    const looksLikeJSON = /\{[\s\S]*\}/.test(rawAsString);
    
    // If it's an explicit error from metadata, but the user says it's intended content
    if (!parsed && message.metadata?.error) {
       return (
         <div style={{ marginTop: 10 }}>
            <JSONCollapsible data={rawAsString} title={isUser ? "Raw Content" : "System Output"} expanded={showRaw} onToggle={() => setShowRaw(!showRaw)} />
         </div>
       );
    }
    
    // If it looks like JSON but failed to parse (mixed content)
    // For User messages, we trust looksLikeJSON more to wrap it
    if (!parsed && looksLikeJSON) {
       return <JSONCollapsible data={rawAsString} title={isUser ? "JSON Content" : "Raw Content (JSON-like)"} expanded={showRaw} onToggle={() => setShowRaw(!showRaw)} />;
    }

    return renderStringBlocks(String(rawContent).replace(/\n{3,}/g, '\n\n').trim());
  };

  // Detect and extract strategic planning response with HTML visualization artifacts
  // Returns { answer: string, artifacts: Array } if detected, null otherwise
  const strategicPlanningResponse = (() => {
    if (isUser) return null;
    const s = typeof message.content === 'string' ? message.content.trim() : '';
    if (!s.startsWith('{')) return null;
    
    try {
      const parsed = JSON.parse(s);
      if (!parsed || typeof parsed !== 'object') return null;
      
      // Check if this has visualizations with HTML content
      const visualizations = parsed.visualizations;
      if (!Array.isArray(visualizations) || visualizations.length === 0) return null;
      
      const htmlViz = visualizations.find((v: any) => 
        v && typeof v.content === 'string' && 
        (v.type === 'html' || /^<!doctype|<html|<h[1-6]|<table/i.test(v.content.trim()))
      );
      
      if (!htmlViz) return null;
      
      // Extract quarter/year info from the HTML content
      let periodInfo = '';
      const htmlContent = htmlViz.content;
      // Try to find Q1-Q4 202x pattern in the content (look for the latest quarter mentioned)
      const periodMatches = htmlContent.match(/Q[1-4]\s*202[4-9]/gi);
      if (periodMatches && periodMatches.length > 0) {
        // Get the last (most recent) quarter mentioned
        const lastPeriod = periodMatches[periodMatches.length - 1].replace(/\s+/g, ' ');
        periodInfo = ` for the data until ${lastPeriod}`;
      }
      
      // Build the exact answer message format requested
      const cleanAnswer = `The requested analysis is ready - attached is the Strategic Planning Report${periodInfo}.`;
      
      // Convert visualization to artifact format
      const artifacts = [{
        artifact_type: 'html',
        type: 'html',
        title: 'Strategic Planning Report',
        content: htmlViz.content
      }];
      
      return { answer: cleanAnswer, artifacts };
    } catch (e) {
      return null;
    }
  })();

  // Detect if message content looks like structured JSON or contains failed_generation
  const contentIsJSONLike = (() => {
    try {
      const parsed = tryParseJSON(message.content);
      if (parsed) return true;
    } catch (_) {
      // ignore
    }
    const s = typeof message.content === 'string' ? message.content : '';
    if (!s) return false;
    if (/failed_generation/.test(s)) return true;
    if (/\{[\s\S]*\}/.test(s)) return true;
    return false;
  })();

  // Detect if the content looks like a full HTML document or escaped HTML
  const unescapeHtmlEntities = (s: string) => {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  };

  const contentIsHTML = (() => {
    const s = typeof message.content === 'string' ? message.content.trim() : '';
    if (!s) return false;
    
    // 1. Direct HTML document markers
    if (/^<!doctype html>/i.test(s) || /^<html\b/i.test(s) || /<head\b|<body\b|<script\b/i.test(s)) return true;
    
    // 2. Top-level element presence (simple heuristic)
    if (/^<\w+[^>]*>/.test(s) && /<\/\w+>/.test(s)) return true;
    
    // 3. Escaped HTML like &lt;html&gt;
    if (/&lt;\/?[a-zA-Z]+.*&gt;/.test(s)) return true;

    // 4. Contains significant HTML tags (mixed content)
    // This handles cases where the LLM returns text mixed with HTML tags (e.g. "Here is the report: <b>Title</b>...")
    if (/<(h[1-6]|table|div|p|ul|ol|dl|blockquote|section|article|header|footer|main|nav|aside|b|i|strong|em|br|span)[^>]*>/i.test(s)) return true;

    // 5. JSON-wrapped HTML (check visualizations array and common fields)
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === 'object') {
          // Check visualizations array first (most common for HTML reports)
          if (Array.isArray(parsed.visualizations)) {
            for (const viz of parsed.visualizations) {
              if (viz && typeof viz.content === 'string' && 
                  (viz.type === 'html' || /^<!doctype|<html|<h[1-6]|<table/i.test(viz.content.trim()))) {
                return true;
              }
            }
          }
          // Check common fields for HTML content
          const candidates = [
            parsed.answer,
            parsed.html,
            parsed.content,
            parsed.body,
            parsed.config?.html_content,
            parsed.config?.html
          ];
          
          for (const c of candidates) {
            if (typeof c === 'string' && (
              /^<!doctype html>/i.test(c.trim()) || 
              /<html\b/i.test(c.trim()) || 
              // Check for block-level HTML tags or common formatting tags anywhere in the string
              /<(h[1-6]|table|div|p|ul|ol|dl|blockquote|section|article|header|footer|main|nav|aside|b|i|strong|em|br|span)[^>]*>/i.test(c)
            )) {
              return true;
            }
          }
        }
      } catch (e) {
        // Not valid JSON, ignore
      }
    }

    return false;
  })();

  // Prepare an unescaped html string if detected
  const htmlCandidate = (() => {
    if (!contentIsHTML) return null;
    let s = typeof message.content === 'string' ? message.content : '';
    console.log('[MessageBubble] HTML Check:', { title: message.metadata?.title, isAnalysis: message.metadata?.title === "Strategic Planning Analysis", contentPreview: s.slice(0, 50) });
    
    // If content is JSON-wrapped, extract the HTML from within
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === 'object') {
          // Check visualizations array first (most common for HTML reports)
          if (Array.isArray(parsed.visualizations)) {
            for (const viz of parsed.visualizations) {
              if (viz && typeof viz.content === 'string' && 
                  (viz.type === 'html' || /^<!doctype|<html|<h[1-6]|<table/i.test(viz.content.trim()))) {
                return viz.content;
              }
            }
          }
          // Check common fields for HTML content
          const candidates = [
            parsed.answer,
            parsed.html,
            parsed.content,
            parsed.body,
            parsed.config?.html_content,
            parsed.config?.html
          ];
          for (const c of candidates) {
            if (typeof c === 'string' && /^<!doctype|<html|<h[1-6]|<table/i.test(c.trim())) {
              return c;
            }
          }
        }
      } catch (e) {
        // Not valid JSON, continue with raw string
      }
    }
    
    // If it looks escaped, unescape common entities
    if (s.indexOf('&lt;') !== -1 || s.indexOf('&gt;') !== -1) {
      s = unescapeHtmlEntities(s);
    }
    // Strip wrapping quotes if present
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
    }
    return s;
  })();

  const rowClass = `message-row ${isUser ? 'message-row--user' : 'message-row--bot'} ${isRTL ? 'rtl' : 'ltr'}`;

  const isAnalysisRequest = isUser && typeof message.content === 'string' && message.content.includes("Analyze the following quarterly dashboard data");

  return (
    <div className={rowClass} dir={isRTL ? 'rtl' : 'ltr'} onMouseEnter={() => setShowActionsHover(true)} onMouseLeave={() => setShowActionsHover(false)}>
      {showAvatar && (
        <div className="message-avatar-wrap">
          <div className={`message-avatar ${isUser ? 'message-avatar--user' : 'message-avatar--bot'}`}>
            <span className="message-avatar-initial">{isUser ? 'U' : 'N'}</span>
          </div>
        </div>
      )}

      <div className={`message-content ${isUser ? 'message-content--user' : 'message-content--bot'}`}>
        <div className={`message-bubble ${isUser ? 'message-bubble--user' : 'message-bubble--bot'} clickable`}>
          <div className="message-bubble-inner">
            {isAnalysisRequest ? (
              <div>
                <div 
                  style={{display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0'}} 
                  onClick={() => setShowRaw(!showRaw)}
                  title="Click to view full request data"
                >
                   <div style={{
                     width: 32, height: 32, 
                     backgroundColor: 'rgba(255,255,255,0.1)', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     border: '1px solid rgba(255,255,255,0.2)'
                   }}>
                     <span style={{fontSize: '16px'}}>📄</span>
                   </div>
                   <div style={{display: 'flex', flexDirection: 'column'}}>
                     <span style={{fontWeight: 600, fontSize: '14px'}}>Analysis Request</span>
                     <span style={{fontSize: '11px', opacity: 0.7}}>Click to expand data payload</span>
                   </div>
                </div>
                {showRaw && (
                  <div style={{marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8}}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px', fontFamily: 'monospace', opacity: 0.9, overflowX: 'auto' }}>
                      {message.content}
                    </pre>
                  </div>
                )}
              </div>
            ) : strategicPlanningResponse ? (
              // Strategic planning response - show clean answer text, artifacts render as chips below
              <div className="markdown-content">
                <p>{strategicPlanningResponse.answer}</p>
              </div>
            ) : (contentIsHTML && htmlCandidate) ? (
              <div style={{ width: '100%' }}>
                <UniversalCanvas content={htmlCandidate} type="html" title={message.metadata?.title || 'HTML Artifact'} />
              </div>
            ) : ((!isUser && (message.metadata?.error || contentIsJSONLike)) || (isUser && contentIsJSONLike)) ? (
              renderFormattedContent(message.content)
            ) : (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {(() => {
                    let content = message.content.replace(/\n{3,}/g, '\n\n').trim();
                    // Auto-fence JSON for user messages if not already fenced
                    if (isUser && !content.includes('```') && /\{[\s\S]*\}/.test(content)) {
                       content = content.replace(/(\{[\s\S]*\})/g, '\n```json\n$1\n```\n');
                    }
                    return content;
                  })()}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Render artifact chips - from metadata.artifacts OR from strategicPlanningResponse */}
        {!isUser && (
          (message.metadata?.artifacts && message.metadata.artifacts.length > 0) || 
          (strategicPlanningResponse?.artifacts && strategicPlanningResponse.artifacts.length > 0)
        ) && (
          <div className="artifact-list">
            {(strategicPlanningResponse?.artifacts || message.metadata?.artifacts || []).map((artifact: any, index: number) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                className="artifact-chip clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenArtifact) onOpenArtifact(artifact, strategicPlanningResponse?.artifacts || message.metadata?.artifacts);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onOpenArtifact) onOpenArtifact(artifact, strategicPlanningResponse?.artifacts || message.metadata?.artifacts);
                  }
                }}
              >
                <ArtifactIcon type={artifact.artifact_type || artifact.type || 'unknown'} size={16} color={'var(--component-text-accent)'} />
                <span className="artifact-title">{artifact.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`message-meta ${isRTL ? 'meta-rtl' : ''}`}>
          <span className="message-time">{formatTime(message.created_at)}</span>

          <div className={`message-actions ${showActionsHover ? 'visible' : ''}`}>
            <button onClick={handleCopy} title={language === 'ar' ? 'نسخ' : 'Copy'} className="icon-button">
              {copied ? <CheckCheck className="icon green" /> : <Copy className="icon" />}
            </button>

            {isUser && onEdit && (
              <button onClick={onEdit} title={language === 'ar' ? 'تعديل' : 'Edit'} className="icon-button">
                <Edit2 className="icon" />
              </button>
            )}

            {!isUser && onFeedback && (
              <>
                <button onClick={() => handleFeedback(true)} title={language === 'ar' ? 'مفيد' : 'Helpful'} className={`icon-button ${feedback === 'up' ? 'positive' : ''}`}>
                  <ThumbsUp className="icon" />
                </button>
                <button onClick={() => handleFeedback(false)} title={language === 'ar' ? 'غير مفيد' : 'Not helpful'} className={`icon-button ${feedback === 'down' ? 'negative' : ''}`}>
                  <ThumbsDown className="icon" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JSONCollapsible({ 
  data, 
  title = 'JSON Data',
  expanded,
  onToggle 
}: { 
  data: any; 
  title?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <div style={{ border: '1px solid var(--component-panel-border)', borderRadius: 8, overflow: 'hidden', margin: '8px 0' }}>
      <div 
        onClick={handleClick}
        style={{
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.05)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.9em',
          fontWeight: 600,
          color: 'var(--component-text-secondary)',
          userSelect: 'none'
        }}
        role="button"
        tabIndex={0}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{expanded ? '📂' : '📁'}</span>
          <span>{title}</span>
        </div>
        <span>{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div 
          style={{ padding: '12px', background: 'var(--component-bg-primary)', borderTop: '1px solid var(--component-panel-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            fontSize: '0.85em', 
            fontFamily: 'monospace', 
            margin: 0,
            color: 'var(--component-text-primary)' 
          }}>
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ArtifactIcon({ type, size = 16, color }: { type: string; size?: number; color?: string }) {
  const commonStyle = { width: size, height: size, flexShrink: 0, color: color || 'rgba(107,114,128,1)' } as any;

  switch ((type || '').toUpperCase()) { // Convert type to uppercase for case-insensitive matching
    case 'CHART':
    case 'CHART_BAR':
    case 'CHART_LINE':
    case 'CHART_PIE':
    case 'PIE':
    case 'COLUMN':
    case 'LINE':
    case 'RADAR':
    case 'BUBBLE':
    case 'BULLET':
    case 'COMBO':
      return (
        <svg style={commonStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'TABLE':
      return (
        <svg style={commonStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case 'HTML':
    case 'REPORT':
      return (
        <svg style={commonStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'DOCUMENT':
      return (
        <svg style={commonStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    default:
      // Fallback icon for unknown types - a generic file icon
      return (
        <svg style={commonStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
}

/**
 * Thinking Indicator Component
 * Shows while AI is processing
 */
export function ThinkingIndicator({ language = 'en' }: { language?: 'en' | 'ar' }) {
  const text = language === 'ar' ? 'نور تفكر...' : 'Noor is thinking...';
  
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 32, height: 32, background: 'var(--component-text-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: 'var(--component-text-on-accent)', fontSize: 12, fontWeight: 600 }}>N</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent' }}>
        <Loader2 style={{ width: 16, height: 16, color: 'var(--component-text-secondary)' }} />
        <span style={{ fontSize: 14, color: 'var(--component-text-secondary)' }}>{text}</span>
      </div>
    </div>
  );
}
