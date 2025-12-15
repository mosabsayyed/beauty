#!/usr/bin/env python3
"""
Test script for OpenTelemetry tracing setup.

This script verifies that tracing is properly configured and working.
Run after installing tracing dependencies.

Usage:
    python scripts/test_tracing.py
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

def test_imports():
    """Test that OpenTelemetry modules can be imported."""
    print("🔍 Testing OpenTelemetry imports...")
    
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import ConsoleSpanExporter
        print("✅ OpenTelemetry core modules imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import OpenTelemetry modules: {e}")
        print("\nInstall dependencies:")
        print("  cd backend && pip install -r requirements.txt")
        return False

def test_tracing_module():
    """Test the custom tracing module."""
    print("\n🔍 Testing JOSOOR tracing module...")
    
    try:
        from app.utils.tracing import (
            init_tracing,
            trace_operation,
            trace_llm_call,
            trace_database_query,
            trace_mcp_call,
            add_span_event,
            set_span_attributes
        )
        print("✅ JOSOOR tracing module imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import tracing module: {e}")
        return False

def test_basic_tracing():
    """Test basic tracing functionality."""
    print("\n🔍 Testing basic tracing operations...")
    
    try:
        from app.utils.tracing import init_tracing, trace_operation, add_span_event
        
        # Initialize tracing
        tracer = init_tracing()
        
        if tracer is None:
            print("⚠️  Tracing is disabled (OTEL_ENABLED=false)")
            return True
        
        print("✅ Tracing initialized successfully")
        
        # Test creating a span
        with trace_operation("test_operation", attributes={"test": "value"}) as span:
            add_span_event("test_event", {"event_data": "test"})
            print("✅ Created test span with event")
        
        print("✅ Basic tracing operations work correctly")
        return True
        
    except Exception as e:
        print(f"❌ Tracing test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_configuration():
    """Test tracing configuration."""
    print("\n🔍 Testing tracing configuration...")
    
    otel_enabled = os.getenv("OTEL_ENABLED", "true")
    otel_service_name = os.getenv("OTEL_SERVICE_NAME", "josoor-backend")
    otel_exporter_type = os.getenv("OTEL_EXPORTER_TYPE", "console")
    
    print(f"   OTEL_ENABLED: {otel_enabled}")
    print(f"   OTEL_SERVICE_NAME: {otel_service_name}")
    print(f"   OTEL_EXPORTER_TYPE: {otel_exporter_type}")
    
    if otel_enabled.lower() == "true":
        print("✅ Tracing is enabled")
        
        if otel_exporter_type == "jaeger":
            jaeger_host = os.getenv("JAEGER_AGENT_HOST", "localhost")
            jaeger_port = os.getenv("JAEGER_AGENT_PORT", "6831")
            print(f"   Jaeger: {jaeger_host}:{jaeger_port}")
            print("   💡 Make sure Jaeger is running:")
            print("      docker-compose -f docker-compose.tracing.yml up -d")
        elif otel_exporter_type == "otlp":
            otlp_endpoint = os.getenv("OTEL_EXPORTER_ENDPOINT", "http://localhost:4318")
            print(f"   OTLP Endpoint: {otlp_endpoint}")
        else:
            print("   Using console exporter (traces will print to stdout)")
    else:
        print("⚠️  Tracing is disabled")
    
    return True

def main():
    """Run all tests."""
    print("=" * 70)
    print("JOSOOR OpenTelemetry Tracing Test Suite")
    print("=" * 70)
    
    # Load environment variables
    env_file = backend_path / ".env"
    if env_file.exists():
        print(f"\n📁 Loading environment from: {env_file}")
        from dotenv import load_dotenv
        load_dotenv(env_file)
    else:
        print("\n⚠️  No .env file found, using defaults")
    
    tests = [
        ("Imports", test_imports),
        ("Tracing Module", test_tracing_module),
        ("Configuration", test_configuration),
        ("Basic Operations", test_basic_tracing),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    
    all_passed = True
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {name}")
        if not success:
            all_passed = False
    
    print("\n" + "=" * 70)
    if all_passed:
        print("🎉 All tests passed! Tracing is ready to use.")
        print("\nNext steps:")
        print("1. Start backend: ./sb.sh")
        print("2. Make some requests")
        print("3. View traces in console or Jaeger UI (http://localhost:16686)")
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
        print("\nCommon fixes:")
        print("1. Install dependencies: cd backend && pip install -r requirements.txt")
        print("2. Check .env configuration")
        print("3. If using Jaeger, ensure it's running")
    print("=" * 70)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
