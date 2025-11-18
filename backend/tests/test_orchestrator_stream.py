import types
import json
from unittest.mock import patch, MagicMock

from app.services.orchestrator_zero_shot import OrchestratorZeroShot


class DummyResponse:
    def __init__(self, lines, status_code=200):
        self._lines = lines
        self.status_code = status_code

    def iter_lines(self):
        for l in self._lines:
            yield l

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_stream_query_emits_sse_tokens():
    # Prepare SSE-like lines
    sse_lines = [
        b"data: {\"choices\":[{\"delta\":{\"content\":\"{\\\"memory_process\\\": {\\\"thought_trace\\\": \\\"Thinking...\\\"},\\\"answer\\\": \\\"Partial\\\"}\"}}]}\n\n",
        b"data: {\"choices\":[{\"delta\":{\"content\":\" and more\\\"}}]}\n\n",
        b"data: [DONE]\n\n",
    ]

    dummy = DummyResponse(sse_lines)

    with patch('requests.post') as mock_post:
        mock_post.return_value.__enter__.return_value = dummy

        # Provide environment variables to avoid init error
        import os
        os.environ['GROQ_API_KEY'] = 'test'
        os.environ['MCP_SERVER_URL'] = 'http://localhost'

        orch = OrchestratorZeroShot()
        gen = orch.stream_query('hello', [])
        out = []
        for item in gen:
            out.append(item)

        # Should have emitted token frames as SSE strings
        # The implementation wraps tokens as data: {"token": ...}\n\n
        assert any('"token":' in x or '{"token":' in x for x in out)
        # last item should be data: [DONE]
        assert out[-1].strip().endswith('[DONE]')
