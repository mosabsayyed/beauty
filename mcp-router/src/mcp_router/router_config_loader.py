import os
import yaml
import json
from typing import Dict, Any
from pathlib import Path

try:
    import jsonschema
except Exception:
    jsonschema = None

def load_router_config(path: str) -> Dict[str, Any]:
    """Load and return router_config from YAML file. Raises on missing or invalid file."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Router config not found: {path}")
    with open(path, 'r') as f:
        config = yaml.safe_load(f)
    # Minimal validation
    if 'tools' not in config or 'backends' not in config:
        raise ValueError('router_config.yaml must define `backends` and `tools`')

    # Optional: validate against schema provided in the repo
    schema_path = Path(__file__).parent / 'schemas' / 'router_config.schema.json'
    if jsonschema and schema_path.exists():
        with open(schema_path, 'r') as sf:
            schema = json.load(sf)
        try:
            jsonschema.validate(config, schema)
        except Exception as e:
            raise ValueError(f'router_config.yaml failed schema validation: {e}')
    return config
