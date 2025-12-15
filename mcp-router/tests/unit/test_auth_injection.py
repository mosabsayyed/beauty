import os
import pytest
from mcp_router.policy import build_forward_headers


def test_auth_injection_from_backend_env(monkeypatch):
    backend = {'auth_header_key': 'MY_TOKEN_KEY'}
    monkeypatch.setenv('MY_TOKEN_KEY', 'token-abc')
    headers = build_forward_headers({}, backend)
    assert headers.get('Authorization') == 'Bearer token-abc'


def test_service_token_used_if_no_backend(monkeypatch):
    backend = {'auth_header_key': None}
    monkeypatch.setenv('MCP_ROUTER_SERVICE_TOKEN', 'svc-xyz')
    headers = build_forward_headers({}, backend)
    assert headers.get('Authorization') == 'Bearer svc-xyz'


def test_preserves_existing_auth_header():
    backend = {'auth_header_key': 'MY_TOKEN_KEY'}
    headers_in = {'Authorization': 'Bearer existing'}
    headers = build_forward_headers(headers_in, backend)
    assert headers.get('Authorization') == 'Bearer existing'
