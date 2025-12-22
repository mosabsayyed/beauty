"""
Configuration Module for JOSOOR
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    """Application settings"""
    
    # LLM Provider Configuration
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "replit")  # replit, openai, or anthropic
    
    # Database Configuration (PostgreSQL via Supabase)
    DATABASE_URL = os.getenv("DATABASE_URL")
    PGUSER = os.getenv("PGUSER")
    PGPASSWORD = os.getenv("PGPASSWORD")
    PGHOST = os.getenv("PGHOST")
    PGPORT = os.getenv("PGPORT")
    PGDATABASE = os.getenv("PGDATABASE")
    
    # Supabase REST API Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Neo4j Configuration
    NEO4J_URI = os.getenv("NEO4J_URI", "")
    NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
    NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv("AI_INTEGRATIONS_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL = os.getenv("AI_INTEGRATIONS_OPENAI_BASE_URL") or os.getenv("OPENAI_BASE_URL")
    EMBEDDING_MODEL = "text-embedding-3-small"
    
    # JWT Authentication Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key") # CHANGE THIS IN PRODUCTION!
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    # Current year for filters
    CURRENT_YEAR = 2025
    
    # Debug mode
    DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
    DEBUG_PROMPTS = os.getenv("DEBUG_PROMPTS", "false").lower() == "true"

    # Groq / LLM Model Selection
    GROQ_MODEL_PRIMARY = os.getenv("GROQ_MODEL_PRIMARY", "openai/gpt-oss-20b")
    GROQ_MODEL_FALLBACK = os.getenv("GROQ_MODEL_FALLBACK", "llama-3.3-70b-versatile")
    GROQ_MODEL_ALT = os.getenv("GROQ_MODEL_ALT", "openai/gpt-oss-120b")

    # Local LLM (optional, for offline/dev testing via Ollama, LM Studio, or compatible APIs)
    LOCAL_LLM_ENABLED = os.getenv("LOCAL_LLM_ENABLED", "false").lower() == "true"
    LOCAL_LLM_MODEL = os.getenv("LOCAL_LLM_MODEL", "llama3.1:8b")
    LOCAL_LLM_BASE_URL = os.getenv("LOCAL_LLM_BASE_URL") or os.getenv("OLLAMA_URL") or "http://localhost:11434"
    LOCAL_LLM_TIMEOUT = int(os.getenv("LOCAL_LLM_TIMEOUT", "60"))
    LOCAL_LLM_USE_RESPONSES_API = os.getenv("LOCAL_LLM_USE_RESPONSES_API", "false").lower() == "true"

settings = Settings()
