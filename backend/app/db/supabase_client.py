import os
import json
import subprocess
import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.client: Client | None = None
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY

    async def connect(self) -> None:
        """Initialize Supabase client object (lightweight) for property access."""
        if not self.client:
            # We still create the client object so external code accessing .client (like setup.py) works
            try:
                self.client = create_client(self.url, self.key)
                logger.info(f"✅ Created Supabase client object for {self.url}")
            except Exception as e:
                logger.error(f"Failed to create Supabase client object: {e}")

    async def disconnect(self) -> None:
        self.client = None

    async def _run_curl(self, endpoint: str, method: str = "GET", params: Dict[str, str] = None, body: Any = None) -> Any:
        # Use simple endpoint for REST calls
        full_url = f"{self.url}/rest/v1/{endpoint}"
        if endpoint == "rpc":
             # Special case for RPC
             pass # Handled in rpc method usually, but let's support generic
        
        # Build query string
        query_parts = []
        if params:
            for k, v in params.items():
                query_parts.append(f"{k}={v}")
        
        if query_parts:
            full_url += "?" + "&".join(query_parts)
            
        cmd = [
            "curl", "-sS",
            "-X", method,
            "-H", f"apikey: {self.key}",
            "-H", f"Authorization: Bearer {self.key}"
        ]
        
        if body is not None:
            cmd.extend(["-H", "Content-Type: application/json"])
            cmd.extend(["-d", json.dumps(body)])
            # If creating/updating, we often want the return representation
            if method in ["POST", "PATCH"]:
                 cmd.extend(["-H", "Prefer: return=representation"])
            
        cmd.append(full_url)
        
        # Run curl
        # logger.debug(f"Running curl: {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Curl failed: {result.stderr}")
                return []
            
            if not result.stdout.strip():
                return []
                
            return json.loads(result.stdout)
        except Exception as e:
            logger.error(f"Error executing curl: {e}")
            return []

    async def table_select(self, table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, order: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        params = {"select": columns}
        if limit:
            params["limit"] = str(limit)
        
        if filters:
            for k, v in filters.items():
                params[k] = f"eq.{v}"
                
        if order:
            # order dict should be {'column': 'col_name', 'desc': True/False}
            direction = "desc" if order.get("desc") else "asc"
            params["order"] = f"{order['column']}.{direction}"

        return await self._run_curl(table, "GET", params)

    async def table_insert(self, table: str, data: Dict[str, Any] | List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return await self._run_curl(table, "POST", None, data)

    async def table_update(self, table: str, data: Dict[str, Any], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        params = {}
        if filters:
            for k, v in filters.items():
                params[k] = f"eq.{v}"
        return await self._run_curl(table, "PATCH", params, data)
        
    async def table_delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        params = {}
        if filters:
            for k, v in filters.items():
                params[k] = f"eq.{v}"
        return await self._run_curl(table, "DELETE", params)

    async def table_count(self, table: str, filters: Optional[Dict[str, Any]] = None) -> int:
        params = {"select": "*", "count": "exact", "head": "true"}
        if filters:
            for k, v in filters.items():
                params[k] = f"eq.{v}"
        
        # Curl for HEAD request with count
        # This is tricky with _run_curl parsing JSON.
        # We need headers. 
        # For now, let's just do a GET with limit=1 and count=exact and parse the Range header?
        # Or easier: select count from... Supabase doesn't easily return count in JSON body unless we wrap it.
        # Alternative: _run_curl return count if requested?
        
        # HACK: Just run a specialized curl command for count
        full_url = f"{self.url}/rest/v1/{table}"
        query_parts = ["select=*", "count=exact", "limit=1"] # Fetch 1 row but get total count
        if filters:
             for k, v in filters.items():
                query_parts.append(f"{k}=eq.{v}")
        full_url += "?" + "&".join(query_parts)
        
        cmd = [
            "curl", "-sS", "-I", # HEAD request
            "-H", f"apikey: {self.key}",
            "-H", f"Authorization: Bearer {self.key}",
            "-H", "Range-Unit: items",
            full_url
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            # Parse Content-Range: 0-0/6
            for line in result.stdout.splitlines():
                if line.lower().startswith("content-range:"):
                    parts = line.split('/')
                    if len(parts) == 2:
                        return int(parts[1].strip())
            return 0
        except:
            return 0

    async def rpc(self, function_name: str, params: Optional[Dict[str, Any]] = None) -> Any:
        full_url = f"{self.url}/rest/v1/rpc/{function_name}"
        cmd = [
            "curl", "-sS", "-X", "POST",
            "-H", f"apikey: {self.key}",
            "-H", f"Authorization: Bearer {self.key}",
            "-H", "Content-Type: application/json",
            full_url
        ]
        if params:
            cmd.extend(["-d", json.dumps(params)])
            
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if not result.stdout.strip(): return None
            return json.loads(result.stdout)
        except:
             return None

    # Helper for execute_raw_sql which uses rpc under the hood
    async def execute_raw_sql(self, sql: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        result = await self.rpc('execute_sql', {'query_text': sql})
        return result if isinstance(result, list) else []

supabase_client = SupabaseClient()
