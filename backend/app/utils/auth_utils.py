from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from app.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.services.user_service import UserService, user_service, User
from datetime import datetime, timedelta, timezone
import requests

# JWT Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Supabase config
SUPABASE_URL = settings.SUPABASE_URL

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
# Optional variant that does not raise a 401 if token is missing (use for guest-friendly endpoints)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), user_service: UserService = Depends(lambda: user_service)) -> User:
    """
    Try to resolve the token in two ways:
    1) Verify as local JWT issued by this backend
    2) If that fails, call Supabase /auth/v1/user endpoint to validate a Supabase access token
    If Supabase validates, map auth.uid() to a user in our local users table (create if missing)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # First try our local JWT verification
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user = await user_service.get_user_by_id(int(user_id))
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        # Attempt Supabase validation
        if not SUPABASE_URL:
            raise credentials_exception
        try:
            headers = {"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_ANON_KEY}
            user_resp = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers, timeout=5)
            if user_resp.status_code != 200:
                raise credentials_exception
            user_json = user_resp.json()
            supa_user_id = user_json.get("id")
            supa_email = user_json.get("email")
            if not supa_user_id:
                raise credentials_exception
            # Try to find local user by supa id or email. If not found, create a local user record linked to supabase id
            local_user = await user_service.get_user_by_supabase_id(supa_user_id) if hasattr(user_service, 'get_user_by_supabase_id') else None
            if not local_user and supa_email:
                local_user = await user_service.get_user_by_email(supa_email)
            if not local_user:
                # create a lightweight local user record mapping to supabase id
                # If Supabase provides a `user_metadata` or `full_name`, persist it when creating local user
                try:
                    user_metadata = user_json.get('user_metadata') or {}
                    full_name = user_metadata.get('full_name') or user_json.get('user_metadata', {}).get('full_name') if isinstance(user_json, dict) else None
                    new_local = await user_service.create_user(email=supa_email, password=None, supabase_id=supa_user_id, full_name=full_name)
                    return new_local
                except Exception:
                    # if creation fails, deny access
                    raise credentials_exception
            return local_user
        except Exception:
            raise credentials_exception


def verify_token(token: str, credentials_exception):
    # keep for backward compatibility but prefer get_current_user
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        # Try Supabase validation as fallback
        if not SUPABASE_URL:
            raise credentials_exception
        headers = {"Authorization": f"Bearer {token}"}
        user_resp = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers, timeout=5)
        if user_resp.status_code != 200:
            raise credentials_exception
        return user_resp.json()


async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme_optional), user_service: UserService = Depends(lambda: user_service)) -> Optional[User]:
    """Similar to get_current_user but returns None if token is invalid or missing.
    This allows endpoints to accept unauthenticated (guest) requests without returning 401.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        user = await user_service.get_user_by_id(int(user_id))
        return user
    except Exception:
        # Try Supabase validation, but if it fails, return None rather than raising
        if not SUPABASE_URL:
            return None
        try:
            headers = {"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_ANON_KEY}
            user_resp = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers, timeout=5)
            if user_resp.status_code != 200:
                return None
            user_json = user_resp.json()
            supa_user_id = user_json.get("id")
            supa_email = user_json.get("email")
            if not supa_user_id:
                return None
            local_user = await user_service.get_user_by_supabase_id(supa_user_id) if hasattr(user_service, 'get_user_by_supabase_id') else None
            if not local_user and supa_email:
                local_user = await user_service.get_user_by_email(supa_email)
            if not local_user:
                try:
                    user_metadata = user_json.get('user_metadata') or {}
                    full_name = user_metadata.get('full_name') or user_json.get('user_metadata', {}).get('full_name') if isinstance(user_json, dict) else None
                    new_local = await user_service.create_user(email=supa_email, password=None, supabase_id=supa_user_id, full_name=full_name)
                    return new_local
                except Exception:
                    return None
            return local_user
        except Exception:
            return None
