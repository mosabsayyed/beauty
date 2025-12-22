import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Brain,
  Zap,
  MessageSquare,
  ArrowLeft,
  Code,
  Eye,
  Layers,
  Settings as SettingsIcon,
  Plus,
  Save,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchSettings,
  saveSettings,
  AdminSettings,
  MCPEntry,
} from '../services/adminSettingsService';
import './ObservabilityPage.css';
import { useCallback } from 'react';

// Use same pattern as chatService for API base URL (CRA + Vite)
const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;
const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';

interface Trace {
  conversation_id: string;
  created_at: string;
  query: string;
  persona: string;
  tool_calls_count: number;
  has_error: boolean;
  file_size: number;
  turns: number;
}

interface ToolCall {
  tool: string;
  server: string;
  arguments: string;
}

interface TimelineEvent {
  timestamp: string;
  type: string;
  layer: string;
  data: any;
}

interface TraceDetail {
  conversation_id: string;
  created_at: string;
  turns: any[];
  timeline: TimelineEvent[];
  tool_calls: ToolCall[];
  reasoning: any[];
  mcp_operations: any[];
  errors: any[];
  raw: any;
}

// Admin settings types
type TabKey = 'traces' | 'admin-settings';
const TOOL_OPTIONS = ['recall_memory', 'retrieve_instructions', 'read_neo4j_cypher'];

// ============================================================================
// TRACE LIST COMPONENT
// ============================================================================
function TraceList({ 
  traces, 
  selectedId, 
  onSelect, 
  onRefresh,
  loading 
}: { 
  traces: Trace[]; 
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="trace-list-panel">
      <div className="trace-list-header">
        <h3 className="trace-list-title">
          <Layers className="icon-md" />
          Conversation Traces
        </h3>
        <button 
          className={`trace-list-refresh ${loading ? 'loading' : ''}`}
          onClick={onRefresh} 
          disabled={loading}
        >
          <RefreshCw className="icon-md" />
        </button>
      </div>
      <div className="trace-list-content">
        {traces.map((trace) => (
          <div
            key={trace.conversation_id}
            onClick={() => onSelect(trace.conversation_id)}
            className={`trace-item ${selectedId === trace.conversation_id ? 'selected' : ''}`}
          >
            <div className="trace-item-header">
              <span className="trace-item-id">
                #{trace.conversation_id}
              </span>
              <div className="trace-item-status">
                {trace.has_error ? (
                  <AlertCircle className="status-icon error" />
                ) : (
                  <CheckCircle className="status-icon success" />
                )}
                <span className={`badge ${trace.persona === 'maestro' ? 'badge-default' : 'badge-secondary'}`}>
                  {trace.persona}
                </span>
              </div>
            </div>
            <p className="trace-item-query">
              {trace.query || 'No query'}
            </p>
            <div className="trace-item-meta">
              <span>
                <Zap className="icon-sm" />
                {trace.tool_calls_count} tools
              </span>
              <span>
                <Clock className="icon-sm" />
                {trace.created_at}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE COMPONENT
// ============================================================================
function Timeline({ events }: { events: TimelineEvent[] }) {
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

  const toggleEvent = (index: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (type: string) => {
    if (type.includes('llm')) return <Brain className="icon-md" style={{ color: '#A855F7' }} />;
    if (type.includes('tier1')) return <Database className="icon-md" style={{ color: '#3B82F6' }} />;
    if (type.includes('groq')) return <Cpu className="icon-md" style={{ color: '#10B981' }} />;
    if (type.includes('parse')) return <Code className="icon-md" style={{ color: '#F97316' }} />;
    if (type.includes('error') || type.includes('failed')) return <AlertCircle className="icon-md" style={{ color: '#EF4444' }} />;
    return <MessageSquare className="icon-md" style={{ color: '#6B7280' }} />;
  };

  const getEventClass = (type: string) => {
    if (type.includes('error') || type.includes('failed')) return 'error';
    if (type.includes('groq_full_trace')) return 'success';
    if (type.includes('tier1')) return 'tier1';
    return '';
  };

  return (
    <div>
      {events.map((event, index) => (
        <div
          key={index}
          className={`timeline-event ${getEventClass(event.type)}`}
        >
          <div
            className="timeline-event-header"
            onClick={() => toggleEvent(index)}
          >
            <div className="timeline-event-left">
              {getEventIcon(event.type)}
              <span className="timeline-event-type">{event.type}</span>
              <span className="badge badge-outline">{event.layer}</span>
            </div>
            <div className="timeline-event-right">
              <span className="timeline-event-time">{event.timestamp}</span>
              {expandedEvents.has(index) ? (
                <ChevronDown className="icon-md" />
              ) : (
                <ChevronRight className="icon-md" />
              )}
            </div>
          </div>
          {expandedEvents.has(index) && (
            <div className="timeline-event-data">
              <pre className="code-block">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// REASONING PANEL
// ============================================================================
function normalizeThought(thought: unknown): Array<{ text: string; type?: string }> {
  if (!thought) return [];

  if (Array.isArray(thought)) {
    return thought
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return { text: item };
        if (typeof item === 'object' && 'text' in (item as any)) {
          const text = (item as any).text;
          const type = (item as any).type;
          return { text: typeof text === 'string' ? text : JSON.stringify(text), type };
        }
        return { text: JSON.stringify(item) };
      })
      .filter((x) => Boolean(x)) as { text: string; type?: string }[];
  }

  if (typeof thought === 'string') return [{ text: thought }];

  if (typeof thought === 'object') {
    const maybeText = (thought as any).text;
    const maybeType = (thought as any).type;
    if (typeof maybeText === 'string') return [{ text: maybeText, type: maybeType }];
    if (maybeText != null) return [{ text: JSON.stringify(maybeText), type: maybeType }];
    return [{ text: JSON.stringify(thought) }];
  }

  return [{ text: String(thought) }];
}

function ReasoningPanel({ reasoning }: { reasoning: any[] }) {
  if (!reasoning || reasoning.length === 0) {
    return (
      <div className="reasoning-empty">
        <Brain />
        <p>No reasoning steps captured</p>
      </div>
    );
  }

  return (
    <div>
      {reasoning.map((step, index) => (
        <div key={index} className="reasoning-step">
          <div className="reasoning-step-header">
            <Brain />
            Reasoning Step {index + 1}
          </div>
          <div className="reasoning-step-content">
            {normalizeThought(step?.thought ?? step?.text ?? step).map((t, i) => (
              <div key={i} className="reasoning-thought">
                {t.text}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// TOOL CALLS PANEL
// ============================================================================
function ToolCallsPanel({ toolCalls, mcpOps }: { toolCalls: ToolCall[]; mcpOps: any[] }) {
  return (
    <div>
      {/* Available Tools */}
      {mcpOps && mcpOps.length > 0 && (
        <div className="mcp-tools-card">
          <div className="mcp-tools-header">
            <Database />
            MCP Tools Available
          </div>
          <div className="mcp-tools-list">
            {mcpOps[0]?.tools?.map((tool: string) => (
              <span key={tool} className="badge badge-outline">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tool Calls */}
      {toolCalls.map((tc, index) => (
        <div key={index} className="tool-call-card">
          <div className="tool-call-header">
            <Zap />
            {tc.tool}
            <span className="badge badge-secondary">{tc.server}</span>
          </div>
          <div className="tool-call-content">
            <pre className="code-block">
              {JSON.stringify(JSON.parse(tc.arguments || '{}'), null, 2)}
            </pre>
          </div>
        </div>
      ))}

      {toolCalls.length === 0 && (
        <div className="tools-empty">
          <Zap />
          <p>No tool calls made</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ERRORS PANEL
// ============================================================================
function ErrorsPanel({ errors }: { errors: any[] }) {
  if (!errors || errors.length === 0) {
    return (
      <div className="errors-success">
        <CheckCircle />
        <p>No errors detected</p>
      </div>
    );
  }

  return (
    <div>
      {errors.map((error, index) => (
        <div key={index} className="error-card">
          <div className="error-card-header">
            <AlertCircle />
            {error.type}
          </div>
          <div className="error-card-content">
            <pre className="code-block error-code-block">
              {JSON.stringify(error.data, null, 2)}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// TRACE DETAIL VIEW COMPONENT
// ============================================================================
function TraceDetailView({ trace, onBack }: { trace: TraceDetail; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('timeline');

  return (
    <div className="trace-detail">
      {/* Header */}
      <div className="trace-detail-header">
        <div className="trace-detail-header-left">
          <button className="trace-detail-back" onClick={onBack}>
            <ArrowLeft className="icon-md" />
          </button>
          <div>
            <h2 className="trace-detail-title">
              Trace #{trace.conversation_id}
            </h2>
            <p className="trace-detail-date">{trace.created_at}</p>
          </div>
        </div>
        <div className="trace-detail-badges">
          <span className="badge badge-outline">
            {trace.tool_calls.length} Tool Calls
          </span>
          <span className={`badge ${trace.errors.length > 0 ? 'badge-destructive' : 'badge-success'}`}>
            {trace.errors.length > 0 ? `${trace.errors.length} Errors` : 'Success'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <MessageSquare className="summary-card-icon blue" />
          <div>
            <p className="summary-card-value">{trace.turns.length}</p>
            <p className="summary-card-label">Turns</p>
          </div>
        </div>
        <div className="summary-card">
          <Zap className="summary-card-icon green" />
          <div>
            <p className="summary-card-value">{trace.tool_calls.length}</p>
            <p className="summary-card-label">Tool Calls</p>
          </div>
        </div>
        <div className="summary-card">
          <Brain className="summary-card-icon purple" />
          <div>
            <p className="summary-card-value">{trace.reasoning.length}</p>
            <p className="summary-card-label">Reasoning Steps</p>
          </div>
        </div>
        <div className="summary-card">
          <AlertCircle className="summary-card-icon red" />
          <div>
            <p className="summary-card-value">{trace.errors.length}</p>
            <p className="summary-card-label">Errors</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-list">
          <button
            className={`tab-trigger ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock />
            Timeline
          </button>
          <button
            className={`tab-trigger ${activeTab === 'reasoning' ? 'active' : ''}`}
            onClick={() => setActiveTab('reasoning')}
          >
            <Brain />
            Reasoning
          </button>
          <button
            className={`tab-trigger ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            <Zap />
            Tool Calls
          </button>
          <button
            className={`tab-trigger ${activeTab === 'errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            <AlertCircle />
            Errors
          </button>
          <button
            className={`tab-trigger ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            <Code />
            Raw JSON
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'timeline' && <Timeline events={trace.timeline} />}
          {activeTab === 'reasoning' && <ReasoningPanel reasoning={trace.reasoning} />}
          {activeTab === 'tools' && <ToolCallsPanel toolCalls={trace.tool_calls} mcpOps={trace.mcp_operations} />}
          {activeTab === 'errors' && <ErrorsPanel errors={trace.errors} />}
          {activeTab === 'raw' && (
            <pre className="code-block">
              {JSON.stringify(trace.raw, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN OBSERVABILITY PAGE
// ============================================================================
function AdminSettingsPanel({
  userRole,
  token,
  settings,
  draft,
  setDraft,
  onReload,
  onSave,
  loading,
  error,
}: {
  userRole?: string;
  token: string | null;
  settings: AdminSettings | null;
  draft: AdminSettings | null;
  setDraft: (cfg: AdminSettings | null) => void;
  onReload: () => void;
  onSave: () => void;
  loading: boolean;
  error: string | null;
}) {
  // Use permissive logic if token is missing (dev mode / auth bypass)
  const isGuest = !token;
  const isAdmin = userRole === 'admin';

  const updateProvider = (key: keyof AdminSettings['provider'], value: any) => {
    if (!draft) return;
    setDraft({
      ...draft,
      provider: { ...draft.provider, [key]: value },
    });
  };

  const updateBinding = (persona: string, label: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      mcp: {
        ...draft.mcp,
        persona_bindings: { ...draft.mcp.persona_bindings, [persona]: label },
      },
    });
  };

  const updateEndpoint = (idx: number, key: keyof MCPEntry, value: any) => {
    if (!draft) return;
    const endpoints = [...(draft.mcp.endpoints || [])];
    endpoints[idx] = { ...endpoints[idx], [key]: value };
    setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
  };

  const toggleTool = (idx: number, tool: string) => {
    if (!draft) return;
    const endpoints = [...(draft.mcp.endpoints || [])];
    const entry = endpoints[idx];
    const next = entry.allowed_tools.includes(tool)
      ? entry.allowed_tools.filter((t) => t !== tool)
      : [...entry.allowed_tools, tool];
    endpoints[idx] = { ...entry, allowed_tools: next };
    setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
  };

  const addEndpoint = () => {
    if (!draft) return;
    const endpoints = [...(draft.mcp.endpoints || [])];
    endpoints.push({ label: 'new-mcp', url: 'http://localhost:8201', allowed_tools: TOOL_OPTIONS });
    setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
  };

  const removeEndpoint = (idx: number) => {
    if (!draft) return;
    const endpoints = [...(draft.mcp.endpoints || [])];
    endpoints.splice(idx, 1);
    setDraft({ ...draft, mcp: { ...draft.mcp, endpoints } });
  };

  if (!draft) {
    return (
      <div className="detail-panel" style={{ padding: '24px' }}>
        {error && (
          <div className="observability-error" style={{ marginBottom: '12px' }}>
            <AlertCircle className="icon-md" />
            <p>{error}</p>
          </div>
        )}
        <button className="trace-list-refresh" onClick={onReload} disabled={loading}>
          <RefreshCw className="icon-md" />
          Load Settings
        </button>
      </div>
    );
  }

  return (
    <div className="observability-main" style={{ gap: '16px' }}>
      <div className="detail-panel" style={{ width: '100%', padding: '16px' }}>
        <div className="observability-header-left" style={{ marginBottom: '12px' }}>
          <SettingsIcon className="observability-header-icon" />
          <div>
            <h2 className="observability-header-title" style={{ margin: 0 }}>Admin Settings</h2>
            <p className="observability-header-subtitle" style={{ margin: 0 }}>
              Manage provider routing, v1/responses toggle, and MCP endpoints.
            </p>
          </div>
        </div>

        {error && (
          <div className="observability-error" style={{ marginBottom: '12px' }}>
            <AlertCircle className="icon-md" />
            <p>{error}</p>
          </div>
        )}

        <div className="admin-settings-grid">
          <div className="admin-card">
            <h3>Provider & Models</h3>
            <label className="admin-field">
              <span>Use Local LLM</span>
              <input
                type="checkbox"
                checked={draft.provider.local_llm_enabled}
                onChange={(e) => updateProvider('local_llm_enabled', e.target.checked)}
              />
            </label>
            <label className="admin-field">
              <span>Local Base URL</span>
              <input
                type="text"
                value={draft.provider.local_llm_base_url || ''}
                onChange={(e) => updateProvider('local_llm_base_url', e.target.value)}
                placeholder="http://localhost:1234"
              />
            </label>
            <label className="admin-field">
              <span>Local Model</span>
              <input
                type="text"
                value={draft.provider.local_llm_model || ''}
                onChange={(e) => updateProvider('local_llm_model', e.target.value)}
                placeholder="llama3.1:8b"
              />
            </label>
            <label className="admin-field">
              <span>Timeout (s)</span>
              <input
                type="number"
                value={draft.provider.local_llm_timeout || 60}
                onChange={(e) => updateProvider('local_llm_timeout', Number(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Use /v1/responses</span>
              <input
                type="checkbox"
                checked={draft.provider.use_responses_api ?? true}
                onChange={(e) => updateProvider('use_responses_api', e.target.checked)}
              />
            </label>
            <label className="admin-field">
              <span>Max Output Tokens</span>
              <input
                type="number"
                value={draft.provider.max_output_tokens || 8000}
                onChange={(e) => updateProvider('max_output_tokens', Number(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Temperature</span>
              <input
                type="number"
                step="0.1"
                value={draft.provider.temperature ?? 0.1}
                onChange={(e) => updateProvider('temperature', Number(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>OpenRouter Endpoint</span>
              <input
                type="text"
                value={draft.provider.openrouter_api_endpoint || ''}
                onChange={(e) => updateProvider('openrouter_api_endpoint', e.target.value)}
                placeholder="https://openrouter.ai/api/v1/responses"
              />
            </label>
            <label className="admin-field">
              <span>Primary Model</span>
              <input
                type="text"
                value={draft.provider.openrouter_model_primary || ''}
                onChange={(e) => updateProvider('openrouter_model_primary', e.target.value)}
                placeholder="google/gemma-3-27b-it"
              />
            </label>
            <label className="admin-field">
              <span>Fallback Model</span>
              <input
                type="text"
                value={draft.provider.openrouter_model_fallback || ''}
                onChange={(e) => updateProvider('openrouter_model_fallback', e.target.value)}
                placeholder="google/gemini-2.5-flash"
              />
            </label>
            <label className="admin-field">
              <span>Alt Model</span>
              <input
                type="text"
                value={draft.provider.openrouter_model_alt || ''}
                onChange={(e) => updateProvider('openrouter_model_alt', e.target.value)}
                placeholder="mistralai/devstral-2512:free"
              />
            </label>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>MCP Endpoints</h3>
              <button className="trace-list-refresh" onClick={addEndpoint} type="button">
                <Plus className="icon-sm" /> Add
              </button>
            </div>
            <div className="admin-mcp-list">
              {(draft.mcp.endpoints || []).map((ep, idx) => (
                <div key={`${ep.label}-${idx}`} className="admin-mcp-entry">
                  <div className="admin-mcp-row">
                    <input
                      type="text"
                      value={ep.label}
                      onChange={(e) => updateEndpoint(idx, 'label', e.target.value)}
                      placeholder="label"
                    />
                    <input
                      type="text"
                      value={ep.url}
                      onChange={(e) => updateEndpoint(idx, 'url', e.target.value)}
                      placeholder="http://localhost:8201"
                    />
                    <button
                      className="trace-list-refresh"
                      onClick={() => removeEndpoint(idx)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-tools-row">
                    {TOOL_OPTIONS.map((tool) => (
                      <label key={tool} className="admin-tool-chip">
                        <input
                          type="checkbox"
                          checked={ep.allowed_tools?.includes(tool)}
                          onChange={() => toggleTool(idx, tool)}
                        />
                        {tool}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-card" style={{ marginTop: '12px' }}>
              <h4>Persona Bindings</h4>
              {['noor', 'maestro', 'default'].map((persona) => (
                <label key={persona} className="admin-field">
                  <span>{persona} →</span>
                  <select
                    value={draft.mcp.persona_bindings?.[persona] || ''}
                    onChange={(e) => updateBinding(persona, e.target.value)}
                  >
                    <option value="">Select endpoint</option>
                    {(draft.mcp.endpoints || []).map((ep) => (
                      <option key={ep.label} value={ep.label}>
                        {ep.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Last updated: {settings?.updated_at || 'n/a'} by {settings?.updated_by || 'n/a'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="trace-list-refresh" onClick={onReload} disabled={loading}>
              <RefreshCw className="icon-sm" /> Reload
            </button>
            <button className="trace-list-refresh" onClick={() => setDraft(settings)} disabled={loading}>
              Revert
            </button>
            <button className="trace-list-refresh" onClick={onSave} disabled={loading}>
              <Save className="icon-sm" /> Save
            </button>
          </div>
        </div>

        {draft.audit && draft.audit.length > 0 && (
          <div className="admin-card" style={{ marginTop: '16px' }}>
            <h4>Recent Changes</h4>
            <div className="admin-audit-list">
              {draft.audit.slice(-5).reverse().map((a, idx) => (
                <div key={idx} className="admin-audit-row">
                  <span>{a.updated_at}</span>
                  <span>{a.updated_by}</span>
                  <span>providers/mcp updated</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OBSERVABILITY DASHBOARD COMPONENT (Embeddable)
// ============================================================================
export function ObservabilityDashboard({ 
  showHeader = true,
  mode
}: { 
  showHeader?: boolean;
  mode?: 'admin-only' | 'full';
}) {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(mode === 'admin-only' ? 'admin-settings' : 'traces');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [draftSettings, setDraftSettings] = useState<AdminSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Auto-refresh state
  const [isLive, setIsLive] = useState(true);
  const { user, token } = useAuth();

  const fetchTraces = useCallback(async () => {
    // Don't set loading to true for background updates to avoid UI flicker
    if (!isLive) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/debug/traces?limit=25`);
      if (!response.ok) throw new Error('Failed to fetch traces');
      const data = await response.json();
      setTraces(data.traces || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      // Only set error state if it's a manual action or initial load
      if (!isLive) setError(err.message);
    } finally {
      if (!isLive) setLoading(false);
    }
  }, [isLive]);

  // Auto-polling effect
  useEffect(() => {
    // Initial fetch
    if (activeTab === 'traces') {
      fetchTraces();
    }

    let intervalId: NodeJS.Timeout;
    if (isLive && activeTab === 'traces') {
      intervalId = setInterval(() => {
        fetchTraces();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, activeTab, fetchTraces]);

  const loadSettings = useCallback(async () => {
    // Proceed even without token (backend handles dev-fallback)
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const cfg = await fetchSettings(token);
      setSettings(cfg);
      setDraftSettings(cfg);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'admin-settings' && !draftSettings && !settingsLoading) {
      loadSettings();
    }
  }, [activeTab, loadSettings, draftSettings, settingsLoading]);

  const fetchTraceDetail = async (conversationId: string) => {
    // Detail view doesn't auto-refresh, so we use standard loading state
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/debug/traces/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch trace detail');
      const data = await response.json();
      setSelectedTrace(data);
      setSelectedId(conversationId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdminOnly = mode === 'admin-only';

  return (
    <div className="observability-page" style={!showHeader ? { padding: 0, height: '100%' } : {}}>
      {/* Header */}
      {showHeader && (
      <header className="observability-header">
        <div className="observability-header-left">
          {isAdminOnly ? (
            <SettingsIcon className="observability-header-icon" />
          ) : (
            <Eye className="observability-header-icon" />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 className="observability-header-title">
                {isAdminOnly ? 'System Administration' : 'Observability Dashboard'}
              </h1>
              {!isAdminOnly && (
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`badge clickable ${isLive ? 'badge-success' : 'badge-secondary'}`}
                  style={{ 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 10px',
                    fontSize: '12px'
                  }}
                >
                  {isLive && (
                    <span className="live-indicator">
                      <span className="live-dot"></span>
                    </span>
                  )}
                  {isLive ? 'LIVE' : 'PAUSED'}
                </button>
              )}
            </div>
            <p className="observability-header-subtitle">
              {isAdminOnly 
                ? 'Configure platform providers, MCP endpoints, and system behaviors' 
                : 'Monitor LLM reasoning, tool calls, and cognitive flow'}
            </p>
          </div>
        </div>
        <button 
          className="observability-back-btn"
          onClick={() => window.location.href = isAdminOnly ? '/josoor-v2' : '/chat'}
        >
          {isAdminOnly ? 'Back to Dashboard' : 'Back to Chat'}
        </button>
      </header>
      )}

      {/* Embedded Controls if Header Hidden */}
      {!showHeader && !isAdminOnly && (
          <div className="flex justify-between items-center mb-4 px-4 pt-2">
             <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">Live Monitoring</h3>
                <button 
                onClick={() => setIsLive(!isLive)}
                className={`badge clickable ${isLive ? 'badge-success' : 'badge-secondary'}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
              >
                {isLive ? 'ON' : 'PAUSED'}
              </button>
             </div>
          </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="observability-error">
          <AlertCircle className="icon-md" />
          <p>{error}</p>
        </div>
      )}

      {!isAdminOnly && (
        <div className="tab-switcher" style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
          <button
            className={`tab-trigger ${activeTab === 'traces' ? 'active' : ''}`}
            onClick={() => setActiveTab('traces')}
          >
            <Layers className="icon-sm" />
            Traces
          </button>
          <button
            className={`tab-trigger ${activeTab === 'admin-settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-settings')}
          >
            <SettingsIcon className="icon-sm" />
            Admin Settings
          </button>
        </div>
      )}

      {activeTab === 'traces' && !isAdminOnly && (
        <div className="observability-main" style={!showHeader ? { height: 'calc(100% - 40px)' } : {}}>
          {/* Left Panel - Trace List */}
          <TraceList
            traces={traces}
            selectedId={selectedId}
            onSelect={fetchTraceDetail}
            onRefresh={fetchTraces}
            loading={loading}
          />

          {/* Right Panel - Detail View */}
          <div className="detail-panel">
            {selectedTrace ? (
              <TraceDetailView
                trace={selectedTrace}
                onBack={() => {
                  setSelectedTrace(null);
                  setSelectedId(null);
                }}
              />
            ) : (
              <div className="detail-empty">
                <Eye className="detail-empty-icon" />
                <h3>Select a Trace</h3>
                <p>
                  Click on a conversation trace to view its full execution details,
                  <br />
                  including reasoning steps, tool calls, and errors.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'admin-settings' && (
        <div className={isAdminOnly ? "observability-full-page" : ""}>
          <AdminSettingsPanel
            userRole={(user as any)?.role}
            token={token}
            settings={settings}
            draft={draftSettings}
            setDraft={setDraftSettings}
            onReload={loadSettings}
            onSave={async () => {
              if (!draftSettings) return;
              setSettingsError(null);
              setSettingsLoading(true);
              try {
                const saved = await saveSettings(draftSettings, token);
                setSettings(saved);
                setDraftSettings(saved);
              } catch (err: any) {
                setSettingsError(err.message || 'Failed to save settings');
              } finally {
                setSettingsLoading(false);
              }
            }}
            loading={settingsLoading}
            error={settingsError}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE WRAPPER
// ============================================================================
export default function ObservabilityPage({ mode }: { mode?: 'admin-only' | 'full' }) {
    return <ObservabilityDashboard showHeader={true} mode={mode} />;
}
