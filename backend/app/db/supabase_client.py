import os
import json
import logging
from typing import List, Dict, Any, Optional
import httpx
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

    async def _run_http(self, endpoint: str, method: str = "GET", params: Dict[str, str] = None, body: Any = None) -> Any:
        """Use async httpx client instead of blocking subprocess curl."""
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
        
        # Prepare headers
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json"
        }
        
        # If creating/updating, we often want to return representation
        if method in ["POST", "PATCH"]:
            headers["Prefer"] = "return=representation"
        
        # Use async httpx client (reused across calls)
        if not hasattr(self, '_http_client'):
            self._http_client = httpx.AsyncClient(timeout=30.0)
        
        try:
            if method == "GET":
                response = await self._http_client.get(full_url, headers=headers)
            elif method == "POST":
                response = await self._http_client.post(full_url, headers=headers, json=body)
            elif method == "PATCH":
                response = await self._http_client.patch(full_url, headers=headers, json=body)
            elif method == "DELETE":
                response = await self._http_client.delete(full_url, headers=headers)
            else:
                logger.error(f"Unsupported HTTP method: {method}")
                return []
            
            if response.status_code >= 400:
                logger.error(f"HTTP {response.status_code}: {response.text}")
                return []
            
            if not response.text.strip():
                return []
                
            return response.json()
        except Exception as e:
            logger.error(f"Error executing HTTP request: {e}")
            return []
        
        # Run async HTTP request
        try:
            result = await self._run_http(endpoint, method, params, body)
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"Error executing HTTP request: {e}")
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

        return await self._run_http(table, "GET", params)

    async def table_insert(self, table: str, data: Dict[str, Any] | List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return await self._run_http(table, "POST", None, data)

    async def table_update(self, table: str, data: Dict[str, Any], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        params = {}
        if filters:
            for k, v in filters.items():
                params[k] = f"eq.{v}"
        return await self._run_http(table, "PATCH", params, data)
        
    async def table_delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        params = {}
        if filters:
            for k, v in filters.items():
                params[k] = f"eq.{v}"
        return await self._run_http(table, "DELETE", params)

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
