# Persona-Based Tier 1 Architecture

## Overview

This implementation adds persona-aware Tier 1 element assembly, allowing different instruction elements to be served to **Noor** (staff) vs **Maestro** (executive) personas based on user privileges.

## Architecture Changes

### 1. Database Schema (`backend/sql/add_persona_column.sql`)

**Added:**
- `persona` column to `instruction_elements` table (values: "noor", "maestro", "both")
- Index: `idx_instruction_elements_persona` for fast persona-based queries
- View: `v_tier1_assembly` for Tier 1 element inspection
- Function: `get_tier1_for_persona(p_persona VARCHAR)` for filtered element retrieval

**Purpose:**
Elements marked "both" are shared, while persona-specific elements are only loaded for that persona.

### 2. Tier 1 Assembler (`backend/app/services/tier1_assembler.py`)

**Updated Functions:**
```python
load_tier1_elements(persona: str = "noor")
assemble_tier1_prompt(persona: str = "noor")
get_tier1_token_count(persona: str = "noor")
```

**How it Works:**
- Calls Supabase RPC function `get_tier1_for_persona`
- Returns elements where `persona = {persona} OR persona = 'both'`
- Persona-specific elements are automatically filtered

### 3. Orchestrator (`backend/app/services/orchestrator_noor.py`)

**Multi-Persona Support:**
- Single unified orchestrator handles both Noor and Maestro
- Persona passed to `__init__(persona="noor")` or `__init__(persona="maestro")`
- Different MCP Router URLs based on persona:
  - Noor: `NOOR_MCP_ROUTER_URL` (port 8201)
  - Maestro: `MAESTRO_MCP_ROUTER_URL` (port 8202)

**Memory Scope Differences:**
- **Noor:** personal, departmental, ministry (no secrets)
- **Maestro:** personal, departmental, ministry, secrets

### 4. Maestro Orchestrator (`backend/app/services/orchestrator_maestro.py`)

**Created:**
- Thin wrapper around unified orchestrator
- Automatically initializes with `persona="maestro"`
- Maintains backward compatibility with existing code

### 5. Chat Router (`backend/app/api/routes/chat.py`)

**User Role → Persona Mapping:**
```python
if user_role in ['user', 'staff']:
    persona_name = 'noor'  # Staff uses Noor
elif user_role == 'exec':
    persona_name = 'maestro'  # Executives use Maestro
```

**Orchestrator Selection:**
- Gets appropriate orchestrator instance via factory function
- Persona-based routing takes precedence over version-based routing

## Migration Steps

### Run Migration Script

```bash
cd backend
python migrate_persona_tier1.py
```

This script:
1. ✅ Adds `persona` column to `instruction_elements`
2. ✅ Creates index for performance
3. ✅ Updates existing Tier 1 elements to `persona='both'`
4. ✅ Creates view `v_tier1_assembly`
5. ✅ Creates function `get_tier1_for_persona`
6. ✅ Verifies element counts for both personas

### Environment Variables Required

Ensure these are set in `.env`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
NOOR_MCP_ROUTER_URL=http://127.0.0.1:8201
MAESTRO_MCP_ROUTER_URL=http://127.0.0.1:8202
```

## Usage Examples

### Query Persona-Specific Elements

```python
from app.services.tier1_assembler import get_tier1_prompt

# Get Noor's Tier 1 prompt (staff)
noor_prompt = get_tier1_prompt(persona="noor")

# Get Maestro's Tier 1 prompt (executive)
maestro_prompt = get_tier1_prompt(persona="maestro")
```

### Direct SQL Queries

```sql
-- Get elements for Noor
SELECT * FROM get_tier1_for_persona('noor');

-- Get elements for Maestro
SELECT * FROM get_tier1_for_persona('maestro');

-- View all Tier 1 elements with persona labels
SELECT element, persona, description 
FROM v_tier1_assembly 
ORDER BY element;
```

### Adding Persona-Specific Elements

To create an element only for Maestro (executives):

```sql
INSERT INTO instruction_elements (
    bundle, element, content, description, 
    avg_tokens, persona, status, version
) VALUES (
    'tier1',
    '0.7_executive_directives',
    'EXECUTIVE PRIVILEGES\n- Access to strategic planning tools\n- Secrets memory scope available',
    'Executive-only instructions',
    50,
    'maestro',  -- Only Maestro will see this
    'active',
    '3.4.0'
);
```

## Testing

### 1. Test Migration
```bash
python migrate_persona_tier1.py
```

### 2. Test Tier 1 Assembly
```bash
python -c "
from app.services.tier1_assembler import get_tier1_prompt, get_tier1_token_count

# Test both personas
for persona in ['noor', 'maestro']:
    prompt = get_tier1_prompt(persona)
    stats = get_tier1_token_count(persona)
    print(f'{persona.capitalize()}: {stats["element_count"]} elements, {stats["total_tokens"]} tokens')
"
```

### 3. Test Orchestrator
```bash
# Test with staff user (should get Noor)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer staff_token" \
  -d '{"query": "What capabilities do we have?"}'

# Test with exec user (should get Maestro)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer exec_token" \
  -d '{"query": "Show me strategic priorities"}'
```

## Benefits

1. **🔒 Role-Based Access Control**
   - Executives get additional privileged instructions
   - Staff users don't see executive-only content

2. **📊 Granular Control**
   - Individual elements can be persona-specific
   - Shared elements reduce duplication

3. **🚀 Performance**
   - Database function is cached by Supabase
   - Indexed queries are fast
   - Python-level caching per persona

4. **🔧 Maintainability**
   - Single source of truth (database)
   - Easy to add new persona-specific elements
   - No code changes needed for content updates

## Troubleshooting

### Elements Not Loading
```bash
# Check if persona column exists
psql -c "SELECT column_name FROM information_schema.columns 
         WHERE table_name='instruction_elements' AND column_name='persona';"

# Verify elements exist
psql -c "SELECT COUNT(*), persona FROM instruction_elements 
         WHERE bundle='tier1' GROUP BY persona;"
```

### Function Not Working
```bash
# Test function directly
psql -c "SELECT * FROM get_tier1_for_persona('noor');"
```

### Wrong Persona Selected
- Check user role in database: `SELECT role FROM users WHERE email='user@example.com';`
- Verify mapping in `chat.py` line 196-201
- Check debug logs for persona selection

## Future Enhancements

1. **Dynamic Persona Assignment**
   - Allow users to switch personas based on context
   - Temporary elevation for specific queries

2. **Persona Inheritance**
   - Define persona hierarchies (maestro inherits from noor)
   - Automatic element cascade

3. **A/B Testing**
   - Test different instruction sets per persona
   - Measure effectiveness

4. **Analytics**
   - Track which elements are most used per persona
   - Optimize token usage
