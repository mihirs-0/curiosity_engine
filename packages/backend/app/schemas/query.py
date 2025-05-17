from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class QueryBase(BaseModel):
    raw_query: str = Field(..., min_length=1)
    answer_markdown: str = Field(..., min_length=1)

class QueryCreate(QueryBase):
    pass

class Query(QueryBase):
    id: int
    user_id: int
    sonar_data: Optional[Dict[str, Any]] = None
    sonar_status: str = 'pending'
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QueryResponse(BaseModel):
    id: int
    sonar_data: Optional[Dict[str, Any]] = None
    sonar_status: str 