import sys, os; sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
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

