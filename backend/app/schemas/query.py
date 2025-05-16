from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class QueryBase(BaseModel):
    raw_query: str = Field(..., min_length=1)
    answer_markdown: str = Field(..., min_length=1)

class QueryCreate(QueryBase):
    pass

class Query(QueryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 