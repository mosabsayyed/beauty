## Must be updated with any changes done:

- **User → Chat UI:** User types a query in the chat input (UI component `ChatInterface`) and submits it.  
- **Chat UI → Frontend controller:** `ChatInterface` calls the app controller (`ChatAppPage` / `ChatContainer`) which calls `chatService.sendMessage`.  
- **Frontend → Backend API:** `chatService.sendMessage` issues `POST /chat/message` to the backend API.  
- **API route → Conversation manager:** The API handler in chat.py builds conversation context and persists the user message via `SupabaseConversationManager.add_message`.  
- **API → Orchestrator:** The API calls `OrchestratorZeroShot.stream_query(..., use_mcp=True)` to process the query and fetch data/tool results.  
- **Orchestrator → Upstream model + MCP:** `OrchestratorZeroShot` composes the system prompt, includes the MCP tool block, calls the Groq Responses API (and MCP `read_neo4j_cypher` as needed) and receives the model/tool outputs.  
- **Orchestrator → Normalizer → API:** The orchestrator normalizes the Groq/Responses payload into the canonical JSON shape (`answer`, `memory_process`, `analysis`, `data`, `visualizations`, `tool_results`, `raw_response`) and returns it to the API.  

**API → Persist assistant message:** The API now persists only the minimal structured assistant payload and metadata (dropping narrative, unused fields, and `raw_response`). Only required fields for frontend rendering are stored: `answer`, `insights`, `artifacts`, `clarification_needed`, `clarification_questions`, `clarification_context`, `memory_process`, and `tool_results`.

**API → Frontend response:** The API returns a minimal `ChatResponse` containing only the structured assistant payload (no narrative, unused fields, or `raw_response`). The frontend receives clean, ready-to-render data and does not need to parse or sanitize noisy LLM output.

**Frontend → Reload / merge messages:** Frontend reloads conversation messages (`chatService.getConversationMessages`) and the message loader (`ChatAppPage.loadConversationMessages`) merges the structured assistant fields directly into message metadata. No additional sanitization or JSON extraction is required.

**Frontend rendering:** `MessageBubble` and related components render the assistant `answer`, and show `memory_process.thought_trace` (or tool/failure UI) based on the clean, structured metadata.

**Streaming UI (optional):** If streaming is used, `ChatInterface`’s oboe/streaming path updates `streamingThinking` and `streamingAnswer`, and on completion persists identical structured metadata so streaming and single-shot flows present the same artifacts.

**Observability:** `init_debug_logger` and backend logs capture `llm_request` / `llm_response` and MCP call events for troubleshooting.

