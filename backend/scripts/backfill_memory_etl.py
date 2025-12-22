#!/usr/bin/env python3
"""
Backfill Memory ETL - One-Time Historical Data Ingestion

This script processes ALL conversations regardless of age, creating Memory nodes
for the entire conversation history. Run once to populate the graph database.

Unlike nightly_memory_etl.py (which runs incrementally with 24h lookback),
this backfill:
- Processes all conversations without time filtering
- Uses pagination to handle large datasets
- Can be interrupted and resumed (skips unchanged conversations)
- Populates the full graph with historical context
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import hashlib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
import httpx
from neo4j import GraphDatabase

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/mosab/projects/chatmodule/backend/logs/memory_backfill.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class ETLConfig:
    """Configuration for backfill ETL."""
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_SERVICE_KEY", ""))
    neo4j_uri: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user: str = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "")
    neo4j_database: str = os.getenv("NEO4J_DATABASE", "memory_semantic_index")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    batch_size: int = 200  # Higher batch for backfill
    min_conversation_length: int = 3


@dataclass
class ConversationRecord:
    session_id: str
    user_id: str
    user_email: str
    messages: List[Dict[str, str]]
    started_at: datetime
    ended_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]


@dataclass
class MemoryNode:
    id: str
    scope: str
    content: str
    embedding: List[float]
    timestamp: datetime
    source_session: str
    user_id: str
    tags: List[str]
    message_hash: str
    message_count: int
    source_updated_at_ts: int


class MemoryBackfillETL:
    """Backfill ETL for historical conversations."""
    
    def __init__(self, config: ETLConfig):
        self.config = config
        self.neo4j_driver = None
        self._validate_config()
    
    def _validate_config(self) -> None:
        required = [
            ("SUPABASE_URL", self.config.supabase_url),
            ("SUPABASE_SERVICE_KEY", self.config.supabase_key),
            ("NEO4J_URI", self.config.neo4j_uri),
            ("NEO4J_PASSWORD", self.config.neo4j_password),
            ("OPENAI_API_KEY", self.config.openai_api_key),
        ]
        missing = [name for name, value in required if not value]
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
    
    async def run(self) -> Dict[str, int]:
        """Execute backfill."""
        stats = {"processed": 0, "created": 0, "skipped": 0, "errors": 0, "total_fetched": 0}
        
        logger.info("=" * 70)
        logger.info("Starting Memory Backfill ETL (ALL CONVERSATIONS)")
        logger.info("=" * 70)
        
        try:
            self.neo4j_driver = GraphDatabase.driver(
                self.config.neo4j_uri,
                auth=(self.config.neo4j_user, self.config.neo4j_password)
            )
            
            # Paginate through all conversations
            offset = 0
            has_more = True
            
            while has_more:
                logger.info(f"Fetching batch at offset {offset} (batch size: {self.config.batch_size})")
                conversations = await self._fetch_conversations_paginated(offset)
                stats["total_fetched"] += len(conversations)
                
                if not conversations:
                    has_more = False
                    break
                
                for conv in conversations:
                    try:
                        stats["processed"] += 1
                        
                        if len(conv.messages) < self.config.min_conversation_length:
                            stats["skipped"] += 1
                            continue
                        
                        message_hash = self._compute_message_hash(conv.messages)
                        existing = self._get_existing_memory(conv.session_id)
                        needs_processing = self._needs_processing(conv, message_hash, existing)
                        
                        if not needs_processing:
                            stats["skipped"] += 1
                            logger.debug(f"Skipping unchanged conversation {conv.session_id}")
                            continue
                        
                        memory = await self._process_conversation(conv, message_hash)
                        await self._upsert_memory_node(memory)
                        stats["created"] += 1
                        
                        if stats["created"] % 50 == 0:
                            logger.info(f"Progress: {stats['created']} created, {stats['skipped']} skipped")
                    
                    except Exception as e:
                        stats["errors"] += 1
                        logger.error(f"Error processing {conv.session_id}: {e}")
                
                offset += len(conversations)
                if len(conversations) < self.config.batch_size:
                    has_more = False
            
            logger.info("=" * 70)
            logger.info(f"Backfill Complete: {stats}")
            logger.info("=" * 70)
            
            # Verify Memory nodes were created with valid scopes
            if stats["created"] > 0:
                self._verify_memory_creation()
        
        finally:
            if self.neo4j_driver:
                self.neo4j_driver.close()
        
        return stats
    
    async def _fetch_conversations_paginated(self, offset: int) -> List[ConversationRecord]:
        """Fetch conversations with pagination (no time filter)."""
        async with httpx.AsyncClient() as client:
            conv_resp = await client.get(
                f"{self.config.supabase_url}/rest/v1/conversations",
                headers={
                    "apikey": self.config.supabase_key,
                    "Authorization": f"Bearer {self.config.supabase_key}",
                },
                params={
                    "select": "*",
                    "order": "id.asc",
                    "offset": offset,
                    "limit": self.config.batch_size,
                }
            )
            
            if conv_resp.status_code != 200:
                logger.error(f"Supabase conversations error: {conv_resp.text}")
                return []
            
            conv_rows = conv_resp.json()
            conversations: List[ConversationRecord] = []
            
            for conv in conv_rows:
                conv_id = conv.get("id")
                if conv_id is None:
                    continue
                
                msg_resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/messages",
                    headers={
                        "apikey": self.config.supabase_key,
                        "Authorization": f"Bearer {self.config.supabase_key}",
                    },
                    params={
                        "select": "role,content,created_at",
                        "conversation_id": f"eq.{conv_id}",
                        "order": "created_at.asc",
                    }
                )
                
                if msg_resp.status_code != 200:
                    logger.error(f"Supabase messages error for {conv_id}: {msg_resp.text}")
                    continue
                
                messages = msg_resp.json() or []
                
                started_raw = conv.get("created_at") or conv.get("started_at") or datetime.utcnow().isoformat()
                updated_raw = conv.get("updated_at") or conv.get("ended_at") or started_raw
                ended_raw = conv.get("ended_at") or conv.get("updated_at") or updated_raw
                
                conversations.append(
                    ConversationRecord(
                        session_id=str(conv_id),
                        user_id=str(conv.get("user_id", "")),
                        user_email=str(conv.get("user_email", "")),
                        messages=messages,
                        started_at=datetime.fromisoformat(str(started_raw).replace("Z", "")),
                        ended_at=datetime.fromisoformat(str(ended_raw).replace("Z", "")),
                        updated_at=datetime.fromisoformat(str(updated_raw).replace("Z", "")),
                        metadata=conv.get("metadata", {}) if isinstance(conv.get("metadata"), dict) else {},
                    )
                )
            
            return conversations
    
    def _get_existing_memory(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self.neo4j_driver.session(database=self.config.neo4j_database) as session:
            result = session.run(
                """
                MATCH (m:Memory {source_session: $session_id})
                RETURN m.id AS id,
                       m.source_updated_at_ts AS source_updated_at_ts,
                       m.message_hash AS message_hash,
                       m.message_count AS message_count
                """,
                session_id=session_id,
            )
            record = result.single()
            return record.data() if record else None
    
    def _needs_processing(
        self,
        conv: ConversationRecord,
        incoming_hash: str,
        existing: Optional[Dict[str, Any]],
    ) -> bool:
        if not existing:
            return True
        existing_hash = existing.get("message_hash")
        existing_ts = existing.get("source_updated_at_ts") or 0
        incoming_ts = int(conv.updated_at.timestamp())
        if existing_hash == incoming_hash and existing_ts >= incoming_ts:
            return False
        return True
    
    async def _process_conversation(self, conv: ConversationRecord, message_hash: str) -> MemoryNode:
        content = self._serialize_conversation(conv)
        tags = self._extract_tags(conv.messages)
        scope = self._determine_scope(conv.user_id, conv.user_email)
        embedding = await self._generate_embedding(content)
        node_id = f"conversation_{conv.session_id}_{int(conv.updated_at.timestamp())}"
        
        return MemoryNode(
            id=node_id,
            scope=scope,
            content=content,
            embedding=embedding,
            timestamp=conv.updated_at,
            source_session=conv.session_id,
            user_id=conv.user_id,
            tags=tags,
            message_hash=message_hash,
            message_count=len(conv.messages),
            source_updated_at_ts=int(conv.updated_at.timestamp()),
        )
    
    def _compute_message_hash(self, messages: List[Dict[str, str]]) -> str:
        hasher = hashlib.sha256()
        for msg in messages or []:
            role = msg.get("role", "")
            content = msg.get("content", "")
            created = msg.get("created_at", "")
            hasher.update(f"{role}|{created}|{content}".encode("utf-8"))
        return hasher.hexdigest()
    
    def _serialize_conversation(self, conv: ConversationRecord) -> str:
        conversation_parts = []
        for msg in conv.messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            conversation_parts.append(f"[{role}]: {content}")
        return "\n".join(conversation_parts)
    
    def _extract_tags(self, messages: List[Dict[str, str]]) -> List[str]:
        domain_keywords = [
            "project", "objective", "risk", "capability", "budget",
            "progress", "milestone", "kpi", "strategy", "portfolio",
            "department", "team", "process", "system", "performance"
        ]
        text = " ".join(msg.get("content", "").lower() for msg in messages)
        found_tags = [kw for kw in domain_keywords if kw in text]
        return found_tags[:10]
    
    def _determine_scope(self, user_id: str, user_email: str) -> str:
        """
        Determine the memory scope based on user context.
        
        Scope model (v3.4):
        - personal: User's private memories
        - departmental: Shared within department/team
        - ministry: Cross-departmental ministry-level insights
        - secrets: Executive/confidential context (restricted)
        
        Currently defaults to 'personal'. To enhance:
        - Look up user's organizational unit and role from Supabase users table
        - Cross-reference with user profile to assign departmental/ministry scope
        - Only assign 'secrets' for executive users (role='exec')
        """
        # TODO: Enhance with department/role lookup from Supabase users table
        # For now, default to 'personal' scope
        return "personal"
    
    async def _generate_embedding(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.config.embedding_dimensions
        
        def _chunk_text(t: str, max_chars: int = 7000) -> List[str]:
            chunks: List[str] = []
            start = 0
            while start < len(t):
                end = start + max_chars
                chunks.append(t[start:end])
                start = end
            return chunks
        
        chunks = _chunk_text(text)
        embeddings: List[List[float]] = []
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.config.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.config.embedding_model,
                        "input": chunks,
                        "dimensions": self.config.embedding_dimensions,
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"OpenAI error: {response.text}")
                    return [0.0] * self.config.embedding_dimensions
                
                data = response.json().get("data", [])
                for item in data:
                    emb = item.get("embedding")
                    if emb:
                        embeddings.append(emb)
            
            except Exception as e:
                logger.error(f"Embedding generation failed: {e}")
                return [0.0] * self.config.embedding_dimensions
        
        if not embeddings:
            return [0.0] * self.config.embedding_dimensions
        
        summed = [0.0] * self.config.embedding_dimensions
        for emb in embeddings:
            for i, val in enumerate(emb):
                summed[i] += val
        return [v / len(embeddings) for v in summed]
    
    async def _upsert_memory_node(self, memory: MemoryNode) -> None:
        with self.neo4j_driver.session(database=self.config.neo4j_database) as session:
            session.run(
                """
                MERGE (m:Memory {source_session: $source_session})
                SET m.id = $id,
                    m.scope = $scope,
                    m.content = $content,
                    m.embedding = $embedding,
                    m.timestamp = datetime($timestamp),
                    m.source_updated_at_ts = $source_updated_at_ts,
                    m.message_hash = $message_hash,
                    m.message_count = $message_count,
                    m.user_id = $user_id,
                    m.tags = $tags,
                    m.updated_at = datetime(),
                    m.created_at = coalesce(m.created_at, datetime())
                """,
                id=memory.id,
                scope=memory.scope,
                content=memory.content,
                embedding=memory.embedding,
                timestamp=memory.timestamp.isoformat(),
                source_session=memory.source_session,
                source_updated_at_ts=memory.source_updated_at_ts,
                message_hash=memory.message_hash,
                message_count=memory.message_count,
                user_id=memory.user_id,
                tags=memory.tags,
            )
    
    def _verify_memory_creation(self) -> None:
        """Quick verification that Memory nodes were created with valid scopes."""
        try:
            with self.neo4j_driver.session(database=self.config.neo4j_database) as session:
                # Check node count
                result = session.run("MATCH (m:Memory) RETURN count(m) AS c")
                total = result.single().get("c", 0)
                
                # Check scope distribution
                scopes = session.run(
                    "MATCH (m:Memory) RETURN DISTINCT m.scope AS scope, count(m) AS c ORDER BY c DESC"
                ).data()
                
                logger.info(f"Memory verification: {total} total nodes")
                for row in scopes:
                    logger.info(f"  - scope '{row['scope']}': {row['c']} nodes")
                
        except Exception as e:
            logger.error(f"Verification failed: {e}")


async def main():
    config = ETLConfig()
    etl = MemoryBackfillETL(config)
    
    try:
        stats = await etl.run()
        if stats["errors"] > 0:
            sys.exit(1)
    except Exception as e:
        logger.exception(f"Backfill failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
