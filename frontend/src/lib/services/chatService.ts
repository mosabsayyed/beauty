import { ChatRequest, ChatResponse, Conversation, ChatMessage, DebugLogs } from '../../types/chat';
import { safeJsonParse } from '../../utils/streaming';

// API base discovery
// - CRA exposes env via process.env.REACT_APP_*
// - Vite exposes env via import.meta.env.VITE_*
// We support both without ever referencing the global `process` identifier directly
// (which would throw in Vite/browser when no polyfill exists).
const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;

// If not set, fall back to relative API paths under /api/v1 so dev setups using
// a proxy or same-origin backend continue working.
const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
const API_PATH_PREFIX = API_BASE_URL ? '' : '/api/v1';

function buildUrl(endpointPath: string) {
  // endpointPath should start with '/'
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${API_BASE_URL || ''}${API_PATH_PREFIX}${path}`;
}

class ChatService {
  private async fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<Response> {
    let response: Response;
    const token = (() => {
      try { return localStorage.getItem('josoor_token'); } catch { return null; }
    })();

    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string,string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      response = await fetch(url, {
        headers,
        ...options,
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      // Throw a clearer error for network-level failures (DNS, CORS, server down, etc.)
      throw new Error(`Network error when fetching ${url}: ${errMsg}`);
    }

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      let errorData: any = undefined;
      try {
        errorData = await response.json();
        // Prefer common fields used by our backend and LLM responses
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData.llm_response) {
          errorMessage = typeof errorData.llm_response === 'string' ? errorData.llm_response : JSON.stringify(errorData.llm_response);
        }
      } catch (e) {
        // Keep original message if parsing fails
      }

      const err = new Error(errorMessage);
      (err as any).body = errorData;
      throw err;
    }

    return response;
  }

  // Artifact format adapter for chart compatibility
  private adaptArtifacts(response: any): any {
    if (response.artifacts) {
      response.artifacts = response.artifacts.map((artifact: any) => {
        const type = String(artifact.artifact_type || artifact.type || '').toLowerCase();
        if (type === 'chart' || type === 'table' || type === 'csv') {
          return this.adaptChartArtifact(artifact);
        }
        // Explicitly preserve HTML artifacts
        if (type === 'html') {
            return {
                ...artifact,
                artifact_type: 'HTML',
                // Ensure content is preserved
                content: artifact.content || artifact.html || artifact.body
            };
        }
        return artifact;
      });
    }
    if (response.visualizations) {
      response.visualizations = response.visualizations.map((artifact: any) => {
        const type = String(artifact.type || '').toLowerCase();
        if (type === 'html') {
             return {
                ...artifact,
                artifact_type: 'HTML',
                content: artifact.content || artifact.html || artifact.body
            };
        }
        return this.adaptChartArtifact(artifact);
      });
    }
    return response;
  }

  // Helper to parse CSV string into columns and rows
  private parseCsv(csv: string): { columns: string[], rows: any[][] } {
    if (!csv) return { columns: [], rows: [] };
    
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { columns: [], rows: [] };
    
    // Simple CSV parser handling quoted strings
    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          result.push(current.replace(/^"|"$/g, '').trim()); // Remove surrounding quotes
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.replace(/^"|"$/g, '').trim());
      return result;
    };

    const columns = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);
    return { columns, rows };
  }

  private adaptChartArtifact(artifact: any): any {

    const content = artifact.content || {};
    
    // TRUST THE BACKEND: If config exists, use it.
    // Handle case where config is at root (LLM output) or inside content
    const config = content.config || artifact.config;
    
    if (config) {
      console.log('[adaptChartArtifact] Has config, using config path');
      // CRITICAL: Preserve the type field from the artifact root if it exists
      // Backend sends visualizations with type at root level: {type: "column", title: "...", config: {...}}
      const chartType = artifact.type || content.chart?.type || content.type || 'bar';
      console.log('[adaptChartArtifact] Extracted chartType:', chartType);
      
      // Map headers to columns if needed (LLM outputs headers, TableRenderer expects columns)
      if (config.headers && !config.columns) {
        config.columns = config.headers;
      }

      // Determine artifact_type based on chartType
      let artifactType = artifact.artifact_type || 'CHART';
      if (String(chartType).toLowerCase() === 'table') {
        artifactType = 'TABLE';
      } else if (String(chartType).toLowerCase() === 'csv') {
        artifactType = 'TABLE'; // Render CSV as table
      }

      return {
        ...artifact,
        artifact_type: artifactType,
        content: {
          ...content,
          chart: { type: chartType },
          // Ensure config is preserved exactly as is
          config: config
        }
      };
    }

    // Check for direct CSV content or type
    if (artifact.type === 'csv' || content.type === 'csv' || content.csv) {
        const csvContent = content.csv || artifact.content; // Assuming content might be the raw CSV string if type is csv
        if (typeof csvContent === 'string') {
            const { columns, rows } = this.parseCsv(csvContent);
            return {
                ...artifact,
                artifact_type: 'TABLE',
                content: {
                    chart: { type: 'table' },
                    title: { text: artifact.title || 'CSV Data' },
                    columns,
                    rows
                }
            };
        }
    }

    // Fallback for legacy/other formats
    console.log('[adaptChartArtifact] No config, using fallback path');
    // Check artifact.type first (from backend visualizations), then content.chart.type, then content.type
    const chartType = artifact.type || content.chart?.type || content.type || 'bar';
    console.log('[adaptChartArtifact] Extracted chartType:', chartType);
    const titleText = content.title?.text || content.chart_title || artifact.title || '';
    const xCategories = content.xAxis?.categories || content.categories || [];
    const yAxis = content.yAxis || (content.y_axis_label ? { title: { text: content.y_axis_label } } : undefined);
    const series = content.series || [];

    // Determine artifact_type based on chartType
    let artifactType = artifact.artifact_type || 'CHART';
    if (String(chartType).toLowerCase() === 'table') {
      artifactType = 'TABLE';
    } else if (String(chartType).toLowerCase() === 'csv') {
        artifactType = 'TABLE';
    }

    const result = {
      ...artifact,
      artifact_type: artifactType,
      content: {
        chart: { type: chartType },
        title: { text: titleText },
        xAxis: { categories: xCategories },
        yAxis: yAxis,
        series,
      }
    };
    console.log('[adaptChartArtifact] Returning:', JSON.stringify(result, null, 2));
    return result;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Backend chat endpoints are namespaced under /chat (e.g. /api/v1/chat/message)
    const response = await this.fetchWithErrorHandling(buildUrl('/chat/message'), {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const data = await response.json();

    // Native pass-through mode: the backend now returns a mandated `llm_payload`
    // block (if available) and the full `raw_response`. Do NOT normalize or
    // remap fields—return the payload as-is so the UI can consume the exact
    // block the LLM produced.
    if (data && data.llm_payload) {
      const out: any = {
        conversation_id: data.conversation_id,
        llm_payload: data.llm_payload,
        raw_response: data.raw_response,
      };

      // If artifacts live inside the llm_payload, adapt them for frontend
      if (out.llm_payload && out.llm_payload.artifacts) {
        out.llm_payload.artifacts = this.adaptArtifacts(out.llm_payload).artifacts || out.llm_payload.artifacts;
      }

      return out;
    }

    // Fallback: return the whole response untouched
    return data;
  }

  // Accept an optional userId for legacy/demo uses, but do NOT default to 1.
  // In normal operation we do NOT pass user_id: the backend resolves the current
  // user using the Authorization token via the get_current_user dependency.
  // Passing user_id as a query param is a legacy pattern in example scripts; it
  // should not be used for production or normal flows. If `userId` is provided,
  // it will be appended to the query string to preserve compatibility.
  async getConversations(userId?: number, limit: number = 50): Promise<{ conversations: Conversation[] }> {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', `${limit}`);
    if (typeof userId === 'number') {
      queryParams.set('user_id', `${userId}`);
    }
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations?${queryParams.toString()}`)
    );
    return response.json();
  }

  async getConversationMessages(conversationId: number): Promise<{ messages: ChatMessage[] }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations/${conversationId}/messages`)
    );
    const data = await response.json();
    
    // Adapt artifacts in historical messages too
    if (data.messages && Array.isArray(data.messages)) {
      data.messages = data.messages.map((msg: any) => {
        // Check if message has metadata with artifacts or visualizations
        if (msg.metadata) {
          if (msg.metadata.artifacts) {
            msg.metadata.artifacts = this.adaptArtifacts({ artifacts: msg.metadata.artifacts }).artifacts;
          }
          if (msg.metadata.visualizations) {
            msg.metadata.visualizations = this.adaptArtifacts({ artifacts: msg.metadata.visualizations }).artifacts;
          }
        }
        return msg;
      });
    }
    
    return data;
  }

  async getDebugLogs(conversationId: number): Promise<DebugLogs> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/debug_logs/${conversationId}`)
    );
    return response.json();
  }

  async deleteConversation(conversationId: number): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations/${conversationId}`),
      {
        method: 'DELETE',
      }
    );
    return response.json();
  }

  async addConversationMessage(conversationId: number, role: 'user' | 'assistant', content: string, metadata: any = {}): Promise<{ ok: boolean }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations/${conversationId}/messages`),
      {
        method: 'POST',
        body: JSON.stringify({ role, content, metadata }),
      }
    );
    return response.json();
  }

  // Helper method to format error messages for display
  formatErrorMessage(error: Error): string {
    if (!error) return 'An unknown error occurred';
    let errorMessage = error.message || 'An unknown error occurred';

    const body = (error as any).body;

    // Use shared safeJsonParse that handles Markdown-wrapped JSON and noisy LLM output
    const tryParseJSON = (value: any) => {
      try {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object') return value;
        if (typeof value !== 'string') return null;
        return safeJsonParse(value);
      } catch (e) {
        return null;
      }
    };

    // Recursively search for a key in an object
    const findKeyRecursive = (obj: any, key: string): any => {
      if (!obj || typeof obj !== 'object') return null;
      if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
      for (const k of Object.keys(obj)) {
        try {
          const res = findKeyRecursive(obj[k], key);
          if (res !== null && res !== undefined) return res;
        } catch (_) {
          // ignore
        }
      }
      return null;
    };

    const pieces: string[] = [];

    // Primary message preference order
    const primaryMsg =
      (body && (body.message || (body.error && body.error.message) || body.detail || body.error || body.llm_response)) ||
      errorMessage;

    if (primaryMsg) {
      if (typeof primaryMsg === 'string') pieces.push(primaryMsg);
      else pieces.push(JSON.stringify(primaryMsg, null, 2));
    }

    // Helper to extract failed_generation from various nested shapes and escaped strings
    const extractFailedGeneration = (source: any) => {
      if (!source) return null;
      if (source.failed_generation) return source.failed_generation;
      if (source.error && source.error.failed_generation) return source.error.failed_generation;
      if (typeof source.message === 'string' && /failed_generation/.test(source.message)) {
        const parsed = tryParseJSON(source.message);
        if (parsed && parsed.failed_generation) return parsed.failed_generation;
      }
      if (typeof source.error === 'string' && /failed_generation/.test(source.error)) {
        const parsed = tryParseJSON(source.error);
        if (parsed && parsed.failed_generation) return parsed.failed_generation;
      }
      const foundDeep = findKeyRecursive(source, 'failed_generation');
      if (foundDeep) return foundDeep;
      return null;
    };

    let failedGen: any = null;
    if (body) {
      failedGen = extractFailedGeneration(body) || null;
    } else {
      const m = (errorMessage || '').match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = tryParseJSON(m[0]);
        if (parsed) failedGen = extractFailedGeneration(parsed) || null;
      }
    }

    if (failedGen) {
      const parsedFG = tryParseJSON(failedGen) || failedGen;

      pieces.push('');
      if (parsedFG && typeof parsedFG === 'object') {
        if (parsedFG.name) pieces.push(`Tool attempted: ${parsedFG.name}`);

        const args = parsedFG.arguments || parsedFG.args || parsedFG.parameters || null;
        if (args) {
          if (args.answer) {
            pieces.push('Answer:');
            pieces.push(typeof args.answer === 'string' ? args.answer : JSON.stringify(args.answer, null, 2));
          }

          if (args.clarification_needed) pieces.push(`Clarification needed: ${Boolean(args.clarification_needed)}`);

          if (Array.isArray(args.questions) && args.questions.length > 0) {
            pieces.push('Questions:');
            args.questions.forEach((q: any, i: number) => pieces.push(`${i + 1}. ${q}`));
          }

          const otherArgs = { ...args };
          delete otherArgs.answer;
          delete otherArgs.clarification_needed;
          delete otherArgs.questions;
          if (Object.keys(otherArgs).length > 0) {
            pieces.push('Tool arguments (additional):');
            pieces.push(JSON.stringify(otherArgs, null, 2));
          }
        } else {
          pieces.push('Failed generation details:');
          pieces.push(JSON.stringify(parsedFG, null, 2));
        }
      } else {
        pieces.push('Failed generation (raw):');
        pieces.push(String(parsedFG));
      }

      return pieces.filter(Boolean).join('\n\n');
    }

    if (body) {
      try {
        if (typeof body === 'string') {
          pieces.push(body);
        } else if (body.detail) {
          pieces.push(typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail, null, 2));
        } else if (body.message) {
          pieces.push(typeof body.message === 'string' ? body.message : JSON.stringify(body.message, null, 2));
        } else if (body.error) {
          pieces.push(typeof body.error === 'string' ? body.error : JSON.stringify(body.error, null, 2));
        } else if (body.llm_response) {
          pieces.push(typeof body.llm_response === 'string' ? body.llm_response : JSON.stringify(body.llm_response, null, 2));
        } else {
          pieces.push(JSON.stringify(body, null, 2));
        }
      } catch (e) {
        // fall back
      }

      return pieces.filter(Boolean).join('\n\n');
    }

    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const errorObj = tryParseJSON(jsonMatch[0]);
        if (errorObj) {
          const final = errorObj.detail || errorObj.message || JSON.stringify(errorObj, null, 2) || errorMessage;
          return final;
        }
      }
    } catch (e) {
      // ignore
    }

    return errorMessage;
  }
}

export const chatService = new ChatService();
