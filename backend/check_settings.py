import os
import sys
from pathlib import Path

# Add backend to sys.path
sys.path.append(str(Path(__file__).parent))

from app.config import settings

def redact(val):
    if not val: return "None"
    if len(val) < 4: return "***"
    return val[:2] + "..." + val[-2:]

print(f"PGHOST: {redact(settings.PGHOST)}")
print(f"PGPORT: {settings.PGPORT}")
print(f"PGUSER: {redact(settings.PGUSER)}")
print(f"PGDATABASE: {redact(settings.PGDATABASE)}")
print(f"PGPASSWORD: {redact(settings.PGPASSWORD)}")
print(f"SUPABASE_URL: {redact(settings.SUPABASE_URL)}")
print(f"SUPABASE_SERVICE_ROLE_KEY: {redact(settings.SUPABASE_SERVICE_ROLE_KEY)}")
