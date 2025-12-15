-- =====================================================
-- NOOR COGNITIVE DIGITAL TWIN v3.0 - INSTRUCTION STORE SCHEMA
-- Migration: Add instruction_bundles, instruction_metadata, usage_tracking
-- Date: 2025-12-05
-- NOTE: These tables are ADDITIVE - do not drop existing tables
-- =====================================================

-- Table 1: instruction_bundles (Core Content Store)
-- Stores the 10 atomic instruction modules for dynamic loading during Step 2: RECOLLECT
CREATE TABLE IF NOT EXISTS instruction_bundles (
    id SERIAL PRIMARY KEY,
    tag TEXT NOT NULL,                  -- Unique Bundle identifier (e.g., 'strategy_gap_diagnosis')
    path_name TEXT,                     -- Human-readable name ('Simple Query Path')
    content TEXT NOT NULL,              -- Full XML instruction block
    category TEXT,                      -- Bundle classification (core, strategy, conditional)
    avg_tokens INTEGER,                 -- Estimated token count (~1,200 for gap_diagnosis)
    version TEXT NOT NULL,              -- Semantic version (MAJOR.MINOR.PATCH)
    status TEXT NOT NULL DEFAULT 'active', -- Lifecycle state ('active', 'deprecated', 'draft')
    experiment_group TEXT,              -- A/B test group name (e.g., 'canary_v1.1.0')
    depends_on TEXT[],                  -- Other required bundle tags
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- UNIQUE on tag (allows Foreign Key references from instruction_metadata)
    CONSTRAINT instruction_bundles_tag_unique UNIQUE (tag),
    
    -- UNIQUE on (tag, version) for versioning
    CONSTRAINT instruction_bundles_tag_version_unique UNIQUE (tag, version),
    
    -- Status constraint
    CONSTRAINT instruction_bundles_status_check CHECK (status IN ('active', 'deprecated', 'draft'))
);

-- Table 2: instruction_metadata (Trigger Rules/Mode Mapping)
-- Maps bundles to interaction modes (A-H) for dynamic loading
CREATE TABLE IF NOT EXISTS instruction_metadata (
    tag TEXT PRIMARY KEY REFERENCES instruction_bundles(tag) ON DELETE CASCADE,
    trigger_modes TEXT[],               -- Interaction Modes (A, B, F, G, etc.) that trigger this bundle
    trigger_conditions JSONB,           -- Complex rules (e.g., {"file_attached": true})
    compatible_with TEXT[],             -- Bundles that can safely co-load
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: usage_tracking (Audit Log / Observability Tracking)
-- Tracks each query for cost optimization and token economics analysis
CREATE TABLE IF NOT EXISTS usage_tracking (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    agent_id TEXT NOT NULL DEFAULT 'Noor', -- Noor or Maestro
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    mode TEXT,                          -- Interaction Mode (A-H)
    tokens_input INTEGER,               -- Total INPUT tokens consumed
    tokens_output INTEGER,              -- Total OUTPUT tokens consumed
    confidence_score FLOAT,             -- Probabilistic Confidence Score (from Step 4)
    bundles_loaded TEXT[],              -- List of Task-Specific Bundles loaded in Step 2
    memory_recalled BOOLEAN DEFAULT FALSE, -- Whether Step 0 memory was used
    quick_exit BOOLEAN DEFAULT FALSE,   -- Whether Quick Exit Path was triggered
    latency_ms INTEGER,                 -- Total processing time in milliseconds
    error_occurred BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for bundle lookup by status and tag
CREATE INDEX IF NOT EXISTS idx_bundle_status_tag ON instruction_bundles (status, tag);

-- GIN index for trigger_modes array lookup
CREATE INDEX IF NOT EXISTS idx_metadata_trigger_modes ON instruction_metadata USING GIN (trigger_modes);

-- Index for usage tracking queries
CREATE INDEX IF NOT EXISTS idx_usage_session_user ON usage_tracking (session_id, user_id);

-- Index for usage tracking by timestamp (for analytics)
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_tracking (timestamp DESC);

-- Index for usage tracking by agent
CREATE INDEX IF NOT EXISTS idx_usage_agent ON usage_tracking (agent_id);

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for instruction_bundles
DROP TRIGGER IF EXISTS update_instruction_bundles_updated_at ON instruction_bundles;
CREATE TRIGGER update_instruction_bundles_updated_at
    BEFORE UPDATE ON instruction_bundles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for instruction_metadata
DROP TRIGGER IF EXISTS update_instruction_metadata_updated_at ON instruction_metadata;
CREATE TRIGGER update_instruction_metadata_updated_at
    BEFORE UPDATE ON instruction_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA: Core instruction bundles
-- =====================================================

-- Insert cognitive_cont (core bundle always loaded)
INSERT INTO instruction_bundles (tag, path_name, content, category, avg_tokens, version, status)
VALUES (
    'cognitive_cont',
    'Cognitive Control Core',
    '<INSTRUCTION_BUNDLE tag="cognitive_cont" version="1.0.0">
    <PURPOSE>Core cognitive control loop definitions and mode classification rules.</PURPOSE>
    <MODES>
        <MODE id="A" name="Simple Query" description="Direct fact lookup from graph" quick_exit="false"/>
        <MODE id="B1" name="Complex Analysis" description="Multi-hop reasoning with synthesis" quick_exit="false"/>
        <MODE id="B2" name="Gap Diagnosis" description="Identify missing relationships or capabilities" quick_exit="false"/>
        <MODE id="C" name="Exploratory" description="Hypothetical scenarios, no data required" quick_exit="false"/>
        <MODE id="D" name="Acquaintance" description="Questions about Noor capabilities" quick_exit="true"/>
        <MODE id="E" name="Learning" description="Concept explanations" quick_exit="false"/>
        <MODE id="F" name="Social" description="Greetings and small talk" quick_exit="true"/>
        <MODE id="G" name="Report Generation" description="Structured multi-section output" quick_exit="false"/>
        <MODE id="H" name="Clarification" description="Ambiguous query requires clarification" quick_exit="true"/>
    </MODES>
    <CLASSIFICATION_RULES>
        <RULE>If query contains greeting words (hello, hi, thank you) AND no data request → Mode F</RULE>
        <RULE>If query asks about "you" or "your capabilities" → Mode D</RULE>
        <RULE>If query is ambiguous with unresolved entities → Mode H</RULE>
        <RULE>If query asks for "report" or "summary" → Mode G</RULE>
        <RULE>If query asks about "gap" or "missing" → Mode B2</RULE>
        <RULE>If query requires multi-hop traversal → Mode B1</RULE>
        <RULE>If query is simple lookup → Mode A</RULE>
    </CLASSIFICATION_RULES>
</INSTRUCTION_BUNDLE>',
    'core',
    800,
    '1.0.0',
    'active'
) ON CONFLICT (tag) DO NOTHING;

-- Insert metadata for cognitive_cont
INSERT INTO instruction_metadata (tag, trigger_modes, compatible_with)
VALUES (
    'cognitive_cont',
    ARRAY['A', 'B1', 'B2', 'C', 'D', 'E', 'F', 'G', 'H'],
    ARRAY['knowledge_context', 'tool_rules_core']
) ON CONFLICT (tag) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- Verify tables exist:
-- SELECT COUNT(*) FROM information_schema.tables 
-- WHERE table_name IN ('instruction_bundles', 'instruction_metadata', 'usage_tracking');
-- Expected: 3

-- Verify indexes exist:
-- SELECT indexname FROM pg_indexes 
-- WHERE indexname IN ('idx_bundle_status_tag', 'idx_metadata_trigger_modes', 'idx_usage_session_user');
-- Expected: 3 rows

-- Test versioning constraint:
-- INSERT INTO instruction_bundles (tag, content, version, status, category)
-- VALUES ('test_bundle', 'content', '1.0.0', 'active', 'test');
-- INSERT INTO instruction_bundles (tag, content, version, status, category)
-- VALUES ('test_bundle', 'content2', '1.0.0', 'active', 'test');
-- Expected: Second insert should fail with UNIQUE constraint violation
