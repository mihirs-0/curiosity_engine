import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.models.query import Query

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_create_query_success():
    query_data = {
        "raw_query": "Best cafes in Tokyo?",
        "answer_markdown": "# Top Tokyo Cafes\n\n1. Cafe A\n2. Cafe B"
    }
    
    response = client.post("/queries", json=query_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["raw_query"] == query_data["raw_query"]
    assert data["answer_markdown"] == query_data["answer_markdown"]
    assert data["id"] == 1  # First query should have ID 1
    assert data["user_id"] == 1  # Hard-coded user_id
    assert "created_at" in data
    assert data["updated_at"] is None

def test_create_query_missing_fields():
    # Test missing raw_query
    response = client.post("/queries", json={"answer_markdown": "Some answer"})
    assert response.status_code == 422
    
    # Test missing answer_markdown
    response = client.post("/queries", json={"raw_query": "Some query"})
    assert response.status_code == 422

def test_create_query_empty_fields():
    # Test empty raw_query
    response = client.post("/queries", json={
        "raw_query": "",
        "answer_markdown": "Some answer"
    })
    assert response.status_code == 422
    
    # Test empty answer_markdown
    response = client.post("/queries", json={
        "raw_query": "Some query",
        "answer_markdown": ""
    })
    assert response.status_code == 422

def test_query_persistence():
    # Create first query
    query1 = {
        "raw_query": "First query?",
        "answer_markdown": "First answer"
    }
    response1 = client.post("/queries", json=query1)
    assert response1.status_code == 200
    assert response1.json()["id"] == 1
    
    # Create second query
    query2 = {
        "raw_query": "Second query?",
        "answer_markdown": "Second answer"
    }
    response2 = client.post("/queries", json=query2)
    assert response2.status_code == 200
    assert response2.json()["id"] == 2  # ID should increment 