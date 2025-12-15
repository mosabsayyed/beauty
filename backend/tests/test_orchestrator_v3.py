"""
Integration Tests for Noor Cognitive Digital Twin v3.0

Tests the complete 5-step cognitive loop:
- Step 0: REMEMBER (Memory Recall)
- Step 1: REQUIREMENTS (Intent Classification)
- Step 2: RECOLLECT (Bundle Loading)
- Step 3: RECALL (Cypher Execution)
- Step 4: RECONCILE (Gap Analysis)
- Step 5: RETURN (Response Formatting)

Reference: [END_STATE_TECHNICAL_DESIGN] Implementation Roadmap v3.0
"""

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock

from app.services.orchestrator_v3 import OrchestratorV3


# =============================================================================
# QUICK EXIT PATH TESTS (Mode D/F)
# =============================================================================

class TestQuickExitPath:
    """
    Test Quick Exit Path for conversational queries.
    Target latency: < 0.5s for Mode D and F.
    """

    @pytest.fixture
    def orchestrator(self):
        """Create orchestrator with mocked environment"""
        with patch.dict('os.environ', {
            'GROQ_API_KEY': 'test_key',
            'MCP_ROUTER_URL': 'http://test:8000'
        }):
            return OrchestratorV3()

    @pytest.mark.asyncio
    async def test_mode_f_greeting(self, orchestrator):
        """Greetings should trigger quick exit"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {
                "mode": "F",
                "quick_exit_triggered": True,
                "chat_response": "Hello! I am Noor, your Cognitive Digital Twin."
            }
            
            with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                result = await orchestrator.execute_query(
                    user_query="Hello, Noor",
                    session_id="test_session"
                )
            
            assert result.get("quick_exit") == True
            assert result.get("mode") == "F"
            assert "Noor" in result.get("answer", "")

    @pytest.mark.asyncio
    async def test_mode_d_acquaintance(self, orchestrator):
        """Acquaintance questions should trigger quick exit"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {
                "mode": "D",
                "quick_exit_triggered": True,
                "chat_response": "I am Noor, the Cognitive Digital Twin..."
            }
            
            with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                result = await orchestrator.execute_query(
                    user_query="Who are you?",
                    session_id="test_session"
                )
            
            assert result.get("quick_exit") == True
            assert result.get("mode") == "D"

    @pytest.mark.asyncio
    async def test_quick_exit_skips_bundle_loading(self, orchestrator):
        """Quick exit should NOT load bundles (skip Step 2)"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {
                "mode": "F",
                "quick_exit_triggered": True,
                "chat_response": "Hello!"
            }
            
            with patch('app.services.mcp_service.retrieve_instructions', new_callable=AsyncMock) as mock_bundles:
                with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                    result = await orchestrator.execute_query(
                        user_query="Hi",
                        session_id="test_session"
                    )
                
                # retrieve_instructions should NOT be called for quick exit
                mock_bundles.assert_not_called()

    @pytest.mark.asyncio
    async def test_quick_exit_skips_memory(self, orchestrator):
        """Quick exit should NOT recall memory (skip Step 0)"""
        with patch('app.services.mcp_service.recall_memory', new_callable=AsyncMock) as mock_memory:
            with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                result = await orchestrator.execute_query(
                    user_query="Thank you",
                    session_id="test_session"
                )
            
            # Memory recall should NOT be called for quick exit
            mock_memory.assert_not_called()


# =============================================================================
# STANDARD ANALYTICAL PATH TESTS
# =============================================================================

class TestStandardPath:
    """
    Test standard analytical path (non-Quick Exit modes).
    Should execute all 5 steps in sequence.
    """

    @pytest.fixture
    def orchestrator(self):
        """Create orchestrator with mocked environment"""
        with patch.dict('os.environ', {
            'GROQ_API_KEY': 'test_key',
            'MCP_ROUTER_URL': 'http://test:8000'
        }):
            return OrchestratorV3()

    @pytest.mark.asyncio
    async def test_mode_a_full_path(self, orchestrator):
        """Mode A should execute full path with bundle loading"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {
                "mode": "A",
                "quick_exit_triggered": False
            }
            
            with patch('app.services.mcp_service.retrieve_instructions', new_callable=AsyncMock) as mock_bundles:
                mock_bundles.return_value = "<INSTRUCTIONS>Test bundle content</INSTRUCTIONS>"
                
                with patch.object(orchestrator, '_invoke_llm_with_tools', new_callable=AsyncMock) as mock_llm:
                    mock_llm.return_value = {
                        "output_text": json.dumps({
                            "answer": "Here are the projects...",
                            "confidence_score": 0.9,
                            "data": {"query_results": []}
                        })
                    }
                    
                    with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                        result = await orchestrator.execute_query(
                            user_query="List all projects for 2025",
                            session_id="test_session"
                        )
                    
                    # Should have loaded bundles
                    mock_bundles.assert_called()
                    
                    # Should have called LLM
                    mock_llm.assert_called()
                    
                    # Should have mode A
                    assert result.get("mode") == "A"
                    assert result.get("quick_exit") == False

    @pytest.mark.asyncio
    async def test_mode_b2_loads_gap_bundle(self, orchestrator):
        """Mode B2 should load strategy_gap_diagnosis bundle"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {
                "mode": "B2",
                "quick_exit_triggered": False
            }
            
            with patch('app.services.mcp_service.recall_memory', new_callable=AsyncMock, return_value="[]"):
                with patch('app.services.mcp_service.retrieve_instructions', new_callable=AsyncMock) as mock_bundles:
                    mock_bundles.return_value = "<GAP_ANALYSIS>strategy_gap_diagnosis bundle</GAP_ANALYSIS>"
                    
                    with patch.object(orchestrator, '_invoke_llm_with_tools', new_callable=AsyncMock) as mock_llm:
                        mock_llm.return_value = {"output_text": '{"answer": "Gap found", "confidence_score": 0.85}'}
                        
                        with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                            result = await orchestrator.execute_query(
                                user_query="What gaps exist in our project capabilities?",
                                session_id="test_session"
                            )
                        
                        mock_bundles.assert_called_with('B2')


# =============================================================================
# MEMORY INTEGRATION TESTS
# =============================================================================

class TestMemoryIntegration:
    """
    Test Step 0 (REMEMBER) and Step 5 (RETURN) memory operations.
    """

    @pytest.fixture
    def orchestrator(self):
        with patch.dict('os.environ', {
            'GROQ_API_KEY': 'test_key',
            'MCP_ROUTER_URL': 'http://test:8000'
        }):
            return OrchestratorV3()

    @pytest.mark.asyncio
    async def test_step_0_recall_for_continuation(self, orchestrator):
        """Mode G (Continuation) should trigger memory recall"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {"mode": "G", "quick_exit_triggered": False}
            
            with patch('app.services.mcp_service.recall_memory', new_callable=AsyncMock) as mock_memory:
                mock_memory.return_value = json.dumps([{"key": "prev", "content": "Previous context"}])
                
                with patch('app.services.mcp_service.retrieve_instructions', new_callable=AsyncMock, return_value="<BUNDLE/>"):
                    with patch.object(orchestrator, '_invoke_llm_with_tools', new_callable=AsyncMock) as mock_llm:
                        mock_llm.return_value = {"output_text": '{"answer": "Continuing...", "confidence_score": 0.9}'}
                        
                        with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                            result = await orchestrator.execute_query(
                                user_query="And what about the risks?",
                                session_id="test_session"
                            )
                        
                        # Memory should have been recalled for continuation
                        mock_memory.assert_called()

    @pytest.mark.asyncio
    async def test_step_5_memory_save_trigger(self, orchestrator):
        """Memory save should be triggered when LLM sets trigger_memory_save=true"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {"mode": "A", "quick_exit_triggered": False}
            
            with patch('app.services.mcp_service.retrieve_instructions', new_callable=AsyncMock, return_value="<BUNDLE/>"):
                with patch.object(orchestrator, '_invoke_llm_with_tools', new_callable=AsyncMock) as mock_llm:
                    # LLM output triggers memory save
                    mock_llm.return_value = {
                        "output_text": json.dumps({
                            "answer": "I'll remember your preference for L3 analysis.",
                            "confidence_score": 0.95,
                            "trigger_memory_save": True,
                            "memory_content": "User prefers L3 level analysis"
                        })
                    }
                    
                    with patch('app.services.mcp_service.save_memory', new_callable=AsyncMock) as mock_save:
                        mock_save.return_value = "Memory saved successfully"
                        
                        with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                            result = await orchestrator.execute_query(
                                user_query="I only want L3 level analysis",
                                session_id="test_session"
                            )
                        
                        # save_memory should have been called with personal scope
                        mock_save.assert_called_once()
                        call_args = mock_save.call_args
                        assert call_args[1]['scope'] == 'personal'


# =============================================================================
# RESPONSE FORMATTING TESTS
# =============================================================================

class TestResponseFormatting:
    """Test response normalization and business language translation."""

    @pytest.fixture
    def orchestrator(self):
        with patch.dict('os.environ', {
            'GROQ_API_KEY': 'test_key',
            'MCP_ROUTER_URL': 'http://test:8000'
        }):
            return OrchestratorV3()

    def test_business_language_translation(self, orchestrator):
        """Technical terms should be translated to business language"""
        text = "The L3 level Cypher query returned 5 Nodes"
        
        translated = orchestrator._apply_business_language(text)
        
        assert "L3" not in translated or "Function" in translated
        assert "Cypher" not in translated.lower() or "database search" in translated.lower()
        assert "Node" not in translated or "Entity" in translated

    def test_network_graph_conversion(self, orchestrator):
        """Network graphs should be converted to tables"""
        visualizations = [{
            "type": "network_graph",
            "title": "Project Dependencies",
            "data": [
                {"Source": "Project A", "Relationship": "REQUIRES", "Target": "Capability B"}
            ]
        }]
        
        processed = orchestrator._process_visualizations(visualizations)
        
        assert len(processed) == 1
        assert processed[0]["type"] == "table"
        assert "Rendered as Table" in processed[0]["title"]


# =============================================================================
# BUNDLE CACHING TESTS
# =============================================================================

class TestBundleCaching:
    """Test that bundles are placed at prompt prefix for caching."""

    @pytest.fixture
    def orchestrator(self):
        with patch.dict('os.environ', {
            'GROQ_API_KEY': 'test_key',
            'MCP_ROUTER_URL': 'http://test:8000'
        }):
            return OrchestratorV3()

    def test_bundles_at_prompt_prefix(self, orchestrator):
        """Bundles MUST be at the start of the prompt for caching"""
        bundles_content = "<INSTRUCTION_BUNDLE>This is the bundle</INSTRUCTION_BUNDLE>"
        
        prompt = orchestrator._build_full_prompt(
            bundles_content=bundles_content,
            recalled_context="",
            conversation_history=None,
            user_query="What are the projects?",
            mode="A"
        )
        
        # Bundles should be at the very start
        assert prompt.startswith(bundles_content)
        
        # User query should come after
        query_pos = prompt.find("What are the projects?")
        bundle_pos = prompt.find("<INSTRUCTION_BUNDLE>")
        assert bundle_pos < query_pos

    def test_prompt_structure_order(self, orchestrator):
        """Prompt should follow correct order: bundles > context > history > query"""
        prompt = orchestrator._build_full_prompt(
            bundles_content="<BUNDLE>1</BUNDLE>",
            recalled_context='[{"key": "memory"}]',
            conversation_history=[{"role": "user", "content": "Previous question"}],
            user_query="Current question",
            mode="A"
        )
        
        # Check order
        bundle_pos = prompt.find("<BUNDLE>")
        end_marker = prompt.find("[--- END INSTRUCTIONS ---]")
        context_pos = prompt.find("<recalled_context>")
        history_pos = prompt.find("<conversation_history>")
        query_pos = prompt.find("<user_query>")
        
        assert bundle_pos < end_marker
        assert end_marker < context_pos
        assert context_pos < history_pos
        assert history_pos < query_pos


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================

class TestErrorHandling:
    """Test graceful error handling throughout the pipeline."""

    @pytest.fixture
    def orchestrator(self):
        with patch.dict('os.environ', {
            'GROQ_API_KEY': 'test_key',
            'MCP_ROUTER_URL': 'http://test:8000'
        }):
            return OrchestratorV3()

    @pytest.mark.asyncio
    async def test_bundle_loading_fallback(self, orchestrator):
        """Should use fallback instructions if bundle loading fails"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {"mode": "A", "quick_exit_triggered": False}
            
            with patch('app.services.mcp_service.retrieve_instructions', new_callable=AsyncMock) as mock_bundles:
                mock_bundles.side_effect = Exception("Database error")
                
                with patch.object(orchestrator, '_invoke_llm_with_tools', new_callable=AsyncMock) as mock_llm:
                    mock_llm.return_value = {"output_text": '{"answer": "Fallback worked"}'}
                    
                    with patch('app.services.mcp_service.log_completion', new_callable=AsyncMock):
                        result = await orchestrator.execute_query(
                            user_query="Test query",
                            session_id="test_session"
                        )
                        
                        # Should still produce a result using fallback
                        assert "error" not in result or result.get("answer") is not None

    @pytest.mark.asyncio
    async def test_graceful_llm_failure(self, orchestrator):
        """Should return user-friendly error on LLM failure"""
        with patch.object(orchestrator, '_invoke_classification', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = {"mode": "A", "quick_exit_triggered": False}
            
            with patch('app.services.mcp_service.retrieve_instructions', new_callable=AsyncMock, return_value="<BUNDLE/>"):
                with patch.object(orchestrator, '_invoke_llm_with_tools', new_callable=AsyncMock) as mock_llm:
                    mock_llm.side_effect = Exception("LLM API error")
                    
                    result = await orchestrator.execute_query(
                        user_query="Test query",
                        session_id="test_session"
                    )
                    
                    # Should have error field
                    assert "error" in result
                    # Should have user-friendly message
                    assert "please try again" in result.get("answer", "").lower() or "issue" in result.get("answer", "").lower()
