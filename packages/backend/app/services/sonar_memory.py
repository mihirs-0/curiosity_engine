"""
Central client for Perplexity Sonar with conversation-memory emulation.

Docs:
  - Chat Completions endpoint :contentReference[oaicite:0]{index=0}
  - Model list showing **sonar-deep-research** (128k context) :contentReference[oaicite:1]{index=1}
  - Structured JSON outputs guide :contentReference[oaicite:2]{index=2}
"""

import os, requests, json, time
from typing import List, Dict, Optional, Union

PPLX_API = "https://api.perplexity.ai/chat/completions"
HEADERS   = {"Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}",
             "Content-Type": "application/json"}

def call_sonar(messages: List[Dict],
               system_prompt: str,
               model: str = "sonar-deep-research",
               max_tokens: int = 2048,
               response_format: Optional[str] = "json_object"):
    """One-shot call with injected memory."""
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            *messages                      # ← full memory window
        ],
        "temperature": 0.4,
        "top_p": 1,
        "response_format": {"type": response_format} if response_format else None,
        "stream": False
    }
    ts = time.time()
    r = requests.post(PPLX_API, headers=HEADERS, json=body, timeout=90)
    r.raise_for_status()
    usage = {"latency": round(time.time() - ts, 2), **r.json().get("usage", {})}
    return r.json()["choices"][0]["message"]["content"], usage 