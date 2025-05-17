import pytest
from fastapi.testclient import TestClient

def test_create_query(client):
    query_data = {
        "raw_query": "Test query",
        "answer_markdown": "Test answer"
    }
    response = client.post("/queries", json=query_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["sonar_status"] in ["pending", "error", "completed"]

def test_get_queries(client):
    # First create a query
    query_data = {
        "raw_query": "Test query",
        "answer_markdown": "Test answer"
    }
    client.post("/queries", json=query_data)
    
    # Then get all queries
    response = client.get("/queries")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "sonar_status" in data[0]

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json() 