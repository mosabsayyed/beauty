# JOSOOR Chat Application - Complete Requirements Document

**Version:** 1.0.0  
**Date:** November 14, 2024  
**Status:** Approved & Locked

---

## 1. Executive Summary

### 1.1 What is JOSOOR?

**JOSOOR — The Cognitive Transformation Bridge** is the flagship product of AI Twin Tech, positioning the company as a Systems Architect and Integrator for the Cognitive Government era. JOSOOR is not just software; it's a bridge between traditional government operations and the cognitive future.

The name "JOSOOR" (جسور) means "bridges" in Arabic, embodying the product's mission to connect legacy systems with AI-powered transformation.

### 1.2 Target Audience

**Primary:** Public sector organizations and government entities  
**Secondary:** Transformation leaders, policy makers, and government analysts  
**Geography:** MENA region with focus on cognitive government initiatives

### 1.3 Product Vision

The chat interface (Noor) serves as the **universal portal to all content**. Unlike traditional websites with navigation menus, JOSOOR demonstrates its value proposition by using AI to navigate complexity. This is a **pure AI-first experience** — "like it or leave it, this is the future."

**Core Philosophy:** The chat app IS the site. Users interact with all JOSOOR capabilities through conversational AI.

---

## 2. Development Team Structure

### 2.1 Two-AI Development Model

**Frontend AI (Design & UI):**
- Responsible for: React components, UI/UX, styling, layouts, frontend state management
- Tech stack: React, TypeScript, Tailwind CSS, Recharts
- Deliverables: Complete chat interface, canvas renderers, responsive design
- Integration: Consumes backend API via TypeScript contract

**Backend AI (Logic & Data):**
- Responsible for: LLM orchestration, graph database navigation, tool calling, API endpoints
- Tech stack: Python, FastAPI, Neo4j, Supabase, LLM integration
- Deliverables: REST API endpoints, prompt engineering, data processing
- Integration: Provides API following established contract

### 2.2 Integration Pattern

**API Contract Approach:**
1. TypeScript interface contract defines the boundary between frontend and backend
2. Frontend develops with mock implementations
3. Backend develops following the same contract
4. Integration via simple swap from mock to real API
5. No coupling during parallel development

---

## 3. Backend API Contract

### 3.1 Transport & Authentication

- **Protocol:** REST API (no WebSocket/SSE currently)
- **Base URL:** `http://localhost:8000` (dev) | TBD (production)
- **API Prefix:** `/api/v1/`
- **Authentication:** Demo mode (user_id = 1) currently. JWT planned for future.
- **CORS:** Wide open for dev (allow all origins)

### 3.2 Core Endpoints

#### POST `/api/v1/chat/message`
Send user query, receive AI response with artifacts

**Request:**
```typescript
{
  query: string;
  conversation_id: number | null;
  persona?: string; // default: "transformation_analyst"
}
```

**Response:**
```typescript
{
  conversation_id: number;
  message: string;
  visualization: dict | null; // legacy field
  insights: string[];
  artifacts: Artifact[];
  clarification_needed?: boolean;
  clarification_questions?: string[];
  clarification_context?: string;
}
```

#### GET `/api/v1/chat/conversations`
List user conversations

**Response:**
```typescript
{
  conversations: Array<{
    id: number;
    title: string;
    message_count: number;
    created_at: string;
    updated_at: string;
  }>
}
```

#### GET `/api/v1/chat/conversations/{conversation_id}`
Get conversation details with messages

**Response:**
```typescript
{
  conversation: object;
  messages: Array<{
    id: number;
    role: string;
    content: string;
    created_at: string;
    metadata?: object;
  }>
}
```

#### GET `/api/v1/chat/conversations/{conversation_id}/messages`
Get messages for a conversation (limit: 100)

#### DELETE `/api/v1/chat/conversations/{conversation_id}`
Delete conversation

#### GET `/api/v1/chat/debug_logs/{conversation_id}`
Get debug logs for conversation (development only)

### 3.3 Artifact Types & Formats

**Artifact Structure:**
```typescript
{
  artifact_type: "CHART" | "TABLE" | "REPORT" | "DOCUMENT";
  title: string;
  content: Record<string, any>; // format varies by type
  description?: string;
}
```

#### CHART Artifacts
Backend returns **Highcharts-style configuration**. Frontend translates to Recharts.

**Example:**
```json
{
  "artifact_type": "CHART",
  "title": "Risk by Project",
  "content": {
    "chart": { "type": "bar" },
    "title": { "text": "Risk by Project" },
    "xAxis": { "categories": ["Alpha", "Beta", "Gamma"] },
    "yAxis": { "title": { "text": "Risk Score" }, "min": 0 },
    "series": [
      { "name": "Risk Score", "data": [0.9, 0.87, 0.65] }
    ]
  }
}
```

**Chart types:** bar, column, line, area, pie, scatter

#### TABLE Artifacts
**Format:**
```typescript
{
  artifact_type: "TABLE",
  content: {
    columns: string[];
    rows: any[][];
    total_rows: number;
  }
}
```

#### REPORT Artifacts
**Format:**
```typescript
{
  artifact_type: "REPORT",
  content: {
    format: "markdown" | "json" | "html";
    body: string;
  }
}
```

#### DOCUMENT Artifacts
**Format:**
```typescript
{
  artifact_type: "DOCUMENT",
  content: {
    format: "html" | "markdown";
    body: string;
  }
}
```

### 3.4 Important Backend Notes

- **Artifacts array is authoritative:** Use `response.artifacts[]`, not `response.visualization`
- **No streaming currently:** Synchronous request/response only
- **Artifacts persist in message metadata:** Retrieved via messages endpoint
- **Session management:** Integer conversation IDs auto-created on first message

---

## 4. Design System (LOCKED)

### 4.1 Base System: Mono-Functional SaaS Kit

**Philosophy:** Radical Clarity  
**Tone:** Professional, crisp, efficient, authoritative

### 4.2 Color Palette

**Canvas:**
- Page background: `#F9FAFB`
- Card background: `#FFFFFF`
- Inverted background: `#000000`

**Text:**
- Primary: `#111827`
- Secondary: `#6B7280`
- Tertiary: `#9CA3AF`
- Inverted: `#FFFFFF`

**Borders:**
- Subtle: `#F3F4F6`
- Default: `#E5E7EB`
- Focus: `#000000`

**Interactive:**
- Primary default: `#000000`
- Primary hover: `#374151`
- Secondary background: `#FFFFFF`
- Secondary border: `#E5E7EB`

**Gold Accent (NEW):**
- Primary gold: `#D4AF37` (classic gold)
- Gold hover: `#C5A028`
- Gold muted: `#E8D7A3`

**Usage:** Gold for premium/auth indicators, AI identity accents, special capabilities

### 4.3 Typography

**Font Family:** Inter, system-ui, -apple-system, sans-serif

**Weights:**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

**Sizing:**
- H1: 24px
- H2: 20px
- H3: 16px
- Body: 14px
- Caption: 12px

### 4.4 Spacing

- Container padding: 24px
- Element gap: 16px
- Tight gap: 8px

### 4.5 Border Radius (APPROVED)

- Small: 6px
- Medium: 8px
- Large: 12px
- XLarge: 16px
- Full: 9999px (pills)

**Note:** Rounded corners approved (changed from initial "sharp-only" requirement)

### 4.6 Shadows

- Card: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`
- Popover: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`
- None: `none`

### 4.7 Iconography

- Style: Line/Stroke
- Weight: 1.5px or 2px
- Library: Lucide React
- Color: Inherit from text

---

## 5. Chat-Specific Design Extensions

### 5.1 Message Bubbles

**User Messages:**
- Background: `#000000`
- Text: `#FFFFFF`
- Border radius: 12px
- Max width: 80% of chat column
- Alignment: Right (LTR) / Left (RTL)

**Assistant Messages:**
- Background: `#FFFFFF`
- Text: `#111827`
- Border: 1px solid `#E5E7EB`
- Border radius: 12px
- Max width: 100% of chat column
- Alignment: Left (LTR) / Right (RTL)

**Avatar:**
- Size: 32px × 32px
- Border radius: Full (circle)
- User: Initials or photo
- Noor (AI): Gold accent icon/logo

### 5.2 Canvas/Artifact Containers

**Artifact Card (embedded in chat):**
- Background: `#F9FAFB`
- Border: 1px solid `#E5E7EB`
- Border radius: 8px
- Padding: 16px
- Hover: Border color → `#000000`

**Canvas Panel (slide-out):**
- Background: `#FFFFFF`
- Shadow: Popover shadow
- Width: 50% of viewport (min 480px)
- Header background: `#000000`
- Header text: `#FFFFFF`

**Chart Styling:**
- Use Recharts with custom styling
- Grid lines: `#E5E7EB`
- Axis text: `#6B7280`
- Data colors: Monochrome palette with gold accent for primary data

**Table Styling:**
- Header background: `#F9FAFB`
- Header text: `#111827`, semibold
- Border: 1px solid `#E5E7EB`
- Row hover: `#F9FAFB`
- Striped rows: Alternate `#FFFFFF` / `#F9FAFB`

### 5.3 Sidebar Design

**Width:** 260px (fixed)

**Sections:**
1. App header (logo + "JOSOOR" or "جسور")
2. New Chat button (primary black button)
3. Navigation tabs (Chats, Artifacts)
4. Recent conversations list
5. Account section (bottom)

**Conversation Item:**
- Height: 48px
- Padding: 12px
- Border radius: 8px
- Hover: Background `#F9FAFB`
- Active: Background `#000000`, text `#FFFFFF`
- Overflow: Ellipsis on title

### 5.4 Input Composer

**Container:**
- Border top: 1px solid `#E5E7EB`
- Background: `#FFFFFF`
- Padding: 16px

**Text Area:**
- Border: 1px solid `#E5E7EB`
- Border radius: 8px
- Min height: 48px
- Max height: 120px
- Focus: Border `#000000`, ring 2px

**Send Button:**
- Background: `#000000`
- Icon: Arrow up (white)
- Size: 40px × 40px
- Border radius: 8px
- Hover: Background `#374151`
- Disabled: Opacity 50%

**Attachment Button:**
- Icon: Paperclip
- Background: Transparent
- Hover: Background `#F9FAFB`
- Border radius: 6px

### 5.5 Loading States

**Thinking Indicator:**
- Background: `#F9FAFB`
- Text: "Noor is thinking..." / "نور تفكر..."
- Icon: Animated spinner (1.5s rotation)

**Streaming (future):**
- Typewriter effect with cursor
- Partial artifact preview

---

## 6. Features Specification

### 6.1 Core User Flow

1. **Entry:** Rubik's Cube animation (unchanged from current)
2. **Landing:** Chat interface (no login required)
3. **Guest Mode:** Access public content, browse examples
4. **Auth Prompt:** When attempting restricted features
5. **Logged In:** Full access to conversations, artifacts, exports

### 6.2 Basic Features (MUST HAVE)

**Chat Functionality:**
- [x] Send message, receive AI response
- [x] Multi-conversation management (sidebar)
- [x] New conversation button
- [x] Delete conversations
- [x] Edit conversation title
- [x] Conversation metadata (date, message count)

**Canvas/Artifacts:**
- [x] View charts (Recharts renderer with Highcharts translation)
- [x] View data tables (interactive, sortable)
- [x] View reports (markdown renderer)
- [x] View documents (HTML/markdown renderer)
- [x] Expand/collapse canvas panel
- [x] Minimize/maximize canvas
- [x] Close canvas (return to chat-only)

**Message Features:**
- [x] Copy message text
- [x] Edit and resend user message
- [x] Thumbs up/down on assistant responses
- [x] Regenerate response with options
- [x] Timestamp display
- [x] Message overflow handling (show more/less)

### 6.3 Advanced Features (MUST HAVE)

**Conversation Management:**
- [x] Multi-conversation support
- [x] Search across conversations (NEW - to be built)
- [ ] Share conversations (public links) - NOT INCLUDED
- [ ] Export conversation - NOT INCLUDED

**File Upload (NEW):**
- [x] Attach files to messages
- **Restrictions:**
  - File types: PDF, TXT only
  - Max size per file: 10MB
  - Max files per message: 10
  - Total size limit: 10MB across all files
- [x] File preview in chat
- [x] Upload progress indicator
- [x] Remove uploaded files before sending

**Export Functionality (NEW):**
Artifacts can be exported to:
- [x] Microsoft Excel (.xlsx)
- [x] Microsoft Word (.docx)
- [x] Microsoft PowerPoint (.pptx)
- [x] Google Sheets
- [x] Google Docs
- [x] Google Slides

**Note:** Most export functionality already supported by backend

### 6.4 Future Features (NOT IN V1)

- [ ] Real-time streaming responses (requires backend changes)
- [ ] Voice input (planned for next release)
- [ ] Share conversations via public links
- [ ] Export full conversation history
- [ ] Collaborative artifacts (multi-user editing)

### 6.5 Bilingual Support (Arabic/English)

**Language Toggle:**
- Accessible from header
- Persists in localStorage
- Affects: UI labels, placeholder text, date formatting, RTL/LTR layout

**RTL Support:**
- Full layout flip for Arabic
- Mirror positioning (sidebar, canvas)
- Text alignment (right for AR, left for EN)
- Icon mirroring where semantically appropriate

**Content:**
- All UI strings available in both languages
- Assistant responses follow conversation language
- Timestamps formatted per locale

---

## 7. Layout Specification (Claude-Style)

### 7.1 Three-Column Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar: 260px] │ [Chat: Flex] │ [Canvas: 50% (opt)] │
│                  │              │                       │
│ • Logo           │ Header       │ Artifact Header      │
│ • New Chat       │              │                       │
│ • Conversations  │ Messages     │ Artifact Content     │
│ • Account        │              │                       │
│                  │ Composer     │ Actions              │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Region Specifications

**Sidebar (Left):**
- Position: Fixed left
- Width: 260px (not resizable)
- Scroll: Independent for conversations list
- Background: `#F9FAFB`

**Chat Column (Center):**
- Position: Flex
- Min width: 480px
- Max width: 960px (when canvas closed)
- Scroll: Independent for message timeline
- Background: `#FFFFFF`
- Resizable: Yes (when canvas open)

**Canvas Panel (Right):**
- Position: Right slide-out
- Width: 50% of viewport (min 480px)
- Scroll: Independent
- Background: `#FFFFFF`
- Visible: Only when artifact open
- Animation: Slide in from right (300ms ease)

### 7.3 Responsive Behavior

**Desktop (>1280px):**
- Three columns visible when canvas open
- Chat column shrinks to accommodate canvas

**Tablet (768px - 1280px):**
- Canvas overlays chat (full width right panel)
- Sidebar collapsible to icon-only

**Mobile (<768px):**
- Single column view
- Sidebar as drawer overlay
- Canvas as full-screen modal

---

## 8. Interaction Flows

### 8.1 Opening an Artifact

**Trigger:** User clicks artifact card in chat

**Steps:**
1. Set `currentArtifactId`
2. Load artifact data into canvas body
3. Animate canvas slide-in from right (300ms)
4. Shrink chat column width
5. Show vertical divider between chat and canvas
6. Focus remains on canvas header

### 8.2 Closing Canvas

**Trigger:** User clicks close button or navigates away

**Steps:**
1. Animate canvas slide-out to right (300ms)
2. Set canvas visibility to false
3. Expand chat column to full width
4. Hide vertical divider
5. Focus returns to chat composer

### 8.3 Switching Conversations

**Trigger:** User clicks conversation in sidebar

**Steps:**
1. Load conversation messages into chat timeline
2. Scroll chat to bottom (latest message)
3. If conversation has active artifact:
   - Restore artifact in canvas
   - Open canvas panel
4. Else: Ensure canvas is closed
5. Update conversation title in header

### 8.4 Creating New Artifact

**Trigger:** Assistant generates artifact in response

**Steps:**
1. Backend returns `ChatResponse` with artifacts array
2. Assistant message renders with embedded artifact card(s)
3. User can click card to open in canvas
4. Artifact persists in message metadata for future retrieval

### 8.5 File Upload Flow

**Trigger:** User clicks attachment button

**Steps:**
1. Open file picker (PDF, TXT only)
2. Validate file type, size, count
3. Show upload progress
4. Display file preview below composer
5. Allow removal before sending
6. Include files in message payload on send

---

## 9. Site Map & Content Sections

### 9.1 Primary Sections (Accessible via Noor Chat)

1. **Home / New Chat**
   - Entry point after Rubik's Cube
   - Welcome message from Noor
   - Suggested prompts for first-time users

2. **The First Use Case** (NEW)
   - Description of initial JOSOOR implementation
   - Success stories and case studies
   - Public sector transformation examples

3. **Twin Science** (Media Library) (NEW)
   - Research papers and publications
   - Video content
   - Infographics and visual explainers
   - Thought leadership articles

4. **Twin Experience** (NEW)
   - Interactive demos
   - Guided tours of JOSOOR capabilities
   - Sandbox environment for exploration

5. **Intelligent Dashboards** (NEW)
   - Pre-built analytics views
   - Real-time data visualizations
   - Customizable KPI tracking
   - Export and sharing options

6. **Chat Over Coffee** (Existing)
   - Founders' vision and philosophy
   - Behind-the-scenes content
   - Company culture and values

7. **Origins** (Existing)
   - Company history
   - Mission and vision
   - Team background

8. **Twin Studio** (Existing)
   - Development environment
   - API documentation
   - Integration guides

9. **Artifacts Gallery**
   - User's saved artifacts
   - Inspiration templates
   - Community-shared examples (if applicable)

### 9.2 Navigation Method

**All sections accessible via:**
- Natural language queries to Noor
- Quick action buttons (converted to chat commands)
- Contextual suggestions in responses
- Sidebar shortcuts (if deemed necessary)

**Example:** User types "Show me the first use case" → Noor loads content in canvas panel

---

## 10. Gold Accent Integration

### 10.1 Usage Guidelines

Gold (`#D4AF37`) used sparingly for:

**AI Identity:**
- Noor avatar border/glow
- "AI Response" label subtle underline
- Thinking indicator accent

**Premium/Auth Indicators:**
- "Login Required" badge on restricted features
- Gold star icon for premium capabilities
- User avatar border when logged in with premium

**Special Highlights:**
- Featured artifact badge in gallery
- Important insights callout
- New feature announcement banner

**Interactive States:**
- Gold accent on hover for special actions
- Gold progress bar for uploads
- Gold checkmark for successful operations

### 10.2 What NOT to Use Gold For

- Primary buttons (remain black)
- Standard navigation elements
- Regular text or borders
- Background fills (except very subtle `#E8D7A3` for highlights)

---

## 11. Technical Stack

### 11.1 Frontend

- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS v4.0
- **Charts:** Recharts (translating Highcharts configs from backend)
- **Icons:** Lucide React
- **Animation:** Motion (framer-motion successor)
- **Markdown:** react-markdown
- **Forms:** react-hook-form@7.55.0
- **State Management:** React Context + hooks
- **HTTP Client:** fetch API
- **File Handling:** Native File API with validation

### 11.2 Backend

- **Framework:** FastAPI (Python)
- **Database:** Neo4j (graph), Supabase (relational)
- **LLM:** Custom orchestration with tool calling
- **Authentication:** JWT (planned), demo mode (current)

### 11.3 Build & Deploy

- **Dev Server:** Vite
- **Production Build:** Static site generation
- **Hosting:** TBD (recommend Vercel/Netlify for frontend)
- **Backend Hosting:** TBD

---

## 12. Development Phases

### Phase 1: Foundation (Current)
- [x] Design system implementation
- [x] Basic chat interface
- [x] Canvas panel structure
- [ ] TypeScript API contract
- [ ] Mock API service

STAGE GATE: Pause for User Review and QA of Phase outputs. Await user approval to proceed.

### Phase 2: Core Features
- [ ] Backend integration (real API)
- [ ] Conversation management (sidebar)
- [ ] Artifact renderers (chart, table, report, document)
- [ ] Highcharts → Recharts translation layer
- [ ] File upload functionality
- [ ] Search across conversations

STAGE GATE: Pause for User Review and QA of Phase outputs. Await user approval to proceed.

### Phase 3: Content Integration
- [ ] Migrate existing content sections to canvas format
- [ ] Add new sections (First Use Case, Twin Science, etc.)
- [ ] Noor prompt engineering for content navigation
- [ ] Quick actions menu refinement

STAGE GATE: Pause for User Review and QA of Phase outputs. Await user approval to proceed.

### Phase 4: Polish & Export
- [ ] Export functionality (Excel, Word, PPT, Google equivalents)
- [ ] Loading states and error handling
- [ ] Responsive design (mobile, tablet)
- [ ] Performance optimization
- [ ] Accessibility (WCAG 2.1 AA)

STAGE GATE: Pause for User Review and QA of Phase outputs. Await user approval to proceed.

### Phase 5: Authentication & Launch
- [ ] JWT authentication implementation
- [ ] User registration/login flow
- [ ] Permission-based content access
- [ ] Production deployment
- [ ] Analytics integration

STAGE GATE: Pause for User Review and QA of Phase outputs. Await user approval to close.
---

## 13. Success Metrics

**Site User Engagement:**
- Average conversation length
- Artifact creation rate
- Return user rate
- Time spent in canvas

**Technical Performance:**
- Page load time <2s
- Time to first response <3s
- Canvas render time <500ms
- Zero critical errors

**Content Discovery:**
- Navigation via Noor vs traditional menus
- Content section access patterns
- Search usage and effectiveness
- Artifact export frequency

---

## 14. Risks & Mitigations

**Risk:** Highcharts → Recharts translation complexity  
**Mitigation:** Build incremental translator, handle edge cases gracefully, fallback to raw data table

**Risk:** Backend API changes breaking frontend  
**Mitigation:** TypeScript contract as single source of truth, version API, comprehensive error handling

**Risk:** Users confused by AI-only navigation  
**Mitigation:** Strong onboarding, clear prompts, fallback breadcrumbs in canvas

**Risk:** Performance with large conversations  
**Mitigation:** Pagination, virtual scrolling, lazy loading artifacts

**Risk:** Arabic RTL layout edge cases  
**Mitigation:** Thorough testing, CSS logical properties, RTL-first development for new features

---

## 15. Appendices

### Appendix A: Reference Documents

The following backend documentation files are incorporated by reference:

1. **backend_api_full.md** - Complete API endpoint specifications
2. **backend_env_and_cors.md** - Environment and CORS configuration
3. **artifacts_spec.md** - Detailed artifact formats and rendering guidance

### Appendix B: Design System Reference

**Source:** Mono-Functional SaaS Kit v2.0  
**Reference Image:** `figma:asset/1d101e90c6682390ff608449e80b74e07bd6d3fd.png`

### Appendix C: JSON Specification Reference

**Source:** Chat+Canvas Webapp Layout specification (provided in requirements)  
**Coverage:** Layout regions, components, interaction flows, behavior triggers

---

## 16. Document Control

**This document is the single source of truth for JOSOOR chat application development.**

**Change Control:**
- Changes require mutual agreement between product owner and both AI developers
- Version updates tracked in header
- Major changes trigger new document version
- Archive previous versions with timestamp

**Review Schedule:**
- Review after each development phase
- Update as needed based on user testing
- Lock design system except for new component patterns

---

**End of Requirements Document**

*For questions or clarifications, refer to this document first. If ambiguity exists, request clarification from product owner before making assumptions.*
