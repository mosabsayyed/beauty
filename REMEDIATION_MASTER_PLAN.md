# Josoor Sandbox - DEFINITIVE REMEDIATION MASTER PLAN

## Context & Protocol
This document replaces the previous implementation plan. It is a strictly sequential, phase-gated engineering specification. **No work proceeds to the next phase without explicit User Approval.**

---

## Phase 1: Frame, Header & Chat Integration (Hyper-Detailed)
**Goal:** Restore 100% parity with legacy `/chat` behavioral logic and UI.

### 1. The "New Chat" Bridge
- **Requirement:** Clicking "New Chat" in the sandbox sidebar MUST open the full chat module interface (ChatContainer + Canvas).
- **Modification File:** [JosoorPage.tsx](file:///home/mosab/projects/chatmodule/frontend/src/pages/josoor-sandbox/JosoorPage.tsx)
- **Instructions:**
    1.  **State Management:** Add `isChatActive: boolean` and `messages: APIMessage[]` states.
    2.  **JSX Change:**
        ```tsx
        // Logic: If isChatActive is true, render the Chat Module instead of the Desk content.
        <div className="app-main-content">
          {isChatActive ? (
            <div className="chat-integration-layer">
              <ChatContainer 
                messages={messages} 
                onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)} 
                onSendMessage={handleSendMessage}
              />
              {isCanvasOpen && <CanvasManager artifacts={canvasArtifacts} />}
            </div>
          ) : (
            /* Render activeDesk (Control Tower, etc.) */
          )}
        </div>
        ```

### 2. Sidebar: The "Hidden Button" & Legacy Icons
- **Modification File:** [FrameSidebar.tsx](file:///home/mosab/projects/chatmodule/frontend/src/pages/josoor-sandbox/layout/FrameSidebar.tsx)
- **Instructions:**
    1.  **New Chat Button:** Add at the very top of the sidebar.
        ```tsx
        <button onClick={() => setChatActive(true)} className="new-chat-action">
          <img src="/icons/new.svg" alt="New Chat" />
          <span>New Chat</span>
        </button>
        ```
    2.  **HIDDEN CANVAS TOGGLE (The "Easter Egg"):** Place strictly in the Conversations section header. This button allows users to collapse the "huge code" (Canvas) while staying in chat.
        ```tsx
        <div className="sidebar-group-header">
           <span>Conversations</span>
           <button onClick={onToggleCanvas} className="canvas-toggle-hidden">
             <img src="/icons/menu.svg" alt="Toggle" />
           </button>
        </div>
        ```
    3.  **Legacy Icons:** Replace ALL Lucide icons with their SVG equivalents from `/public/icons/`:
        - `Twin Knowledge` -> `/icons/twin.svg`
        - `Intelligent Dashboards` -> `/icons/demo.svg`
        - `Product Roadmap` -> `/icons/architecture.svg`
        - `Plan Your Journey` -> `/icons/approach.svg`

### 3. Header: User Menu Rebuild
- **Modification File:** [Header.tsx](file:///home/mosab/projects/chatmodule/frontend/src/pages/josoor-sandbox/layout/Header.tsx)
- **Instructions:**
    1.  **Import:** `import { DropdownMenu, ... } from '../../../components/ui/dropdown-menu';`
    2.  **JSX:** Implement `DropdownMenu` for the profile icon with items: `Profile`, `Settings`, `Logout` (calling `authLogout()`).

> [!IMPORTANT]
> **GATE 1: STOP.** Verify that "New Chat" triggers the chat layout and the sidebar has the Hamburger icon next to "Conversations".

---

## Phase 2: Core Desks - Strategic Logic Injection
**Goal:** Extract real components from `InvestorDemoHub.tsx` and feed them DB data.

### 1. Intelligence Dashboard (Two Core Pieces)
- **File:** [ControlTower.tsx](file:///home/mosab/projects/chatmodule/frontend/src/pages/josoor-sandbox/components/ControlTower.tsx)
- **Instructions:**
    1.  **Extraction:** Extract and import:
        - `StrategicInsights.tsx` (from `components/graphv001/components/`)
        - `SectorOutcomes.tsx` (from `components/graphv001/components/`)
    2.  **Logic Wiring:** 
        - Call `GET /api/v1/dashboard/dashboard-data`.
        - Pass the result as props to these components. 
        - Remove ALL mocks/pictures; these MUST be the interactive React/Recharts versions.

### 2. Risk Desk: interactive Topology
- **File:** [RiskTopologyMap.tsx](file:///home/mosab/projects/chatmodule/frontend/src/pages/josoor-sandbox/components/RiskTopologyMap.tsx)
- **Instructions:**
    1.  **Node Visuals:** Force nodes to be Rectangles `160px x 80px`.
    2.  **Interaction:** Clicking a node must highlight the propagation path (Chain 1/2 logic).

### 3. Dependency Desk: Gap Persistence
- **Instructions:**
    1.  Change button text to **"Save Analysis"**.
    2.  Submit to `POST /api/v1/chains/recommendations`.

> [!IMPORTANT]
> **GATE 2: STOP.** Verify the Control Tower shows live charts and Risk nodes are the correct dimensions.

---

## Phase 3: Specialized Desks (Hold for Details)
*Details for Planning and Reporting will be presented for approval after Phase 2.*

---

## Phase 4: Final Handover & Visual Audit
- RTL testing for all 6 dashboards.
- Light/Dark theme consistency (CSS Variables check).
