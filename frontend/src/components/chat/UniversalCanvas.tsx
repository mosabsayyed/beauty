/**
 * UniversalCanvas - Auto-detecting polymorphic renderer
 * Intelligently detects content type and routes to specialized renderers
 */

import { CodeRenderer, MarkdownRenderer, MediaRenderer, ExcelRenderer, FileRenderer, HtmlRenderer } from './renderers';
import { ArtifactRenderer } from './ArtifactRenderer';
import type { Artifact } from '../../types/api';

interface UniversalCanvasProps {
  content?: any;
  title?: string;
  type?: string;
  artifact?: any; // Support passing artifact directly (flat or wrapped)
}

// Content type detection
function detectContentType(content: any, explicitType?: string): {
  type: 'code' | 'markdown' | 'html' | 'image' | 'video' | 'audio' | 'excel' | 'file' | 'artifact' | 'json' | 'chart' | 'table';
  language?: string;
  url?: string;
} {
  // PRIORITY 1: String content - check for HTML documents first
  if (typeof content === 'string') {
    const trimmed = content.trim();
    
    // HTML document (complete HTML file)
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || (trimmed.startsWith('<') && trimmed.includes('<html'))) {
      return { type: 'html' };
    }
  }

  // PRIORITY 2: Check if it's a visualization object from the LLM
  // Format: { type: 'table'|'chart'|'column'|'bar', title, config, data }
  if (content && typeof content === 'object' && content.type) {
    const vizType = String(content.type).toLowerCase();
    
    // Known chart types
    if (['chart', 'column', 'bar', 'line', 'area', 'pie', 'radar', 'bubble', 'bullet', 'combo', 'scatter'].includes(vizType)) {
      return { type: 'chart' };
    }
    
    // Table
    if (vizType === 'table') {
      return { type: 'table' };
    }
    
    // Fallback: If it has config and data, assume it's a chart
    if (content.config && content.data) {

      return { type: 'chart' };
    }
  }

  // PRIORITY 3: Check if it's an Artifact object (from existing system)
  if (content && typeof content === 'object' && 'artifact_type' in content) {
    return { type: 'artifact' };
  }

  // PRIORITY 3: Explicit type provided
  if (explicitType) {
    const lower = explicitType.toLowerCase();
    
    if (['python', 'javascript', 'typescript', 'sql', 'java', 'cpp', 'go', 'rust'].includes(lower)) {
      return { type: 'code', language: lower };
    }
    if (lower === 'markdown' || lower === 'md') return { type: 'markdown' };
    if (lower === 'html') return { type: 'html' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(lower)) return { type: 'image' };
    if (['mp4', 'webm', 'ogg'].includes(lower)) return { type: 'video' };
    if (['mp3', 'wav', 'ogg'].includes(lower)) return { type: 'audio' };
    if (['csv', 'xlsx', 'xls'].includes(lower)) return { type: 'excel' };
    if (['pdf', 'docx', 'pptx'].includes(lower)) return { type: 'file' };
  }

  // PRIORITY 4: String content - detect by pattern
  if (typeof content === 'string') {
    const trimmed = content.trim();
    
    // HTML
    if (trimmed.startsWith('<') && trimmed.includes('>')) {
      return { type: 'html' };
    }
    
    // Markdown (has headers, lists, or code blocks)
    if (/^#{1,6}\s/.test(trimmed) || /^[-*+]\s/.test(trimmed) || /```/.test(trimmed)) {
      return { type: 'markdown' };
    }
    
    // Code (has common code patterns)
    if (/^(def |class |function |import |from |const |let |var |SELECT |CREATE )/.test(trimmed)) {
      // Detect language
      if (/^(def |class |import |from )/.test(trimmed)) return { type: 'code', language: 'python' };
      if (/^(function |const |let |var |import )/.test(trimmed)) return { type: 'code', language: 'javascript' };
      if (/^(SELECT |CREATE |INSERT |UPDATE |DELETE )/.test(trimmed)) return { type: 'code', language: 'sql' };
      return { type: 'code', language: 'text' };
    }
    
    // URL (image/video/audio)
    if (/^https?:\/\//.test(trimmed)) {
      if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmed)) return { type: 'image', url: trimmed };
      if (/\.(mp4|webm|ogg)$/i.test(trimmed)) return { type: 'video', url: trimmed };
      if (/\.(mp3|wav|ogg)$/i.test(trimmed)) return { type: 'audio', url: trimmed };
    }
    
    // CSV (has commas and newlines)
    if (trimmed.includes(',') && trimmed.includes('\n')) {
      return { type: 'excel' };
    }
    
    // Markdown Image (standalone)
    const markdownImageRegex = /^!\[.*?\]\((.*?)\)$/;
    const imageMatch = trimmed.match(markdownImageRegex);
    if (imageMatch) {
      return { type: 'image', url: imageMatch[1] };
    }

    // Default to markdown for plain text
    return { type: 'markdown' };
  }

  // PRIORITY 5: Array of arrays (Excel data)
  if (Array.isArray(content) && Array.isArray(content[0])) {
    return { type: 'excel' };
  }

  // LAST RESORT: Object - render as JSON
  if (typeof content === 'object') {
    return { type: 'json' };
  }

  return { type: 'markdown' };
}

export function UniversalCanvas(props: UniversalCanvasProps) {
  const { content: propsContent, title, type, artifact } = props;
  
  // Support both calling patterns:
  // 1. CanvasPanel: passes content, title, type directly
  // 2. MessageBubble: might pass artifact (flat visualization object)
  const content = propsContent || artifact?.content || artifact || {};
  const detected = detectContentType(content, type || artifact?.artifact_type);

  // Debug log for content detection
  console.log('[UniversalCanvas] DEBUG RENDER:', {
    propsContent,
    artifact,
    resolvedContent: content,
    detectedType: detected,
    hasContent: !!content,
    keys: content ? Object.keys(content) : []
  });

  if (!content || Object.keys(content).length === 0) return null;

  // Render based on detected type
  switch (detected.type) {
    case 'html':
      return (
        <HtmlRenderer 
          html={typeof content === 'string' ? content : (content.content || '')} 
          title={title} 
        />
      );

    case 'markdown':
      return (
        <MarkdownRenderer 
          content={typeof content === 'string' ? content : (content.content || '')} 
          title={title}
        />
      );

    case 'code':
      return (
        <CodeRenderer 
          code={typeof content === 'string' ? content : (content.content || '')}
          language={detected.language || 'text'}
          title={title}
        />
      );

    case 'image':
    case 'video':
    case 'audio':
      return (
        <MediaRenderer 
          type={detected.type}
          url={detected.url || (typeof content === 'string' ? content : content.url)}
          title={title}
        />
      );

    case 'excel':
      return (
        <ExcelRenderer 
          data={Array.isArray(content) ? content : undefined}
          csvContent={typeof content === 'string' ? content : undefined}
          title={title}
        />
      );

    case 'file':
      return (
        <FileRenderer
          url={content.url}
          filename={content.filename || 'download'}
          size={content.size}
          type={content.fileType}
          content={content.content}
        />
      );

    case 'chart':
    case 'table':
      // At this point, content is the raw visualization object from the LLM
      // We need to wrap it in the Artifact interface for ArtifactRenderer
      console.log('[UniversalCanvas] Rendering chart/table with content:', {
        detectedType: detected.type,
        content: content,
        config: content.config,
        data: content.config?.data || content.data,
        typeField: content.type  // CHECK IF TYPE EXISTS HERE
      });
      
      let artifactType = detected.type === 'chart' ? 'CHART' : 'TABLE';
      
      // Detect if it's actually a table disguised as a chart
      if (detected.type === 'chart' && (content.chart?.type === 'table' || content.type === 'table')) {
         artifactType = 'TABLE';
      }

      const artifactForRenderer = {
        artifact_type: artifactType,
        title: content.title || title || 'Untitled',
        description: content.description,
        // CRITICAL FIX: Preserve the type field from the original content
        content: {
          ...(content.config || content),
          // If content has a type field at root, preserve it as chart.type
          ...(content.type && { chart: { type: content.type } })
        },
        // Also expose data at the top level for convenience
        data: content.config?.data || content.data, 
      };

      console.log('[UniversalCanvas] Created artifactForRenderer:', artifactForRenderer);
      console.log('[UniversalCanvas] Created artifactForRenderer:', artifactForRenderer);
      return (
        <div style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <ArtifactRenderer artifact={artifactForRenderer as Artifact} />
        </div>
      );

    case 'artifact':
      return <ArtifactRenderer artifact={content as Artifact} />;

    case 'json':
      return (
        <CodeRenderer 
          code={JSON.stringify(content, null, 2)}
          language="json"
          title={title}
        />
      );

    default:
      return (
        <div style={{ padding: 24 }}>
          <p>Unable to render content</p>
          <pre style={{ fontSize: 12, color: '#666' }}>
            {JSON.stringify({ detected, content }, null, 2)}
          </pre>
        </div>
      );
  }
}
