import pytest
from httpx import AsyncClient

# Mark tests as asyncio
pytestmark = pytest.mark.anyio

async def test_create_guest_and_resolve(client: AsyncClient):
    # Create guest
    resp = await client.post('/api/v1/auth/guest')
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('status') == 'ok'
    token = data.get('access_token')
    user = data.get('user')
    assert token
    assert user and 'id' in user

    # Use token to call users/me
    headers = {'Authorization': f'Bearer {token}'}
    me = await client.get('/api/v1/auth/users/me', headers=headers)
    assert me.status_code == 200
    me_json = me.json()
    assert me_json['id'] == user['id'] or me_json['email'] == user['email']
