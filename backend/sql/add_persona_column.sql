-- Add persona column to instruction_elements table
-- This allows Tier 1 elements to be persona-specific (noor vs maestro)

-- Add persona column (nullable for backwards compatibility)
ALTER TABLE instruction_elements 
ADD COLUMN IF NOT EXISTS persona VARCHAR(20) DEFAULT 'both';

-- Create index for fast persona-based queries
CREATE INDEX IF NOT EXISTS idx_instruction_elements_persona 
ON instruction_elements(bundle, persona, status) 
WHERE status = 'active';

-- Add comment
COMMENT ON COLUMN instruction_elements.persona IS 'Persona assignment: "noor" (staff), "maestro" (executive), or "both" (shared). Controls which persona can see this element.';

-- Update existing tier1 elements to be available for both personas by default
UPDATE instruction_elements 
SET persona = 'both' 
WHERE bundle = 'tier1' AND persona IS NULL;

-- Create view for Tier 1 assembly with persona filtering
CREATE OR REPLACE VIEW v_tier1_assembly AS
SELECT 
    id,
    bundle,
    element,
    content,
    description,
    avg_tokens,
    persona,
    version,
    created_at,
    updated_at
FROM instruction_elements
WHERE bundle = 'tier1' 
  AND status = 'active'
ORDER BY element ASC;

COMMENT ON VIEW v_tier1_assembly IS 'Assembles Tier 1 elements for persona-based prompts. Filter by persona="noor", persona="maestro", or persona="both"';

-- Create function to get Tier 1 prompt for a specific persona
CREATE OR REPLACE FUNCTION get_tier1_for_persona(p_persona VARCHAR)
RETURNS TABLE (
    element VARCHAR,
    content TEXT,
    avg_tokens INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ie.element,
        ie.content,
        ie.avg_tokens
    FROM instruction_elements ie
    WHERE ie.bundle = 'tier1' 
      AND ie.status = 'active'
      AND (ie.persona = p_persona OR ie.persona = 'both')
    ORDER BY ie.element ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tier1_for_persona IS 'Returns Tier 1 elements for specific persona (noor/maestro). Includes elements marked "both" + persona-specific elements.';
