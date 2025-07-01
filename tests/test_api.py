from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
import httpx
import asyncio
import pytest
from backend.main import app, log_entries

client = TestClient(app)

def test_root():
    resp = client.get('/')
    assert resp.status_code == 200
    assert resp.json() == {"message": "Welcome to your FastAPI site!"}

def test_create_and_list_logs():
    log_entries.clear()
    payload = {"content": "hello", "tags": ["greeting"]}
    r = client.post('/logs', json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data['content'] == payload['content']
    assert data['tags'] == payload['tags']
    assert 'id' in data and 'timestamp' in data

    r2 = client.get('/logs')
    assert r2.status_code == 200
    logs = r2.json()
    assert len(logs) == 1
    assert logs[0]['content'] == payload['content']


def test_cors_headers():
    resp = client.get('/', headers={'Origin': 'http://localhost:3000'})
    assert resp.status_code == 200
    assert resp.headers.get('access-control-allow-origin') == 'http://localhost:3000'


@pytest.mark.asyncio
async def test_unique_ids_concurrent_posts():
    log_entries.clear()


    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        async def post_entry(i: int) -> int:
            payload = {"content": f"entry{i}", "tags": ["t"]}
            resp = await async_client.post('/logs', json=payload)
            return resp.json()['id']

        ids = await asyncio.gather(*(post_entry(i) for i in range(5)))

    assert ids == sorted(ids)
    assert len(set(ids)) == 5

