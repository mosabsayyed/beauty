from typing import Optional, Dict, Any
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
import hashlib
import asyncio
from app.db.supabase_client import supabase_client, SupabaseClient
from pydantic import BaseModel, EmailStr
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    password: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UserService:
    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client
        self.table_name = "users" # Assuming a 'users' table in Supabase

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str, user_email: str | None = None) -> bool:
        """Verify password with support for legacy hash formats.

        Steps:
        1. Try modern passlib verification (bcrypt).
        2. If UnknownHashError, attempt legacy checks:
           - If stored hash looks like an MD5 hex (32 chars), compare md5(password).
           - As a last resort, compare plaintext equality (only for legacy migration).
        3. If a legacy check succeeds, re-hash the password with current scheme and
           update the record in Supabase to migrate to `password_hash` modern format.

        Returns True if password matches, False otherwise.
        """
        try:
            if pwd_context.verify(plain_password, hashed_password):
                return True
        except UnknownHashError:
            logger.warning("Unknown password hash format detected; attempting legacy fallbacks")

        # Legacy: MD5 hex (insecure) check
        try:
            if isinstance(hashed_password, str) and len(hashed_password) == 32:
                md5 = hashlib.md5(plain_password.encode("utf-8")).hexdigest()
                if md5 == hashed_password:
                    logger.info("Legacy MD5 password matched; migrating hash to bcrypt")
                    # Migrate to new bcrypt hash
                    if user_email:
                        new_hash = self.get_password_hash(plain_password)
                        try:
                            # Schedule async migration update (don't block verification)
                            asyncio.create_task(self.client.table_update(self.table_name, {"password": new_hash}, {"email": user_email}))
                        except Exception as e:
                            logger.error(f"Failed to schedule migration of legacy password for {user_email}: {e}")
                    return True
        except Exception:
            pass

        # Last-resort: plaintext stored password migration (very risky) - only migrate if exact match
        try:
            if plain_password == hashed_password:
                logger.info("Plaintext password matched legacy record; migrating hash to bcrypt")
                if user_email:
                    new_hash = self.get_password_hash(plain_password)
                    try:
                        asyncio.create_task(self.client.table_update(self.table_name, {"password": new_hash}, {"email": user_email}))
                    except Exception as e:
                        logger.error(f"Failed to schedule migration of plaintext password for {user_email}: {e}")
                return True
        except Exception:
            pass

        return False

    async def get_user_by_email(self, email: str) -> Optional[User]:
        await self.client.connect()
        users = await self.client.table_select(self.table_name, "*", {"email": email})
        if users:
            return User(**users[0])
        return None

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        await self.client.connect()
        users = await self.client.table_select(self.table_name, "*", {"id": user_id})
        if users:
            return User(**users[0])
        return None

    async def create_user(self, email: str, password: Optional[str] = None, supabase_id: Optional[str] = None) -> Optional[User]:
        """
        Create a user record in the users table. If supabase_id is provided, store it in the record to link
        local users to Supabase auth users. Password may be None for OAuth-created users.
        """
        await self.client.connect()
        user_data: dict = {
            "email": email,
        }
        if password is not None:
            user_data["password"] = password
        if supabase_id is not None:
            user_data["supabase_id"] = supabase_id
        try:
            new_user = await self.client.table_insert(self.table_name, user_data)
            if new_user:
                return User(**new_user[0])
        except Exception as e:
            logger.error(f"Error creating user in Supabase: {e}")
            return None
        return None

    async def get_user_by_supabase_id(self, supabase_id: str) -> Optional[User]:
        await self.client.connect()
        users = await self.client.table_select(self.table_name, "*", {"supabase_id": supabase_id})
        if users:
            return User(**users[0])
        return None

user_service = UserService(supabase_client)
