import { ChatRequest, ChatResponse, Conversation, ChatMessage, DebugLogs } from '../types/chat';

// Use REACT_APP_API_URL (recommended) or REACT_APP_API_BASE for backwards compatibility.
// If not set, fall back to relative API paths under /api/v1 so development setups using
// a proxy or same-origin backend continue working.
const RAW_API_BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || '';
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
        if (artifact.artifact_type === 'CHART') {
          return this.adaptChartArtifact(artifact);
        }
        return artifact;
      });
    }
    return response;
  }

  private adaptChartArtifact(artifact: any): any {
    const content = artifact.content || {};
    // Support both legacy flattened chart content and Highcharts-style content
    const chartType = content.chart?.type || content.type || 'bar';
    const titleText = content.title?.text || content.chart_title || artifact.title || '';
    const xCategories = content.xAxis?.categories || content.categories || [];
    const yAxis = content.yAxis || (content.y_axis_label ? { title: { text: content.y_axis_label } } : undefined);
    const series = content.series || [];

    return {
      ...artifact,
      content: {
        chart: { type: chartType },
        title: { text: titleText },
        xAxis: { categories: xCategories },
        yAxis: yAxis,
        series,
      }
    };
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Backend chat endpoints are namespaced under /chat (e.g. /api/v1/chat/message)
    const response = await this.fetchWithErrorHandling(buildUrl('/chat/message'), {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return this.adaptArtifacts(data);
  }

  async getConversations(userId: number = 1, limit: number = 50): Promise<{ conversations: Conversation[] }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations?user_id=${userId}&limit=${limit}`)
    );
    return response.json();
  }

  async getConversationMessages(conversationId: number): Promise<{ messages: ChatMessage[] }> {
    const response = await this.fetchWithErrorHandling(
      buildUrl(`/chat/conversations/${conversationId}/messages`)
    );
    return response.json();
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

  // Helper method to format error messages for display
  formatErrorMessage(error: Error): string {
    if (!error) return 'An unknown error occurred';
    let errorMessage = error.message || 'An unknown error occurred';

    const body = (error as any).body;

    // Utility: robust attempt to parse JSON from a string, handling nested and double-escaped JSON
    const tryParseJSON = (value: any, maxDepth = 10): any => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'object') return value;
      if (typeof value !== 'string') return null;

      const unescapeCommon = (s: string) => String(s).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');

      const extractJsonSubstrings = (s: string) => {
        const matches: string[] = [];
        const re = /\{[\s\S]*?\}/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(s)) !== null) matches.push(m[0]);
        return matches;
      };

      let candidate: any = value;
      for (let depth = 0; depth < maxDepth; depth++) {
        if (typeof candidate !== 'string') return candidate;
        // Quick parse attempt
        try {
          const parsed = JSON.parse(candidate);
          candidate = parsed;
          if (typeof candidate !== 'string') return candidate;
          continue;
        } catch (e) {
          // Remove surrounding quotes if the entire string is quoted
          const stripped = String(candidate).replace(/^\s*"([\s\S]*)"\s*$/,'$1');
          if (stripped !== candidate) candidate = stripped;

          // Unescape common sequences
          const un = unescapeCommon(candidate);
          if (un !== candidate) candidate = un;

          // Extract any JSON-like substrings and try parsing them
          const subs = extractJsonSubstrings(candidate);
          if (subs.length > 0) {
            for (const sub of subs) {
              try {
                const p = JSON.parse(sub);
                return p;
              } catch (_) {
                try {
                  const p2 = JSON.parse(unescapeCommon(sub));
                  return p2;
                } catch (_) {
                  // continue trying other substrings
                }
              }
            }
            // if substrings exist but none parsed, set candidate to first substring and continue
            candidate = subs[0];
            continue;
          }

          // nothing left to try
          return null;
        }
      }

      // Final attempt
      if (typeof candidate === 'string') {
        try { return JSON.parse(candidate); } catch (_) { return null; }
      }
      return candidate;
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
