import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';

interface HtmlRendererProps {
  // Accept either a direct HTML string via `html` or an entire `artifact`
  // object (legacy callers pass the artifact directly). The renderer will
  // extract the HTML from known fields when given an artifact.
  html?: string | any;
  artifact?: any;
  title?: string;
}



export function HtmlRenderer({ html, artifact, title }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');

  // Debug: log when HtmlRenderer mounts/receives props so we can trace invocation




  useEffect(() => {
    // Determine the raw candidate HTML string. Support these input shapes:
    //  - html is a string (preferred)
    //  - html is an artifact object (legacy callers)
    //  - artifact prop provided (artifact object)
    let candidate: string = '';
    try {
      if (typeof html === 'string' && html.trim()) {
        candidate = html;
      } else if (html && typeof html === 'object') {
        // html was passed but it's actually an artifact object; fall through
        const art = html;
        candidate = String(art.content?.body || art.content?.html || art.content?.config?.html_content || art.resolved_html || art.content || '');
      } else if (artifact && typeof artifact === 'object') {
        candidate = String(artifact.content?.body || artifact.content?.html || artifact.content?.config?.html_content || artifact.resolved_html || artifact.content || '');
      }
    } catch (_) {
      candidate = '';
    }

    if (!candidate) {
      setSanitizedHtml('');
      return;
    }

    // Attempt to unescape common HTML-escaped sequences the LLM may include
    candidate = candidate.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    candidate = candidate.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    // If candidate looks like a full HTML document, extract the body inner HTML so
    // we render only the meaningful content inside our container (embedding full
    // <html> documents into a div can produce unexpected behavior).
    const extractBody = (docString: string) => {
      try {
        const bodyMatch = docString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) return bodyMatch[1];
        const htmlMatch = docString.match(/<html[^>]*>([\s\S]*)<\/html>/i);
        if (htmlMatch && htmlMatch[1]) return htmlMatch[1];
        // Fallback: remove <!doctype ...> and <head>...</head>
        let s = docString.replace(/<!doctype[\s\S]*?>/i, '');
        s = s.replace(/<head[\s\S]*?>[\s\S]*?<\/head>/i, '');
        return s;
      } catch (_) {
        return docString;
      }
    };

    if (/^\s*<!doctype/i.test(candidate) || /<html[\s\S]*>/i.test(candidate)) {
      candidate = extractBody(candidate);
    }

    // Use default DOMPurify sanitization first (avoid passing unstable config keys)
    let clean = DOMPurify.sanitize(candidate);

    // As an extra safety layer, strip any remaining <script>, <style> or stylesheet links from the string
    try {
      clean = clean.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
      // clean = clean.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
      clean = clean.replace(/<link[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '');
    } catch (e) {
      // ignore replace errors
    }

    // Debug logging to help trace visibility issues
    try {

      const preview = (clean || '').slice(0, 200);
      console.debug('[HtmlRenderer] preview:', preview);
    } catch (_) {}

    setSanitizedHtml(clean);
  }, [html, artifact]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 200,
    fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial)',
    color: 'var(--component-text, inherit)',
    lineHeight: 1.45,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  // Post-render cleanup: remove any leftover scripts/styles and strip event handler attributes
  useEffect(() => {
    if (!containerRef.current) return;
    const root = containerRef.current;

    // Remove script/style/link nodes
    // root.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(n => n.remove());
    root.querySelectorAll('script, link[rel="stylesheet"]').forEach(n => n.remove());

    // Remove event handler attributes (onclick, onerror, etc.) for all elements
    root.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes || []).forEach(attr => {
        if (/^on/i.test(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
      // Ensure external links open safely
      if (el.tagName === 'A') {
        try {
          el.setAttribute('rel', 'noopener noreferrer');
          if (!el.getAttribute('target')) el.setAttribute('target', '_blank');
        } catch (_) {}
      }
    });

    // Additional debug: log innerText length so we can see if content exists but invisible
    try {
      console.debug('[HtmlRenderer] container innerText length:', root.innerText?.length || 0);
      console.debug('[HtmlRenderer] container child nodes:', root.childNodes.length);
    } catch (_) {}
  }, [sanitizedHtml]);

  // Scoped styles for the renderer content
  const scopedStyles = `
    .html-renderer-inner {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      color: var(--component-text-primary);
      line-height: 1.6;
    }
    .html-renderer-inner h1, .html-renderer-inner h2, .html-renderer-inner h3, .html-renderer-inner h4, .html-renderer-inner h5, .html-renderer-inner h6 {
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      color: var(--component-text-primary);
      line-height: 1.3;
    }
    .html-renderer-inner h1 { font-size: 1.8em; border-bottom: 1px solid var(--component-panel-border); padding-bottom: 0.3em; }
    .html-renderer-inner h2 { font-size: 1.5em; }
    .html-renderer-inner h3 { font-size: 1.25em; }
    .html-renderer-inner p { margin-top: 0; margin-bottom: 1em; }
    .html-renderer-inner a { color: var(--component-text-accent); text-decoration: none; }
    .html-renderer-inner a:hover { text-decoration: underline; }
    .html-renderer-inner code { 
      font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace; 
      background: rgba(0, 0, 0, 0.2); 
      padding: 0.2em 0.4em; 
      border-radius: 0.25em; 
      font-size: 0.9em;
      color: var(--component-text-accent);
    }
    .html-renderer-inner pre { 
      background: rgba(0, 0, 0, 0.2); 
      color: var(--component-text-primary); 
      padding: 1em; 
      border-radius: 0.5em; 
      overflow-x: auto; 
      border: 1px solid var(--component-panel-border);
    }
    .html-renderer-inner pre code { background: transparent; padding: 0; color: inherit; }
    .html-renderer-inner table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 1.5em; 
      font-size: 0.95em;
    }
    .html-renderer-inner th, .html-renderer-inner td { 
      border: 1px solid var(--component-panel-border); 
      padding: 0.75em; 
      text-align: left; 
      color: var(--component-text-primary);
    }
    .html-renderer-inner th { 
      background: rgba(255, 255, 255, 0.05); 
      font-weight: 600; 
      color: var(--component-text-accent);
    }
    .html-renderer-inner tr:nth-child(even) {
      background: rgba(255, 255, 255, 0.02);
    }
    .html-renderer-inner ul, .html-renderer-inner ol {
      padding-left: 1.5em;
      margin-bottom: 1em;
    }
    .html-renderer-inner li {
      margin-bottom: 0.5em;
    }
    .html-renderer-inner blockquote {
      border-left: 4px solid var(--component-accent);
      margin: 0 0 1em 0;
      padding-left: 1em;
      color: var(--component-text-secondary);
      font-style: italic;
    }
  `;

  return (
    <div className="html-renderer-wrapper" style={{ padding: 8 }} aria-label={title || 'HTML content'}>
      <style>{scopedStyles}</style>
      <div
        ref={containerRef}
        className="html-renderer-inner"
        style={containerStyle}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
