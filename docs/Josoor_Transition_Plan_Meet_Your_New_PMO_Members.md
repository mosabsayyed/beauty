# Josoor Transition Plan — Merge: Transformation Control Tower + Augmented PMO (Desks + Deep Dives)

## SHAME MARKER — Depth regression
I previously overwrote the plan with a shorter revision (depth regression). This version restores the missing execution detail and corrects one critical mismatch (API base joining) by aligning to your frontend architecture conventions.

---

## 0) Baseline (what exists today)

### Frontend (React + Vite)
- Primary app page: `/frontend/src/pages/ChatAppPage.tsx` (Chat + Sidebar + Canvas).
- Artifact rendering: `/frontend/src/components/chat/ArtifactRenderer.tsx`.
- Artifact typing: `/frontend/src/types/api.ts` defines `ArtifactType` union (includes `CHART`, `TABLE`, `REPORT`, `DOCUMENT`, `GRAPHV001`, `TWIN_KNOWLEDGE`).
- Sidebar exists and already contains “quick actions” (documented in your architecture overview).

### Backend (FastAPI)
- Dashboard endpoints under `/api/v1/dashboard`:
  - `GET /dashboard-data` (optional `quarter_filter`)
  - `GET /outcomes-data`
  - `GET /investment-initiatives`
- Neo4j endpoints under `/api`:
  - `GET /neo4j/graph`
  - `GET /neo4j/dashboard/metrics`
  - `GET /neo4j/sectors`
- Chat endpoint under `/api/v1/chat`:
  - `POST /message`
- Tier‑1 prompt assembly is pulled from Supabase `instruction_elements` where `bundle='tier1'` and `status='active'`.

### Non‑negotiables (your constraint)
- **Desks are deterministic** (DB/graph backed).
- **AI appears only as Deep Dive** on a selected desk item (context‑bound, evidence‑aware, missing-data explicit).

---

## 1) The merged positioning (single product, two layers)

### Product (what it is)
**Josoor is the Transformation Control Tower** for public-sector transformation execution.

### Delivery wrapper (how it is adopted)
**Augmented PMO**: Josoor is presented as a PMO extension with specialist “digital team members”:
- Stakeholder Liaison (Reporting Specialist outcome)
- Dependency Architect (Planning Specialist outcome)
- Risk Sentinel (Risk Specialist outcome)

Control Tower = trust layer. Augmented PMO = adoption wrapper. Deep Dive = intelligence layer.

---

## 2) Target UX (one screen per desk)

Every desk is a deterministic surface with an attached Deep Dive rail.

### Desk layout
- **Top strip**: 6–10 summary metrics + what changed since last snapshot.
- **Ranked list/table**: items needing attention now.
- **Right rail: Deep Dive** (only after selecting an item):
  1) Signal summary
  2) What changed / why now
  3) Likely root causes (bounded)
  4) Impact trace
  5) Immediate actions (next 7 days)
  6) Stakeholder chain to engage
  7) Missing data

### Deterministic desks (v1)
1) **Control Tower Overview**
   - KPI snapshot + outcomes + initiatives + graph health metrics.
2) **Dependency Desk**
   - Relationship pressure + top-degree nodes (cross-cutting blockers).
3) **Risk Desk**
   - EntityRisk nodes from graph + deep dive escalation actions.

### Screenshots (current draft set)
- `josoor_control_tower_overview_merged.png`
- `josoor_dependency_desk_merged.png`
- `josoor_risk_desk_merged.png`
- `josoor_deep_dive_panel.png`

---

## 3) Transition plan by phase (sequence + acceptance)

### Phase 0 — Marketing packaging (no code)
Deliver:
- Landing page restructure (section 10).
- Embed the three desk screenshots as the “proof strip”.
- “Augmented PMO team” section.
- Deep Dive section appears after proof.

Acceptance:
- Landing page communicates value without mentioning AI in the first 30 seconds.

---

### Phase A — Frontend desks + Deep Dive rail (no new backend endpoints)
Deliver:
- New `ArtifactType` entries.
- 3 desk views (Canvas).
- Shared DeepDivePanel (invokes chat only after row selection).
- Service wrapper calling existing endpoints.
- Sidebar quick actions open each desk deterministically.

Acceptance:
- All desks open without typing.
- Deep dive cannot run without selecting a record.
- Empty/unknown data displays safely as missing data.

---

### Phase B — Backend reliability hardening (trust)
Deliver:
- Contract alignment enforcement (stable llm_payload schema).
- Evidence gating enforced in runtime.
- Backend empty-result guard.
- Canonical deep-dive template enforcement (server-side).

Acceptance:
- Empty retrieval never yields fabricated conclusions.
- Any “grounded claim” requires evidence entries.

---

## 4) Data contract (desks + deep dives)

### 4.1 Desk artifacts (client-side artifacts, no AI required)
Artifact envelope (frontend state / canvas payload):
```json
{
  "artifact_type": "CONTROL_TOWER_OVERVIEW",
  "title": "Transformation Control Tower",
  "description": "Deterministic desk + context-bound deep dives.",
  "content": {}
}
```

### 4.2 Deep Dive request (bounded context)
Deep Dive always sends:
- desk name (CONTROL_TOWER / DEPENDENCY / RISK)
- selected objectType
- selected object payload (raw row or raw node properties)
- optional desk snapshot summary (counts + top items)

Deep Dive response in v1 is text. Phase B adds structured server enforcement.

---

## 5) Phase A — Frontend implementation (injection-ready code)

### 5.1 Update ArtifactType union
**File:** `/frontend/src/types/api.ts`

Add:
```ts
export type ArtifactType =
  | 'CHART'
  | 'TABLE'
  | 'REPORT'
  | 'DOCUMENT'
  | 'GRAPHV001'
  | 'TWIN_KNOWLEDGE'
  | 'CONTROL_TOWER_OVERVIEW'
  | 'DEPENDENCY_DESK'
  | 'RISK_DESK';
```

---

### 5.2 Add endpoint URL builders aligned to your frontend architecture
Your architecture explicitly uses:
- `process.env.REACT_APP_API_BASE` (optional)
- prefix `/api/v1` when base is not set

For Neo4j endpoints, prefix must be `/api` (not `/api/v1`).

Create **new file**: `/frontend/src/lib/services/apiUrl.ts`

```ts
declare global {
  interface Window {
    __JOSOOR_API_BASE_URL__?: string;
  }
}

const API_BASE_URL =
  (typeof window !== 'undefined' && window.__JOSOOR_API_BASE_URL__) ||
  (process.env.REACT_APP_API_BASE || '');

const API_V1_PREFIX = API_BASE_URL ? '' : '/api/v1';
const API_PREFIX = API_BASE_URL ? '' : '/api';

export function buildUrlV1(endpointPath: string) {
  const p = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${API_BASE_URL}${API_V1_PREFIX}${p}`;
}

export function buildUrlApi(endpointPath: string) {
  const p = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${API_BASE_URL}${API_PREFIX}${p}`;
}
```

---

### 5.3 Dashboard + Graph service wrapper
Create **new file**: `/frontend/src/lib/services/dashboardService.ts`

```ts
import { authService } from './authService';
import { buildUrlV1, buildUrlApi } from './apiUrl';

type Json = Record<string, any>;

async function fetchJson<T = any>(url: string): Promise<T> {
  const token = authService.getToken?.() || localStorage.getItem('josoor_token') || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export const dashboardService = {
  // Dashboard (v1)
  getDashboardData: (quarterFilter?: string) =>
    fetchJson<Json[]>(buildUrlV1(`/dashboard/dashboard-data${quarterFilter ? `?quarter_filter=${encodeURIComponent(quarterFilter)}` : ''}`)),

  getOutcomesData: () =>
    fetchJson<Json[]>(buildUrlV1('/dashboard/outcomes-data')),

  getInvestmentInitiatives: () =>
    fetchJson<Json[]>(buildUrlV1('/dashboard/investment-initiatives')),

  // Neo4j (api)
  getFullGraph: () =>
    fetchJson<{ nodes: any[]; links: any[] }>(buildUrlApi('/neo4j/graph')),

  getGraphMetrics: () =>
    fetchJson<Json>(buildUrlApi('/neo4j/dashboard/metrics')),
};
```

Optional re-export:
Create **new file**: `/frontend/src/services/dashboardService.ts`
```ts
export { dashboardService } from '../lib/services/dashboardService';
```

---

### 5.4 Deep Dive Panel (bounded AI)
Create **new file**: `/frontend/src/components/content/control_tower/DeepDivePanel.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import { authService } from '../../../lib/services/authService';
import { buildUrlV1 } from '../../../lib/services/apiUrl';

export type DeepDiveContext = {
  desk: 'CONTROL_TOWER' | 'DEPENDENCY' | 'RISK';
  objectType: string;
  object: any;
  snapshot?: Record<string, any>;
};

type DeepDiveResult = { text: string; raw?: any };

function buildPrompt(ctx: DeepDiveContext) {
  return [
    `You are Noor. You are an Augmented PMO analyst.`,
    `Hard rules: do not invent missing data; if evidence is missing, say so.`,
    ``,
    `DESK: ${ctx.desk}`,
    `OBJECT_TYPE: ${ctx.objectType}`,
    `OBJECT: ${JSON.stringify(ctx.object, null, 2)}`,
    ctx.snapshot ? `SNAPSHOT: ${JSON.stringify(ctx.snapshot, null, 2)}` : '',
    ``,
    `Return strictly in this structure:`,
    `1) Signal summary (1–2 lines)`,
    `2) What changed / why now`,
    `3) Likely root causes (bounded)`,
    `4) Impact trace (who/what is affected)`,
    `5) Immediate actions (next 7 days)`,
    `6) Stakeholder chain to engage (order)`,
    `7) Missing data (explicit list)`,
  ].filter(Boolean).join('\n');
}

async function postChat(query: string) {
  const token = authService.getToken?.() || localStorage.getItem('josoor_token') || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = buildUrlV1('/chat/message');
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, persona: 'noor' }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST /chat/message failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export const DeepDivePanel: React.FC<{ context?: DeepDiveContext }> = ({ context }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepDiveResult | null>(null);

  const prompt = useMemo(() => (context ? buildPrompt(context) : ''), [context]);

  async function run() {
    if (!context) return;

    setLoading(true);
    setResult(null);

    try {
      const json = await postChat(prompt);
      const text = (json?.message || json?.llm_payload?.final_answer || '').toString();
      setResult({ text: text || JSON.stringify(json, null, 2), raw: json });
    } catch (e: any) {
      setResult({ text: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ct-insight">
      <div className="ct-card-title">Deep Dive</div>

      {!context ? (
        <div className="ct-muted">Select an item to analyze. Deep dive stays bound to the selected record.</div>
      ) : (
        <>
          <div className="ct-muted" style={{ marginBottom: 8 }}>
            {context.desk} • {context.objectType}
          </div>

          <button className="ct-row" onClick={run} disabled={loading} style={{ width: 'fit-content' }}>
            {loading ? 'Working…' : 'Run Deep Dive'}
          </button>

          <pre className="ct-pre" style={{ marginTop: 10 }}>
            {result?.text || 'No output yet.'}
          </pre>
        </>
      )}
    </div>
  );
};
```

---

### 5.5 Desk views (3 deterministic desks)

#### 5.5.1 Control Tower Overview
Create **new file**: `/frontend/src/components/content/control_tower/ControlTowerOverviewView.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboardService';
import { DeepDivePanel, DeepDiveContext } from './DeepDivePanel';
import './ControlTowerViews.css';

type AnyRow = Record<string, any>;

function summarize(rows: AnyRow[]) {
  if (!rows?.length) return { total: 0, byStatus: [] as Array<{ key: string; count: number }> };

  const statusKey =
    ['status', 'state', 'phase', 'overall_status', 'risk_level', 'severity', 'progress_status']
      .find(k => rows.some(r => r && typeof r[k] === 'string'));

  const byStatus = statusKey
    ? Object.entries(
        rows.reduce((acc: Record<string, number>, r) => {
          const v = String(r[statusKey] ?? 'Unknown');
          acc[v] = (acc[v] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  return { total: rows.length, byStatus };
}

function compactRow(row: AnyRow, maxPairs = 8) {
  const entries = Object.entries(row || {}).slice(0, maxPairs);
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(' • ');
}

export const ControlTowerOverviewView: React.FC = () => {
  const [quarterFilter, setQuarterFilter] = useState<string>('');
  const [ctx, setCtx] = useState<DeepDiveContext | undefined>(undefined);

  const kpisQ = useQuery({
    queryKey: ['ct_kpis', quarterFilter],
    queryFn: () => dashboardService.getDashboardData(quarterFilter || undefined),
  });

  const outcomesQ = useQuery({
    queryKey: ['ct_outcomes'],
    queryFn: () => dashboardService.getOutcomesData(),
  });

  const initiativesQ = useQuery({
    queryKey: ['ct_initiatives'],
    queryFn: () => dashboardService.getInvestmentInitiatives(),
  });

  const metricsQ = useQuery({
    queryKey: ['ct_graph_metrics'],
    queryFn: () => dashboardService.getGraphMetrics(),
  });

  const kpis = (kpisQ.data || []) as AnyRow[];
  const outcomes = (outcomesQ.data || []) as AnyRow[];
  const initiatives = (initiativesQ.data || []) as AnyRow[];

  const kpiSummary = useMemo(() => summarize(kpis), [kpis]);
  const outSummary = useMemo(() => summarize(outcomes), [outcomes]);
  const initSummary = useMemo(() => summarize(initiatives), [initiatives]);

  const snapshot = useMemo(() => ({
    quarterFilter: quarterFilter || null,
    kpiSummary,
    outSummary,
    initSummary,
    graphMetrics: metricsQ.data || null,
  }), [quarterFilter, kpiSummary, outSummary, initSummary, metricsQ.data]);

  return (
    <div className="ct-root">
      <div className="ct-header">
        <div className="ct-title">Transformation Control Tower</div>
        <div className="ct-subtitle">Deterministic desks + context-bound deep dives.</div>

        <div className="ct-filter">
          <label className="ct-label">Quarter filter</label>
          <input
            className="ct-input"
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            placeholder="Example: Q4 2025"
          />
        </div>
      </div>

      <div className="ct-grid">
        <div className="ct-card">
          <div className="ct-card-title">KPI Dimensions</div>
          <div className="ct-metric">{kpiSummary.total}</div>
          <div className="ct-badges">
            {kpiSummary.byStatus.slice(0, 6).map(s => (
              <span key={s.key} className="ct-badge">{s.key}: {s.count}</span>
            ))}
          </div>
          <div className="ct-list">
            {kpis.slice(0, 8).map((r, i) => (
              <button
                key={i}
                className="ct-row"
                onClick={() => setCtx({ desk: 'CONTROL_TOWER', objectType: 'KPI', object: r, snapshot })}
              >
                {compactRow(r)}
              </button>
            ))}
          </div>
        </div>

        <div className="ct-card">
          <div className="ct-card-title">Outcomes</div>
          <div className="ct-metric">{outSummary.total}</div>
          <div className="ct-badges">
            {outSummary.byStatus.slice(0, 6).map(s => (
              <span key={s.key} className="ct-badge">{s.key}: {s.count}</span>
            ))}
          </div>
          <div className="ct-list">
            {outcomes.slice(0, 8).map((r, i) => (
              <button
                key={i}
                className="ct-row"
                onClick={() => setCtx({ desk: 'CONTROL_TOWER', objectType: 'OUTCOME', object: r, snapshot })}
              >
                {compactRow(r)}
              </button>
            ))}
          </div>
        </div>

        <div className="ct-card">
          <div className="ct-card-title">Investment Initiatives</div>
          <div className="ct-metric">{initSummary.total}</div>
          <div className="ct-badges">
            {initSummary.byStatus.slice(0, 6).map(s => (
              <span key={s.key} className="ct-badge">{s.key}: {s.count}</span>
            ))}
          </div>
          <div className="ct-list">
            {initiatives.slice(0, 8).map((r, i) => (
              <button
                key={i}
                className="ct-row"
                onClick={() => setCtx({ desk: 'CONTROL_TOWER', objectType: 'INITIATIVE', object: r, snapshot })}
              >
                {compactRow(r)}
              </button>
            ))}
          </div>
        </div>

        <div className="ct-card">
          <div className="ct-card-title">Graph Metrics</div>
          <pre className="ct-pre">{metricsQ.data ? JSON.stringify(metricsQ.data, null, 2) : 'No metrics loaded yet.'}</pre>
        </div>
      </div>

      <DeepDivePanel context={ctx} />
    </div>
  );
};
```

#### 5.5.2 Dependency Desk
Create **new file**: `/frontend/src/components/content/control_tower/DependencyDeskView.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboardService';
import { DeepDivePanel, DeepDiveContext } from './DeepDivePanel';
import './ControlTowerViews.css';

type Link = { source?: any; target?: any; type?: string } & Record<string, any>;

function toId(x: any) {
  if (x == null) return '—';
  if (typeof x === 'string' || typeof x === 'number') return String(x);
  return String(x.id ?? x.key ?? x.name ?? '—');
}

export const DependencyDeskView: React.FC = () => {
  const [ctx, setCtx] = useState<DeepDiveContext | undefined>(undefined);

  const graphQ = useQuery({
    queryKey: ['dep_graph'],
    queryFn: () => dashboardService.getFullGraph(),
  });

  const links = (graphQ.data?.links || []) as Link[];

  const relCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of links) {
      const t = String(l.type ?? 'REL');
      acc[t] = (acc[t] || 0) + 1;
    }
    return Object.entries(acc).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [links]);

  const topNodes = useMemo(() => {
    const degree: Record<string, number> = {};
    for (const l of links) {
      const s = toId(l.source);
      const t = toId(l.target);
      degree[s] = (degree[s] || 0) + 1;
      degree[t] = (degree[t] || 0) + 1;
    }
    return Object.entries(degree)
      .map(([id, deg]) => ({ id, deg }))
      .sort((a, b) => b.deg - a.deg)
      .slice(0, 30);
  }, [links]);

  const snapshot = useMemo(() => ({
    relCounts: relCounts.slice(0, 20),
    topNodes: topNodes.slice(0, 20),
    linkCount: links.length,
  }), [relCounts, topNodes, links.length]);

  return (
    <div className="ct-root">
      <div className="ct-header">
        <div className="ct-title">Dependency Desk</div>
        <div className="ct-subtitle">Deterministic graph-derived bottlenecks + context-bound coordination deep dives.</div>
      </div>

      <div className="ct-grid">
        <div className="ct-card">
          <div className="ct-card-title">Relationship Types</div>
          <div className="ct-list">
            {relCounts.slice(0, 14).map(r => (
              <button
                key={r.type}
                className="ct-row"
                onClick={() => setCtx({ desk: 'DEPENDENCY', objectType: 'REL_TYPE', object: r, snapshot })}
              >
                {r.type} • {r.count}
              </button>
            ))}
          </div>
        </div>

        <div className="ct-card">
          <div className="ct-card-title">Top Dependency Nodes (degree)</div>
          <div className="ct-list">
            {topNodes.map(n => (
              <button
                key={n.id}
                className="ct-row"
                onClick={() => setCtx({ desk: 'DEPENDENCY', objectType: 'NODE_CONCENTRATION', object: n, snapshot })}
              >
                {n.id} • degree {n.deg}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DeepDivePanel context={ctx} />
    </div>
  );
};
```

#### 5.5.3 Risk Desk
Create **new file**: `/frontend/src/components/content/control_tower/RiskDeskView.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboardService';
import { DeepDivePanel, DeepDiveContext } from './DeepDivePanel';
import './ControlTowerViews.css';

type Node = { labels?: string[]; properties?: Record<string, any> } & Record<string, any>;

function pickKey(obj: Record<string, any>, keys: string[]) {
  for (const k of keys) if (obj && obj[k] != null) return k;
  return '';
}

export const RiskDeskView: React.FC = () => {
  const [ctx, setCtx] = useState<DeepDiveContext | undefined>(undefined);

  const graphQ = useQuery({
    queryKey: ['risk_graph'],
    queryFn: () => dashboardService.getFullGraph(),
  });

  const riskNodes = useMemo(() => {
    const nodes = (graphQ.data?.nodes || []) as Node[];
    return nodes.filter(n => (n.labels || []).includes('EntityRisk'));
  }, [graphQ.data]);

  const rows = useMemo(() => {
    return riskNodes.map((n, idx) => {
      const props = n.properties || n;
      const titleKey = pickKey(props, ['title', 'name', 'risk', 'risk_name', 'label']);
      const levelKey = pickKey(props, ['risk_level', 'severity', 'level', 'priority', 'status']);
      return {
        _idx: idx,
        title: titleKey ? String(props[titleKey]) : 'Risk',
        level: levelKey ? String(props[levelKey]) : '—',
        raw: props,
      };
    });
  }, [riskNodes]);

  const snapshot = useMemo(() => ({
    riskCount: rows.length,
    topRisks: rows.slice(0, 10).map(r => ({ title: r.title, level: r.level })),
  }), [rows]);

  return (
    <div className="ct-root">
      <div className="ct-header">
        <div className="ct-title">Risk Desk</div>
        <div className="ct-subtitle">Risks pulled from graph; deep dives produce early-warning actions and escalation paths.</div>
      </div>

      <div className="ct-card">
        <div className="ct-card-title">Top Risks</div>
        <div className="ct-list">
          {rows.slice(0, 40).map(r => (
            <button
              key={r._idx}
              className="ct-row"
              onClick={() => setCtx({ desk: 'RISK', objectType: 'RISK', object: r.raw, snapshot })}
            >
              {r.title} • {r.level}
            </button>
          ))}
          {rows.length === 0 ? <div className="ct-muted">No EntityRisk nodes found in graph payload.</div> : null}
        </div>
      </div>

      <DeepDivePanel context={ctx} />
    </div>
  );
};
```

---

### 5.6 Desk CSS (shared)
Create **new file**: `/frontend/src/components/content/control_tower/ControlTowerViews.css`

```css
.ct-root {
  background: var(--component-bg-primary);
  color: var(--component-text-primary);
  font-family: var(--component-font-family);
  padding: 16px;
}

.ct-header {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
}

.ct-title {
  font-family: var(--component-font-heading);
  font-size: 18px;
  font-weight: 700;
}

.ct-subtitle {
  color: var(--component-text-secondary);
  font-size: 13px;
}

.ct-filter {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 8px;
}

.ct-label {
  color: var(--component-text-secondary);
  font-size: 12px;
}

.ct-input {
  background: var(--component-panel-bg);
  border: 1px solid var(--component-panel-border);
  color: var(--component-text-primary);
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 220px;
}

.ct-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ct-card {
  background: var(--component-panel-bg);
  border: 1px solid var(--component-panel-border);
  border-radius: 12px;
  padding: 12px;
  min-height: 120px;
}

.ct-card-title {
  font-family: var(--component-font-heading);
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.ct-metric {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 6px;
}

.ct-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.ct-badge {
  background: var(--component-bg-secondary);
  border: 1px solid var(--component-panel-border);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--component-text-secondary);
}

.ct-list {
  display: grid;
  gap: 6px;
}

.ct-row {
  text-align: left;
  background: transparent;
  border: 1px solid var(--component-panel-border);
  color: var(--component-text-primary);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.ct-row:hover {
  border-color: var(--component-text-accent);
}

.ct-pre {
  margin: 0;
  padding: 10px;
  background: rgba(0,0,0,0.25);
  border: 1px solid var(--component-panel-border);
  border-radius: 10px;
  color: var(--component-text-secondary);
  overflow: auto;
  max-height: 320px;
  white-space: pre-wrap;
}

.ct-muted {
  color: var(--component-text-muted);
  font-size: 12px;
}

.ct-insight {
  margin-top: 12px;
  background: var(--component-panel-bg);
  border: 1px solid var(--component-panel-border);
  border-radius: 12px;
  padding: 12px;
}
```

---

### 5.7 Register desk views in ArtifactRenderer
**File:** `/frontend/src/components/chat/ArtifactRenderer.tsx`

Imports:
```tsx
import { ControlTowerOverviewView } from '../content/control_tower/ControlTowerOverviewView';
import { DependencyDeskView } from '../content/control_tower/DependencyDeskView';
import { RiskDeskView } from '../content/control_tower/RiskDeskView';
```

Switch cases:
```tsx
case 'CONTROL_TOWER_OVERVIEW':
  return <ControlTowerOverviewView />;

case 'DEPENDENCY_DESK':
  return <DependencyDeskView />;

case 'RISK_DESK':
  return <RiskDeskView />;
```

---

### 5.8 Sidebar quick actions (deterministic open)
Add three quick actions, each sets the canvas artifact to the type below (client-side, no LLM call):
- `CONTROL_TOWER_OVERVIEW`
- `DEPENDENCY_DESK`
- `RISK_DESK`

Payload example:
```ts
const artifact = {
  artifact_type: 'CONTROL_TOWER_OVERVIEW',
  title: 'Transformation Control Tower',
  description: 'Deterministic desk + context-bound deep dives.',
  content: {},
};
```

---

## 6) Phase B — Backend fixes (contract alignment + evidence gating + empty-result guard + canonical templates)

### Goal
Stop drift and remove “confident nonsense” by enforcing:
1) **Contract alignment**: llm_payload shape is stable.
2) **Evidence gating**: grounded claims require evidence.
3) **Empty-result guard**: empty tool outputs force missing-data response.
4) **Canonical templates**: deep dives always return a predictable structure.

### 6.1 Add llm_payload canonical model + enforcement
Create **new file**: `/backend/app/core/llm_contract.py`

```python
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field, ValidationError

# Minimal, permissive artifact model (does not assume your internal content schema).
class Artifact(BaseModel):
    artifact_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    content: Dict[str, Any] = Field(default_factory=dict)

class EvidenceItem(BaseModel):
    kind: str = "unknown"
    detail: Dict[str, Any] = Field(default_factory=dict)

class LlmPayload(BaseModel):
    final_answer: str = ""
    artifacts: List[Artifact] = Field(default_factory=list)

    # Reliability controls
    evidence: List[EvidenceItem] = Field(default_factory=list)
    missing_data: List[str] = Field(default_factory=list)
    clarification_needed: bool = False

    # Optional traces (if present, used for guards)
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    mcp_calls: List[Dict[str, Any]] = Field(default_factory=list)
    cypher_queries: List[Dict[str, Any]] = Field(default_factory=list)

DEEP_DIVE_HEADERS = [
    "1) Signal summary",
    "2) What changed / why now",
    "3) Likely root causes",
    "4) Impact trace",
    "5) Immediate actions",
    "6) Stakeholder chain to engage",
    "7) Missing data",
]

def _looks_like_deep_dive(text: str) -> bool:
    if not text:
        return False
    hits = sum(1 for h in DEEP_DIVE_HEADERS if h.lower() in text.lower())
    return hits >= 3

def _force_deep_dive_template(payload: LlmPayload) -> None:
    if _looks_like_deep_dive(payload.final_answer):
        return

    # Wrap any answer into canonical headers to keep UI deterministic.
    body = payload.final_answer.strip() or "Data missing."
    payload.final_answer = "\n".join([
        "1) Signal summary: " + (body.splitlines()[0][:160] if body else "Data missing."),
        "2) What changed / why now: " + ("Unknown — missing evidence." if not payload.evidence else "See evidence."),
        "3) Likely root causes (bounded): " + ("Unknown — missing evidence." if not payload.evidence else "Derived from evidence."),
        "4) Impact trace: " + ("Unknown — missing evidence." if not payload.evidence else "Derived from evidence."),
        "5) Immediate actions (next 7 days): " + "Collect missing data and resolve blockers.",
        "6) Stakeholder chain to engage: " + "Identify owners and escalation chain.",
        "7) Missing data: " + (", ".join(payload.missing_data) if payload.missing_data else "None declared."),
    ])

def _extract_tool_calls(payload: LlmPayload) -> List[Dict[str, Any]]:
    # Support either field name depending on which layer assembled the payload.
    calls = []
    if payload.tool_calls:
        calls.extend(payload.tool_calls)
    if payload.mcp_calls:
        calls.extend(payload.mcp_calls)
    if payload.cypher_queries:
        calls.extend(payload.cypher_queries)
    return calls

def _has_empty_outputs(tool_calls: List[Dict[str, Any]]) -> bool:
    # Generic empty-result guard; recognizes common output shapes.
    for c in tool_calls:
        out = c.get("output", None)
        if out is None:
            continue
        if out == "" or out == [] or out == {}:
            return True
        # Some systems store output under nested keys
        if isinstance(out, dict) and out.get("rows") == []:
            return True
    return False

def enforce_llm_contract(raw: Dict[str, Any], force_deep_dive_template: bool = False) -> Dict[str, Any]:
    # Normalize missing keys without inventing content.
    if raw is None:
        raw = {}

    # Common variant: top-level may already be a dict with final_answer/artifacts, or nested.
    candidate = raw

    # Pydantic v2: model_validate/model_dump
    # Pydantic v1: parse_obj/dict
    try:
        payload = LlmPayload.model_validate(candidate)
    except Exception:
        try:
            payload = LlmPayload.parse_obj(candidate)
        except Exception:
            payload = None

    if payload is None:
        # Minimal coercion pass: keep what exists, drop unknown.
        payload = LlmPayload(
            final_answer=str(candidate.get("final_answer") or candidate.get("answer") or ""),
            artifacts=candidate.get("artifacts") or [],
            evidence=candidate.get("evidence") or [],
            missing_data=candidate.get("missing_data") or [],
            clarification_needed=bool(candidate.get("clarification_needed") or False),
            tool_calls=candidate.get("tool_calls") or [],
            mcp_calls=candidate.get("mcp_calls") or [],
            cypher_queries=candidate.get("cypher_queries") or [],
        )

    tool_calls = _extract_tool_calls(payload)

    # Empty-result guard: if tooling was used and outputs are empty, force missing-data posture.
    if tool_calls and _has_empty_outputs(tool_calls):
        payload.clarification_needed = True
        if not payload.missing_data:
            payload.missing_data = ["Tool returned empty output; required data was not retrieved."]
        if not payload.evidence:
            payload.final_answer = "Data missing. Tool outputs were empty. See missing_data."

    # Evidence gating: if tooling appears to have been used but evidence is empty, downgrade.
    if tool_calls and not payload.evidence:
        payload.clarification_needed = True
        if "Evidence not provided for tool-derived claims." not in payload.missing_data:
            payload.missing_data.append("Evidence not provided for tool-derived claims.")
        if payload.final_answer and "Data missing" not in payload.final_answer:
            payload.final_answer = "Data missing. Evidence is required for grounded claims. See missing_data."

    if force_deep_dive_template:
        _force_deep_dive_template(payload)

    try:
        return payload.model_dump()
    except Exception:
        return payload.dict()
```

---

### 6.2 Apply the contract enforcement in the chat route (single insertion point)
**File:** `/backend/app/api/routes/chat.py`

Patch pattern (do not assume your internal orchestrator name; only wrap its returned dict):

```python
# In /backend/app/api/routes/chat.py (or wherever /api/v1/chat/message is implemented)

from app.core.llm_contract import enforce_llm_contract

# ... inside your existing /message handler, after you have raw_llm_payload dict ...

llm_payload = enforce_llm_contract(raw_llm_payload, force_deep_dive_template=True)

# ... then return your existing ChatResponse using your already-computed conversation_id ...
# return ChatResponse(conversation_id=conversation_id, llm_payload=llm_payload)
```

This keeps your internals intact; it only enforces output stability and guards against empty tool outputs and missing evidence.

---

### 6.3 Canonical templates (server-enforced)
- `force_deep_dive_template=True` ensures Deep Dive output is always sectioned.
- In Phase A, the UI already asks for the same structure; Phase B makes it non-optional.

---

## 7) Landing page restructure (Phase 0)

### Above the fold (no AI mention)
Headline: Transformation Control Tower  
Subhead: Reduce PMO reporting load. Expose cross-cutting dependencies. Turn status noise into early warnings.

### Three blocks
1) Reporting Compression  
2) Cross-Cutting Alignment  
3) Proactive Risk

### Proof strip
Embed:
- `josoor_control_tower_overview_merged.png`
- `josoor_dependency_desk_merged.png`
- `josoor_risk_desk_merged.png`

### Augmented PMO team
- Stakeholder Liaison
- Dependency Architect
- Risk Sentinel

### Deep Dive section (AI appears here)
“Click any element → bounded analysis with evidence.”  
Embed `josoor_deep_dive_panel.png`.

---

## 8) Testing + rollback

### Frontend checks
- Desk artifact opens without chat.
- buildUrlV1/buildUrlApi produce correct paths in both modes (API base set vs not set).
- Deep dive cannot run without selection.

### Backend checks
- If tooling used without evidence → clarification_needed true.
- If tool output empty → clarification_needed true + missing_data populated.
- Deep dive output is always sectioned.

Rollback
- Remove the three artifact types and the ArtifactRenderer switch cases; no migrations required.

---

## 9) Versioning
- Keep this document versioned.
- Keep screenshots versioned with stable filenames to avoid drift.

