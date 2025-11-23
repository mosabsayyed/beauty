# Codebase Investigator Report

## Summary of Findings

The investigation was interrupted by the time limit. Based on the findings so far, the codebase is in a complex transitional state. The primary issue is a fragmented architecture with multiple, conflicting approaches to both LLM integration and data storage. The active, forward-looking architecture appears to be a 'zero-shot' agent using Groq and Neo4j (`OrchestratorZeroShot`), while legacy components using a generic `LLMProvider` and a Supabase/Postgres database for conversation history still exist. This creates significant technical debt and confusion. The key to cleanup is to commit to the Neo4j-based architecture, consolidate the data layer, and remove the redundant `LLMProvider` code. A full investigation of the frontend (`frontend/src`) is still required to understand how it handles the data from these disparate backend systems.

## Relevant Locations

### `backend/app/services/orchestrator_zero_shot.py`
*   **Reasoning:** This is the heart of the current LLM integration. It bypasses traditional LLM classes and makes direct API calls to Groq. It contains the massive, detailed prompt that drives the AI's behavior and reveals the deep integration with Neo4j. This file is critical for understanding the intended future architecture.
*   **Key Symbols:** `OrchestratorZeroShot`, `process_query`, `mcp_server_url`

### `backend/app/api/routes/chat.py`
*   **Reasoning:** This FastAPI route is the main entry point for user queries. It showcases the architectural conflict by simultaneously using `OrchestratorZeroShot` (Neo4j), `SupabaseConversationManager` (Supabase/Postgres), and `SQLExecutorService` (SQL). It's the nexus of the data layer fragmentation.
*   **Key Symbols:** `send_message`, `SupabaseConversationManager`, `OrchestratorZeroShot`, `SQLExecutorService`

### `backend/mcp-server/servers/mcp-neo4j-cypher/src/mcp_neo4j_cypher/server.py`
*   **Reasoning:** This file defines the microservice that acts as a tool server for the LLM, allowing it to interact with the Neo4j database. It confirms that Neo4j is not just a plan but an actively integrated component.
*   **Key Symbols:** `create_mcp_server`, `read_neo4j_cypher`, `get_neo4j_schema`

### `backend/app/services/llm_provider.py`
*   **Reasoning:** This file represents a parallel, likely deprecated, architecture for handling LLM interactions. Its existence alongside `OrchestratorZeroShot` is a major source of confusion and a prime candidate for cleanup. It confirms the user's suspicion of duplicate files.
*   **Key Symbols:** `LLMProvider`, `chat_completion`

### `frontend/package.json`
*   **Reasoning:** This file provides the crucial link between the frontend and backend during development, specifying that frontend API calls are proxied to the backend server running on `http://localhost:8008`.
*   **Key Symbols:** `proxy`
