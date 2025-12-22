import { safeJsonParse } from '../utils/streaming';

const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;

const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
const API_PATH_PREFIX = API_BASE_URL ? '' : '/api/v1';

function buildUrl(endpointPath: string) {
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${API_BASE_URL || ''}${API_PATH_PREFIX}${path}`;
}

export interface ChainResponse {
  chain_key: string;
  id: string;
  year: number;
  count: number;
  results: any[];
  clarification_needed: boolean;
  description?: string;
  summary?: string;
}

export interface ChainSampleResponse {
  chain_key: string;
  has_sample: boolean;
  id?: string;
  year?: number;
  count?: number;
  summary?: string;
}

class ChainsService {
  private async fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<Response> {
    let response: Response;
    const token = (() => {
      try { return localStorage.getItem('josoor_token'); } catch { return null; }
    })();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      response = await fetch(url, { headers, ...options });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      throw new Error(`Network error when fetching ${url}: ${errMsg}`);
    }

    if (!response.ok) {
      let message = `Server error: ${response.status} ${response.statusText}`;
      try {
        const body = await response.text();
        if (body) {
          const parsed = safeJsonParse(body) || body;
          message = typeof parsed === 'string' ? parsed : (parsed?.detail || parsed?.message || message);
        }
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    return response;
  }

  async executeChain(chainKey: string, id: string, year: number): Promise<ChainResponse> {
    const url = buildUrl(`/chains/${encodeURIComponent(chainKey)}`) + `?id=${encodeURIComponent(id)}&year=${year}`;
    const res = await this.fetchWithErrorHandling(url, { method: 'GET' });
    const data = await res.json();
    return data as ChainResponse;
  }

  async getSample(chainKey: string, probeLimit: number = 10): Promise<ChainSampleResponse> {
    const url = buildUrl(`/chains/sample/${encodeURIComponent(chainKey)}`) + `?probe_limit=${probeLimit}`;
    const res = await this.fetchWithErrorHandling(url, { method: 'GET' });
    const data = await res.json();
    return data as ChainSampleResponse;
  }
}

export const chainsService = new ChainsService();
