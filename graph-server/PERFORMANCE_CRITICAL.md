# Graph Server - Critical Performance Notes

## Neo4j Query Optimization (DO NOT MODIFY)

### File: `graph-server/neo4j.ts` - `fetchGraphData()` function

**CRITICAL:** The following optimizations are essential for performance. Modifying them will cause query timeouts.

### 1. LIMIT Placement (Lines 940-952)
```typescript
WITH n LIMIT $limit    // ← MUST be here, before OPTIONAL MATCH
OPTIONAL MATCH (n)-[r]->(m)
```

**Why:** This limits nodes BEFORE finding relationships.
- ✅ Correct: Process 200 nodes → find their relationships
- ❌ Wrong: Process 4000 nodes → find all relationships → limit results

**Performance Impact:**
- Correct placement: ~1-2 seconds
- Wrong placement: 30+ seconds to infinite timeout

### 2. Pattern Matching for "All" Labels (Lines 904-914)
When user selects ALL 17 Entity/Sector labels:
```typescript
ANY(label IN labels(n) WHERE label STARTS WITH 'Entity' OR label STARTS WITH 'Sector')
```

**Why:** Single pattern match is faster than 17 explicit OR clauses.
- ✅ Pattern matching: Single condition
- ❌ Explicit OR chain: `n:EntityCapability OR n:EntityChangeAdoption OR ... (17 times)`

### Verification
If you need to modify this code, test with:
```bash
# Should complete in < 3 seconds
curl "http://localhost:3001/api/graph?labels=EntityCapability,EntityChangeAdoption,...(all 17)&limit=20000"
```

## Schema Management

### File: `frontend/src/components/graphv001/static_schema.ts`

Contains 17 node labels and 26 relationship types. Source of truth: `backend/app/services/ontology.csv`

**DO NOT REMOVE** relationship types without verifying they're removed from ontology.csv.

## Related Files
- `/graph-server/neo4j.ts` - Query logic
- `/frontend/src/components/graphv001/static_schema.ts` - Schema definition
- `/backend/app/services/ontology.csv` - Relationship types source of truth
