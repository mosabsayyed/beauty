import pytest
from httpx import AsyncClient
import uuid
from unittest.mock import patch
from datetime import datetime, timezone

# Mark all tests in this module as asyncio
pytestmark = pytest.mark.anyio

# Mock SupabaseConversationManager for chat tests
class MockSupabaseConversationManager:
    def __init__(self, client=None):
        self.conversations = {}
        self.messages = {}
        self.next_convo_id = 1
        self.next_message_id = 1

    async def create_conversation(self, user_id: int, persona_name: str, title: str):
        convo_id = self.next_convo_id
        self.next_convo_id += 1
        now = datetime.now(timezone.utc).isoformat()
        conversation = {
            "id": convo_id,
            "user_id": user_id,
            "persona_id": 1, # Mock persona ID
            "title": title,
            "created_at": now,
            "updated_at": now,
        }
        self.conversations[convo_id] = conversation
        self.messages[convo_id] = []
        return conversation

    async def get_conversation(self, conversation_id: int, user_id: int):
        convo = self.conversations.get(conversation_id)
        if convo and convo["user_id"] == user_id:
            return convo
        return None

    async def list_conversations(self, user_id: int, limit: int = 50):
        return [
            convo
            for convo in self.conversations.values()
            if convo["user_id"] == user_id
        ][:limit]

    async def delete_conversation(self, conversation_id: int, user_id: int):
        convo = self.conversations.get(conversation_id)
        if convo and convo["user_id"] == user_id:
            del self.conversations[conversation_id]
            if conversation_id in self.messages:
                del self.messages[conversation_id]
            return True
        return False

    async def add_message(self, conversation_id: int, role: str, content: str, metadata: dict):
        message_id = self.next_message_id
        self.next_message_id += 1
        now = datetime.now(timezone.utc).isoformat()
        message = {
            "id": message_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "extra_metadata": metadata,
            "created_at": now,
        }
        self.messages[conversation_id].append(message)
        # Update conversation's updated_at
        if conversation_id in self.conversations:
            self.conversations[conversation_id]["updated_at"] = now
        return message

    async def get_messages(self, conversation_id: int, limit: int = 100):
        return self.messages.get(conversation_id, [])[-limit:]

    async def build_conversation_context(self, conversation_id: int, max_messages: int = 10):
        messages = await self.get_messages(conversation_id, limit=max_messages)
        return [{"role": msg["role"], "content": msg["content"]} for msg in messages]

# Mock OrchestratorZeroShot
class MockOrchestratorZeroShot:
    def process_query(self, user_query: str, conversation_history: list, conversation_id: int):
        # Simple mock response
        if "clarification" in user_query.lower():
            return {
                "answer": "I need more information.",
                "analysis": [],
                "visualizations": [],
                "data": {},
                "cypher_executed": "",
                "confidence": 0.5,
                "clarification_needed": True,
                "questions": ["What year?", "What entity?"],
                "context": "Clarification context."
            }
        return {
            "answer": f"Mock response to: {user_query}",
            "analysis": ["Mock insight 1", "Mock insight 2"],
            "visualizations": [
                {
                    "title": "Mock Chart",
                    "config": {"chart": {"type": "bar"}, "series": [{"data": [1, 2, 3]}]},
                    "description": "A mock chart",
                }
            ],
            "data": {"query_results": [{"col1": "val1", "col2": "val2"}]},
            "cypher_executed": "MATCH (n) RETURN n LIMIT 1",
            "confidence": 0.9,
        }

# Mock SQLExecutorService
class MockSQLExecutorService:
    def execute(self, sql: str, params: list):
        return {"rows": [{"mock_col": "mock_val"}], "columns": ["mock_col"]}

# Fixture to override dependencies
@pytest.fixture
async def mock_conversation_manager():
    return MockSupabaseConversationManager()

@pytest.fixture
async def mock_orchestrator_zero_shot():
    return MockOrchestratorZeroShot()

@pytest.fixture
async def mock_sql_executor_service():
    return MockSQLExecutorService()

# Override dependencies in the FastAPI app
from app.api.routes.chat import get_conversation_manager, OrchestratorZeroShot, SQLExecutorService
from app.main import app

app.dependency_overrides[get_conversation_manager] = mock_conversation_manager
app.dependency_overrides[OrchestratorZeroShot] = mock_orchestrator_zero_shot
app.dependency_overrides[SQLExecutorService] = mock_sql_executor_service


@pytest.mark.asyncio
async def test_send_message_new_conversation(client: AsyncClient):
    response = await client.post(
        "/api/v1/chat/message",
        json={"query": "Hello AI", "persona": "test_persona"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] is not None
    assert data["message"].startswith("Mock response")
    assert len(data["insights"]) == 2
    assert len(data["artifacts"]) == 2 # Chart and Table
    assert data["artifacts"][0]["artifact_type"] == "CHART"
    assert data["artifacts"][1]["artifact_type"] == "TABLE"

async def test_send_message_existing_conversation(client: AsyncClient):
    # Start a new conversation
    new_convo_response = await client.post(
        "/api/v1/chat/message",
        json={"query": "First message", "persona": "test_persona"},
    )
    convo_id = new_convo_response.json()["conversation_id"]

    # Send another message to the same conversation
    response = await client.post(
        "/api/v1/chat/message",
        json={"query": "Second message", "conversation_id": convo_id},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == convo_id
    assert data["message"].startswith("Mock response")

async def test_send_message_clarification_needed(client: AsyncClient):
    response = await client.post(
        "/api/v1/chat/message",
        json={"query": "Clarification needed query"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["clarification_needed"] is True
    assert data["message"] == "I need more information."
    assert len(data["clarification_questions"]) == 2

async def test_list_conversations(client: AsyncClient):
    # Create a conversation first
    await client.post("/api/v1/chat/message", json={"query": "List test 1"})
    await client.post("/api/v1/chat/message", json={"query": "List test 2"})

    response = await client.get("/api/v1/chat/conversations")
    assert response.status_code == 200
    data = response.json()
    assert "conversations" in data
    assert len(data["conversations"]) >= 2 # At least the ones we just created

async def test_get_conversation_detail(client: AsyncClient):
    new_convo_response = await client.post(
        "/api/v1/chat/message",
        json={"query": "Detail test query"},
    )
    convo_id = new_convo_response.json()["conversation_id"]

    response = await client.get(f"/api/v1/chat/conversations/{convo_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["conversation"]["id"] == convo_id
    assert "updated_at" in data["conversation"] # Check for new field
    assert "user_id" in data["conversation"] # Check for new field
    assert len(data["messages"]) == 2 # User message + AI response

async def test_get_conversation_detail_not_found(client: AsyncClient):
    response = await client.get("/api/v1/chat/conversations/99999")
    assert response.status_code == 404

async def test_delete_conversation(client: AsyncClient):
    new_convo_response = await client.post(
        "/api/v1/chat/message",
        json={"query": "Delete test query"},
    )
    convo_id = new_convo_response.json()["conversation_id"]

    response = await client.delete(f"/api/v1/chat/conversations/{convo_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True # Check for new field
    assert data["message"] == "Conversation deleted successfully"

    # Verify it's actually deleted
    get_response = await client.get(f"/api/v1/chat/conversations/{convo_id}")
    assert get_response.status_code == 404

async def test_delete_conversation_not_found(client: AsyncClient):
    response = await client.delete("/api/v1/chat/conversations/99999")
    assert response.status_code == 404
