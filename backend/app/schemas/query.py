from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class QueryBase(BaseModel):
    raw_query: str
    answer_markdown: str

class QueryCreate(QueryBase):
    pass

class Query(QueryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 