from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import httpx
import os
from .models.query import Query
from .schemas.query import QueryCreate, QueryResponse
from .db.database import engine, get_db
from typing import List

# Create database tables
Query.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "chrome-extension://*"],  # Frontend dev server and Chrome extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def call_sonar_api(query: str) -> dict:
    """Call the Perplexity Sonar API with the given query."""
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Perplexity API key not configured")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.perplexity.ai/sonar",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"query": query},
                timeout=10.0  # 10 second timeout
            )
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            return {"error": "Sonar API request timed out"}
        except httpx.HTTPError as e:
            return {"error": f"Sonar API request failed: {str(e)}"}

@app.get("/")
def read_root():
    return {"message": "Curiosity Engine Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/queries", response_model=QueryResponse)
async def create_query(query: QueryCreate, db: Session = Depends(get_db)):
    try:
        # Create the query record first
        db_query = Query(
            user_id=1,  # Hard-coded demo user
            raw_query=query.raw_query,
            answer_markdown=query.answer_markdown,
            sonar_status='pending'
        )
        db.add(db_query)
        db.commit()
        db.refresh(db_query)
        
        # Call Sonar API asynchronously
        try:
            sonar_data = await call_sonar_api(query.raw_query)
            if "error" in sonar_data:
                db_query.sonar_status = 'error'
                db_query.sonar_data = sonar_data
            else:
                db_query.sonar_status = 'completed'
                db_query.sonar_data = sonar_data
            db.commit()
            db.refresh(db_query)
        except Exception as e:
            db_query.sonar_status = 'error'
            db_query.sonar_data = {"error": str(e)}
            db.commit()
            db.refresh(db_query)
        
        return {
            "id": db_query.id,
            "sonar_data": db_query.sonar_data,
            "sonar_status": db_query.sonar_status
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/queries", response_model=List[QueryResponse])
def get_queries(db: Session = Depends(get_db)):
    queries = db.query(Query).order_by(Query.created_at.desc()).all()
    return queries