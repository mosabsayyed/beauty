"""
Simple telemetry wrapper providing Prometheus metrics when prometheus_client is available,
and fallback no-op implementations when it's not. This allows tests and CI to run without
requiring the dependency while enabling useful production metrics when present.
"""
from typing import Dict, Any, Optional
import time

PROMETHEUS_AVAILABLE = False
try:
    from prometheus_client import Counter, Histogram, CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except Exception:
    # Prometheus not available in the environment. We'll provide no-op wrappers.
    Counter = None
    Histogram = None
    CollectorRegistry = None
    generate_latest = None
    CONTENT_TYPE_LATEST = 'text/plain; charset=utf-8'


if PROMETHEUS_AVAILABLE:
    registry = CollectorRegistry()

    forward_count = Counter('mcp_router_forward_count', 'Number of forwarded requests', ['backend', 'tool'], registry=registry)
    forward_latency = Histogram('mcp_router_forward_latency_seconds', 'Forward request latency in seconds', ['backend', 'tool'], registry=registry)

    script_run_count = Counter('mcp_router_script_run_count', 'Number of script runs', ['script', 'success'], registry=registry)
    script_run_latency = Histogram('mcp_router_script_run_latency_seconds', 'Script run latency in seconds', ['script', 'success'], registry=registry)

    auth_failure_count = Counter('mcp_router_auth_failure_count', 'Number of auth failures or missing token', ['backend', 'tool'], registry=registry)
else:
    # Define no-op objects
    class _NoopMetric:
        def Inc(self, *a, **k):
            pass

        def inc(self, *a, **k):
            pass

        def observe(self, *a, **k):
            pass

    class _NoopHist(_NoopMetric):
        def time(self, *a, **k):
            class _Ctx:
                def __enter__(self):
                    return None

                def __exit__(self, exc_type, exc, tb):
                    return False

            return _Ctx()

    registry = None
    forward_count = _NoopMetric()
    forward_latency = _NoopHist()
    script_run_count = _NoopMetric()
    script_run_latency = _NoopHist()
    auth_failure_count = _NoopMetric()


# Helper functions

def inc_forward_count(backend: str = 'unknown', tool: str = 'unknown'):
    try:
        forward_count.labels(backend=backend, tool=tool).inc()
    except Exception:
        # No-op
        pass


def observe_forward_latency(duration_seconds: float, backend: str = 'unknown', tool: str = 'unknown'):
    try:
        forward_latency.labels(backend=backend, tool=tool).observe(duration_seconds)
    except Exception:
        pass


def inc_script_run_count(script: str = 'unknown', success: bool = True):
    try:
        script_run_count.labels(script=script, success=str(success)).inc()
    except Exception:
        pass


def observe_script_run_latency(duration_seconds: float, script: str = 'unknown', success: bool = True):
    try:
        script_run_latency.labels(script=script, success=str(success)).observe(duration_seconds)
    except Exception:
        pass


def inc_auth_failure(backend: str = 'unknown', tool: str = 'unknown'):
    try:
        auth_failure_count.labels(backend=backend, tool=tool).inc()
    except Exception:
        pass


def get_metrics_text() -> (bytes, str):
    """Return a tuple (body, content_type) with Prometheus metrics exposition or a fallback text.
    """
    if not PROMETHEUS_AVAILABLE or registry is None:
        return (b"prometheus_client is not available; metrics disabled\n", CONTENT_TYPE_LATEST)
    try:
        body = generate_latest(registry)
        return (body, CONTENT_TYPE_LATEST)
    except Exception:
        return (b"error generating metrics; see logs\n", CONTENT_TYPE_LATEST)


# Utilities

class Timer:
    def __init__(self):
        self.start = time.monotonic()

    def stop(self):
        return time.monotonic() - self.start
