# Frontend Architecture Reference

> **Purpose:** Comprehensive reference for coding agents and developers working on the JOSOOR frontend.  
> **Grounded in:** Actual codebase analysis, no assumptions.  
> **Last Updated:** Based on current codebase state

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Build & Development](#build--development)
4. [Application Entry Point](#application-entry-point)
5. [Routing](#routing)
6. [Context Providers](#context-providers)
7. [Services Layer](#services-layer)
8. [Components](#components)
9. [Type Definitions](#type-definitions)
10. [Styling System](#styling-system)
11. [Authentication Flow](#authentication-flow)
12. [Chat Architecture](#chat-architecture)
13. [Artifact Rendering](#artifact-rendering)
14. [Internationalization](#internationalization)
15. [Environment Variables](#environment-variables)
16. [Key Patterns](#key-patterns)

---

## Overview

JOSOOR is a **Cognitive Digital Twin** chat application built with React, TypeScript, and Vite.

**Key Characteristics:**
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **Port:** 3000
- **State Management:** React Context + React Query
- **UI Components:** Radix UI primitives + custom components
- **Styling:** CSS variables (NO Tailwind) + component-specific CSS files
- **Authentication:** Supabase Auth + local JWT
- **Languages:** English (en) and Arabic (ar) with RTL support

---

## Directory Structure

```
frontend/
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── postcss.config.js         # PostCSS config
├── .env                      # Environment variables
├── .env.example              # Environment template
├── public/                   # Static assets
│   └── icons/                # Sidebar icons (SVG)
├── src/
│   ├── index.tsx             # React entry point
│   ├── App.tsx               # Root component, routing
│   ├── index.css             # Global CSS imports
│   ├── ChartRenderer.tsx     # Legacy chart component
│   ├── contexts/
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── LanguageContext.tsx # i18n state (en/ar)
│   ├── lib/
│   │   ├── supabaseClient.ts # Supabase client init
│   │   └── services/
│   │       ├── authService.ts   # Auth operations
│   │       └── chatService.ts   # Chat API operations
│   ├── services/             # Re-exports from lib/services
│   ├── pages/
│   │   ├── ChatAppPage.tsx   # Main chat interface
│   │   ├── ChatAppPage.css   # Chat page styles
│   │   ├── LandingPage.tsx   # Public landing page
│   │   ├── LoginPage.tsx     # Login/register form
│   │   ├── WelcomeEntry.tsx  # Entry animation
│   │   ├── ArchitecturePage.tsx
│   │   ├── FounderLetterPage.tsx
│   │   ├── ContactUsPage.tsx
│   │   ├── CanvasTestPage.tsx
│   │   ├── ObservabilityPage.tsx   # Admin observability
│   │   └── ObservabilityPage.css
│   ├── components/
│   │   ├── chat/             # Chat UI components
│   │   ├── ui/               # Radix UI primitives
│   │   ├── layout/           # Layout components
│   │   ├── content/          # Content components
│   │   └── graphv001/        # Graph visualization
│   ├── types/
│   │   ├── api.ts            # API contract types
│   │   ├── chat.ts           # Chat-specific types
│   │   └── index.ts          # Type re-exports
│   ├── styles/
│   │   ├── theme.css         # CSS variables (core)
│   │   ├── chat.css          # Chat styles
│   │   ├── sidebar.css       # Sidebar styles
│   │   ├── message-bubble.css
│   │   └── chat-container.css
│   ├── utils/
│   │   ├── streaming.ts      # JSON parsing utilities
│   │   └── canvasActions.ts  # Canvas export utilities
│   ├── locales/              # Translation files
│   └── data/                 # Static data/configs
└── build/                    # Production build output
```

---

## Build & Development

### Vite Configuration

**File:** `/frontend/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Backend (FastAPI)
      '/api/v1': 'http://localhost:8008',
      // Graph server (proxied via Vite)
      '/api/neo4j': 'http://localhost:3001',
      '/api/dashboard': 'http://localhost:3001',
      '/api/graph': 'http://localhost:3001',
      '/api/business-chain': 'http://localhost:3001',
      '/api/control-tower': 'http://localhost:3001',
      '/api/dependency': 'http://localhost:3001',
      '/api/domain-graph': 'http://localhost:3001',
      '/api/debug': 'http://localhost:3001'
    }
  },
})
```

### Scripts

```json
{
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest"
  }
}
```

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `react` (v19) | UI framework |
| `react-router-dom` | Routing |
| `@tanstack/react-query` | Server state management |
| `@supabase/supabase-js` | Supabase client |
| `@radix-ui/*` | UI primitives (40+ packages) |
| `recharts` | Chart rendering |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `dompurify` | HTML sanitization |
| `date-fns` | Date formatting |
| `highcharts` | Chart library (backup) |

---

## Application Entry Point

### index.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
```

### App.tsx

```tsx
export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

**Provider Hierarchy:**
1. `QueryClientProvider` - React Query
2. `BrowserRouter` - Routing
3. `AuthProvider` - Authentication state
4. `LanguageProvider` - i18n (en/ar)

---

## Routing

**File:** `/frontend/src/App.tsx`

| Path | Component | Access |
|------|-----------|--------|
| `/` | `WelcomeEntry` | Public |
| `/landing` | `LandingPage` | Public |
| `/login` | `LoginPage` | Public |
| `/chat` | `ChatAppPage` | Protected |
| `/josoor-v2` | `JosoorV2Page` | Protected |
| `/architecture` | `ArchitecturePage` | Public |
| `/canvas-test` | `CanvasTestPage` | Public |
| `/founder-letter` | `FounderLetterPage` | Public |
| `/contact-us` | `ContactUsPage` | Public |
| `/admin/observability` | `ObservabilityPage` | Admin (not linked) |
| `*` | Redirect to `/` | - |

### Protected Route Pattern

```tsx
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  return children;
}
```

---

## Context Providers

### AuthContext

**File:** `/frontend/src/contexts/AuthContext.tsx`

```typescript
interface AuthContextShape {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**Features:**
- Syncs with localStorage (`josoor_token`, `josoor_user`)
- Listens to Supabase auth state changes
- Emits custom `josoor_auth_change` event
- Validates tokens via backend `/api/v1/auth/users/me`

### LanguageContext

**File:** `/frontend/src/contexts/LanguageContext.tsx`

```typescript
type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;  // true when language === 'ar'
}
```

**Usage:**
```tsx
const { language, setLanguage, isRTL } = useLanguage();
```

---

## Services Layer

### chatService

**File:** `/frontend/src/lib/services/chatService.ts`

Main API client for chat operations.

#### API URL Resolution

```typescript
const RAW_API_BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || '';
const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
const API_PATH_PREFIX = API_BASE_URL ? '' : '/api/v1';

function buildUrl(endpointPath: string) {
  return `${API_BASE_URL || ''}${API_PATH_PREFIX}${path}`;
}
```

#### Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `sendMessage(request)` | `POST /chat/message` | Send chat message |
| `getConversations(userId?, limit?)` | `GET /chat/conversations` | List conversations |
| `getConversationMessages(id)` | `GET /chat/conversations/{id}/messages` | Get messages |
| `deleteConversation(id)` | `DELETE /chat/conversations/{id}` | Delete conversation |
| `addConversationMessage(...)` | `POST /chat/conversations/{id}/messages` | Add message |
| `getDebugLogs(id)` | `GET /debug_logs/{id}` | Get debug traces |

#### Request/Response Types

```typescript
interface ChatRequest {
  query: string;
  persona?: string;
  conversation_id?: number;
}

interface ChatResponse {
  message: string;
  conversation_id: number;
  clarification_needed?: boolean;
  clarification_questions?: string[];
  artifacts?: Artifact[];
  confidence?: number;
  data?: any;
}
```

#### Artifact Adaptation

The service includes `adaptArtifacts()` which transforms backend visualization configs to frontend-compatible format:
- Maps Highcharts-style configs to Recharts
- Handles CSV parsing for table artifacts
- Preserves HTML artifacts

### authService

**File:** `/frontend/src/lib/services/authService.ts`

Authentication operations using Supabase.

#### LocalStorage Keys

| Key | Purpose |
|-----|---------|
| `josoor_token` | Access token |
| `josoor_user` | User object (JSON) |
| `josoor_authenticated` | Auth flag |
| `josoor_guest_id` | Guest session ID |
| `josoor_guest_conversations` | Guest conversations (JSON) |

#### Methods

| Method | Description |
|--------|-------------|
| `login(email, password)` | Sign in via Supabase |
| `register(email, password, full_name?)` | Sign up |
| `signInWithProvider(provider)` | OAuth (google, apple) |
| `logout()` | Sign out |
| `getToken()` | Get stored token |
| `getUser()` | Get stored user |
| `startGuestSession()` | Create guest session |
| `isGuestMode()` | Check if guest |
| `saveGuestConversations(convos)` | Persist guest history |
| `clearGuestConversations()` | Clear guest data |
| `fetchAppUser()` | Validate via backend |

### Supabase Client

**File:** `/frontend/src/lib/supabaseClient.ts`

```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
```

**Environment Variables:**
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

Falls back to `window.__env__` for runtime injection.

---

## Components

### Chat Components (`/src/components/chat/`)

| Component | Purpose |
|-----------|---------|
| `ChatContainer.tsx` | Main chat area with messages and input |
| `MessageBubble.tsx` | Individual message rendering |
| `ChatInput.tsx` | Message input with send button |
| `Sidebar.tsx` | Conversation list, quick actions, account |
| `CanvasManager.tsx` | Artifact display panel |
| `CanvasPanel.tsx` | Canvas content area |
| `CanvasHeader.tsx` | Canvas toolbar |
| `UniversalCanvas.tsx` | Unified canvas wrapper |
| `ArtifactRenderer.tsx` | Artifact type dispatcher |
| `CommentsSection.tsx` | Artifact comments |

### Renderers (`/src/components/chat/renderers/`)

| Renderer | Artifact Type |
|----------|---------------|
| `HtmlRenderer.tsx` | HTML content |
| `MarkdownRenderer.tsx` | Markdown content |
| `CodeRenderer.tsx` | Code blocks |
| `MediaRenderer.tsx` | Images, videos |
| `FileRenderer.tsx` | File attachments |
| `ExcelRenderer.tsx` | Excel/CSV data |
| `TwinKnowledgeRenderer.tsx` | Twin Knowledge cards |
| `LandingPageRenderer.tsx` | Landing page content |

### UI Primitives (`/src/components/ui/`)

Radix UI components wrapped for the design system:

| Component | Radix Package |
|-----------|---------------|
| `button.tsx` | - (custom) |
| `card.tsx` | - (custom) |
| `dialog.tsx` | `@radix-ui/react-dialog` |
| `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` |
| `scroll-area.tsx` | `@radix-ui/react-scroll-area` |
| `tabs.tsx` | `@radix-ui/react-tabs` |
| `tooltip.tsx` | `@radix-ui/react-tooltip` |
| `select.tsx` | `@radix-ui/react-select` |
| ... | (40+ total) |

### Graph Components (`/src/components/graphv001/`)
### Josoor V2 Pages (`/src/pages/josoor-v2/`)

| Component | Purpose |
|-----------|---------|
| `JosoorV2Page.tsx` | Dashboard shell with Control Tower, Dependency Desk, Risk Desk |
| `components/` | Subcomponents for V2 desks |
| `josoor-v2.css` | Page styles |

| Component | Purpose |
|-----------|---------|
| `GraphDashboard.tsx` | Main graph visualization |
| `GraphDashboard.css` | Graph styles |
| `api/` | Graph API calls |
| `components/` | Graph sub-components |
| `types.ts` | Graph types |
| `constants.ts` | Graph constants |

---

## Type Definitions

### API Types (`/src/types/api.ts`)

#### Artifact Types

```typescript
export type ArtifactType = 'CHART' | 'TABLE' | 'REPORT' | 'DOCUMENT' | 'GRAPHV001' | 'TWIN_KNOWLEDGE';

export interface BaseArtifact {
  id?: string;
  created_at?: string;
  groupId?: number;
  artifact_type: ArtifactType;
  title: string;
  description?: string;
  content: Record<string, any>;
}
```

#### Chart Artifact

```typescript
export interface ChartArtifact extends BaseArtifact {
  artifact_type: 'CHART';
  content: {
    chart: {
      type: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'scatter';
    };
    title?: { text: string };
    subtitle?: { text: string };
    xAxis?: { categories?: string[]; title?: { text: string } };
    yAxis?: { title?: { text: string }; min?: number; max?: number };
    series: Array<{
      name: string;
      data: number[] | Array<{ x: number; y: number }>;
      color?: string;
    }>;
  };
}
```

#### Table Artifact

```typescript
export interface TableArtifact extends BaseArtifact {
  artifact_type: 'TABLE';
  content: {
    columns: string[];
    rows: any[][];
    total_rows: number;
  };
}
```

### Chat Types (`/src/types/chat.ts`)

```typescript
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: MessageMetadata;
}

export interface Conversation {
  id: number;
  title?: string;
  message_count: number;
  updated_at: string;
}

export interface ChatRequest {
  query: string;
  persona?: string;
  conversation_id?: number;
}
```

---

## Styling System

### Theme Variables

**File:** `/frontend/src/styles/theme.css`

**⚠️ CRITICAL: This project does NOT use Tailwind CSS. Use CSS variables and dedicated CSS files.**

#### Core Variables (Dark Theme)

```css
:root {
  /* Backgrounds */
  --component-bg-primary: #111827;
  --component-panel-bg: #1F2937;
  --component-panel-border: #374151;
  --component-bg-secondary: #374151;

  /* Text */
  --component-text-primary: #F9FAFB;
  --component-text-secondary: #D1D5DB;
  --component-text-muted: #9CA3AF;

  /* Accent */
  --component-text-accent: #FFD700;      /* Gold */
  --component-text-on-accent: #111827;

  /* Status Colors */
  --component-color-success: #10B981;
  --component-color-warning: #FFD700;
  --component-color-danger: #EF4444;

  /* Chat Bubbles */
  --chat-bubble-user-bg: #10B981;
  --chat-bubble-user-text: #FFFFFF;
  --chat-bubble-bot-bg: #374151;
  --chat-bubble-bot-text: #F9FAFB;

  /* Fonts */
  --component-font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  --component-font-heading: 'Inter', 'Segoe UI', sans-serif;
  --component-font-mono: ui-monospace, SFMono-Regular, monospace;
}
```

#### Light Theme Overrides

```css
:root[data-theme="light"] {
  --component-bg-primary: #F3F4F6;
  --component-panel-bg: #FFFFFF;
  --component-panel-border: #E5E7EB;
  --component-text-primary: #1F2937;
  --component-text-secondary: #4B5563;
  --component-text-accent: #D97706;  /* Darker amber */
  /* ... */
}
```

### CSS File Organization

| File | Purpose |
|------|---------|
| `theme.css` | CSS variables, theme definitions |
| `chat.css` | Chat area styles |
| `sidebar.css` | Sidebar styles |
| `message-bubble.css` | Message bubble styles |
| `chat-container.css` | Container layout |

### Styling Pattern

```css
/* Use CSS variables, not Tailwind classes */
.my-component {
  background: var(--component-panel-bg);
  color: var(--component-text-primary);
  border: 1px solid var(--component-panel-border);
}

.my-component:hover {
  border-color: var(--component-text-accent);
}
```

---

## Authentication Flow

```
1. User visits /chat
       │
       ▼
2. ProtectedRoute checks auth
       │
       ├── Loading? → Show loading
       │
       ├── No user? → Redirect to /landing
       │
       └── Has user? → Render ChatAppPage
       
3. Login Flow (/login)
       │
       ▼
4. authService.login(email, password)
       │
       ▼
5. Supabase signInWithPassword
       │
       ▼
6. persistSession() → localStorage
       │
       ├── josoor_token = access_token
       ├── josoor_user = user JSON
       └── josoor_authenticated = 'true'
       │
       ▼
7. Emit 'josoor_auth_change' event
       │
       ▼
8. AuthContext updates state
       │
       ▼
9. Navigate to /chat
```

### Guest Mode

```typescript
// Start guest session
const guestId = await authService.startGuestSession();

// Check if guest
if (authService.isGuestMode()) {
  // Use local storage for conversations
  const convos = authService.getGuestConversations();
}

// On login, migrate guest data
if (auth.user && guestConvos.length > 0) {
  // Prompt user to migrate
  // Transfer to backend
  authService.clearGuestConversations();
}
```

---

## Chat Architecture

### ChatAppPage Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    ChatAppPage (3-column)                   │
├──────────┬────────────────────────────┬─────────────────────┤
│ Sidebar  │     ChatContainer          │   CanvasManager     │
│          │                            │   (slide-out)       │
│ - Convos │ - Header                   │                     │
│ - Quick  │ - Messages                 │ - Artifact display  │
│   Actions│ - ChatInput                │ - Navigation        │
│ - Account│                            │ - Actions           │
└──────────┴────────────────────────────┴─────────────────────┘
```

### State Management

```typescript
// ChatAppPage state
const [conversations, setConversations] = useState<ConversationSummary[]>([]);
const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
const [messages, setMessages] = useState<APIMessage[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [canvasArtifacts, setCanvasArtifacts] = useState<any[]>([]);
const [isCanvasOpen, setIsCanvasOpen] = useState(false);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);
const [streamingMessage, setStreamingMessage] = useState<APIMessage | null>(null);
```

### Message Flow

```
1. User types message
       │
       ▼
2. ChatInput.onSendMessage(text)
       │
       ▼
3. ChatAppPage.handleSendMessage()
       │
       ▼
4. chatService.sendMessage({ query, conversation_id, persona })
       │
       ▼
5. Backend returns ChatResponse
       │
       ▼
6. Extract artifacts from response
       │
       ▼
7. Update messages state
       │
       ▼
8. Update canvas artifacts
       │
       ▼
9. ChatContainer re-renders with new message
```

---

## Artifact Rendering

### ArtifactRenderer Flow

```
ArtifactRenderer receives artifact
       │
       ▼
Switch on artifact.artifact_type
       │
       ├── 'CHART' → ChartComponent (Recharts)
       ├── 'TABLE' → TableRenderer (ui/table)
       ├── 'REPORT' → MarkdownRenderer
       ├── 'DOCUMENT' → HtmlRenderer / MarkdownRenderer
       ├── 'GRAPHV001' → GraphDashboard
       ├── 'TWIN_KNOWLEDGE' → TwinKnowledgeRenderer
       └── default → JSON fallback
```

### Chart Colors

```typescript
const CHART_COLORS = {
  primary: 'var(--component-text-accent)',  // Gold
  gray1: 'var(--component-text-primary)',
  gray2: 'var(--component-text-secondary)',
  gray3: 'var(--component-text-muted)',
  // ... more colors
};
```

### Canvas Manager States

```typescript
type CanvasMode = 'hidden' | 'collapsed' | 'expanded' | 'fullscreen';
```

---

## Internationalization

### Language Toggle

```tsx
const { language, setLanguage, isRTL } = useLanguage();

// Toggle language
setLanguage(language === 'en' ? 'ar' : 'en');
```

### RTL Support

```tsx
<div dir={isRTL ? 'rtl' : 'ltr'}>
  {children}
</div>
```

### Translation Pattern

```typescript
const translations = {
  welcomeTitle: language === 'ar' ? 'مرحباً بك، أنا نور' : 'Welcome, I am Noor',
  welcomeSubtitle: language === 'ar' 
    ? 'مساعدك الذكي في رحلة التحول المعرفي'
    : 'Your AI guide to cognitive transformation',
  // ...
};
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | - | Full backend API URL (e.g., `http://localhost:8008/api/v1`) |
| `REACT_APP_API_BASE` | - | Alias for `REACT_APP_API_URL` |

**Behavior:**
- If `REACT_APP_API_URL` is set → Use as base URL
- If not set → Use relative paths `/api/v1/*` (requires proxy)

### .env.example

```dotenv
# Backend API URL (include /api/v1 if applicable)
REACT_APP_API_URL=http://localhost:8008/api/v1

# Supabase
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

---

## Key Patterns

### Memoized Components

```tsx
const MemoizedSidebar = memo(Sidebar);
const MemoizedChatContainer = memo(ChatContainer);
const MemoizedCanvasManager = memo(CanvasManager);
```

### Error Boundary

```tsx
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <div className="artifact-error">...</div>;
    }
    return this.props.children;
  }
}
```

### Safe JSON Parsing

**File:** `/frontend/src/utils/streaming.ts`

```typescript
export const safeJsonParse = (rawInput: string) => {
  // 1. Try standard parse
  // 2. Strip Markdown code blocks
  // 3. Extract last JSON block from string
  // 4. Tolerant sanitization for malformed JSON
};
```

### Fetch with Error Handling

```typescript
private async fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<Response> {
  // Add auth token from localStorage
  // Handle network errors
  // Parse error responses
  // Throw with body attached
}
```

### Theme Detection

```typescript
const [theme, setTheme] = useState<'dark' | 'light'>(() => {
  const themeAttr = document.documentElement.getAttribute('data-theme');
  return (themeAttr as 'light' | 'dark') || 'dark';
});

useEffect(() => {
  const observer = new MutationObserver(() => {
    const themeAttr = document.documentElement.getAttribute('data-theme');
    setTheme((themeAttr as 'light' | 'dark') || 'dark');
  });
  observer.observe(document.documentElement, { 
    attributes: true, 
    attributeFilter: ['data-theme'] 
  });
  return () => observer.disconnect();
}, []);
```

---

## Quick Reference

### Starting Development

```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

### Building for Production

```bash
npm run build
# Output in /frontend/build/
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Pages | PascalCase | `ChatAppPage.tsx` |
| Components | PascalCase | `MessageBubble.tsx` |
| Services | camelCase | `chatService.ts` |
| Styles | Component-name.css | `ChatAppPage.css` |
| Types | camelCase | `api.ts` |

### Component Import Pattern

```tsx
// UI components
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '../ui/card';

// Chat components
import { Sidebar, ChatContainer } from '../components/chat';

// Services
import { chatService } from '../services/chatService';
import * as authService from '../services/authService';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
```

### Quick Action System

```typescript
interface QuickAction {
  id: string;           // 'knowledge' | 'demo' | 'architecture' | 'approach'
  icon: string;         // Path to icon in public/
  label: { en: string; ar: string };
  command: { en: string; ar: string };
  category: 'learn' | 'explore' | 'tools';
}
```

**Handler mapping in ChatAppPage:**
- `'knowledge'` → Opens TwinKnowledge component
- `'demo'` → Opens GraphDashboard
- `'architecture'` → Opens ProductRoadmap
- `'approach'` → Opens PlanYourJourney

---

*This document is auto-generated from codebase analysis. Update as architecture evolves.*
