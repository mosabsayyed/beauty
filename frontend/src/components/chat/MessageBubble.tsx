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
  const renderFormattedContent = (rawContent: any) => {
    const parsed = tryParseJSON(rawContent) || null;

    // Helper to render blocks from a plain string using double-newline separation
    const renderStringBlocks = (text: string) => {
      return String(text).split(/\n\s*\n/).map((block, idx) => {
        // Questions block
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

        // Tool attempted line
        if (/^Tool attempted:/i.test(block.trim())) {
          return (
            <p key={idx} style={{ margin: '6px 0', fontWeight: 600 }}>{block.replace(/^Tool attempted:\s*/i, '')}</p>
          );
        }

        return <p key={idx} style={{ margin: '6px 0' }}>{block}</p>;
      });
    };

    // Helper to render key/value summary for objects without dumping full JSON
    const renderKeySummary = (obj: any) => {
      if (!obj || typeof obj !== 'object') return null;
      return (
        <div style={{ marginTop: 8 }}>
          {Object.keys(obj).map(k => {
            const v = obj[k];
            const isPrimitive = v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
            let display = '';
            if (isPrimitive) display = String(v);
            else if (Array.isArray(v)) display = `[${v.length}] ${v.length > 0 ? String(v[0]).slice(0, 120) : ''}`;
            else display = '{...}';
            return (
              <div key={k} style={{ marginBottom: 6 }}>
                <strong style={{ display: 'inline-block', minWidth: 120 }}>{k}:</strong>
                <span style={{ marginLeft: 8, wordBreak: 'break-word' }}>{display}</span>
              </div>
            );
          })}
        </div>
      );
    };

    // If parsed is an object and looks like a failed generation payload
    if (parsed && typeof parsed === 'object') {
      const fg = parsed.failed_generation || parsed;
      const obj = typeof fg === 'string' ? tryParseJSON(fg) || fg : fg;

      if (obj && typeof obj === 'object') {
        const name = obj.name || obj.tool || 'Tool';
        const args = obj.arguments || obj.args || obj.parameters || null;

        return (
          <div>
            {name && <p style={{ margin: 0, fontWeight: 700 }}>Tool attempted: {name}</p>}

            {args && args.answer && <p style={{ marginTop: 8 }}>{typeof args.answer === 'string' ? args.answer : JSON.stringify(args.answer, null, 2)}</p>}

            {args && Array.isArray(args.questions) && (
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                {args.questions.map((q: any, i: number) => <li key={i} style={{ marginBottom: 4 }}>{q}</li>)}
              </ul>
            )}

            {/* Render a concise summary of other args instead of dumping full JSON */}
            {args && (() => {
              const other = { ...args };
              delete other.answer; delete other.questions; delete other.clarification_needed;
              if (Object.keys(other).length > 0) {
                return renderKeySummary(other);
              }
              return null;
            })()}

            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setShowRaw(!showRaw)} style={{ padding: '6px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 6, border: '1px solid rgba(209,213,219,1)', background: 'transparent' }}>{showRaw ? 'Hide raw JSON' : 'Show raw JSON'}</button>
            </div>

            {showRaw && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(parsed, null, 2)}</pre>}
          </div>
        );
      }

      // If parsed is not an object (string), show it nicely with option to reveal raw
      return (
        <div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{String(parsed)}</div>
          <div style={{ marginTop: 10 }}>
            <button onClick={() => setShowRaw(!showRaw)} style={{ padding: '6px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 6, border: '1px solid rgba(209,213,219,1)', background: 'transparent' }}>{showRaw ? 'Hide raw JSON' : 'Show raw JSON'}</button>
          </div>
          {showRaw && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(parsed, null, 2)}</pre>}
        </div>
      );
    }

    // If not parsed JSON, but content looks like JSON or an error, show a concise error + retry fallback
    const rawAsString = String(rawContent || '');
    const looksLikeJSON = /\{[\s\S]*\}/.test(rawAsString);
    if (!parsed && (message.metadata?.error || looksLikeJSON)) {
      return (
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#dc2626' }}>{language === 'ar' ? 'خطأ: استجابة غير متوقعة' : 'Error: Unexpected response format'}</p>
          <p style={{ marginTop: 8, color: 'var(--text-tertiary)' }}>{language === 'ar' ? 'تعذر تفسير استجابة المساعد.' : "We couldn't parse the assistant response."}</p>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button onClick={() => { if (typeof onRetry === 'function') onRetry(); }} style={{ padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 6, border: '1px solid rgba(209,213,219,1)', background: 'transparent' }}>{language === 'ar' ? 'حاول مرة أخرى' : 'Retry'}</button>
            <button onClick={() => setShowRaw(!showRaw)} style={{ padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 6, border: '1px solid rgba(209,213,219,1)', background: 'transparent' }}>{showRaw ? (language === 'ar' ? 'إخفاء JSON' : 'Hide raw JSON') : (language === 'ar' ? 'عرض JSON الخام' : 'Show raw JSON')}</button>
          </div>
          {showRaw && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{rawAsString}</pre>}
        </div>
      );
    }

    return renderStringBlocks(String(rawContent));
  };

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

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    flexDirection: isUser ? (isRTL ? 'row' : 'row-reverse') : 'row',
  };

  const avatarStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isUser ? 'var(--canvas-inverted-bg)' : 'var(--color-gold)',
    flexShrink: 0,
  } as any;

  const contentWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: isUser ? undefined : 1,
    maxWidth: isUser ? '80%' : '100%',
  };

  const bubbleStyle: React.CSSProperties = isUser
    ? {
        background: 'var(--canvas-card-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '12px 16px',
        maxWidth: '80%',
        whiteSpace: 'pre-wrap',
      }
    : {
        background: 'transparent',
        color: 'var(--text-primary)',
        border: 'none',
        borderRadius: 0,
        padding: 0,
        maxWidth: '100%',
        whiteSpace: 'pre-wrap',
      };

  const timeStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 8 };
  const actionsContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, opacity: showActionsHover ? 1 : 0, transition: 'opacity 0.15s ease' };

  return (
    <div style={containerStyle} dir={isRTL ? 'rtl' : 'ltr'} onMouseEnter={() => setShowActionsHover(true)} onMouseLeave={() => setShowActionsHover(false)}>
      {showAvatar && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={avatarStyle}>
            <span style={{ color: 'var(--text-inverted)', fontSize: 12, fontWeight: isUser ? 500 : 600 }}>{isUser ? 'U' : 'N'}</span>
          </div>
        </div>
      )}

      <div style={contentWrapperStyle}>
        <div style={bubbleStyle}>
          {/* Render message content; format errors and JSON-like content for readability */}
          <div style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{(message.metadata?.error || contentIsJSONLike) ? renderFormattedContent(message.content) : <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>}</div>
        </div>

        {!isUser && message.metadata?.artifacts && message.metadata.artifacts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {message.metadata.artifacts.map((artifact: any, index: number) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenArtifact) onOpenArtifact(artifact, message.metadata?.artifacts);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onOpenArtifact) onOpenArtifact(artifact, message.metadata?.artifacts);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 8px', borderRadius: 8, background: 'rgba(247,248,250,1)', border: '1px solid rgba(229,231,235)', maxWidth: 320, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', cursor: 'pointer' }}
              >
                <ArtifactIcon type={artifact.artifact_type || artifact.type || 'unknown'} size={16} color={'#D4AF37'} />
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{artifact.title}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span style={timeStyle}>{formatTime(message.created_at)}</span>

          <div style={actionsContainerStyle}>
            <button onClick={handleCopy} title={language === 'ar' ? 'نسخ' : 'Copy'} style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              {copied ? <CheckCheck style={{ height: 14, width: 14, color: '#16a34a' }} /> : <Copy style={{ height: 14, width: 14, color: 'var(--text-secondary)' }} />}
            </button>

            {isUser && onEdit && (
              <button onClick={onEdit} title={language === 'ar' ? 'تعديل' : 'Edit'} style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Edit2 style={{ height: 14, width: 14, color: 'var(--text-secondary)' }} />
              </button>
            )}

            {!isUser && onFeedback && (
              <>
                <button onClick={() => handleFeedback(true)} title={language === 'ar' ? 'مفيد' : 'Helpful'} style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: feedback === 'up' ? '#16a34a' : 'var(--text-secondary)' }}>
                  <ThumbsUp style={{ height: 14, width: 14 }} />
                </button>
                <button onClick={() => handleFeedback(false)} title={language === 'ar' ? 'غير مفيد' : 'Not helpful'} style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: feedback === 'down' ? '#dc2626' : 'var(--text-secondary)' }}>
                  <ThumbsDown style={{ height: 14, width: 14 }} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
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
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: 'var(--text-inverted)', fontSize: 12, fontWeight: 600 }}>N</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent' }}>
        <Loader2 style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{text}</span>
      </div>
    </div>
  );
}
