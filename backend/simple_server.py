
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json, os, time, re, uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

app = FastAPI(
    title="Obsidian Simple API",
    description="Simple API serving existing event data",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load existing data
STORE_PATH = Path(__file__).parent / "obsidian_events_store.json"

def load_data():
    if STORE_PATH.exists():
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"total": 0, "events": []}

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}

@app.get("/events")
async def events_endpoint(agent_id: Optional[str] = Query(default=None)):
    data = load_data()
    events = data.get("events", [])
    if agent_id:
        filtered = [e for e in events if e.get("agent_id") == agent_id]
        return {"total": len(filtered), "events": filtered, "agent_id": agent_id}
    return data

@app.get("/agents")
async def agents_endpoint():
    data = load_data()
    events = data.get("events", [])
    agent_map: dict[str, dict] = {}
    for e in events:
        aid = e.get("agent_id", "default")
        if aid not in agent_map:
            agent_map[aid] = {"agent_id": aid, "event_count": 0, "total_spend": 0.0, "blocked_count": 0}
        a = agent_map[aid]
        a["event_count"] += 1
        cost = float(e.get("audit_event", {}).get("cost_total") or 0)
        a["total_spend"] += cost
        if e.get("audit_event", {}).get("action") in ("stop", "deny_tool"):
            a["blocked_count"] += 1
    agents = sorted(agent_map.values(), key=lambda a: a["agent_id"])
    for a in agents:
        n = a["event_count"]
        a["compliance_pass_rate"] = round((n - a["blocked_count"]) / n * 100, 1) if n else 100.0
        a["total_spend"] = round(a["total_spend"], 6)
    return {"agents": agents}

@app.get("/insights")
async def insights_endpoint(agent_id: Optional[str] = Query(default=None)):
    return {
        "recall": "Loaded from stored data",
        "reflect": "All endpoints working without cascadeflow",
        "agent_id": agent_id,
        "auto_applied": False
    }

@app.get("/trust-score")
async def trust_score_endpoint(agent_id: str = Query(...)):
    return {
        "agent_id": agent_id,
        "composite_score": 85.5,
        "compliance_score": 90,
        "cost_efficiency_score": 80,
        "recall_accuracy_score": 85,
        "weights": {"compliance": "40%", "cost_efficiency": "30%", "recall_accuracy": "30%"},
        "math": "Composite score calculation example",
        "event_count": 10,
        "compliance_note": "Sample data",
        "cost_note": "Sample data",
        "hindsight_bank": f"obsidian-{agent_id}"
    }

@app.get("/roi")
async def roi_endpoint(agent_id: Optional[str] = Query(default=None)):
    return {
        "agent_id": agent_id or "all",
        "query_count": 5,
        "actual_cost": 0.05,
        "baseline_cost": 0.1,
        "savings_dollars": 0.05,
        "savings_percent": 50,
        "most_expensive_model": "llama-3.3-70b-versatile",
        "most_expensive_cost_seen": 0.02,
        "model_breakdown": {},
        "math": "Example ROI calculation"
    }

@app.get("/remediations")
async def remediations_endpoint():
    return {
        "total_remediations": 0,
        "auto_applied": False,
        "current_policy": {},
        "remediations": []
    }


# ── Category classifier ───────────────────────────────────────────────────────
_CATEGORY_RULES: list[tuple[list[str], str]] = [
    (["order", "#", "tracking", "shipment", "delivery", "where is my"], "order_status"),
    (["refund", "money back", "charge", "cancel", "return"], "refund"),
    (["credit card", "ssn", "password", "cvv", "card number", "bank account",
      "social security", "date of birth", "personal"], "sensitive_data"),
]


def classify_category(query: str) -> str:
    lower = query.lower()
    for keywords, category in _CATEGORY_RULES:
        if any(kw in lower for kw in keywords):
            return category
    return "general_faq"


# ── /query endpoint ──────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str
    agent_id: str = "default"


@app.post("/query")
async def query_endpoint(body: QueryRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty")

    agent_id = body.agent_id or "default"
    category = classify_category(body.query)
    run_id = str(uuid.uuid4())[:8]
    ts_ms = time.time() * 1000

    # Try Groq API
    api_key = os.environ.get("GROQ_API_KEY", "")
    answer = ""
    model = "llama-3.3-70b-versatile"
    latency_ms = 0.0
    cost = 0.0

    if api_key:
        try:
            import httpx
            t0 = time.time()
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": body.query}],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                answer = data["choices"][0]["message"]["content"]
                latency_ms = (time.time() - t0) * 1000
                # Rough cost estimate
                usage = data.get("usage", {})
                prompt_tokens = usage.get("prompt_tokens", 0)
                completion_tokens = usage.get("completion_tokens", 0)
                cost = (prompt_tokens * 0.00000059 + completion_tokens * 0.00000079)
        except Exception as exc:
            answer = f"[ERROR] Groq API call failed: {exc}"
    else:
        answer = "[ERROR] No GROQ_API_KEY set. Add it to .env"

    audit_event = {
        "action":          "allow",
        "model":           model,
        "cost_total":      round(cost, 6),
        "latency_used_ms": round(latency_ms, 1),
        "decision_mode":   "simple",
        "timestamp_ms":    ts_ms,
        "run_id":          run_id,
        "step":            1,
        "reason":          "direct_groq_call",
        "query":           body.query,
        "agent_id":        agent_id,
        "budget_state":    {"max": 1.0, "remaining": 0.0},
    }

    # Store event
    _store_event(category, audit_event, agent_id)

    return {
        "response":          answer,
        "category":          category,
        "blocked":           False,
        "audit_event":       audit_event,
        "summary":           {},
        "routing_suggestion": None,
        "agent_id":          agent_id,
    }


def _store_event(category: str, audit_event: dict, agent_id: str = "default"):
    data = load_data()
    data.setdefault("total", 0)
    data["total"] += 1
    data.setdefault("events", []).append({
        "timestamp_ms": time.time() * 1000,
        "category": category,
        "agent_id": agent_id,
        "audit_event": audit_event,
    })
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

