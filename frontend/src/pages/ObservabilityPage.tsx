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
} from 'lucide-react';
import './ObservabilityPage.css';

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
            {step.thought?.map((t: any, i: number) => (
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
export default function ObservabilityPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh state
  const [isLive, setIsLive] = useState(true);

  const fetchTraces = async () => {
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
  };

  // Auto-polling effect
  useEffect(() => {
    // Initial fetch
    fetchTraces();

    let intervalId: NodeJS.Timeout;
    if (isLive) {
      intervalId = setInterval(() => {
        fetchTraces();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive]);

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

  return (
    <div className="observability-page">
      {/* Header */}
      <header className="observability-header">
        <div className="observability-header-left">
          <Eye className="observability-header-icon" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 className="observability-header-title">Observability Dashboard</h1>
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
            </div>
            <p className="observability-header-subtitle">
              Monitor LLM reasoning, tool calls, and cognitive flow
            </p>
          </div>
        </div>
        <button 
          className="observability-back-btn"
          onClick={() => window.location.href = '/chat'}
        >
          Back to Chat
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="observability-error">
          <AlertCircle className="icon-md" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="observability-main">
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
    </div>
  );
}
