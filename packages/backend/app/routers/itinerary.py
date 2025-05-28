from fastapi import APIRouter, Depends
from ..models.chat import ItineraryChoice
from ..services.sonar_memory import call_sonar
from .auth import get_required_user
from ..database import get_supabase
from supabase import Client
import json
import httpx
from fastapi import HTTPException
from fastapi import APIRouter, Depends, Body, Path

router = APIRouter(prefix="http://localhost:8000/trips/{trip_id}/finalize", tags=["itinerary"])

@router.post("")
async def finalize(trip_id: str=Path(..., description="The ID of the trip"),
                   body: dict=Body(..., description="The message to send"),
                   user=Depends(get_required_user),
                   supabase: Client = Depends(get_supabase)):

    # 1. Fetch all itinerary rows for the given trip
    result = supabase.table("itineraries")\
        .select("sonar_json")\
        .eq("trip_id", trip_id)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="No itinerary suggestions found for this trip")

    # 2. Extract all suggestions from sonar_json
    suggestions = []
    for row in result.data:
        json_blob = row.get("sonar_json", {})
        if isinstance(json_blob, str):
            try:
                json_blob = json.loads(json_blob)
            except Exception:
                continue
        # Expecting the "suggestion" field inside the JSON blob
        if "suggestion" in json_blob:
            suggestions.append(json_blob["suggestion"])

    if not suggestions:
        raise HTTPException(status_code=400, detail="No valid suggestions found in itinerary rows")

    # 3. Build prompt
    user_prompt = (
        f"Here are all confirmed ideas:\n{suggestions}\n"
        f"Please craft a coherent {body['days']}-day plan named "
        f"\"{body['title']}\". Respond ONLY with valid JSON matching:\n"
        """{
          "title": str,
          "days": [
            { "day": 1, "summary": str, "morning": str,
              "afternoon": str, "evening": str, "notes": [str] }
          ]
        }"""
    )

    # 4. Send to Sonar
    system = (
        "Return JSON only. Do *not* include <think> or extra text. "
        "Use sonar-deep-research for exhaustive, cited planning."
    )

    itinerary_json, _ = call_sonar(
        [{"role": "user", "content": user_prompt}],
        system_prompt=system,
        response_format="json_object"
    )

    # 5. Return JSON
    return json.loads(itinerary_json)