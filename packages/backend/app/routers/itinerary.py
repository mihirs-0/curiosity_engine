from fastapi import APIRouter, Depends
from ..models.chat import ItineraryChoice
from ..services.sonar_memory import call_sonar
from .auth import get_current_user
from ..database import get_supabase
from supabase import Client
import json

router = APIRouter(prefix="/trips/{trip_id}/finalize", tags=["itinerary"])

@router.post("")
async def finalize(trip_id: str,
                   body: dict,                     # {title: str, days: int}
                   user=Depends(get_current_user),
                   supabase: Client = Depends(get_supabase)):
    # gather all selected suggestions across collaborators
    picks_result = supabase.table("itinerary_choice")\
        .select("*")\
        .eq("trip_id", trip_id)\
        .execute()
    
    picks = picks_result.data
    bullets = [p["payload"]["suggestion"] for p in picks]

    messages = [
      {"role": "user", "content":
       f"Here are all confirmed ideas:\n{bullets}\n"
       f"Please craft a coherent {body['days']}-day plan named "
       f"\"{body['title']}\". Respond ONLY with valid JSON matching "
       """{{
            "title": str,
            "days": [
              {{ "day": 1, "summary": str, "morning": str,
                "afternoon": str, "evening": str, "notes": [str] }}
            ]
          }}"""
       }
    ]

    system = ("Return JSON only. Do *not* include <think> or extra text. "
              "Use sonar-deep-research for exhaustive, cited planning.")
    itinerary_json, _ = call_sonar(messages, system_prompt=system,
                                   response_format="json_object")
    return json.loads(itinerary_json) 