-- Noor v3.3: Element-Level Instruction Storage
-- Migration from bundle-level to element-level granularity

CREATE TABLE IF NOT EXISTS instruction_elements (
    id SERIAL PRIMARY KEY,
    bundle VARCHAR(100) NOT NULL,           -- Parent bundle (e.g., "visualization_config")
    element VARCHAR(100) NOT NULL,          -- Element name (e.g., "chart_types")
    content TEXT NOT NULL,                  -- Element content (XML-tagged)
    description TEXT,                       -- What this element does
    avg_tokens INTEGER DEFAULT 0,           -- Estimated token count
    dependencies TEXT[],                    -- Other elements this depends on
    use_cases TEXT[],                       -- When to use this element (for LLM guidance)
    status VARCHAR(20) DEFAULT 'active',    -- active/deprecated
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(bundle, element, version)
);

-- Index for fast element retrieval
CREATE INDEX IF NOT EXISTS idx_instruction_elements_lookup 
ON instruction_elements(element, status) 
WHERE status = 'active';

-- Index for bundle-based queries
CREATE INDEX IF NOT EXISTS idx_instruction_elements_bundle 
ON instruction_elements(bundle, status) 
WHERE status = 'active';

-- Element catalog view (for LLM to understand available elements)
CREATE OR REPLACE VIEW element_catalog AS
SELECT 
    bundle,
    element,
    description,
    avg_tokens,
    use_cases,
    dependencies
FROM instruction_elements
WHERE status = 'active'
ORDER BY bundle, element;

COMMENT ON TABLE instruction_elements IS 'Element-level instruction storage for v3.3 Agentic Architecture. LLM selects specific elements instead of loading entire bundles.';
COMMENT ON COLUMN instruction_elements.element IS 'Unique element identifier (e.g., chart_types, EntityProject, temporal_filter_pattern)';
COMMENT ON COLUMN instruction_elements.use_cases IS 'Array of scenarios when LLM should load this element (e.g., ["user asks for chart", "visualization requested"])';
COMMENT ON COLUMN instruction_elements.dependencies IS 'Array of other elements that should be loaded together (e.g., chart_types depends on color_rules)';
