const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;
const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
const API_PATH_PREFIX = API_BASE ? '' : '/api/v1';

export type MCPEntry = {
  label: string;
  url: string;
  allowed_tools: string[];
};

export type AdminSettings = {
  provider: {
    local_llm_enabled: boolean;
    local_llm_base_url?: string | null;
    local_llm_model?: string | null;
    local_llm_timeout?: number;
    use_responses_api?: boolean;
    openrouter_api_endpoint?: string | null;
    openrouter_model_primary?: string | null;
    openrouter_model_fallback?: string | null;
    openrouter_model_alt?: string | null;
    max_output_tokens?: number;
    temperature?: number;
  };
  mcp: {
    endpoints: MCPEntry[];
    persona_bindings: Record<string, string>;
  };
  updated_at?: string;
  updated_by?: string;
  audit?: any[];
};

function buildUrl(path: string) {
  return `${API_BASE}${API_PATH_PREFIX}${path}`;
}

export async function fetchSettings(token: string | null): Promise<AdminSettings> {
  const res = await fetch(buildUrl('/admin/settings'), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
  const json = await res.json();
  return json as AdminSettings;
}

export async function saveSettings(settings: AdminSettings, token: string | null): Promise<AdminSettings> {
  const res = await fetch(buildUrl('/admin/settings'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to save settings (${res.status})`);
  }
  const json = await res.json();
  return json as AdminSettings;
}
