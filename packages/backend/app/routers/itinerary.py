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

router = APIRouter(prefix="/trips/{trip_id}/finalize", tags=["itinerary"])

@router.post("")
async def finalize_itinerary(
    trip_id: str = Path(...),
    body: dict = Body(...),          # expects { title:str, days:int }
    user = Depends(get_required_user),
    supabase: Client = Depends(get_supabase),
):
    # 1️⃣  gather user-confirmed suggestions
    rows = (
        supabase.table("itinerary_choice")
        .select("payload")
        .eq("trip_id", trip_id)
        .execute()
        .data
    )
    suggestions = [
        r["payload"].get("suggestion")
        for r in rows
        if r.get("payload")
    ]
    if not suggestions:
        raise HTTPException(400, "No suggestions have been added yet.")

    # 2️⃣  build prompt & call Sonar (small / cheap)
    prompt = (
        f"Here are confirmed ideas:\n{json.dumps(suggestions, indent=2)}\n\n"
        f"Craft a {body['days']}-day itinerary titled \"{body['title']}\".\n"
        "Return *only* JSON matching:\n"
        '{"title":str,"days":[{"day":1,"summary":str,"morning":str,'
        '"afternoon":str,"evening":str,"notes":[str]}]}'
    )
    
    try:
        raw_json, usage = call_sonar(
            "Return JSON only.",  # system_prompt (first parameter)
            [{"role": "user", "content": prompt}],  # messages (second parameter)
            model="sonar-small-online",
            max_tokens=512,
            response_format={"type": "json_object"},  # correct format as dict
        )
        itinerary_json = json.loads(raw_json)
    except HTTPException as e:
        print("❌ Sonar timeout or error:", e.detail)
        raise HTTPException(status_code=500, detail="Itinerary generation failed due to Sonar timeout.")

    # 3️⃣  save to `itineraries`
    insert = (
        supabase.table("itineraries")
        .insert({
            "trip_id": trip_id,
            "query_id": None,
            "theme": None,
            "sonar_json": itinerary_json,
        })
        .select("id, sonar_json")
        .single()
        .execute()
        .data
    )

    # 4️⃣  patch the trips row so later page loads know where to look
    supabase.table("trips").update(
        {"personalized_itinerary_id": insert["id"]}
    ).eq("trip_id", trip_id).execute()

    return {"itinerary": insert, "usage": usage}