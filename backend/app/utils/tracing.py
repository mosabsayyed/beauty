"""
OpenTelemetry Tracing Configuration for JOSOOR

This module provides comprehensive distributed tracing for:
- API requests and responses
- LLM calls (Groq)
- Database operations (Supabase, Neo4j)
- MCP tool calls
- Service layer operations

Environment Variables:
- OTEL_ENABLED: Enable/disable tracing (default: true)
- OTEL_SERVICE_NAME: Service name (default: josoor-backend)
- OTEL_EXPORTER_TYPE: jaeger, otlp, or console (default: console)
- OTEL_EXPORTER_ENDPOINT: Jaeger/OTLP endpoint (default: http://localhost:4318)
- JAEGER_AGENT_HOST: Jaeger agent host (default: localhost)
- JAEGER_AGENT_PORT: Jaeger agent port (default: 6831)
"""

import os
import logging
from typing import Optional, Dict, Any
from contextlib import contextmanager
from functools import wraps

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter,
)
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Conditional imports for exporters
try:
    from opentelemetry.exporter.jaeger.thrift import JaegerExporter
    JAEGER_AVAILABLE = True
except ImportError:
    JAEGER_AVAILABLE = False

try:
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    OTLP_AVAILABLE = True
except ImportError:
    OTLP_AVAILABLE = False

logger = logging.getLogger(__name__)

# Global tracer instance
_tracer: Optional[trace.Tracer] = None
_tracing_enabled: bool = False


def init_tracing(app=None) -> Optional[trace.Tracer]:
    """
    Initialize OpenTelemetry tracing.
    
    Args:
        app: FastAPI application instance (optional, for auto-instrumentation)
        
    Returns:
        Tracer instance if enabled, None otherwise
    """
    global _tracer, _tracing_enabled
    
    # Check if tracing is enabled
    otel_enabled = os.getenv("OTEL_ENABLED", "true").lower() == "true"
    if not otel_enabled:
        logger.info("OpenTelemetry tracing is disabled (OTEL_ENABLED=false)")
        _tracing_enabled = False
        return None
    
    _tracing_enabled = True
    
    # Service configuration
    service_name = os.getenv("OTEL_SERVICE_NAME", "josoor-backend")
    exporter_type = os.getenv("OTEL_EXPORTER_TYPE", "console").lower()
    
    # Create resource
    resource = Resource(attributes={
        SERVICE_NAME: service_name,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": "1.0.0"
    })
    
    # Create tracer provider
    provider = TracerProvider(resource=resource)
    
    # Configure exporter based on type
    exporter = None
    
    if exporter_type == "jaeger" and JAEGER_AVAILABLE:
        jaeger_host = os.getenv("JAEGER_AGENT_HOST", "localhost")
        jaeger_port = int(os.getenv("JAEGER_AGENT_PORT", "6831"))
        
        exporter = JaegerExporter(
            agent_host_name=jaeger_host,
            agent_port=jaeger_port,
        )
        logger.info(f"✅ Jaeger tracing configured: {jaeger_host}:{jaeger_port}")
        
    elif exporter_type == "otlp" and OTLP_AVAILABLE:
        otlp_endpoint = os.getenv("OTEL_EXPORTER_ENDPOINT", "http://localhost:4318")
        
        exporter = OTLPSpanExporter(
            endpoint=otlp_endpoint,
        )
        logger.info(f"✅ OTLP tracing configured: {otlp_endpoint}")
        
    else:
        # Default to console exporter for development
        exporter = ConsoleSpanExporter()
        logger.info("✅ Console tracing configured (development mode)")
    
    # Add span processor
    provider.add_span_processor(BatchSpanProcessor(exporter))
    
    # Set the global tracer provider
    trace.set_tracer_provider(provider)
    
    # Get tracer
    _tracer = trace.get_tracer(__name__)
    
    # Auto-instrument FastAPI
    if app:
        FastAPIInstrumentor.instrument_app(app)
        logger.info("✅ FastAPI auto-instrumentation enabled")
    
    # Auto-instrument requests library
    RequestsInstrumentor().instrument()
    logger.info("✅ Requests library auto-instrumentation enabled")
    
    logger.info(f"🔍 OpenTelemetry tracing initialized: {service_name}")
    return _tracer


def get_tracer() -> Optional[trace.Tracer]:
    """Get the global tracer instance."""
    return _tracer


def is_tracing_enabled() -> bool:
    """Check if tracing is enabled."""
    return _tracing_enabled


@contextmanager
def trace_operation(
    operation_name: str,
    attributes: Optional[Dict[str, Any]] = None,
    span_kind: trace.SpanKind = trace.SpanKind.INTERNAL
):
    """
    Context manager for tracing an operation.
    
    Usage:
        with trace_operation("database_query", {"table": "users"}):
            # Your operation here
            result = query_database()
    
    Args:
        operation_name: Name of the operation
        attributes: Dictionary of attributes to add to the span
        span_kind: Type of span (INTERNAL, SERVER, CLIENT, PRODUCER, CONSUMER)
    """
    if not _tracing_enabled or not _tracer:
        # No-op if tracing disabled
        yield None
        return
    
    with _tracer.start_as_current_span(
        operation_name,
        kind=span_kind,
        attributes=attributes or {}
    ) as span:
        try:
            yield span
        except Exception as e:
            span.set_attribute("error", True)
            span.set_attribute("error.type", type(e).__name__)
            span.set_attribute("error.message", str(e))
            span.record_exception(e)
            raise


def trace_function(operation_name: Optional[str] = None):
    """
    Decorator for tracing a function.
    
    Usage:
        @trace_function("my_operation")
        def my_function():
            # Your code here
            pass
    
    Args:
        operation_name: Name of the operation (defaults to function name)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            with trace_operation(op_name):
                return func(*args, **kwargs)
        return wrapper
    return decorator


def trace_llm_call(
    model: str,
    prompt: str,
    persona: Optional[str] = None,
    temperature: Optional[float] = None
):
    """
    Create a span for an LLM call.
    
    Usage:
        with trace_llm_call("gpt-4", prompt, persona="noor") as span:
            response = call_llm()
            span.set_attribute("llm.response_tokens", len(response))
    
    Args:
        model: Model name
        prompt: Prompt text (will be truncated in span)
        persona: Persona name (noor/maestro)
        temperature: Temperature setting
    """
    attributes = {
        "llm.model": model,
        "llm.prompt_preview": prompt[:200] if prompt else "",
        "llm.prompt_length": len(prompt) if prompt else 0,
    }
    
    if persona:
        attributes["llm.persona"] = persona
    if temperature is not None:
        attributes["llm.temperature"] = temperature
    
    return trace_operation(
        "llm.call",
        attributes=attributes,
        span_kind=trace.SpanKind.CLIENT
    )


def trace_database_query(
    database: str,
    operation: str,
    query: Optional[str] = None,
    table: Optional[str] = None
):
    """
    Create a span for a database query.
    
    Usage:
        with trace_database_query("neo4j", "read", query=cypher) as span:
            result = execute_query()
            span.set_attribute("db.result_count", len(result))
    
    Args:
        database: Database name (neo4j, supabase)
        operation: Operation type (read, write, delete)
        query: Query string (will be truncated)
        table: Table/collection name
    """
    attributes = {
        "db.system": database,
        "db.operation": operation,
    }
    
    if query:
        attributes["db.statement"] = query[:500]
    if table:
        attributes["db.table"] = table
    
    return trace_operation(
        f"db.{database}.{operation}",
        attributes=attributes,
        span_kind=trace.SpanKind.CLIENT
    )


def trace_mcp_call(
    tool_name: str,
    router: str,
    persona: str,
    arguments: Optional[Dict[str, Any]] = None
):
    """
    Create a span for an MCP tool call.
    
    Usage:
        with trace_mcp_call("read_neo4j_cypher", "noor", "noor") as span:
            result = call_mcp_tool()
            span.set_attribute("mcp.success", True)
    
    Args:
        tool_name: MCP tool name
        router: Router name (noor/maestro)
        persona: Persona name
        arguments: Tool arguments (will be sanitized)
    """
    attributes = {
        "mcp.tool": tool_name,
        "mcp.router": router,
        "mcp.persona": persona,
    }
    
    if arguments:
        # Sanitize arguments (don't log sensitive data)
        attributes["mcp.arguments_count"] = len(arguments)
    
    return trace_operation(
        f"mcp.{tool_name}",
        attributes=attributes,
        span_kind=trace.SpanKind.CLIENT
    )


def add_span_event(event_name: str, attributes: Optional[Dict[str, Any]] = None):
    """
    Add an event to the current span.
    
    Args:
        event_name: Event name
        attributes: Event attributes
    """
    if not _tracing_enabled:
        return
    
    current_span = trace.get_current_span()
    if current_span:
        current_span.add_event(event_name, attributes=attributes or {})


def set_span_attributes(attributes: Dict[str, Any]):
    """
    Set attributes on the current span.
    
    Args:
        attributes: Dictionary of attributes to set
    """
    if not _tracing_enabled:
        return
    
    current_span = trace.get_current_span()
    if current_span:
        for key, value in attributes.items():
            current_span.set_attribute(key, value)


def set_span_error(error: Exception):
    """
    Mark the current span as error and record exception.
    
    Args:
        error: Exception that occurred
    """
    if not _tracing_enabled:
        return
    
    current_span = trace.get_current_span()
    if current_span:
        current_span.set_attribute("error", True)
        current_span.set_attribute("error.type", type(error).__name__)
        current_span.set_attribute("error.message", str(error))
        current_span.record_exception(error)
