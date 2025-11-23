import pytest
from httpx import AsyncClient
import uuid
import io

# Mark all tests in this module as asyncio
pytestmark = pytest.mark.anyio

async def get_auth_token(client: AsyncClient) -> str:
    """Helper function to register and login a user to get a token."""
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    password = "testpassword"
    await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "password": password, "name": "Test User"},
    )
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": password},
    )
    return login_response.json()["access_token"]

async def test_upload_file(client: AsyncClient):
    token = await get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a dummy file in memory
    file_content = b"This is a test file."
    dummy_file = io.BytesIO(file_content)
    dummy_file.name = "test.txt"
    
    files = {"files": (dummy_file.name, dummy_file, "text/plain")}
    
    response = await client.post("/api/v1/files/upload", headers=headers, files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["file_ids"]) == 1
    assert isinstance(data["file_ids"][0], str)
    assert data["message"] == "Successfully uploaded 1 files."

async def test_upload_multiple_files(client: AsyncClient):
    token = await get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    files_to_upload = [
        ("files", ("test1.txt", b"file 1 content", "text/plain")),
        ("files", ("test2.txt", b"file 2 content", "text/plain")),
    ]
    
    response = await client.post("/api/v1/files/upload", headers=headers, files=files_to_upload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["file_ids"]) == 2
    assert data["message"] == "Successfully uploaded 2 files."

async def test_upload_file_no_token(client: AsyncClient):
    file_content = b"This is a test file."
    dummy_file = io.BytesIO(file_content)
    dummy_file.name = "test.txt"
    
    files = {"files": (dummy_file.name, dummy_file, "text/plain")}
    
    response = await client.post("/api/v1/files/upload", files=files)
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

async def test_upload_no_files(client: AsyncClient):
    token = await get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.post("/api/v1/files/upload", headers=headers)
    
    assert response.status_code == 422 # FastAPI's validation error for missing file
