# app/routers/itineraries.py# app/routers/generate_itinerary.py

from fastapi import APIRouter, Depends, Body, HTTPException
from supabase import Client
import json
import uuid
import datetime as dt

from ..database import get_supabase
from ..services.sonar_memory import call_sonar
from .auth import get_required_user

router = APIRouter(prefix="/itineraries", tags=["itinerary"])


@router.post("/generate")
async def generate_itinerary(
    body: dict = Body(
        ...,
        example={
            "raw_query": "One week in Paris",
            "luxury_level": "moderate",
            "travel_with": "partner",
            "interests": ["food", "culture"],
        },
    ),
    user=Depends(get_required_user),
    supabase: Client = Depends(get_supabase),
):
    """
    1. Call Sonar with a strict JSON-Schema ➜ overview + itinerary
    2. Persist in `trips` and `itineraries`
    3. Return { trip_id } for the front-end
    """

    # ── 1) Build user prompt ───────────────────────────────────────
    prompt = (
        f"Based on this query:\n\"{body['raw_query']}\"\n\n"
        f"Create a {body['luxury_level']} itinerary for a {body['travel_with']}.\n"
        f"Focus on: {', '.join(body.get('interests', [])) or 'general highlights'}.\n\n"
        "Respond **only** with valid JSON that satisfies the schema I give you. "
        "No markdown, code fences, or extra fields."
    )

    # ── 2) Define the JSON-schema ──────────────────────────────────
    schema = {
        "type": "object",
        "properties": {
            "overview": {"type": "string"},
            "itinerary": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "day": {"type": "integer"},
                        "summary": {"type": "string"},
                        "morning": {"type": "string"},
                        "afternoon": {"type": "string"},
                        "evening": {"type": "string"},
                        "notes": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                    },
                    "required": ["day", "summary", "morning", "afternoon", "evening"],
                },
                "minItems": 1,
                "maxItems": 5,
            },
        },
        "required": ["overview", "itinerary"],
    }

    # ── 3) Call Sonar, enforcing that schema ────────────────────────
    content, usage = call_sonar(
        system_prompt="You are a travel-planning assistant. Return ONLY valid JSON conforming to the schema.",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a travel-planning assistant. "
                    "Return ONLY valid JSON conforming to the schema."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        # note: we’re using the new `schema=` param, not response_format directly
        schema=schema,
    )

    # parse the JSON the model returned
    try:
        itinerary_obj = json.loads(content)
    except json.JSONDecodeError as e:
        raise HTTPException(502, f"Invalid JSON from Sonar: {e}")

    # ── 4) Insert TRIP ─────────────────────────────────────────────
    trip_payload = {
        "title": body["raw_query"],
        "original_query_id": None,
        "luxury_level": body["luxury_level"],
        "travel_with": body["travel_with"],
        "interests": list(body.get("interests", [])),
        "status": "active",
        "user_id": user.id,
    }

    trip_resp = supabase.table("trips").insert(trip_payload).execute()
    if not trip_resp.data:
        raise HTTPException(500, "Failed to insert trip")
    trip = trip_resp.data[0]

    # ── 5) Sanitize any sets and insert ITINERARY ──────────────────
    def _sanitize(obj):
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, dict):
            return {k: _sanitize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_sanitize(i) for i in obj]
        return obj

    sanitized = _sanitize(itinerary_obj)

    itin_resp = supabase.table("itineraries").insert({
        "trip_id": trip["trip_id"],
        "query_id": None,
        "theme": body["luxury_level"],
        "sonar_json": sanitized,
    }).execute()
    if not itin_resp.data:
        raise HTTPException(500, "Failed to insert itinerary")
    itinerary = itin_resp.data[0]

    # ── 6) Patch trip with the itinerary id ───────────────────────
    supabase.table("trips").update(
        {"personalized_itinerary_id": itinerary["id"]}
    ).eq("trip_id", trip["trip_id"]).execute()

    return {"trip_id": trip["trip_id"]}