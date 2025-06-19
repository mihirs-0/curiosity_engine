"""
Central client for Perplexity Sonar with conversation-memory emulation.

Docs:
  - Chat Completions endpoint
  - Model list showing sonar-deep-research (128k context)
  - Structured JSON outputs guide
"""

import os
import time
import requests
from typing import List, Dict, Optional, Tuple 
from fastapi import HTTPException

PPLX_API = "https://api.perplexity.ai/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}",
    "Content-Type": "application/json",
}

def call_sonar(
    system_prompt: str,
    messages: List[Dict],
    model: str = "sonar-pro",
    max_tokens: int = 1024,
    schema: Optional[dict] = None,
    response_format: Optional[dict] = None,
    timeout: int = 30,       # seconds per attempt
    retries: int = 1,        # number of retries *after* the first attempt
) -> Tuple[str, dict]:
    """
    Send a Chat Completions request to Perplexity Sonar with simple retry logic.

    Raises:
        HTTPException 504 if the API times out after all retries
        HTTPException <status> forwarding Sonar's own error response
    
    response_format = None
    if schema is not None:
        response_format = {
            "type": "json_schema",
            "json_schema": {"schema": schema},
        } 
    """

    # build the correct response_format object if the caller supplied a schema
    response_format_value = None
    if schema is not None:
        response_format_value = {
           "type": "json_schema",
           "json_schema": {"schema": schema},
        }

    body = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "top_p": 1,
        "stream": False,
        "max_tokens": max_tokens,
        "response_format": response_format_value,
    }

    attempt = 0
    while attempt <= retries:
        attempt += 1
        t0 = time.time()
        try:
            r = requests.post(PPLX_API, headers=HEADERS, json=body, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            usage = {"latency": round(time.time() - t0, 2), **data.get("usage", {})}
            return data["choices"][0]["message"]["content"], usage

        except requests.Timeout:
            if attempt > retries:
                raise HTTPException(
                    504, f"Sonar API timed out after {retries + 1} attempt(s)."
                )
            time.sleep(2)

        except requests.HTTPError:
            raise HTTPException(r.status_code, {"sonar_error": r.text or r.json()})