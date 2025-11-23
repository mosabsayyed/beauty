import pytest
from httpx import AsyncClient
import uuid

# Mark all tests in this module as asyncio
pytestmark = pytest.mark.anyio

async def test_register_user(client: AsyncClient):
    # Generate a unique email for each test run
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "password": "testpassword", "name": "Test User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "User registered successfully"
    assert data["user"]["email"] == unique_email

async def test_register_duplicate_user(client: AsyncClient):
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    # First registration should succeed
    await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "password": "testpassword", "name": "Test User"},
    )
    # Second registration with the same email should fail
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "password": "testpassword", "name": "Test User"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

async def test_login_for_access_token(client: AsyncClient):
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    password = "testpassword"
    await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "password": password, "name": "Test User"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_email

async def test_login_incorrect_password(client: AsyncClient):
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email, "password": "testpassword", "name": "Test User"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

async def test_read_users_me(client: AsyncClient):
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
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/auth/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email

async def test_read_users_me_no_token(client: AsyncClient):
    response = await client.get("/api/v1/auth/users/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"
