from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from app.db.supabase_client_async import SupabaseClient


class SupabaseConversationManager:
    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client
    
    async def create_conversation(
        self,
        user_id: int,
        persona_name: str = "transformation_analyst",
        title: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        # TODO: When personas table is seeded, use persona_name to look up persona_id
        # For now: hardcode persona_id=1 (noor) for all conversations
        persona_id = 1
        
        conversation_data = {
            'user_id': user_id,
            'persona_id': persona_id,
            'title': title or "New Conversation",
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = await self.client.table_insert('conversations', conversation_data)
        return result[0] if result else None
    
    async def get_conversation(
        self,
        conversation_id: int,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        conversations = await self.client.table_select(
            'conversations',
            '*',
            {'id': conversation_id, 'user_id': user_id}
        )
        return conversations[0] if conversations else None
    
    async def list_conversations(
        self,
        user_id: int,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        # RPC path removed: rely on standard table_select to avoid missing-function errors.
        conversations = await self.client.table_select(
            'conversations',
            '*',
            {'user_id': user_id}
        )
        conversations.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        
        # Return with message_count filled from a single messages fetch (no per-conversation calls)
        limited_conversations = conversations[:limit]
        conv_ids = [str(conv['id']) for conv in limited_conversations if 'id' in conv]

        message_counts: Dict[str, int] = {}
        if conv_ids:
            params = {
                "select": "conversation_id",
                # One request for all conversations; Supabase supports in.(...) filter.
                "conversation_id": f"in.({','.join(conv_ids)})"
            }
            rows = await self.client._run_http('messages', 'GET', params)
            for row in rows or []:
                cid = str(row.get('conversation_id'))
                if cid:
                    message_counts[cid] = message_counts.get(cid, 0) + 1

        for conv in limited_conversations:
            cid = str(conv.get('id')) if conv.get('id') is not None else None
            conv['message_count'] = message_counts.get(cid, 0)

        return limited_conversations
    
    async def delete_conversation(
        self,
        conversation_id: int,
        user_id: int
    ) -> bool:
        conversation = await self.get_conversation(conversation_id, user_id)
        if conversation:
            await self.client.table_delete('conversations', {'id': conversation_id})
            return True
        return False
    
    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        message_data = {
            'conversation_id': conversation_id,
            'role': role,
            'content': content,
            'extra_metadata': metadata or {},
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = await self.client.table_insert('messages', message_data)
        message = result[0] if result else None
        
        conversations = await self.client.table_select('conversations', '*', {'id': conversation_id})
        if conversations:
            conversation = conversations[0]
            update_data = {'updated_at': datetime.utcnow().isoformat()}
            
            if conversation.get('title') == "New Conversation" and role == "user":
                update_data['title'] = content[:50] + ("..." if len(content) > 50 else "")
            
            await self.client.table_update('conversations', update_data, {'id': conversation_id})
        
        return message
    
    async def get_messages(
        self,
        conversation_id: int,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        # Fetch messages sorted by created_at DESC with limit
        # This gets the *latest* N messages efficiently from the DB
        messages = await self.client.table_select(
            'messages',
            '*',
            {'conversation_id': conversation_id},
            order={'column': 'created_at', 'desc': True},
            limit=limit
        )
        # Reverse to return in chronological order (oldest first)
        messages.reverse()
        return messages
    
    async def build_conversation_context(
        self,
        conversation_id: int,
        max_messages: int = 10
    ) -> List[Dict[str, str]]:
        """Build conversation context as list of message dicts for orchestrator.

        IMPORTANT:
        - Message `content` in DB may be a large structured JSON blob.
        - Feeding large blobs back into the LLM repeatedly can blow up context and
          increase Groq tool-validation failures.
        - This method returns a compacted form suitable for prompt history.
        """
        messages = await self.get_messages(conversation_id, limit=max_messages)
        
        if not messages:
            return []
        
        messages.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        messages = list(reversed(messages[-max_messages:]))
        
        def _compact_content(role: str, content: Any, max_chars: int) -> str:
            if content is None:
                return ""
            if not isinstance(content, str):
                content = str(content)
            raw = content.strip()
            if len(raw) <= max_chars:
                return raw

            # If assistant content is JSON, keep only the human-facing answer.
            if role == "assistant" and raw.startswith("{"):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, dict):
                        answer = parsed.get("answer") or parsed.get("message")
                        if isinstance(answer, str) and answer.strip():
                            answer = answer.strip()
                            return (answer[: max_chars - 1] + "…") if len(answer) > max_chars else answer
                except Exception:
                    pass

            return raw[: max_chars - 1] + "…"

        compacted: List[Dict[str, str]] = []
        for msg in messages:
            role = (msg.get("role") or "user").strip()
            max_chars = 2400 if role == "assistant" else 1400
            compacted.append({
                "role": role,
                "content": _compact_content(role, msg.get("content"), max_chars=max_chars),
            })

        return compacted
