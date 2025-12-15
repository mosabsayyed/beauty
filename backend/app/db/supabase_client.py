import os
from supabase import create_client, Client
from typing import List, Dict, Any, Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseClient:
    def __init__(self):
        self.client: Client | None = None

    async def connect(self) -> None:
        """Initialize Supabase client using REST API."""
        if not self.client:
            # Create a real supabase client using service role key
            self.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY,
            )
            logger.info(f"✅ Connected to Supabase at {settings.SUPABASE_URL}")

    async def disconnect(self) -> None:
        """Clear the client reference. The underlying client does not require explicit close."""
        self.client = None

    def _ensure_connected(self) -> Client:
        """Return the connected supabase client or raise if not connected."""
        if self.client is None:
            raise RuntimeError("Supabase client not connected. Call connect() first.")
        return self.client

    async def execute_query(self, query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError("Use table-based methods instead of raw SQL with REST API")

    async def execute_mutation(self, query: str, params: Optional[List[Any]] = None) -> str:
        raise NotImplementedError("Use table-based methods instead of raw SQL with REST API")

    async def table_select(self, table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, order: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Select data from a table with optional filtering, ordering, and limiting."""
        if not self.client:
            await self.connect()

        client = self._ensure_connected()
        query = client.table(table).select(columns)

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if order:
            # order dict should be {'column': 'col_name', 'desc': True/False}
            query = query.order(order['column'], desc=order.get('desc', False))
            
        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data or []

    async def table_insert(self, table: str, data: Dict[str, Any] | List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Insert data into a table."""
        if not self.client:
            await self.connect()

        client = self._ensure_connected()
        response = client.table(table).insert(data).execute()
        return response.data or []

    async def table_update(self, table: str, data: Dict[str, Any], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Update data in a table."""
        if not self.client:
            await self.connect()

        client = self._ensure_connected()
        query = client.table(table).update(data)

        for key, value in filters.items():
            query = query.eq(key, value)

        response = query.execute()
        return response.data or []

    async def table_delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Delete data from a table."""
        if not self.client:
            await self.connect()

        client = self._ensure_connected()
        query = client.table(table).delete()

        for key, value in filters.items():
            query = query.eq(key, value)

        response = query.execute()
        return response.data or []

    async def table_count(self, table: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Get count of rows in a table matching filters."""
        if not self.client:
            await self.connect()

        client = self._ensure_connected()
        # Use select with count='exact' and head=True to get just the count
        query = client.table(table).select("*", count="exact", head=True)

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        response = query.execute()
        return response.count or 0

    async def rpc(self, function_name: str, params: Optional[Dict[str, Any]] = None) -> Any:
        if not self.client:
            await self.connect()

        client = self._ensure_connected()
        response = client.rpc(function_name, params or {}).execute()
        return response.data

    async def execute_raw_sql(self, sql: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        if not self.client:
            await self.connect()

        try:
            result = await self.rpc('execute_sql', {'query_text': sql})
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"Error executing raw SQL via RPC: {e}")
            return []


supabase_client = SupabaseClient()
