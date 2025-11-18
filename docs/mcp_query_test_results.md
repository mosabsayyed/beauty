# MCP Query Test Results

Generated: 2025-11-13T21:08:09.459008+00:00

## Meta

- **ts**: 2025-11-13T21:08:04.178859+00:00
- **label_with_embeddings**: EntityITSystem
- **available_index_count**: 53
- **available_indexes_sample**: [['id', 'name', 'state', 'populationPercent', 'type', 'entityType', 'labelsOrTypes', 'properties', 'indexProvider', 'owningConstraint', 'lastRead', 'readCount'], ['id', 'name', 'state', 'populationPercent', 'type', 'entityType', 'labelsOrTypes', 'properties', 'indexProvider', 'owningConstraint', 'lastRead', 'readCount'], ['id', 'name', 'state', 'populationPercent', 'type', 'entityType', 'labelsOrTypes', 'properties', 'indexProvider', 'owningConstraint', 'lastRead', 'readCount'], ['id', 'name', 'state', 'populationPercent', 'type', 'entityType', 'labelsOrTypes', 'properties', 'indexProvider', 'owningConstraint', 'lastRead', 'readCount'], ['id', 'name', 'state', 'populationPercent', 'type', 'entityType', 'labelsOrTypes', 'properties', 'indexProvider', 'owningConstraint', 'lastRead', 'readCount']]
- **index_name_tried**: vector_index_entityproject

## Tests

### native_vector_query — ok

- Rows:

  - {"id": "1.8.1", "year": 2025, "level": "L3", "name": "Refined procedures and policies", "embedding_generated_at": "2025-11-10T02:24:17.133000000+00:00", "composite_key": "1.8.1|2025", "score": 1.0}
  - {"id": "1.8.1", "year": 2026, "level": "L3", "name": "Refined procedures and policies", "embedding_generated_at": "2025-11-10T02:33:48.386000000+00:00", "composite_key": "1.8.1|2026", "score": 1.0}
  - {"id": "1.1", "year": 2026, "level": "L2", "name": "Improving regulations and guidelines (developing organizational documents)", "embedding_generated_at": "2025-11-10T02:34:08.447000000+00:00", "composite_key": "1.1|2026", "score": 0.9019343852996826}
  - {"id": "2.1.3", "year": 2027, "level": "L3", "name": "Refined consumer care strategy and practices", "embedding_generated_at": "2025-11-10T02:43:13.712000000+00:00", "composite_key": "2.1.3|2027", "score": 0.8913673162460327}
  - {"id": "1.1", "year": 2025, "level": "L2", "name": "Improving regulations and guidelines (developing organizational documents)", "embedding_generated_at": "2025-11-10T02:24:56.981000000+00:00", "composite_key": "1.1|2025", "score": 0.8831287622451782}

### cosine_project_to_orgs — ok

- Project sampled: {'id': '1.8.1', 'year': 2025, 'level': 'L3'}

- Rows:

  - {"id": "1.1.2", "year": 2028, "level": "L3", "name": "Policies and Procedures", "composite_key": "1.1.2|2028", "score": 0.6676646224430848}
  - {"id": "1.1.2", "year": 2026, "level": "L3", "name": "Policies and Procedures", "composite_key": "1.1.2|2026", "score": 0.6676646224430848}
  - {"id": "1.1.2", "year": 2025, "level": "L3", "name": "Policies and Procedures", "composite_key": "1.1.2|2025", "score": 0.6676646224430848}
  - {"id": "1.1.2", "year": 2027, "level": "L3", "name": "Policies and Procedures", "composite_key": "1.1.2|2027", "score": 0.6676646224430848}
  - {"id": "1.1.2", "year": 2029, "level": "L3", "name": "Policies and Procedures", "composite_key": "1.1.2|2029", "score": 0.6676646224430848}

### gds_available — ok

