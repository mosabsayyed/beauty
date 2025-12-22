#!/usr/bin/env python3
"""
Nightly Memory ETL - Noor Cognitive Digital Twin v3.0

This script processes conversation logs and persists them as Memory nodes
in Neo4j. This is the ONLY way memory is written - Noor has READ-ONLY access.

Architecture:
- Source: PostgreSQL (conversation_logs table)
- Target: Neo4j (Memory nodes in memory_semantic_index)
- Schedule: Run nightly via cron or systemd timer

Memory Node Schema:
    Memory {
        id: str,           # conversation_{session_id}_{timestamp}
        scope: str,        # personal | departmental | ministry | secrets (derived from user context)
        content: str,      # The full conversation (no truncation)
        embedding: [float],# 1536-dim vector for semantic search
        timestamp: datetime,
        source_session: str,
        user_id: str,
        tags: [str]        # Extracted topics/entities
    }

Per Bible Section 1.2: Noor NEVER writes to memory directly.
Memory persistence happens here, in the backend batch job.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import hashlib

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
import httpx
from neo4j import GraphDatabase, AsyncGraphDatabase

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/mosab/projects/chatmodule/backend/logs/memory_etl.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# =============================================================================
# Configuration
# =============================================================================

@dataclass
class ETLConfig:
    """Configuration for the Memory ETL process."""
    
    # PostgreSQL (via Supabase)
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    # Prefer service role key; fall back to SUPABASE_SERVICE_KEY if provided
    supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_SERVICE_KEY", ""))
    
    # Neo4j
    neo4j_uri: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user: str = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "")
    neo4j_database: str = os.getenv("NEO4J_DATABASE", "memory_semantic_index")
    
    # OpenAI for embeddings
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    
    # ETL Settings
    batch_size: int = 100
    lookback_hours: int = 24  # Process conversations from last 24 hours
    min_conversation_length: int = 3  # Minimum turns to process


# =============================================================================
# Data Models
# =============================================================================

@dataclass 
class ConversationRecord:
    """A conversation record from PostgreSQL."""
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
    """A Memory node to insert into Neo4j."""
    id: str
    scope: str  # personal | departmental | global
    content: str
    embedding: List[float]
    timestamp: datetime
    source_session: str
    user_id: str
    tags: List[str]
    message_hash: str
    message_count: int
    source_updated_at_ts: int


# =============================================================================
# ETL Logic
# =============================================================================

class MemoryETL:
    """
    ETL pipeline for processing conversations into Memory nodes.
    """
    
    def __init__(self, config: ETLConfig):
        self.config = config
        self.neo4j_driver = None
        self._validate_config()
    
    def _validate_config(self) -> None:
        """Validate required configuration."""
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
        """
        Execute the full ETL pipeline.
        
        Returns:
            Stats dict with processed, created, skipped counts.
        """
        stats = {"processed": 0, "created": 0, "skipped": 0, "errors": 0}
        
        logger.info("=" * 60)
        logger.info("Starting Nightly Memory ETL")
        logger.info(f"Lookback: {self.config.lookback_hours} hours")
        logger.info("=" * 60)
        
        try:
            # 1. Connect to Neo4j
            self.neo4j_driver = GraphDatabase.driver(
                self.config.neo4j_uri,
                auth=(self.config.neo4j_user, self.config.neo4j_password)
            )
            
            # 2. Fetch conversations from PostgreSQL
            conversations = await self._fetch_conversations()
            logger.info(f"Fetched {len(conversations)} conversations to process")
            
            # 3. Process each conversation
            for conv in conversations:
                try:
                    stats["processed"] += 1
                    
                    # Skip short conversations
                    if len(conv.messages) < self.config.min_conversation_length:
                        stats["skipped"] += 1
                        continue
                    
                    # Decide if this conversation needs processing
                    message_hash = self._compute_message_hash(conv.messages)
                    existing = self._get_existing_memory(conv.session_id)
                    needs_processing = self._needs_processing(conv, message_hash, existing)
                    if not needs_processing:
                        stats["skipped"] += 1
                        existing_ts = (existing or {}).get("source_updated_at_ts")
                        logger.info(
                            "Skipping unchanged conversation %s (existing_ts=%s, incoming_ts=%s)",
                            conv.session_id,
                            existing_ts,
                            int(conv.updated_at.timestamp()),
                        )
                        continue
                    
                    # Generate memory node
                    memory = await self._process_conversation(conv, message_hash)
                    
                    # Upsert into Neo4j
                    await self._upsert_memory_node(memory)
                    stats["created"] += 1
                    
                    logger.info(f"Created memory node: {memory.id}")
                    
                except Exception as e:
                    stats["errors"] += 1
                    logger.error(f"Error processing {conv.session_id}: {e}")
            
            logger.info("=" * 60)
            logger.info(f"ETL Complete: {stats}")
            logger.info("=" * 60)
            
            # Verify Memory nodes were created with valid scopes
            if stats["created"] > 0:
                self._verify_memory_creation()
            
        finally:
            if self.neo4j_driver:
                self.neo4j_driver.close()
        
        return stats
    
    async def _fetch_conversations(self) -> List[ConversationRecord]:
        """
        Fetch conversations and messages from Supabase tables.
        - conversations: filter by updated_at within lookback window
        - messages: fetched per conversation_id, ordered by created_at asc
        """
        cutoff = datetime.utcnow() - timedelta(hours=self.config.lookback_hours)

        async with httpx.AsyncClient() as client:
            conv_resp = await client.get(
                f"{self.config.supabase_url}/rest/v1/conversations",
                headers={
                    "apikey": self.config.supabase_key,
                    "Authorization": f"Bearer {self.config.supabase_key}",
                },
                params={
                    "select": "*",
                    "updated_at": f"gte.{cutoff.isoformat()}",
                    "order": "updated_at.desc",
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

                # Fetch messages for this conversation
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
                    logger.error(f"Supabase messages error for conversation {conv_id}: {msg_resp.text}")
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
        """Fetch existing memory metadata for a conversation if present."""
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
        """Decide whether to process based on hash and update timestamp."""
        if not existing:
            return True

        existing_hash = existing.get("message_hash")
        existing_ts = existing.get("source_updated_at_ts") or 0
        incoming_ts = int(conv.updated_at.timestamp())

        # If both hash and updated_at are unchanged, skip reprocessing
        if existing_hash == incoming_hash and existing_ts >= incoming_ts:
            return False

        return True
    
    async def _process_conversation(self, conv: ConversationRecord, message_hash: str) -> MemoryNode:
        """
        Process a conversation into a Memory node.
        
        Steps:
        1. Serialize full conversation content (no summarization)
        2. Extract topics/tags
        3. Determine scope based on user
        4. Generate embedding
        """
        # 1. Serialize full conversation content
        content = self._serialize_conversation(conv)
        
        # 2. Extract tags (simple keyword extraction)
        tags = self._extract_tags(conv.messages)
        
        # 3. Determine scope
        scope = self._determine_scope(conv.user_id, conv.user_email)
        
        # 4. Generate embedding
        embedding = await self._generate_embedding(content)
        
        # 5. Create node ID
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
        """Compute a stable hash for the message list to detect changes."""
        hasher = hashlib.sha256()
        for msg in messages or []:
            role = msg.get("role", "")
            content = msg.get("content", "")
            created = msg.get("created_at", "")
            hasher.update(f"{role}|{created}|{content}".encode("utf-8"))
        return hasher.hexdigest()
    
    def _serialize_conversation(self, conv: ConversationRecord) -> str:
        """
        Serialize the full conversation exactly as seen (no summarization).

        Each message is stored with its role and full content.
        """
        conversation_parts = []
        
        for msg in conv.messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")  # Keep full content, no truncation
            conversation_parts.append(f"[{role}]: {content}")
        
        full_conversation = "\n".join(conversation_parts)

        # Keep full text; downstream embedding step handles chunking safely
        return full_conversation
    
    def _extract_tags(self, messages: List[Dict[str, str]]) -> List[str]:
        """
        Extract topic tags from conversation messages.
        
        This is a simple keyword extraction. In production,
        you might use NER or topic modeling.
        """
        # Keywords related to Digital Twin domain
        domain_keywords = [
            "project", "objective", "risk", "capability", "budget",
            "progress", "milestone", "kpi", "strategy", "portfolio",
            "department", "team", "process", "system", "performance"
        ]
        
        text = " ".join(msg.get("content", "").lower() for msg in messages)
        
        found_tags = []
        for keyword in domain_keywords:
            if keyword in text:
                found_tags.append(keyword)
        
        return found_tags[:10]  # Limit to 10 tags
    
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
        """Generate embedding vector using chunked averaging to avoid truncation loss."""

        if not text:
            return [0.0] * self.config.embedding_dimensions

        def _chunk_text(t: str, max_chars: int = 7000) -> List[str]:
            """Split text into manageable chunks for the embedding API."""
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

        # Average chunk embeddings to represent the full conversation
        summed = [0.0] * self.config.embedding_dimensions
        for emb in embeddings:
            for i, val in enumerate(emb):
                summed[i] += val
        return [v / len(embeddings) for v in summed]
    
    async def _upsert_memory_node(self, memory: MemoryNode) -> None:
        """Create or update a Memory node for the conversation."""
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


# =============================================================================
# Main Entry Point
# =============================================================================

async def main():
    """Main entry point for the nightly ETL job."""
    config = ETLConfig()
    etl = MemoryETL(config)
    
    try:
        stats = await etl.run()
        
        # Exit with error code if there were errors
        if stats["errors"] > 0:
            sys.exit(1)
        
    except Exception as e:
        logger.exception(f"ETL failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
