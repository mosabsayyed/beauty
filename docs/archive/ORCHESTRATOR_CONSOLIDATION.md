# Orchestrator Consolidation - December 13, 2025

## Summary

Consolidated all orchestrator implementations into a single universal orchestrator file.

## Changes Made

### New File Structure

**Active:**
- ✅ `orchestrator_universal.py` - Single source of truth for all orchestration

**Archived:**
- 📦 `archive_orchestrators/orchestrator_noor.py` - v3.4 multi-persona (source)
- 📦 `archive_orchestrators/orchestrator.py` - duplicate of noor
- 📦 `archive_orchestrators/orchestrator_maestro.py` - thin wrapper
- 📦 `archive_orchestrators/orchestrator_zero_shot.py` - v2.0 legacy
- 📦 `archive_orchestrators/orchestrator_agentic.py` - v3.2 legacy
- 📦 `archive_orchestrators/orchestrator_zero_shot copy*.py` - various copies

## orchestrator_universal.py Features

### Multi-Persona Architecture
Single `CognitiveOrchestrator` class handles both personas:
- **Noor** (staff): `CognitiveOrchestrator(persona="noor")`
- **Maestro** (executive): `CognitiveOrchestrator(persona="maestro")`

### Persona-Specific Configuration
- **MCP Router URLs**: Noor (port 8201) vs Maestro (port 8202)
- **Tier 1 Content**: Different memory scopes per persona
- **Memory Access**: 
  - Noor: personal, departmental, ministry
  - Maestro: personal, departmental, ministry, secrets

### Key Components
1. **Tier 1 Loading**: Database-driven with persona filtering
2. **Groq LLM Integration**: /v1/responses endpoint with MCP tools
3. **Robust JSON Parsing**: Handles code fences, comments, Groq quirks
4. **Business Language Translation**: Technical → business terms
5. **Auto-Recovery**: Retry logic for invalid JSON
6. **Fast-Path Greetings**: Skip LLM for simple greetings

## Updated Imports

### chat.py Changes
```python
# Before
from app.services.orchestrator_noor import NoorOrchestrator
from app.services.orchestrator_maestro import MaestroOrchestrator

# After
from app.services.orchestrator_universal import CognitiveOrchestrator, NoorOrchestrator
```

### Backward Compatibility
The universal orchestrator exports aliases:
```python
NoorOrchestrator = CognitiveOrchestrator  # For existing imports
```

## Factory Functions

```python
# Create persona-specific orchestrator
orchestrator = CognitiveOrchestrator(persona="noor")
orchestrator = CognitiveOrchestrator(persona="maestro")

# Factory functions
create_orchestrator(persona="noor")
create_noor_orchestrator()
create_maestro_orchestrator()
```

## Migration Path

### For Developers
1. ✅ Import from `orchestrator_universal` instead of specific files
2. ✅ Use `CognitiveOrchestrator(persona=...)` for new code
3. ✅ Existing `NoorOrchestrator` imports still work (alias)

### For System
1. ✅ All persona routing now uses universal orchestrator
2. ✅ User role mapping unchanged (staff → noor, exec → maestro)
3. ✅ MCP router URLs still persona-specific

## Testing

### Verify Import
```python
from app.services.orchestrator_universal import CognitiveOrchestrator

# Test both personas
noor = CognitiveOrchestrator(persona="noor")
maestro = CognitiveOrchestrator(persona="maestro")
```

### Run Backend
```bash
./sb.sh --fg
```

### Test API Endpoints
```bash
# Staff user (Noor)
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer staff_token" \
  -d '{"query": "What projects are active?"}'

# Exec user (Maestro)
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer exec_token" \
  -d '{"query": "Show strategic priorities"}'
```

## Benefits

### 1. Single Source of Truth
- No more duplicate code across files
- Updates apply to all personas instantly
- Reduced maintenance overhead

### 2. Cleaner Codebase
- One file vs 11+ orchestrator files
- Clear archive structure
- Easy to find current implementation

### 3. Consistent Behavior
- Same logic for both personas
- Persona differences explicit in configuration
- Easier to test and debug

### 4. Future-Proof
- Easy to add new personas
- Centralized feature additions
- Version control simplified

## Rollback Instructions

If needed, restore archived files:
```bash
cd /home/mosab/projects/chatmodule/backend/app/services
cp archive_orchestrators/orchestrator_noor.py .
cp archive_orchestrators/orchestrator_maestro.py .
# Revert chat.py imports
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         orchestrator_universal.py               │
├─────────────────────────────────────────────────┤
│                                                 │
│  CognitiveOrchestrator(persona)                │
│      │                                          │
│      ├─ persona="noor"                          │
│      │   ├─ MCP Router: port 8201              │
│      │   ├─ Memory: personal/dept/ministry     │
│      │   └─ Tier 1: load_tier1(persona="noor") │
│      │                                          │
│      └─ persona="maestro"                       │
│          ├─ MCP Router: port 8202               │
│          ├─ Memory: personal/dept/ministry/secrets│
│          └─ Tier 1: load_tier1(persona="maestro")│
│                                                 │
│  Aliases:                                       │
│    NoorOrchestrator = CognitiveOrchestrator    │
│                                                 │
└─────────────────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │      chat.py         │
            ├──────────────────────┤
            │ User Role → Persona  │
            │ staff → noor         │
            │ exec  → maestro      │
            └──────────────────────┘
```

## Next Steps

1. ✅ Test both personas thoroughly
2. ✅ Monitor logs for import errors
3. ✅ Update documentation references
4. ✅ Consider deleting archive after 30 days if stable
