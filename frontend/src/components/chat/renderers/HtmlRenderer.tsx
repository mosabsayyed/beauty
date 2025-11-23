import { useEffect, useRef } from 'react';

interface HtmlRendererProps {
  html: string;
  title?: string;
}

const GLOBAL_STYLES = `
  /* Tailwind CSS v3 Base */
  *, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
  html { line-height: 1.5; -webkit-text-size-adjust: 100%; -moz-tab-size: 4; tab-size: 4; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
  body { margin: 0; line-height: inherit; }
  hr { height: 0; color: inherit; border-top-width: 1px; }
  
  /* Custom Scrollbar */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* Typography */
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; color: #111827; }
  h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: #111827; }
  p { margin-top: 0; margin-bottom: 1em; }
  a { color: #d97706; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace; background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.9em; }
  pre { background: #1f2937; color: #f9fafb; padding: 1em; border-radius: 0.5em; overflow-x: auto; }
  pre code { background: transparent; padding: 0; color: inherit; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
  th, td { border: 1px solid #e5e7eb; padding: 0.5em; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
`;

export function HtmlRenderer({ html, title }: HtmlRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Inject content and styles
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${GLOBAL_STYLES}</style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    doc.close();
  }, [html]);

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      {title && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
          {title}
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full flex-1 border-none"
        title={title || "HTML Content"}
        sandbox="allow-scripts allow-same-origin allow-popups"
        style={{ height: '100%', minHeight: '600px' }}
      />
    </div>
  );
}
