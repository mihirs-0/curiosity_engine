from fastapi import APIRouter, Depends, HTTPException
from .auth import get_current_user, get_required_user
from ..database import get_supabase
from ..services.sonar_memory import call_sonar
from ..models.chat import ChatMessage, ItineraryChoice
from supabase import Client
from datetime import datetime
from fastapi import APIRouter, Depends, Body, Path
from fastapi.responses import JSONResponse
from fastapi import HTTPException
import json

import re

def strip_code_fences(text: str) -> str:
    """Remove ```json … ``` fences."""
    return re.sub(r"```(?:json)?\s*(\{.*?\})\s*```", r"\1", text, flags=re.DOTALL)

def strip_think(text: str) -> str:
    """Remove inadvertent <think> … </think> leaks."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)

def safe_row(resp, action="DB op"):
    if isinstance(resp.data, dict) and resp.data.get("message"):
        raise HTTPException(500, { "action": action, **resp.data })
    if not resp.data:
        raise HTTPException(500, f"{action} returned no data")
    return resp.data[0]

MAX_TURNS = 2

router = APIRouter(prefix="/trips/{trip_id}/chat", tags=["chat"])

MEMORY_LIMIT = 6                               # last 12 messages → memory

SYSTEM_PLANNER = """
You are a collaborative travel-planning assistant.

Return a single JSON object matching this schema:

{
  "reply": "<friendly chatty text to show the user>",
  "suggestion": {
    "suggestion": "<one activity idea>",
    "day": <int>,
    "tags": ["food", "culture"]
  }
}

No markdown, no ``` fences, no <think> blocks, no extra keys.
"""



@router.post("")
async def post_message(
    trip_id: str = Path(..., description="The ID of the trip"),
    body: dict = Body(..., description="The message to send"),
    user=Depends(get_required_user),
    supabase: Client = Depends(get_supabase),
):
    # 1️⃣  persist user message ---------------------------------------------
    user_message_data = {
        "trip_id": trip_id,
        "user_id": user.id,
        "role": "user",
        "content": body["content"],
        "created_at": datetime.utcnow().isoformat(),
    }
    insert_resp = supabase.table("chat_message").insert(user_message_data).execute()
    user_msg = safe_row(insert_resp, "insert chat_message")

    # 2️⃣  build memory (last N, incl. the one we just inserted) -------------
    history_result = (
        supabase.table("chat_message")
        .select("*")
        .eq("trip_id", trip_id)
        .order("created_at", desc=True)
        .limit(MEMORY_LIMIT)
        .execute()
    )
    history = list(reversed(history_result.data))  # chronological
    memory_msgs = [{"role": m["role"], "content": m["content"]} for m in history]

    # -- ensure roles alternate and end with user ---------------------------
    clean_msgs = []
    last_role = None
    for m in memory_msgs:
        if m["role"] == last_role:
            continue
        clean_msgs.append(m)
        last_role = m["role"]


    if clean_msgs and clean_msgs[-1]["role"] != "user":
        clean_msgs.append({"role": "user", "content": body["content"]})

    # 3️⃣  call Sonar --------------------------------------------------------
    SUGGESTION_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "suggestion": {
            "type": "object",
            "properties": {
                "suggestion": {"type": "string"},
                "day": {"type": "integer"},
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "maxItems": 5
                }
            },
            "required": ["suggestion", "day"],
            "additionalProperties": False
        }
    },
    "required": ["reply", "suggestion"],
    "additionalProperties": False
}


    raw_answer, usage = call_sonar(
    system_prompt=SYSTEM_PLANNER,
    messages=clean_msgs,          # includes the system message already
    schema=SUGGESTION_SCHEMA,     # <- NEW
)
    
    try:
        parsed = json.loads(raw_answer)
    except json.JSONDecodeError:
        raise HTTPException(502, "Sonar did not return valid JSON")

    reply_text = parsed["reply"]
    suggestion_obj = parsed["suggestion"]
    # 4️⃣  persist assistant reply ------------------------------------------
    assistant_message_data = {
        "trip_id": trip_id,
        "user_id": "assistant",
        "role": "assistant",
        "content": raw_answer,
        "created_at": datetime.utcnow().isoformat(),
    }
    bot_resp = supabase.table("chat_message").insert(assistant_message_data).execute()
    bot_msg = safe_row(bot_resp, "insert assistant message")

    # 5️⃣  respond -----------------------------------------------------------
    return {"assistant": bot_msg, "usage": usage}

@router.post("/select")
async def select_suggestion(trip_id: str,
                            body: dict,
                            user=Depends(get_required_user),
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