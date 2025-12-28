# Role-Based Routing Architecture: Staff → Noor, Exec → Maestro

## Problem Statement

We need to route users to different personas (Noor vs Maestro) based on their role:
- **Staff** → Noor (operational/analytical persona)
- **Exec** → Maestro (executive/strategic persona - MORE privileges, not restricted)

## Corrected Architecture Understanding

**Maestro is NOT a restricted version of Noor - it's the OPPOSITE:**
- Maestro = Executive persona with EXPANDED privileges
- Same code structure as orchestrator_agentic.py
- Key differences:
  1. **Memory Access**: ALL THREE memory banks (project, workspace, shared) - except personal
  2. **LLM Model**: Different model than Noor (higher capability)
  3. **MCP Router**: Uses dedicated MCP router instance
- **No security restrictions needed** - execs use Maestro exclusively, no spillover concerns
- Both are peer orchestrators with different tool capabilities

## Current Implementation Status

### ✅ Backend Complete
1. **Database Schema** (`backend/sql/create_tables.sql`):
   - `users.role` field exists: `role VARCHAR(50) DEFAULT 'user'`
   - Supports: 'user', 'staff', 'exec'

2. **User Model** (`backend/app/services/user_service.py`):
   - Added `role: Optional[str] = "user"` field
   - `create_user()` accepts and stores role

3. **Authentication** (`backend/app/api/routes/auth.py`):
   - Registration: `POST /auth/register` accepts `role` parameter
   - Login: JWT token includes `{sub: user_id, role: "staff"}`
   - Token validation: `get_current_user` loads user with role
   - Response: Login and registration return `role` field

4. **Role-Based Routing** (`backend/app/api/routes/chat.py` lines 168-177):
   ```python
   user_role = current_user.role if current_user and hasattr(current_user, 'role') else 'user'
   
   if user_role == 'staff':
       request.persona_name = 'noor'
   elif user_role == 'exec':
       request.persona_name = 'maestro'
   ```

### ⚠️ Frontend Incomplete
1. **LoginPage** (`frontend/src/pages/LoginPage.tsx`):
   - ❌ No role field in registration form
   - ❌ No role stored/displayed after login
   - ❌ Uses Supabase Auth (bypasses our role system)

2. **AuthService** (`frontend/src/lib/services/authService.ts`):
   - ❌ Uses Supabase SDK (`supabase.auth.signInWithPassword`)
   - ❌ Doesn't call our `/api/v1/auth/login` endpoint
   - ❌ Doesn't handle role field

3. **ChatService** (`frontend/src/lib/services/chatService.ts`):
   - ✅ Sends `persona` field in ChatRequest
   - ⚠️ But persona is currently hardcoded/selected by user, not by role

### ⚠️ Maestro Orchestrator Missing
- orchestrator_agentic.py is for Noor only
- Need separate orchestrator_maestro.py with:
  - Different cognitive_cont (strategic focus vs operational)
  - Different MCP tools (executive-level data access)
  - Different prompt patterns
  - Different validation rules

## Architecture Design

### 1. Frontend Changes Required

#### A. Update LoginPage.tsx
```tsx
// Add role selector for registration (admin/internal use only)
const [role, setRole] = useState<'user' | 'staff' | 'exec'>('user');

// In registration form:
<select value={role} onChange={(e) => setRole(e.target.value)}>
  <option value="user">User</option>
  <option value="staff">Staff (Noor)</option>
  <option value="exec">Executive (Maestro)</option>
</select>

// Pass to backend:
await apiRegister(email, password, name, role);
```

**OR** (Recommended): Hide role selector, make it programmatic:
- Detect user's email domain (@josoor.com staff, @exec.josoor.com execs)
- Or use invite codes (staff invite → role='staff')
- Or admin panel to assign roles

#### B. Update authService.ts
**Option 1: Replace Supabase Auth with Our Backend**
```typescript
export async function login(email: string, password: string) {
  // Call OUR backend endpoint
  const resp = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!resp.ok) throw new Error('Login failed');
  
  const data = await resp.json(); // { access_token, user: {id, email, role} }
  
  // Store token AND role
  localStorage.setItem(LS_TOKEN, data.access_token);
  localStorage.setItem(LS_USER, JSON.stringify(data.user)); // includes role
  
  return data;
}

export async function register(email: string, password: string, name: string, role: string = 'user') {
  const resp = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role })
  });
  
  if (!resp.ok) throw new Error('Registration failed');
  return await resp.json();
}
```

**Option 2: Sync Supabase Auth with Our Backend**
Keep Supabase for OAuth, but call `/api/v1/auth/sync` after login to get role:
```typescript
export async function login(email: string, password: string) {
  // Supabase login
  const resp = await supabase.auth.signInWithPassword({ email, password });
  if (resp.error) throw resp.error;
  
  // Sync with our backend to get role
  const token = resp.data.session.access_token;
  const userResp = await fetch('/api/v1/auth/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const userData = await userResp.json(); // {id, email, role}
  
  localStorage.setItem(LS_USER, JSON.stringify(userData));
  return userData;
}
```

#### C. Update ChatAppPage.tsx
Remove persona selector UI for staff/exec users:
```tsx
const user = getUser(); // {id, email, role}

// Don't show persona picker if role forces persona
const showPersonaPicker = user?.role === 'user';

// Display which persona they're using
<div>Using: {user?.role === 'staff' ? 'Noor' : user?.role === 'exec' ? 'Maestro' : selectedPersona}</div>
```

### 2. Backend Changes Required

#### A. Create orchestrator_maestro.py
```python
# backend/app/services/orchestrator_maestro.py

COGNITIVE_CONT_MAESTRO = """
<MUST_READ_ALWAYS>
<system_mission>
You are **Maestro**, the executive-level cognitive digital twin for JOSOOR.
Your focus is strategic decision-making, high-level insights, and executive reporting.
- Speak in executive language (strategy, ROI, risk, alignment)
- Provide concise summaries with key takeaways
- Focus on business impact and decisions
- Avoid operational details unless critical
</system_mission>

<cognitive_control_loop>
**STEP 0: CLASSIFY INTENT**
Determine if this is:
- A. Strategic question (capabilities, alignment, gaps)
- B. Executive report request (portfolio view, KPIs)
- C. Decision support (trade-offs, recommendations)
- D. Quick status check

**STEP 1: INTERPRET (Executive Lens)**
Translate query into strategic objectives:
- What decision does this inform?
- What level of detail is appropriate for exec?
- What's the business context?

**STEP 2: RECOLLECT**
Load only executive-relevant elements:
- gap_types (strategic gaps)
- business_chains (value streams)
- SectorObjective (alignment)
- risk_dependency_rules
- Avoid: operational details, technical specs

**STEP 3: REASON (Strategic Analysis)**
- Identify strategic implications
- Prioritize by business impact
- Consider dependencies and risks
- Frame in exec language

**STEP 4: RESPOND**
Format: Executive brief style
- **Key Insight**: One-liner
- **Supporting Data**: High-level metrics
- **Recommendation**: Action-oriented
- **Visualization**: Strategic dashboards only
</cognitive_control_loop>

<output_format>
{
  "mode": "A|B|C|D",
  "answer": "Executive-focused response",
  "artifacts": [{
    "artifact_type": "CHART",
    "title": "Strategic View: ...",
    "config": {...}
  }]
}
</output_format>
</MUST_READ_ALWAYS>
"""

class MaestroOrchestrator:
    def __init__(self):
        self.groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "openai/gpt-oss-120b"
        # Different MCP tools for Maestro
        self.mcp_tools = [
            recall_memory_exec,  # Executive memory scope
            retrieve_elements_exec,  # Strategic elements only
            read_neo4j_cypher_exec  # Limited to executive-level queries
        ]
    
    async def execute_query(self, user_query: str, session_id: str, history=None):
        # Similar structure to orchestrator_agentic.py
        # But uses COGNITIVE_CONT_MAESTRO
        # And exec-scoped MCP tools
        pass
```

#### B. Update chat.py Routing
```python
# backend/app/api/routes/chat.py

# Orchestrator factory based on persona
def get_orchestrator(persona_name: str):
    if persona_name == 'noor':
        from app.services.orchestrator_agentic import NoorAgenticOrchestrator
        return NoorAgenticOrchestrator()
    elif persona_name == 'maestro':
        from app.services.orchestrator_maestro import MaestroOrchestrator
        return MaestroOrchestrator()
    else:
        # Fallback to zero_shot
        from app.services.orchestrator_zero_shot import OrchestratorZeroShot
        return OrchestratorZeroShot()

# In chat endpoint (after role routing):
orchestrator = get_orchestrator(request.persona_name)
llm_response = await orchestrator.execute_query(
    user_query=request.query,
    session_id=session_id,
    history=conversation_context
)
```

#### C. Create MCP Tools with Exec Scope
```python
# backend/app/services/mcp_service.py

async def retrieve_elements_exec(elements: List[str]) -> str:
    """
    Retrieve instruction elements for Maestro (executive scope).
    Only allows strategic elements, blocks operational details.
    """
    # Whitelist of executive-allowed elements
    EXEC_ALLOWED_ELEMENTS = {
        'gap_types', 'business_chains', 'SectorObjective',
        'risk_dependency_rules', 'EntityProject', 'EntityCapability',
        'chart_types', 'color_rules', 'layout_constraints'
    }
    
    # Filter requested elements
    filtered = [e for e in elements if e in EXEC_ALLOWED_ELEMENTS]
    
    if len(filtered) < len(elements):
        blocked = [e for e in elements if e not in EXEC_ALLOWED_ELEMENTS]
        logger.warning(f"Maestro blocked from accessing: {blocked}")
    
    # Fetch from instruction_elements table
    response = supabase.table('instruction_elements') \
        .select('element, content') \
        .in_('element', filtered) \
        .eq('status', 'active') \
        .execute()
    
    return format_elements(response.data)

async def read_neo4j_cypher_exec(query: str) -> str:
    """
    Execute Neo4j Cypher query with executive constraints.
    - No access to operational fields (budget_spent, progress_percentage)
    - Only strategic aggregations allowed
    - Limit result size to executive summaries
    """
    # Validate query doesn't access restricted fields
    RESTRICTED_FIELDS = ['budget_spent', 'uptime_percentage', 'efficiency_score']
    if any(field in query.lower() for field in RESTRICTED_FIELDS):
        raise PermissionError(f"Maestro cannot access operational fields: {RESTRICTED_FIELDS}")
    
    # Execute with row limit
    result = neo4j_driver.execute_query(query + " LIMIT 100")
    return format_results(result)
```

### 3. Security Boundaries

#### Data Access Control Matrix

| Element/Field | Noor (Staff) | Maestro (Exec) | Notes |
|---------------|--------------|----------------|-------|
| **Knowledge Context** |
| EntityProject | ✅ Full | ✅ Summary | Exec sees name, status, not details |
| EntityCapability | ✅ Full | ✅ Full | Strategic view |
| EntityRisk | ✅ Full | ✅ Full | Risk awareness critical |
| EntityITSystem | ✅ Full | ❌ Blocked | Operational detail |
| EntityProcess | ✅ Full | ❌ Blocked | Operational detail |
| **Fields** |
| budget_allocated | ✅ Read | ✅ Read | |
| budget_spent | ✅ Read | ❌ Blocked | Operational metric |
| progress_percentage | ✅ Read | ❌ Blocked | Operational metric |
| maturity_level | ✅ Read | ✅ Read | Strategic metric |
| **Analysis** |
| Gap detection | ✅ Full | ✅ Strategic only | |
| Cypher queries | ✅ Unrestricted | ⚠️ Restricted | No operational fields |
| Visualizations | ✅ All types | ✅ Exec dashboards | Summary charts only |

#### MCP Tool Permissions

| Tool | Noor | Maestro | Implementation |
|------|------|---------|----------------|
| recall_memory | Full access | Exec memories only | Filter by namespace |
| retrieve_elements | All 48 elements | 15 strategic elements | Whitelist filter |
| read_neo4j_cypher | Unrestricted | Restricted fields | Query validation |

## Implementation Plan

### Phase 1: Frontend Auth Fix (1-2 days)
1. **Choose auth strategy**: Replace Supabase OR sync with backend
2. **Update authService.ts**: Call `/api/v1/auth/login` with role handling
3. **Update LoginPage.tsx**: 
   - Add role field to registration (hidden or admin-only)
   - Display user's role after login
4. **Update ChatAppPage.tsx**: Hide persona picker for staff/exec
5. **Test**: Register as staff → auto-routes to Noor

### Phase 2: Maestro Orchestrator (2-3 days)
1. **Create orchestrator_maestro.py**:
   - Executive-focused cognitive_cont
   - Strategic prompt patterns
   - Business language emphasis
2. **Create MCP tools with exec scope**:
   - retrieve_elements_exec (15 strategic elements)
   - read_neo4j_cypher_exec (field restrictions)
   - recall_memory_exec (exec namespace only)
3. **Update chat.py**: Orchestrator factory pattern
4. **Test**: Login as exec → uses Maestro → sees strategic views

### Phase 3: Element-Level Access Control (1 day)
1. **Create element whitelist** in orchestrator_maestro.py
2. **Implement query validation** in read_neo4j_cypher_exec
3. **Add audit logging**: Log when Maestro blocked from data
4. **Test**: Maestro cannot access operational fields

### Phase 4: Integration Testing (1 day)
1. Test user journey:
   - Register as staff → Chat uses Noor → Full operational access
   - Register as exec → Chat uses Maestro → Strategic views only
   - Regular user → Can choose persona (both work)
2. Test security boundaries:
   - Maestro requests operational element → blocked
   - Maestro Cypher query with budget_spent → error
3. Test persona switching:
   - Staff user cannot manually switch to Maestro
   - Exec user cannot manually switch to Noor

## File Changes Summary

### Backend
- ✅ `backend/app/services/user_service.py` - Added role field
- ✅ `backend/app/api/routes/auth.py` - Registration/login with role
- ✅ `backend/app/api/routes/chat.py` - Role-based routing
- 🆕 `backend/app/services/orchestrator_maestro.py` - New file
- 🔧 `backend/app/services/mcp_service.py` - Add exec-scoped tools
- 🔧 `backend/app/api/routes/chat.py` - Orchestrator factory

### Frontend
- 🔧 `frontend/src/lib/services/authService.ts` - Call backend auth API
- 🔧 `frontend/src/pages/LoginPage.tsx` - Add role to registration
- 🔧 `frontend/src/pages/ChatAppPage.tsx` - Hide persona picker for staff/exec
- 🔧 `frontend/src/types/chat.ts` - Add role to User type

## Security Notes

1. **JWT Token Security**:
   - Token includes role in payload
   - Backend validates role on every request
   - Frontend cannot forge role (token signed by backend)

2. **Data Isolation**:
   - Noor and Maestro see same Neo4j graph (by design)
   - But Maestro's MCP tools filter results
   - Orchestrator enforces access at query level

3. **Conversation Isolation**:
   - Already implemented via SupabaseConversationManager
   - user_id filter in conversations table
   - No changes needed

4. **Role Assignment**:
   - Only backend can assign roles
   - Frontend registration needs admin approval OR
   - Use email domain detection (@exec.josoor.com)

## Questions to Answer

1. **Role Assignment**: How do users get staff/exec roles?
   - A. Admin panel (manual assignment)
   - B. Email domain detection (automatic)
   - C. Invite codes (controlled onboarding)
   - D. Registration approval workflow

2. **Auth Strategy**: Replace Supabase or sync?
   - A. Replace: Full control, simpler flow
   - B. Sync: Keep OAuth providers, hybrid approach
   - **Recommendation**: Replace for internal users, keep Supabase for OAuth

3. **Persona Switching**: Can staff temporarily use Maestro view?
   - A. No - strict role enforcement
   - B. Yes - but with permission/audit log
   - **Recommendation**: No switching - reduces complexity

4. **Maestro Data Scope**: How restrictive?
   - A. Very restrictive (strategic summary only)
   - B. Moderate (can drill down with explicit request)
   - **Recommendation**: Start restrictive, add drill-down in Phase 2

## Next Steps

1. **Decide**: Auth strategy (replace vs sync Supabase)
2. **Decide**: Role assignment method (admin, domain, invite)
3. **Implement**: Phase 1 (Frontend auth with role)
4. **Implement**: Phase 2 (Maestro orchestrator)
5. **Test**: End-to-end with both personas
6. **Deploy**: Roll out to staff first, then execs

---
**Status**: Architecture complete, backend role routing implemented, frontend and Maestro orchestrator pending.
