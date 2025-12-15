import yaml
import os
from typing import Dict, Any, List, Optional
from .router_config_loader import load_router_config


class ToolRegistry:
    def __init__(self, config_path: str):
        self._config_path = config_path
        self._config = load_router_config(config_path)
        # Create dict keyed by backend/tool name
        self._tools = {t['name']: t for t in self._config.get('tools', [])}
        self._backends = {b['name']: b for b in self._config.get('backends', [])}

    def get_tools(self) -> List[Dict[str, Any]]:
        return [v for v in self._tools.values()]

    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        return self._tools.get(name)

    def get_tool_schema(self, name: str) -> Optional[str]:
        tool = self._tools.get(name)
        if not tool:
            return None
        return tool.get('schema')

    def get_backend(self, name: str) -> Optional[Dict[str, Any]]:
        return self._backends.get(name)
