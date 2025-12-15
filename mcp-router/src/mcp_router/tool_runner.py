import subprocess
import json
import shlex
import time
from typing import Dict, Any
from .logging_utils import log_event, redact_keys_in_dict, audit_event
import uuid
from .telemetry import inc_script_run_count, observe_script_run_latency


def _truncate(text: str, limit: int = 1024) -> str:
    return text if len(text) <= limit else text[:limit] + '...[truncated]'


def _standard_error_response(code: int, message: str, stderr: str = '') -> Dict[str, Any]:
    return {
        'success': False,
        'status': code,
        'error': message,
        'details': {
            'stderr': _truncate(stderr, 2048)
        }
    }


def run_script(cmd: str, input_json: Dict[str, Any], timeout: int = 30) -> Dict[str, Any]:
    """Runs a script command with input JSON via stdin and returns parsed stdout JSON.
    Returns a standardized JSON object with success/status/data to be compatible with the router's expected contract.
    """
    if isinstance(cmd, str):
        cmd_args = shlex.split(cmd)
    else:
        cmd_args = cmd
    # Log the script run (sanitized); redact sensitive keys in payload
    try:
        safe_input = redact_keys_in_dict(input_json)
    except Exception:
        safe_input = {}
    request_id = str(uuid.uuid4())
    log_event('script.run.start', {'request_id': request_id, 'cmd': cmd, 'input': safe_input})
    start = time.monotonic()
    try:
        p = subprocess.run(cmd_args, input=json.dumps(input_json).encode('utf-8'), capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return _standard_error_response(504, 'script timeout', '')
    duration = time.monotonic() - start
    success = True
    if p.returncode != 0:
        stderr = p.stderr.decode('utf-8', errors='ignore') if p.stderr else ''
        resp = _standard_error_response(500, 'script failed', stderr)
        log_event('script.run.error', {'cmd': cmd, 'stderr': stderr})
        try:
            audit_event(request_id=request_id, tool_name=(cmd if isinstance(cmd, str) else str(cmd[0])), backend='script', caller={}, arguments=input_json.get('args', {}), status='script_failed', duration_ms=duration * 1000.0, success=False)
        except Exception:
            pass
        success = False
        try:
            inc_script_run_count(script=(cmd if isinstance(cmd, str) else str(cmd[0])), success=False)
            observe_script_run_latency(duration, script=(cmd if isinstance(cmd, str) else str(cmd[0])), success=False)
        except Exception:
            pass
        return resp
    raw = p.stdout.decode('utf-8', errors='ignore')
    try:
        parsed = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
            resp = _standard_error_response(502, 'invalid stdout (not JSON)', raw[:2048])
            log_event('script.run.invalid_output', {'cmd': cmd, 'stdout': raw[:200]})
            try:
                audit_event(request_id=request_id, tool_name=(cmd if isinstance(cmd, str) else str(cmd[0])), backend='script', caller={}, arguments=input_json.get('args', {}), status='invalid_output', duration_ms=duration * 1000.0, success=False)
            except Exception:
                pass
            success = False
            try:
                inc_script_run_count(script=(cmd if isinstance(cmd, str) else str(cmd[0])), success=False)
                observe_script_run_latency(duration, script=(cmd if isinstance(cmd, str) else str(cmd[0])), success=False)
            except Exception:
                pass
            return resp
    # Log the successful script run
    log_event('script.run.complete', {'request_id': request_id, 'cmd': cmd, 'result': parsed, 'duration_seconds': duration})
    try:
        inc_script_run_count(script=(cmd if isinstance(cmd, str) else str(cmd[0])), success=True)
        observe_script_run_latency(duration, script=(cmd if isinstance(cmd, str) else str(cmd[0])), success=True)
    except Exception:
        pass
    try:
        audit_event(request_id=request_id, tool_name=(cmd if isinstance(cmd, str) else str(cmd[0])), backend='script', caller={}, arguments=input_json.get('args', {}), status='ok', duration_ms=duration * 1000.0, success=True)
    except Exception:
        pass
    # Normalize response: if the script doesn't follow the success schema, wrap it
    if isinstance(parsed, dict) and 'success' in parsed:
        return parsed
    return {'success': True, 'status': 200, 'data': parsed}
