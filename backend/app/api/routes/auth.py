from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.db.supabase_client import supabase_client # Assuming user storage in Supabase
from app.services.user_service import UserService, user_service, User # Import UserService and User model
from app.utils import auth_utils # Import auth_utils
from datetime import timedelta
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Models from TypeScript Contract ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict # Simplified for now, will refine with User model

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class RegisterResponse(BaseModel):
    user: dict # Simplified for now, will refine with User model
    message: str

# --- Authentication Routes ---

@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(request: LoginRequest, user_service: UserService = Depends(lambda: user_service)):
    """
    Handle user login and return an access token.
    """
    logger.info(f"Login attempt for user: {request.email}")

    user = await user_service.get_user_by_email(request.email)
    # Pass user.email to verify_password so migration can update the correct record
    if not user or not user_service.verify_password(request.password, user.password, user.email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    user_response_data = {
        "id": user.id,
        "email": user.email,
    }

    return LoginResponse(access_token=access_token, token_type="bearer", user=user_response_data)

@router.post("/register", response_model=RegisterResponse)
async def register_user(request: RegisterRequest, user_service: UserService = Depends(lambda: user_service)):
    """
    Handle user registration.
    """
    logger.info(f"Registration attempt for user: {request.email}")

    # Check if user already exists
    existing_user = await user_service.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash the password
    hashed = user_service.get_password_hash(request.password)

    # Create user in Supabase (store hashed password in `password` column)
    new_user = await user_service.create_user(
        email=request.email,
        password=hashed,
        full_name=request.name
    )

    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Return a simplified user dict for the response
    user_response_data = {
        "id": new_user.id,
        "email": new_user.email,
    }

    return RegisterResponse(user=user_response_data, message="User registered successfully")

@router.get("/users/me", response_model=dict) # Using dict for simplicity, can be a User model
async def read_users_me(current_user: User = Depends(auth_utils.get_current_user)):
    """
    Get current authenticated user.
    """
    return {"email": current_user.email, "id": current_user.id}

@router.post("/sync", response_model=dict)
async def sync_supabase_user(payload: dict):
    """
    Sync a Supabase auth user into the app users table.
    Expects payload to contain {"id": <supabase_id>, "email": "...", "user_metadata": {...} }
    """
    try:
        supabase_id = payload.get('id')
        email = payload.get('email')
        if not supabase_id or not email:
            raise HTTPException(status_code=400, detail='supabase user id and email required')

        # Check if user already exists by supabase_id
        existing = await user_service.get_user_by_supabase_id(supabase_id)
        if existing:
            return {"status": "ok", "message": "already_synced", "user": {"id": existing.id, "email": existing.email}}

        # If not, try by email
        existing_by_email = await user_service.get_user_by_email(email)
        if existing_by_email:
            # update supabase_id for existing record
            await supabase_client.connect()
            await supabase_client.table_update('users', {'supabase_id': supabase_id}, {'email': email})
            return {"status": "ok", "message": "linked_by_email", "user": {"id": existing_by_email.id, "email": existing_by_email.email}}

        # Create new user record without password, but store supabase_id
        new_user = await user_service.create_user(email=email, password=None, supabase_id=supabase_id)
        if not new_user:
            raise HTTPException(status_code=500, detail='failed to create app user')
        return {"status": "ok", "message": "created", "user": {"id": new_user.id, "email": new_user.email}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing supabase user: {e}")
        raise HTTPException(status_code=500, detail='internal error')


@router.post("/guest", response_model=dict)
async def create_guest_user(user_service: UserService = Depends(lambda: user_service)):
    """
    Create a lightweight guest user and return an access token that maps to the app user id.
    The guest account uses an email of the form `guest+{uuid}@guest.local` and `role='guest'`.
    """
    # Per `docs/MULTI-USER_SUPPORT.md` Step 3 (Guest mode): guest interactions
    # must be local-only and must not persist to the backend. The presence of
    # this endpoint contradicts the document's requirement. To avoid accidental
    # persistence during development we disable this endpoint and return a
    # clear status explaining the project policy.
    raise HTTPException(
        status_code=410,
        detail=(
            "Guest persistence via backend is disabled per docs/MULTI-USER_SUPPORT.md. "
            "Frontend must keep guest chat state in localStorage only (see docs)."
        ),
    )


class TransferGuestRequest(BaseModel):
    guest_user_id: int
    guest_token: str


@router.post("/transfer_guest", response_model=dict)
async def transfer_guest_conversations(
    body: TransferGuestRequest,
    current_user: User = Depends(auth_utils.get_current_user)
):
    """
    Transfer conversations from a guest app user to the currently authenticated user.
    Requires both the registered user's auth (current_user) and the guest token to prove ownership.
    """
    # Transfer functionality is intentionally disabled because guest mode is
    # specified to be local-only in `docs/MULTI-USER_SUPPORT.md`. To avoid
    # accidental backend reassignments, we return a 410 explaining the policy.
    raise HTTPException(
        status_code=410,
        detail=(
            "Guest transfer via backend is disabled per docs/MULTI-USER_SUPPORT.md. "
            "To persist or transfer guest history, follow the frontend local-only transfer flow described in the docs."
        ),
    )

# --- Future: Token Refresh, Logout, etc. ---
# @router.post("/refresh")
# async def refresh_token():
#     pass

# @router.post("/logout")
# async def logout():
#     pass
