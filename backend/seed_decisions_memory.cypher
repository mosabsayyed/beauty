// Seed Decisions as Memory nodes with scope="secrets"
// Run this in Neo4j Browser

CREATE (m1:Memory {
  id: 'decision-001',
  content: 'Decision Needed: Approve Q1 2026 budget allocation for Digital Transformation initiative. Priority: High. Due: 2025-12-31. Linked Project: Digital Platform Modernization',
  scope: 'secrets',
  tags: ['decision', 'budget', 'high-priority'],
  timestamp: datetime('2025-12-15T10:00:00Z'),
  created_at: datetime('2025-12-15T10:00:00Z'),
  updated_at: datetime('2025-12-15T10:00:00Z')
})

CREATE (m2:Memory {
  id: 'decision-002',
  content: 'Decision Needed: Select vendor for Enterprise Resource Planning system. Priority: High. Due: 2026-01-15. Linked Project: ERP Implementation Phase 1',
  scope: 'secrets',
  tags: ['decision', 'procurement', 'high-priority'],
  timestamp: datetime('2025-12-16T09:00:00Z'),
  created_at: datetime('2025-12-16T09:00:00Z'),
  updated_at: datetime('2025-12-16T09:00:00Z')
})

CREATE (m3:Memory {
  id: 'decision-003',
  content: 'Decision Needed: Approve change request for Customer Portal redesign scope expansion. Priority: Medium. Due: 2026-01-20. Linked Project: Customer Portal Enhancement',
  scope: 'secrets',
  tags: ['decision', 'scope-change', 'medium-priority'],
  timestamp: datetime('2025-12-17T14:30:00Z'),
  created_at: datetime('2025-12-17T14:30:00Z'),
  updated_at: datetime('2025-12-17T14:30:00Z')
})

CREATE (m4:Memory {
  id: 'decision-004',
  content: 'Decision Needed: Resolve resource conflict between Data Analytics and Business Intelligence projects. Priority: High. Due: 2025-12-28. Linked Project: Data Analytics Initiative',
  scope: 'secrets',
  tags: ['decision', 'resource-allocation', 'high-priority'],
  timestamp: datetime('2025-12-18T11:00:00Z'),
  created_at: datetime('2025-12-18T11:00:00Z'),
  updated_at: datetime('2025-12-18T11:00:00Z')
})

CREATE (m5:Memory {
  id: 'decision-005',
  content: 'Decision Needed: Approve extension of Cloud Migration timeline by 2 months. Priority: Medium. Due: 2026-01-10. Linked Project: Cloud Infrastructure Migration',
  scope: 'secrets',
  tags: ['decision', 'timeline-change', 'medium-priority'],
  timestamp: datetime('2025-12-19T16:00:00Z'),
  created_at: datetime('2025-12-19T16:00:00Z'),
  updated_at: datetime('2025-12-19T16:00:00Z')
})

RETURN 'Created 5 decision Memory nodes with scope=secrets';
