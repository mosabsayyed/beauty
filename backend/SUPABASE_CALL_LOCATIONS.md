# Supabase Call Locations - Tier 1, 2, 3

## 1. TIER 1: Orchestrator → tier1_assembler.py → Supabase

### Call Chain:
```
orchestrator_universal.py (line 33)
  ↓ calls load_tier1_bundle()
  ↓ calls get_tier1_prompt(persona="noor", use_cache=True)
  ↓
tier1_assembler.py (line 33-34)
  ↓ calls get_supabase_client()
  ↓ client.table("instruction_elements")
         .select("bundle, element, content, avg_tokens")
         .eq("bundle", "tier1")
         .eq("status", "active")
         .order("element")
         .execute()
```

### Code Location:
**File:** `backend/app/services/tier1_assembler.py`
**Lines:** 16-21 (Supabase client init), 33-45 (DB query)

```python
def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)

def load_tier1_elements(persona: str = "noor") -> List[Dict]:
    client = get_supabase_client()
    
    normalized = (
        client.table("instruction_elements")
        .select("bundle, element, content, avg_tokens")
        .eq("bundle", "tier1")
        .eq("status", "active")
        .order("element")
        .execute()
    )
```

---

## 2. TIER 2 & 3: MCP Router → mcp_wrapper.py → mcp_service.py → Supabase

### Call Chain:
```
LLM calls retrieve_instructions tool
  ↓
MCP Router (port 8201)
  ↓ forwards to mcp_wrapper.py
  ↓
mcp_wrapper.py
  ↓ calls mcp_service.retrieve_instructions(mode, tier, elements)
  ↓
mcp_service.py (line 202-203, 230-232, 288-291)
  ↓ creates Supabase client
  ↓ queries instruction_elements table
```

### Code Location for TIER 3:
**File:** `backend/app/services/mcp_service.py`
**Lines:** 202-203 (client init), 230-232 (Tier 3 query)

```python
from supabase import create_client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Tier 3 query
tier3_response = supabase.table('instruction_elements') \
    .select('element, content, avg_tokens') \
    .eq('bundle', 'tier3') \
    .eq('status', 'active') \
    .execute()
```

### Code Location for TIER 2:
**File:** `backend/app/services/mcp_service.py`
**Lines:** 202-203 (client init), 288-291 (Tier 2 query)

```python
from supabase import create_client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Tier 2 query
tier2_response = supabase.table('instruction_elements') \
    .select('element, content, avg_tokens') \
    .eq('bundle', 'tier2') \
    .eq('status', 'active') \
    .execute()
```

---

## Summary

| Tier | Entry Point | DB Query Location | When Called |
|------|-------------|-------------------|-------------|
| **Tier 1** | orchestrator init | `tier1_assembler.py:33-45` | Once at orchestrator startup (cached) |
| **Tier 2** | LLM MCP call | `mcp_service.py:288-291` | When LLM calls `retrieve_instructions(tier="data_mode_definitions")` |
| **Tier 3** | LLM MCP call | `mcp_service.py:230-232` | When LLM calls `retrieve_instructions(tier="elements", elements=[...])` |

All three query the same table: `instruction_elements`
All three use the same client: Supabase REST API via `create_client()`
All three filter by: `bundle='tierX'` AND `status='active'`
