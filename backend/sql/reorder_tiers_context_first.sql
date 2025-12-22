-- ============================================================================
-- Reorder Tier 1, 2, 3 Elements: Context & Rules FIRST, Instructions SECOND
-- ============================================================================
-- 
-- RATIONALE:
-- LLM overthinks when encountering information piecemeal while reading instructions.
-- Front-loading context/rules/facts BEFORE procedural instructions reduces this.
--
-- NEW ORDERING PHILOSOPHY:
-- 1. WHO/WHAT (identity, role, constraints)
-- 2. WHEN/WHERE (temporal logic, scope)
-- 3. RULES (what's forbidden, what's allowed)
-- 4. HOW (procedural instructions, workflows)
-- ============================================================================

BEGIN;

-- ============================================================================
-- TIER 1 REORDERING (Step 0: REMEMBER)
-- ============================================================================
-- Current order forces LLM to discover rules mid-instruction.
-- New order: Context → Rules → Instructions

-- OLD ORDER:
-- 0.0_step0_role_identity            (WHO)
-- 0.1_step0_mode_classification      (HOW - procedural)
-- 0.2_step0_conditional_routing      (HOW - procedural)
-- 0.3_step0_memory_access_rules      (RULES)
-- 0.4_step0_ej_no_data_protocol      (HOW - procedural)
-- 0.5_step0_forbidden_confabulations (RULES)
-- 0.6_step0_mindset_all_modes        (WHAT)
-- 0.7_step0_temporal_logic           (WHEN)

-- NEW ORDER (Context → Rules → Instructions):
UPDATE instruction_elements SET element = '0.0_context_role_identity' 
WHERE bundle = 'tier1' AND element = '0.0_step0_role_identity';

UPDATE instruction_elements SET element = '0.1_context_mindset' 
WHERE bundle = 'tier1' AND element = '0.6_step0_mindset_all_modes';

UPDATE instruction_elements SET element = '0.2_context_temporal_logic' 
WHERE bundle = 'tier1' AND element = '0.7_step0_temporal_logic';

UPDATE instruction_elements SET element = '0.3_rules_memory_access' 
WHERE bundle = 'tier1' AND element = '0.3_step0_memory_access_rules';

UPDATE instruction_elements SET element = '0.4_rules_forbidden_confabulations' 
WHERE bundle = 'tier1' AND element = '0.5_step0_forbidden_confabulations';

UPDATE instruction_elements SET element = '0.5_instructions_mode_classification' 
WHERE bundle = 'tier1' AND element = '0.1_step0_mode_classification';

UPDATE instruction_elements SET element = '0.6_instructions_conditional_routing' 
WHERE bundle = 'tier1' AND element = '0.2_step0_conditional_routing';

UPDATE instruction_elements SET element = '0.7_instructions_ej_protocol' 
WHERE bundle = 'tier1' AND element = '0.4_step0_ej_no_data_protocol';

-- ============================================================================
-- TIER 1 REORDERING (Step 5: RESPOND)
-- ============================================================================
-- Step 5 elements should also follow: Rules → Process → Format

-- Assuming current Step 5 elements (verify actual names in DB):
-- 5.0_step5_workflow_steps
-- 5.1_step5_business_translation
-- 5.2_step5_output_format
-- 5.3_step5_evidence_gating
-- 5.4_step5_visualization_types
-- 5.5_step5_rules_of_thumb

-- NEW ORDER (Rules → Process → Format):
UPDATE instruction_elements SET element = '5.0_rules_evidence_gating' 
WHERE bundle = 'tier1' AND element = '5.3_step5_evidence_gating';

UPDATE instruction_elements SET element = '5.1_rules_of_thumb' 
WHERE bundle = 'tier1' AND element = '5.5_step5_rules_of_thumb';

UPDATE instruction_elements SET element = '5.2_process_workflow_steps' 
WHERE bundle = 'tier1' AND element = '5.0_step5_workflow_steps';

UPDATE instruction_elements SET element = '5.3_process_business_translation' 
WHERE bundle = 'tier1' AND element = '5.1_step5_business_translation';

UPDATE instruction_elements SET element = '5.4_format_output_schema' 
WHERE bundle = 'tier1' AND element = '5.2_step5_output_format';

UPDATE instruction_elements SET element = '5.5_format_visualization_types' 
WHERE bundle = 'tier1' AND element = '5.4_step5_visualization_types';

-- ============================================================================
-- TIER 2 REORDERING (Data Mode Definitions - Steps 2-4)
-- ============================================================================
-- Tier 2 defines the analytical workflow for data modes (A/B/C/D).
-- Should follow: Context → Rules → Process

-- NOTE: Verify actual element names before running. Assuming typical structure:
-- Step 2: Analysis & Planning
-- Step 3: Execution
-- Step 4: Validation
-- Step 5: (references Tier 1)

-- Example reordering (adjust based on actual DB content):
-- If you have elements like:
-- 2.0_step2_analyze
-- 2.1_step2_planning
-- 2.2_step2_rules
-- 
-- Reorder to:
-- 2.0_context_step2_scope
-- 2.1_rules_step2_constraints
-- 2.2_process_step2_analyze
-- 2.3_process_step2_planning

-- Uncomment and adjust once you verify Tier 2 element names:
-- UPDATE instruction_elements SET element = '2.0_context_...' WHERE bundle = 'tier2' AND element = '...';
-- UPDATE instruction_elements SET element = '2.1_rules_...' WHERE bundle = 'tier2' AND element = '...';

-- ============================================================================
-- TIER 3 REORDERING (Atomic Elements)
-- ============================================================================
-- Tier 3 elements are loaded on-demand, so ordering happens at retrieval time.
-- However, we can prefix them for clarity:
--
-- Categories:
-- - context_* (node schemas, relationship definitions)
-- - rules_* (data_integrity_rules, tool_rules_core)
-- - process_* (optimized_retrieval, impact_analysis)
-- - templates_* (vector_template_*)
--
-- Example: Rename for clarity (optional, doesn't affect load order):
-- UPDATE instruction_elements SET element = 'context_EntityProject' 
-- WHERE bundle = 'tier3' AND element = 'EntityProject';
--
-- UPDATE instruction_elements SET element = 'rules_data_integrity' 
-- WHERE bundle = 'tier3' AND element = 'data_integrity_rules';

-- NOTE: Tier 3 is loaded by explicit name list in retrieve_instructions(),
-- so renaming would require updating orchestrator/MCP service code.
-- Recommend keeping Tier 3 names stable and only reordering Tier 1 & 2.

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check new Tier 1 order
SELECT element, avg_tokens, LEFT(content, 100) as content_preview
FROM instruction_elements 
WHERE bundle = 'tier1' 
  AND status = 'active'
ORDER BY element;

-- Verify total token counts unchanged
SELECT 
  bundle,
  COUNT(*) as element_count,
  SUM(avg_tokens) as total_tokens
FROM instruction_elements
WHERE status = 'active'
GROUP BY bundle
ORDER BY bundle;

COMMIT;

-- ============================================================================
-- POST-MIGRATION STEPS
-- ============================================================================
-- 1. Clear Tier 1 cache in Python:
--    from app.services.tier1_assembler import refresh_tier1_cache
--    refresh_tier1_cache()
--
-- 2. Restart orchestrator to reload from DB
--
-- 3. Test with a sample query to verify context loads before instructions
--
-- 4. Check debug logs for "tier1_loaded" event to confirm new order
-- ============================================================================
