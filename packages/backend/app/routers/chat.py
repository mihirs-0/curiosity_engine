from fastapi import APIRouter, Depends, HTTPException
from .auth import get_current_user
from ..database import get_supabase
from ..services.sonar_memory import call_sonar
from ..models.chat import ChatMessage, ItineraryChoice
from supabase import Client
from datetime import datetime

router = APIRouter(prefix="/trips/{trip_id}/chat", tags=["chat"])

MEMORY_LIMIT = 12                                 # last 12 messages → memory

SYSTEM_PLANNER = """
You are a collaborative travel-planning assistant. The user messages below
come from multiple people working on the same trip. Always:
1. Combine everyone's ideas creatively.
2. Include citations inline (markdown [^1]) where relevant.
3. When asked to propose an activity, wrap it in JSON:
   {"suggestion": "...", "day": <int>, "tags": ["food","culture"]}

Do NOT add any other keys. Do NOT output <think> blocks.
"""

@router.post("")
async def post_message(trip_id: str,
                       body: dict,
                       user=Depends(get_current_user),
                       supabase: Client = Depends(get_supabase)):
    # 1) persist user message
    user_message_data = {
        "trip_id": trip_id,
        "user_id": user.id,
        "role": "user", 
        "content": body["content"],
        "created_at": datetime.utcnow().isoformat()
    }
    
    user_msg_result = supabase.table("chat_message").insert(user_message_data).execute()
    user_msg = user_msg_result.data[0]

    # 2) assemble memory (last N msgs)
    history_result = supabase.table("chat_message")\
        .select("*")\
        .eq("trip_id", trip_id)\
        .order("created_at", desc=True)\
        .limit(MEMORY_LIMIT)\
        .execute()
    
    # Reverse to get chronological order
    history = list(reversed(history_result.data))
    memory_msgs = [{"role": m["role"], "content": m["content"]} for m in history]

    # 3) call Sonar with the refined system prompt
    answer, usage = call_sonar(memory_msgs, system_prompt=SYSTEM_PLANNER, response_format=None)

    # 4) persist assistant reply
    assistant_message_data = {
        "trip_id": trip_id,
        "user_id": "assistant",
        "role": "assistant", 
        "content": answer,
        "created_at": datetime.utcnow().isoformat()
    }
    
    bot_result = supabase.table("chat_message").insert(assistant_message_data).execute()
    bot_msg = bot_result.data[0]

    return {"assistant": bot_msg, "usage": usage}

@router.post("/select")
async def select_suggestion(trip_id: str,
                            body: dict,
                            user=Depends(get_current_user),
                            supabase: Client = Depends(get_supabase)):
    """
    Body: {message_id: int, payload: {suggestion_json}}
    """
    choice_data = {
        "trip_id": trip_id,
        "user_id": user.id,
        "message_id": body["message_id"],
        "payload": body["payload"]
    }
    
    result = supabase.table("itinerary_choice").insert(choice_data).execute()
    return {"status": "saved", "choice": result.data[0]} 