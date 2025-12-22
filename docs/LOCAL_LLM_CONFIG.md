# Local LLM Configuration Guide

## Overview
The orchestrator supports both OpenRouter (cloud) and local LLM providers (LM Studio, Ollama, etc.) with configurable API endpoints.

## Environment Variables

### Local LLM Configuration

```bash
# Enable local LLM instead of OpenRouter
LOCAL_LLM_ENABLED=true

# Base URL (without endpoint path) - LM Studio default is http://localhost:1234
LOCAL_LLM_BASE_URL=http://localhost:1234

# Model name loaded in your local LLM server
LOCAL_LLM_MODEL=your-model-name

# Timeout for local LLM requests (seconds)
LOCAL_LLM_TIMEOUT=120

# Use OpenAI Responses API format (/v1/responses) instead of Chat Completions (/v1/chat/completions)
# Set to "true" for LM Studio v0.3.29+ or any server supporting Responses API
# Set to "false" for standard OpenAI Chat Completions format
LOCAL_LLM_USE_RESPONSES_API=true
```

## LM Studio Configuration

### Option 1: Using Responses API (Recommended)
LM Studio v0.3.29+ supports the Responses API which includes better tool calling support and **stateful conversations**.

```bash
LOCAL_LLM_ENABLED=true
LOCAL_LLM_BASE_URL=http://localhost:1234
LOCAL_LLM_MODEL=your-model-name
LOCAL_LLM_USE_RESPONSES_API=true
```

**What this does:**
- Calls `http://localhost:1234/v1/responses`
- **First turn:** Sends full conversation as formatted string: `"System: ...\n\nUser: ..."`
- **Follow-up turns:** Uses `previous_response_id` to maintain context (only sends latest message)
- Includes function tool definitions (recall_memory, retrieve_instructions, read_neo4j_cypher)
- Parses response from `output[].content[].text` with type `output_text`

**Stateful Conversations:**
- The orchestrator caches response IDs by `session_id`
- On subsequent turns in the same session, it sends `previous_response_id` + only the new user message
- This prevents KV cache errors and reduces token usage
- LM Studio maintains the conversation state server-side

**Reference:** See [LM Studio Responses API Documentation](https://lmstudio.ai/docs/app/api/endpoints/openai/responses)

**Note:** If you see KV cache errors like "inconsistent sequence positions", make sure you're using the latest code with stateful conversation support.

### Option 2: Using Chat Completions API (Fallback)
For older LM Studio versions or other OpenAI-compatible servers:

```bash
LOCAL_LLM_ENABLED=true
LOCAL_LLM_BASE_URL=http://localhost:1234
LOCAL_LLM_MODEL=your-model-name
LOCAL_LLM_USE_RESPONSES_API=false
```

**What this does:**
- Calls `http://localhost:1234/v1/chat/completions`
- Sends `"messages"` array in standard OpenAI format
- No tool definitions included
- Parses response from `choices[0].message.content`

## Ollama Configuration

Ollama uses Chat Completions format:

```bash
LOCAL_LLM_ENABLED=true
LOCAL_LLM_BASE_URL=http://localhost:11434
LOCAL_LLM_MODEL=llama3.1:8b
LOCAL_LLM_USE_RESPONSES_API=false
```

## Switching Between Cloud and Local

To switch back to OpenRouter:

```bash
LOCAL_LLM_ENABLED=false
OPENROUTER_API_KEY=your-key
OPENROUTER_API_ENDPOINT=https://openrouter.ai/api/v1/responses
```

## Troubleshooting

### Issue: Getting 404 errors
**Solution:** Check that your `LOCAL_LLM_BASE_URL` doesn't include the endpoint path:
- ✅ Correct: `http://localhost:1234`
- ❌ Wrong: `http://localhost:1234/v1/chat/completions`

### Issue: "chat/completions" being called when I want "responses"
**Solution:** Set `LOCAL_LLM_USE_RESPONSES_API=true`

### Issue: Model not generating proper JSON
**Solution:** 
- Ensure your model supports JSON mode or tool calling
- Try switching between `LOCAL_LLM_USE_RESPONSES_API=true/false`
- Check LM Studio logs to see actual request/response format

## Endpoint Reference

| Config Value | Endpoint Called | Format |
|--------------|----------------|--------|
| `LOCAL_LLM_USE_RESPONSES_API=true` | `{BASE_URL}/v1/responses` | OpenAI Responses API |
| `LOCAL_LLM_USE_RESPONSES_API=false` | `{BASE_URL}/v1/chat/completions` | OpenAI Chat Completions |
| OpenRouter (default) | `https://openrouter.ai/api/v1/responses` | OpenAI Responses API |

## Implementation Details

### Files Modified
- `backend/app/config/__init__.py` - Added `LOCAL_LLM_USE_RESPONSES_API` config
- `backend/app/services/orchestrator_universal.py` - Split `_call_local_llm` into two methods:
  - `_call_local_llm_chat_completions()` - Standard format
  - `_call_local_llm_responses_api()` - Responses API format

### MCP Tool Support
When `LOCAL_LLM_USE_RESPONSES_API=true`, the orchestrator includes tool definitions for:
- `recall_memory` - Search memory by scope
- `retrieve_instructions` - Load instruction bundles
- `read_neo4j_cypher` - Execute Cypher queries

These tools are NOT included when using Chat Completions format (`LOCAL_LLM_USE_RESPONSES_API=false`).
