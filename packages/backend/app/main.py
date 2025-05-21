from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import List, Optional
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")

supabase: Client = create_client(supabase_url, supabase_key)

# Pydantic models
class QueryCreate(BaseModel):
    raw_query: str

class QueryResponse(BaseModel):
    id: str
    raw_query: str
    sonar_data: Optional[dict] = None
    sonar_status: str
    created_at: Optional[str] = None

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "chrome-extension://*",    # Chrome extension
        os.getenv("FRONTEND_URL", "http://localhost:3000")  # Production frontend URL
    ],
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
                timeout=10.0
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
async def create_query(query: QueryCreate):
    try:
        # Create initial query record in Supabase
        query_data = {
            "raw_query": query.raw_query,
            "sonar_status": "pending"
        }
        
        result = supabase.table("queries").insert(query_data).execute()
        db_query = result.data[0]
        
        # Call Sonar API
        sonar_data = await call_sonar_api(query.raw_query)
        
        # Update query with Sonar response
        update_data = {
            "sonar_data": sonar_data,
            "sonar_status": "error" if "error" in sonar_data else "completed"
        }
        
        result = supabase.table("queries").update(update_data).eq("id", db_query["id"]).execute()
        updated_query = result.data[0]
        
        return QueryResponse(
            id=updated_query["id"],
            raw_query=updated_query["raw_query"],
            sonar_data=updated_query["sonar_data"],
            sonar_status=updated_query["sonar_status"],
            created_at=updated_query.get("created_at")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/queries", response_model=List[QueryResponse])
def get_queries():
    try:
        result = supabase.table("queries").select("*").order("created_at", desc=True).execute()
        return [QueryResponse(**query) for query in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))