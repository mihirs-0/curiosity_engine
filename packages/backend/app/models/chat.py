from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    """Chat message model for API requests/responses - not a database table"""
    id: Optional[int] = None
    trip_id: str
    user_id: str
    role: str       # "user" | "assistant"
    content: str
    created_at: Optional[datetime] = None

class ItineraryChoice(BaseModel):
    """Itinerary choice model for API requests/responses - not a database table"""
    id: Optional[int] = None
    trip_id: str
    user_id: str
    message_id: int
    payload: Dict[str, Any]

# Export models for convenience
__all__ = ["ChatMessage", "ItineraryChoice"] 