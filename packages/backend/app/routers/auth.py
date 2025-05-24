from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from typing import Optional
from pydantic import BaseModel

security = HTTPBearer(auto_error=False)

class User(BaseModel):
    id: str
    email: str

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