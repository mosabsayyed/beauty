import os
import yaml
import pytest
from mcp_router.router_config_loader import load_router_config, jsonschema


def write_temp_yaml(tmp_path, data):
    p = tmp_path / 'router_config.yaml'
    p.write_text(yaml.safe_dump(data))
    return str(p)


def test_missing_required_keys_raises(tmp_path):
    # Missing both tools and backends
    config_path = write_temp_yaml(tmp_path, {'name': 'invalid'})
    with pytest.raises(ValueError):
        load_router_config(config_path)


def test_schema_validation_failure_when_jsonschema_present(tmp_path):
    # If jsonschema is installed and schema exists, invalid types should raise
    if not jsonschema:
        pytest.skip('jsonschema not installed; skipping schema validation test')
    # Create config with invalid backend.type
    config = {
        'backends': [
            {'name': 'bad-backend', 'type': 'octopus', 'url': 'http://127.0.0.1'}
        ],
        'tools': [
            {'name': 'echo', 'backend': 'bad-backend', 'type': 'mcp-forward'}
        ]
    }
    config_path = write_temp_yaml(tmp_path, config)
    with pytest.raises(ValueError):
        load_router_config(config_path)


def test_valid_example_config_loads():
    # Ensure the provided example config in the repo loads without errors
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    example = os.path.join(base, 'router_config.example.yaml')
    cfg = load_router_config(example)
    assert 'backends' in cfg and 'tools' in cfg
