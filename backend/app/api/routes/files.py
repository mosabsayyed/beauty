from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import logging
import asyncio
import re
import json
from pathlib import Path
from datetime import datetime, timedelta
from app.utils.auth_utils import get_current_user
from app.services.user_service import User

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Configuration ---
UPLOAD_DIRECTORY = "uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# Public sector file type policy
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.csv', '.txt', '.md', '.png', '.jpg', '.jpeg'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
}

# Size limits per file type (in bytes)
MAX_FILE_SIZES = {
    'image/png': 10 * 1024 * 1024,      # 10 MB
    'image/jpeg': 10 * 1024 * 1024,     # 10 MB
    'application/pdf': 50 * 1024 * 1024, # 50 MB
    'text/plain': 5 * 1024 * 1024,      # 5 MB
    'text/markdown': 5 * 1024 * 1024,   # 5 MB
    'text/csv': 20 * 1024 * 1024,       # 20 MB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25 * 1024 * 1024,  # 25 MB
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 25 * 1024 * 1024,  # 25 MB
}

# Temporary file storage (in production: use Redis)
temp_files: Dict[str, Dict[str, Any]] = {}

# Load existing temp_files from JSON on startup
def _load_temp_files():
    """Load temp_files from persistent JSON file on startup"""
    global temp_files
    temp_files_path = Path(UPLOAD_DIRECTORY) / ".temp_files.json"
    try:
        if temp_files_path.exists():
            with open(temp_files_path, 'r') as f:
                loaded_files = json.load(f)
                # Convert ISO datetime strings back to datetime objects
                for file_id, file_info in loaded_files.items():
                    if isinstance(file_info.get('created_at'), str):
                        file_info['created_at'] = datetime.fromisoformat(file_info['created_at'])
                    if isinstance(file_info.get('expires_at'), str):
                        file_info['expires_at'] = datetime.fromisoformat(file_info['expires_at'])
                temp_files.update(loaded_files)
                logger.info(f"Loaded {len(loaded_files)} temp files from persistent storage")
    except Exception as e:
        logger.warning(f"Failed to load temp_files from JSON: {e}")

# Initialize temp_files on module load
_load_temp_files()

# --- Pydantic Models ---

class FileUploadRequest(BaseModel):
    conversation_id: Optional[int] = None

class FileInfo(BaseModel):
    file_id: str
    filename: str
    size: int
    mime_type: str

class FileUploadResponse(BaseModel):
    success: bool
    files: List[FileInfo]
    message: str
    ttl_hours: int

class FileInfoResponse(BaseModel):
    file_id: str
    filename: str
    mime_type: str
    size: int
    created_at: datetime
    expires_at: datetime
    time_remaining_seconds: float

# --- File Validator ---

class FileValidator:
    """Multi-layer file validation for public sector security"""
    
    @staticmethod
    def validate_extension(filename: str) -> bool:
        """Layer 1: Extension whitelist"""
        ext = os.path.splitext(filename)[1].lower()
        return ext in ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_mime_type(content_type: str) -> bool:
        """Layer 2: MIME type verification"""
        return content_type in ALLOWED_MIME_TYPES
    
    @staticmethod
    def validate_size(file_size: int, mime_type: str) -> bool:
        """Layer 3: Size validation"""
        max_size = MAX_FILE_SIZES.get(mime_type, 5 * 1024 * 1024)
        return file_size <= max_size
    
    @staticmethod
    def get_max_size_mb(mime_type: str) -> float:
        """Get max size in MB for error messages"""
        max_bytes = MAX_FILE_SIZES.get(mime_type, 5 * 1024 * 1024)
        return max_bytes / (1024 * 1024)
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Layer 4: Sanitize filename to prevent security issues"""
        # Remove path traversal attempts
        filename = os.path.basename(filename)
        # Remove special characters except . - _
        filename = re.sub(r'[^\w\s.-]', '', filename)
        # Limit length
        return filename[:255]
    
    @staticmethod
    def validate_magic_number(file_path: str, mime_type: str) -> bool:
        """Layer 5: Verify file signature (optional - requires python-magic)"""
        try:
            import magic
            mime = magic.Magic(mime=True)
            actual_type = mime.from_file(file_path)
            return actual_type in ALLOWED_MIME_TYPES
        except ImportError:
            # python-magic not installed, skip this validation
            logger.warning("python-magic not installed, skipping magic number validation")
            return True
        except Exception as e:
            logger.error(f"Magic number validation failed: {e}")
            return False

# --- Cleanup Task ---

async def cleanup_file_after_ttl(file_id: str, ttl_seconds: int = 3600):
    """Delete file after TTL expires (default: 1 hour)"""
    await asyncio.sleep(ttl_seconds)
    
    if file_id in temp_files:
        file_info = temp_files[file_id]
        file_path = file_info["path"]
        
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(
                    f"Auto-deleted temporary file: {file_id} "
                    f"({file_info['original_filename']}) "
                    f"for user {file_info['user_id']}"
                )
        except Exception as e:
            logger.error(f"Failed to delete temporary file {file_id}: {e}")
        finally:
            del temp_files[file_id]

# --- Routes ---

@router.post("/upload", response_model=FileUploadResponse)
async def upload_files(
    files: List[UploadFile] = File(...),
    conversation_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Secure file upload with multi-layer validation.
    Files are temporarily stored for 1 hour then auto-deleted.
    
    Allowed file types (public sector policy):
    - Documents: PDF, DOCX, XLSX, CSV, TXT, MD
    - Images: PNG, JPG
    
    Security features:
    - Extension whitelist
    - MIME type verification
    - Size limits (10MB images, 50MB PDFs, etc.)
    - Filename sanitization
    - Magic number verification (if python-magic installed)
    - Temporary storage with auto-cleanup
    """
    uploaded_files = []
    validator = FileValidator()
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided"
        )
    
    # Limit number of files per request
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files per upload"
        )
    
    for file in files:
        try:
            # Layer 1: Extension validation
            if not validator.validate_extension(file.filename):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"File type not allowed: {file.filename}. "
                        f"Allowed types: PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG"
                    )
                )
            
            # Layer 2: MIME type validation
            if not validator.validate_mime_type(file.content_type):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid MIME type: {file.content_type}"
                )
            
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Layer 3: Size validation
            if not validator.validate_size(file_size, file.content_type):
                max_mb = validator.get_max_size_mb(file.content_type)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Maximum size: {max_mb:.0f}MB"
                )
            
            # Layer 4: Sanitize filename
            safe_filename = validator.sanitize_filename(file.filename)
            file_extension = os.path.splitext(safe_filename)[1]
            
            # Generate secure file ID and path
            file_id = str(uuid.uuid4())
            file_path = os.path.join(UPLOAD_DIRECTORY, f"{file_id}{file_extension}")
            
            # Save to disk
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            # Layer 5: Magic number validation (optional)
            if not validator.validate_magic_number(file_path, file.content_type):
                os.remove(file_path)  # Clean up
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File signature doesn't match extension: {file.filename}"
                )
            
            # Store metadata with TTL
            temp_files[file_id] = {
                "path": file_path,
                "original_filename": safe_filename,
                "mime_type": file.content_type,
                "size": file_size,
                "user_id": current_user.id,
                "conversation_id": conversation_id,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=1)
            }
            
            # Persist to JSON file for MCP tool access
            temp_files_path = Path(UPLOAD_DIRECTORY) / ".temp_files.json"
            try:
                serializable_files = {}
                for fid, finfo in temp_files.items():
                    serializable_files[fid] = {
                        **finfo,
                        "created_at": finfo["created_at"].isoformat() if isinstance(finfo["created_at"], datetime) else finfo["created_at"],
                        "expires_at": finfo["expires_at"].isoformat() if isinstance(finfo["expires_at"], datetime) else finfo["expires_at"]
                    }
                with open(temp_files_path, 'w') as f:
                    json.dump(serializable_files, f, indent=2)
            except Exception as e:
                logger.error(f"Failed to persist temp_files to JSON: {e}")
            
            # Schedule cleanup after 1 hour
            asyncio.create_task(cleanup_file_after_ttl(file_id, ttl_seconds=3600))
            
            uploaded_files.append(FileInfo(
                file_id=file_id,
                filename=safe_filename,
                size=file_size,
                mime_type=file.content_type
            ))
            
            logger.info(
                f"User {current_user.id} uploaded {safe_filename} "
                f"(ID: {file_id}, Size: {file_size} bytes, Type: {file.content_type}) "
                f"for conversation {conversation_id}"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {file.filename}"
            )
        finally:
            await file.close()
    
    return FileUploadResponse(
        success=True,
        files=uploaded_files,
        message=f"Successfully uploaded {len(uploaded_files)} file(s). Files will be deleted after 1 hour.",
        ttl_hours=1
    )

@router.get("/file/{file_id}", response_model=FileInfoResponse)
async def get_file_info(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get information about an uploaded file"""
    if file_id not in temp_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or expired"
        )
    
    file_info = temp_files[file_id]
    
    # Verify user owns this file
    if file_info["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    time_remaining = (file_info["expires_at"] - datetime.utcnow()).total_seconds()
    
    return FileInfoResponse(
        file_id=file_id,
        filename=file_info["original_filename"],
        mime_type=file_info["mime_type"],
        size=file_info["size"],
        created_at=file_info["created_at"],
        expires_at=file_info["expires_at"],
        time_remaining_seconds=max(0, time_remaining)
    )

@router.delete("/file/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Manually delete an uploaded file before TTL expires"""
    if file_id not in temp_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or already deleted"
        )
    
    file_info = temp_files[file_id]
    
    # Verify user owns this file
    if file_info["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete file from disk
    try:
        if os.path.exists(file_info["path"]):
            os.remove(file_info["path"])
        del temp_files[file_id]
        
        logger.info(f"User {current_user.id} manually deleted file {file_id}")
        
        return {
            "success": True,
            "message": "File deleted successfully"
        }
    except Exception as e:
        logger.error(f"Failed to delete file {file_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )
