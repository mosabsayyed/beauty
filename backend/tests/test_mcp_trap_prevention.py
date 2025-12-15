"""
Tests for Noor Cognitive Digital Twin v3.0 - Trap Prevention

Reference: [END_STATE_TECHNICAL_DESIGN] Implementation Roadmap v3.0
Section: 4.1 Production Patterns: Preventing the 6 Critical Trap Patterns

Test Categories:
1. Cypher Integrity (SKIP/OFFSET rejection, Level Integrity)
2. Memory Access Control (Noor R/W constraints)
3. Hallucination Prevention
4. Bundle Rollout
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock

# Import the MCP service functions
from app.services.mcp_service import (
    read_neo4j_cypher,
    recall_memory,
    retrieve_instructions,
    check_mode_requires_memory,
    lookup_tags_by_mode
)


# =============================================================================
# TRAP PREVENTION 1 & 2: Database Anti-Patterns (SKIP/OFFSET)
# =============================================================================

class TestCypherIntegritySkipOffset:
    """
    Test that read_neo4j_cypher rejects SKIP and OFFSET keywords.
    Must use Keyset Pagination instead.
    """

    def test_reject_skip_keyword(self):
        """SKIP keyword must be rejected"""
        cypher = "MATCH (p:EntityProject) WHERE p.year = 2025 RETURN p SKIP 100 LIMIT 30"
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "SKIP" in str(exc_info.value)
        assert "Keyset Pagination" in str(exc_info.value)

    def test_reject_offset_keyword(self):
        """OFFSET keyword must be rejected"""
        cypher = "MATCH (p:EntityProject) RETURN p OFFSET 50 LIMIT 30"
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "OFFSET" in str(exc_info.value) or "SKIP" in str(exc_info.value)
        assert "Keyset Pagination" in str(exc_info.value)

    def test_reject_skip_in_subquery(self):
        """SKIP in subqueries must also be rejected"""
        cypher = """
        CALL {
            MATCH (p:EntityProject)
            RETURN p SKIP 10 LIMIT 10
        }
        RETURN count(*)
        """
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "Keyset Pagination" in str(exc_info.value)

    def test_reject_case_insensitive(self):
        """SKIP/OFFSET rejection must be case-insensitive"""
        cypher = "MATCH (p:EntityProject) RETURN p skip 100"
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "Keyset Pagination" in str(exc_info.value)

    def test_allow_keyset_pagination(self):
        """Valid keyset pagination should be allowed"""
        cypher = """
        MATCH (p:EntityProject)
        WHERE p.year = 2025 AND p.id > $last_seen_id
        RETURN p.id, p.name
        ORDER BY p.id
        LIMIT 30
        """
        
        # This should not raise - just check it doesn't error on validation
        # Actual execution will fail without a real DB connection
        with patch('app.services.mcp_service.neo4j_client') as mock_client:
            mock_client.is_connected.return_value = False
            mock_client.connect.return_value = False
            
            with pytest.raises(ConnectionError):
                # ConnectionError is expected without DB, but no ValueError for validation
                read_neo4j_cypher(cypher)


# =============================================================================
# TRAP PREVENTION 3: Hierarchy Violation (Level Integrity)
# =============================================================================

class TestCypherIntegrityLevel:
    """
    Test that read_neo4j_cypher enforces Level Integrity.
    L2 and L3 nodes cannot be mixed in the same traversal path.
    """

    def test_reject_l2_l3_mixing(self):
        """L2 and L3 in same query must be rejected"""
        cypher = """
        MATCH (p:EntityProject {level: 'L2'})-[:REQUIRES]->(c:EntityCapability {level: 'L3'})
        RETURN p.name, c.name
        """
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "Level Integrity" in str(exc_info.value)
        assert "Same-Level Rule" in str(exc_info.value)

    def test_reject_l3_l2_mixing(self):
        """L3 to L2 traversal must also be rejected"""
        cypher = """
        MATCH (c:EntityCapability)
        WHERE c.level = 'L3'
        MATCH (c)-[:MONITORED_BY]->(r:EntityRisk)
        WHERE r.level = 'L2'
        RETURN c.name, r.name
        """
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "Level Integrity" in str(exc_info.value)

    def test_allow_same_level(self):
        """Same level traversal should be allowed"""
        cypher = """
        MATCH (p:EntityProject {year: 2025, level: 'L3'})
        -[:ADDRESSES_GAP]->(c:EntityCapability {level: 'L3'})
        RETURN p.name, c.name
        """
        
        # Should not raise ValueError for level check
        with patch('app.services.mcp_service.neo4j_client') as mock_client:
            mock_client.is_connected.return_value = False
            mock_client.connect.return_value = False
            
            with pytest.raises(ConnectionError):
                # ConnectionError is expected, not ValueError
                read_neo4j_cypher(cypher)

    def test_allow_parent_of_relationship(self):
        """PARENT_OF is the only exception that can cross levels"""
        # Note: The current implementation may flag this as a violation
        # Future enhancement should detect PARENT_OF relationship context
        cypher = """
        MATCH (l2:EntityProject {level: 'L2'})-[:PARENT_OF]->(l3:EntityProject {level: 'L3'})
        RETURN l2.name, l3.name
        """
        
        # Current implementation will reject this - this test documents the limitation
        # In production, PARENT_OF should be allowed to cross levels
        with pytest.raises(ValueError):
            read_neo4j_cypher(cypher)


# =============================================================================
# TRAP PREVENTION 4: Efficiency (No Embedding Retrieval)
# =============================================================================

class TestCypherIntegrityEmbedding:
    """
    Test that read_neo4j_cypher prevents embedding property retrieval.
    Embeddings are too large for Cypher results - use recall_memory instead.
    """

    def test_reject_embedding_in_return(self):
        """Cannot return embedding properties"""
        cypher = "MATCH (m:Memory) RETURN m.key, m.embedding"
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "Embedding" in str(exc_info.value)
        assert "recall_memory" in str(exc_info.value)

    def test_reject_embed_keyword(self):
        """Reject any embed-related properties"""
        cypher = "MATCH (p:EntityProject) RETURN p.embed, p.name"
        
        with pytest.raises(ValueError) as exc_info:
            read_neo4j_cypher(cypher)
        
        assert "Embedding" in str(exc_info.value)

    def test_allow_non_embedding_properties(self):
        """Normal properties should be allowed"""
        cypher = "MATCH (p:EntityProject) RETURN p.id, p.name, p.year, p.level"
        
        with patch('app.services.mcp_service.neo4j_client') as mock_client:
            mock_client.is_connected.return_value = False
            mock_client.connect.return_value = False
            
            with pytest.raises(ConnectionError):
                read_neo4j_cypher(cypher)


# =============================================================================
# MEMORY ACCESS CONTROL - Noor Agent Constraints
# =============================================================================

class TestMemoryAccessControl:
    """
    Test Hierarchical Memory Access Control for Noor Agent.
    - Personal: R/O (requires user_id)
    - Departmental: R/O
    - Ministry: R/O
    - Secrets/admin scopes: NO ACCESS
    """

    @pytest.mark.asyncio
    async def test_recall_memory_reject_csuite(self):
        """Noor is FORBIDDEN from accessing csuite memory"""
        with pytest.raises(PermissionError) as exc_info:
            await recall_memory('csuite', 'test query')
        
        assert "csuite" in str(exc_info.value).lower()
        assert "forbidden" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_recall_memory_allow_personal(self):
        """Noor can read personal memory"""
        with patch('app.services.mcp_service._execute_vector_query', new_callable=AsyncMock) as mock_query:
            with patch('app.services.mcp_service.generate_embedding', new_callable=AsyncMock, return_value=[0.1] * 1536):
                mock_query.return_value = [{"key": "test", "content": "value"}]

                result = await recall_memory('personal', 'test query', user_id='u1')

                assert result != "[]"
                mock_query.assert_called()

    @pytest.mark.asyncio
    async def test_recall_memory_allow_departmental(self):
        """Noor can read departmental memory (R/O)"""
        with patch('app.services.mcp_service._execute_vector_query', new_callable=AsyncMock) as mock_query:
            with patch('app.services.mcp_service.generate_embedding', new_callable=AsyncMock, return_value=[0.1] * 1536):
                mock_query.return_value = [{"key": "dept", "content": "value"}]

                result = await recall_memory('departmental', 'test query')

                assert result != "[]"

    @pytest.mark.asyncio
    async def test_recall_memory_allow_ministry(self):
        """Noor can read ministry memory (R/O)"""
        with patch('app.services.mcp_service._execute_vector_query', new_callable=AsyncMock) as mock_query:
            with patch('app.services.mcp_service.generate_embedding', new_callable=AsyncMock, return_value=[0.1] * 1536):
                mock_query.return_value = [{"key": "min", "content": "value"}]

                result = await recall_memory('ministry', 'test query')

                assert result != "[]"

    @pytest.mark.asyncio
    async def test_recall_memory_no_fallback(self):
        """Noor must NOT fallback across scopes (strict scope enforcement)."""
        with patch('app.services.mcp_service._execute_vector_query', new_callable=AsyncMock) as mock_query:
            with patch('app.services.mcp_service.generate_embedding', new_callable=AsyncMock, return_value=[0.1] * 1536):
                mock_query.return_value = []

                result = await recall_memory('departmental', 'test query')

                assert result == "[]"


# =============================================================================
# MODE TO BUNDLE MAPPING
# =============================================================================

class TestModeBundleMapping:
    """Test that modes map to correct instruction bundles."""

    def test_mode_a_bundles(self):
        """Mode A (Simple Query) should include core bundles"""
        bundles = lookup_tags_by_mode('A')
        assert 'cognitive_loop_core' in bundles
        assert 'data_integrity_rules' in bundles
        assert 'constraint_keyset_pagination' in bundles

    def test_mode_b2_bundles(self):
        """Mode B2 (Gap Diagnosis) should include strategy_gap_diagnosis"""
        bundles = lookup_tags_by_mode('B2')
        assert 'mode_gap_diagnosis' in bundles
        assert 'cypher_impact_analysis' in bundles

    def test_mode_f_bundles(self):
        """Mode F (Social) should use quick_exit_responses"""
        bundles = lookup_tags_by_mode('F')
        assert 'mode_quick_exit' in bundles
        assert len(bundles) == 1

    def test_mode_h_bundles(self):
        """Mode H (Underspecified) should use clarification_mode"""
        bundles = lookup_tags_by_mode('H')
        assert 'mode_clarification' in bundles


# =============================================================================
# MEMORY REQUIREMENT CHECK
# =============================================================================

class TestMemoryRequirement:
    """Test path-dependent memory recall requirements."""

    def test_mode_g_requires_memory(self):
        """Mode G (Continuation) MUST require memory"""
        assert check_mode_requires_memory('G') == True

    def test_mode_b1_requires_memory(self):
        """Mode B1 (Complex Analysis) MUST require memory"""
        assert check_mode_requires_memory('B1') == True

    def test_mode_b2_requires_memory(self):
        """Mode B2 (Gap Diagnosis) MUST require memory"""
        assert check_mode_requires_memory('B2') == True

    def test_mode_f_skips_memory(self):
        """Mode F (Social) should skip memory"""
        assert check_mode_requires_memory('F') == False

    def test_mode_d_skips_memory(self):
        """Mode D (Acquaintance) should skip memory"""
        assert check_mode_requires_memory('D') == False


# =============================================================================
# BUNDLE RETRIEVAL
# =============================================================================

class TestBundleRetrieval:
    """Test instruction bundle retrieval from PostgreSQL."""

    @pytest.mark.asyncio
    async def test_retrieve_instructions_success(self):
        """Should return concatenated bundle content"""
        with patch('supabase.create_client') as mock_supabase:
            # Mock metadata response
            mock_meta = Mock()
            mock_meta.data = [{'tag': 'cognitive_cont'}, {'tag': 'tool_rules_core'}]
            
            # Mock bundles response
            mock_bundles = Mock()
            mock_bundles.data = [
                {'tag': 'cognitive_cont', 'content': '<XML1>content1</XML1>', 'avg_tokens': 500},
                {'tag': 'tool_rules_core', 'content': '<XML2>content2</XML2>', 'avg_tokens': 300}
            ]
            
            mock_client = Mock()
            mock_client.table.return_value.select.return_value.contains.return_value.execute.return_value = mock_meta
            mock_client.table.return_value.select.return_value.in_.return_value.eq.return_value.execute.return_value = mock_bundles
            mock_supabase.return_value = mock_client
            
            result = await retrieve_instructions('A')
            
            assert '<XML1>' in result
            assert '<XML2>' in result

    @pytest.mark.asyncio
    async def test_retrieve_instructions_fallback(self):
        """Should return core bundle if no mode-specific bundles found"""
        with patch('supabase.create_client') as mock_supabase:
            # Mock empty metadata response
            mock_meta = Mock()
            mock_meta.data = []
            
            # Mock fallback bundle
            mock_fallback = Mock()
            mock_fallback.data = {'content': '<FALLBACK>core content</FALLBACK>'}
            
            mock_client = Mock()
            mock_client.table.return_value.select.return_value.contains.return_value.execute.return_value = mock_meta
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = mock_fallback
            mock_supabase.return_value = mock_client
            
            result = await retrieve_instructions('UNKNOWN_MODE')
            
            # Should get some fallback content
            assert result is not None


# =============================================================================
# Tier 3 element selection / naming compatibility
# =============================================================================


@pytest.mark.asyncio
async def test_tier3_element_selection():
    """Tier 3 retrieval must resolve legacy names against x.y_3_<base> elements."""
    tier3_data = [
        {"element": "2.0_3_EntityProject", "content": "proj", "avg_tokens": 10},
        {"element": "3.0_3_temporal_filter_pattern", "content": "temp", "avg_tokens": 10},
        {"element": "5.0_3_chart_type_Table", "content": "table", "avg_tokens": 10},
    ]

    # Build a minimal supabase client mock that matches the chained calls in retrieve_instructions
    class _Resp:
        def __init__(self, data):
            self.data = data

    class _Query:
        def __init__(self, data):
            self._data = data
        def select(self, *args, **kwargs):
            return self
        def eq(self, *args, **kwargs):
            return self
        def execute(self):
            return _Resp(self._data)

    class _Client:
        def __init__(self, data):
            self._data = data
        def table(self, *_args, **_kwargs):
            return _Query(self._data)

    with patch('supabase.create_client', return_value=_Client(tier3_data)):
        result = await retrieve_instructions(
            mode='A',
            tier='elements',
            elements=['EntityProject', 'temporal_filter_pattern', 'chart_type_Table'],
        )

        assert '<element name="2.0_3_EntityProject">' in result
        assert '<element name="3.0_3_temporal_filter_pattern">' in result
        assert '<element name="5.0_3_chart_type_Table">' in result
