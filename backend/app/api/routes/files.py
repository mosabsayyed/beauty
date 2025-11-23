from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import logging
from app.utils.auth_utils import get_current_user
from app.services.user_service import User # Assuming User model is available

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Models from TypeScript Contract ---

class FileUploadRequest(BaseModel):
    # This model is primarily for documentation, actual file upload uses UploadFile
    conversation_id: Optional[int] = None

class FileUploadResponse(BaseModel):
    success: bool
    file_ids: List[str]
    message: str

# --- File Upload Configuration ---
# For simplicity, storing files locally. In production, use cloud storage (S3, Azure Blob, etc.)
UPLOAD_DIRECTORY = "uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# --- File Upload Route ---

@router.post("/upload", response_model=FileUploadResponse)
async def upload_files(
    files: List[UploadFile] = File(...),
    conversation_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user) # Protect this route
):
    """
    Handle file uploads.
    """
    uploaded_file_ids = []
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided"
        )

    for file in files:
        try:
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(file.filename)[1]
            file_path = os.path.join(UPLOAD_DIRECTORY, f"{file_id}{file_extension}")
            
            with open(file_path, "wb") as buffer:
                while content := await file.read(1024):
                    buffer.write(content)
            
            uploaded_file_ids.append(file_id)
            logger.info(f"User {current_user.id} uploaded file {file.filename} (ID: {file_id}) for conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file {file.filename}"
            )
        finally:
            await file.close()
            
    return FileUploadResponse(
        success=True,
        file_ids=uploaded_file_ids,
        message=f"Successfully uploaded {len(uploaded_file_ids)} files."
    )
