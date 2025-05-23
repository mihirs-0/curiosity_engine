from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
import jwt
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Supabase client (optional for local development)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# For local development without Supabase
USE_SUPABASE = bool(supabase_url and supabase_key)
supabase: Optional[Client] = None

if USE_SUPABASE:
    supabase = create_client(supabase_url, supabase_service_key or supabase_key)
    print("✅ Supabase client initialized")
else:
    print("⚠️ Running in local mode without Supabase - queries will be stored in memory")

# In-memory storage for local development
local_queries = []

# Security
security = HTTPBearer(auto_error=False)

# Pydantic models
class QueryCreate(BaseModel):
    raw_query: str

class QueryResponse(BaseModel):
    id: str
    raw_query: str
    sonar_data: Optional[dict] = None
    sonar_status: str
    created_at: Optional[str] = None

class User(BaseModel):
    id: str
    email: str

app = FastAPI(title="Curiosity Engine API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Next.js dev server
        "chrome-extension://*",    # Chrome extension
        os.getenv("FRONTEND_URL", "http://localhost:3000")  # Production frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Extract user from JWT token (optional for some endpoints)"""
    if not credentials:
        return None
    
    try:
        # Verify JWT token with Supabase
        token = credentials.credentials
        
        # For simplicity, we'll trust the token and extract user info
        # In production, you'd want to verify the JWT signature
        payload = jwt.decode(token, options={"verify_signature": False})
        
        return User(
            id=payload.get("sub", ""),
            email=payload.get("email", "")
        )
    except Exception as e:
        print(f"Auth error: {e}")
        return None

async def get_required_user(user: Optional[User] = Depends(get_current_user)) -> User:
    """Require authentication for protected endpoints"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def call_sonar_api(query: str) -> dict:
    """Call the Perplexity Sonar API with the given query."""
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Perplexity API key not configured")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "sonar-pro",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful research assistant. Provide accurate, up-to-date information with sources when possible."
                        },
                        {
                            "role": "user",
                            "content": query
                        }
                    ]
                },
                timeout=30.0
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
async def create_query(query: QueryCreate, user: Optional[User] = Depends(get_current_user)):
    try:
        # Create query ID and timestamp
        query_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        
        # Create initial query record
        query_data = {
            "id": query_id,
            "raw_query": query.raw_query,
            "sonar_status": "pending",
            "created_at": created_at,
            "sonar_data": None
        }
        
        # Add user_id if authenticated
        if user:
            query_data["user_id"] = user.id
        
        if USE_SUPABASE and supabase:
            # Use Supabase
            result = supabase.table("queries").insert(query_data).execute()
            db_query = result.data[0]
        else:
            # Use local storage
            local_queries.append(query_data.copy())
            db_query = query_data
        
        # Call Sonar API (skip if no API key)
        perplexity_key = os.getenv("PERPLEXITY_API_KEY")
        if perplexity_key:
            sonar_data = await call_sonar_api(query.raw_query)
        else:
            sonar_data = {"message": "Perplexity API key not configured - this is a mock response", "query": query.raw_query}
        
        # Update query with Sonar response
        update_data = {
            "sonar_data": sonar_data,
            "sonar_status": "error" if "error" in sonar_data else "completed"
        }
        
        if USE_SUPABASE and supabase:
            # Update in Supabase
            result = supabase.table("queries").update(update_data).eq("id", db_query["id"]).execute()
            updated_query = result.data[0]
        else:
            # Update in local storage
            for local_query in local_queries:
                if local_query["id"] == query_id:
                    local_query.update(update_data)
                    updated_query = local_query
                    break
        
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
def get_queries(user: Optional[User] = Depends(get_current_user)):
    try:
        if USE_SUPABASE and supabase:
            # Use Supabase
            query_builder = supabase.table("queries").select("*")
            
            if user:
                # If authenticated, only return user's queries
                query_builder = query_builder.eq("user_id", user.id)
            
            result = query_builder.order("created_at", desc=True).execute()
            return [QueryResponse(**query) for query in result.data]
        else:
            # Use local storage
            filtered_queries = local_queries.copy()
            
            if user:
                # If authenticated, only return user's queries
                filtered_queries = [q for q in local_queries if q.get("user_id") == user.id]
            
            # Sort by created_at descending
            filtered_queries.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return [QueryResponse(**query) for query in filtered_queries]
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/queries/{query_id}", response_model=QueryResponse)
def get_query(query_id: str, user: Optional[User] = Depends(get_current_user)):
    try:
        if USE_SUPABASE and supabase:
            # Use Supabase
            query_builder = supabase.table("queries").select("*").eq("id", query_id)
            
            if user:
                # If authenticated, ensure user owns the query
                query_builder = query_builder.eq("user_id", user.id)
            
            result = query_builder.execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Query not found")
            
            query_data = result.data[0]
        else:
            # Use local storage
            query_data = None
            for query in local_queries:
                if query["id"] == query_id:
                    # Check user ownership if authenticated
                    if user and query.get("user_id") != user.id:
                        continue
                    query_data = query
                    break
            
            if not query_data:
                raise HTTPException(status_code=404, detail="Query not found")
        
        return QueryResponse(**query_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))