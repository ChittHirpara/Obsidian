"""
main.py — Obsidian FastAPI Backend (v2 — multi-agent isolated)
---------------------------------------------------------------
Existing endpoints (unchanged, backward-compatible):
  POST   /query                → Single-agent query (agent_id="default")
  GET    /events               → Full audit history (optional ?agent_id=...)
  GET    /insights             → Routing insights   (optional ?agent_id=...)
  DELETE /session              → Reset default agent budget + routing policy
  GET    /routing-policy       → Current routing policy
  POST   /apply-suggestion     → Apply latest routing suggestion
  POST   /apply-routing-fix    → (LEGACY) Apply explicit suggestion

New endpoints (Part A + B):
  GET    /agents               → List all agent_ids with event counts
  GET    /trust-score          → Trust score for ?agent_id=... (Part B)
  POST   /agents/{id}/reset    → Reset a specific agent's budget session
"""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from obsidian_core import (
    classify_category,
    reset_session,
    run_query,
    apply_routing_fix,
    get_remediation_log,
    DEMO_BUDGET,
    reset_all_budgets,
)
from slack_alerts import post_slack_alert
from hindsight_store import (
    ask_hindsight,
    check_escalation_pattern,
    compute_trust_score,
    get_agent_ids,
    get_all_events,
    get_insights,
    store_event,
    store_policy_change_event,
    purge_all_events,
    clear_hindsight_memory,
)
from settings_store import get_settings, save_settings, ObsidianSettings

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("obsidian")

# Tracks which sessions have already received a low budget warning
_budget_warnings_sent = set()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Obsidian API",
    description=(
        "AI decision audit and cost governance backend. "
        "Every query is routed through cascadeflow (enforce mode) and logged. "
        "v2: Multi-agent isolated budgets + Hindsight Trust Score."
    ),
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth Dependency ───────────────────────────────────────────────────────────
def verify_api_key(x_obsidian_api_key: str = Header(None)):
    settings = get_settings()
    if not settings.apiKey or x_obsidian_api_key != settings.apiKey:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_obsidian_api_key

# ── Schemas ───────────────────────────────────────────────────────────────────
class OpenAIChatRequest(BaseModel):
    model: str
    messages: list[dict]
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    stream: Optional[bool] = False

class QueryRequest(BaseModel):
    query: str
    agent_id: str = "default"   # NEW: optional agent_id (defaults to "default" for compat)


class QueryResponse(BaseModel):
    response: str
    category: str
    blocked: bool
    audit_event: dict[str, Any]
    summary: dict[str, Any]
    routing_suggestion: Optional[dict[str, Any]]
    agent_id: str = "default"


class EventRecord(BaseModel):
    timestamp_ms: float
    category: str
    agent_id: str = "default"
    audit_event: dict[str, Any]


class EventsResponse(BaseModel):
    total: int
    events: list[EventRecord]
    agent_id: Optional[str] = None


class SessionResetResponse(BaseModel):
    message: str
    previous_summary: dict[str, Any]


class InsightsResponse(BaseModel):
    recall: Optional[str]
    reflect: Optional[str]
    routing_suggestion: Optional[dict[str, Any]]
    agent_id: Optional[str] = None
    # Auto-remediation fields
    auto_applied: bool = False
    applied_at: Optional[str] = None        # ISO timestamp of last auto-fix
    applied_at_ms: Optional[float] = None   # epoch ms for frontend
    last_remediation: Optional[dict[str, Any]] = None   # full record


class RoutingPolicyResponse(BaseModel):
    policy: dict[str, str]


class ApplyRoutingFixRequest(BaseModel):
    suggestion: dict[str, Any]


class DemoMarkRequest(BaseModel):
    label: str
    agent_id: str = "default"


class ApplyRoutingFixResponse(BaseModel):
    success: bool
    message: str
    change: Optional[dict[str, Any]]


class TrustScoreResponse(BaseModel):
    agent_id: str
    composite_score: float
    compliance_score: float
    cost_efficiency_score: float
    recall_accuracy_score: float
    weights: dict[str, str]
    math: str
    recall_eval: dict[str, Any]
    event_count: int
    compliance_note: str
    cost_note: str
    hindsight_bank: str


class AgentSummary(BaseModel):
    agent_id: str
    event_count: int
    total_spend: float
    blocked_count: int
    compliance_pass_rate: float


class AgentListResponse(BaseModel):
    agents: list[AgentSummary]


# ── Shared apply logic ────────────────────────────────────────────────────────
async def _internal_apply_suggestion(suggestion: Optional[dict]) -> ApplyRoutingFixResponse:
    if not suggestion:
        return ApplyRoutingFixResponse(
            success=False,
            message="No actionable suggestion available yet",
            change=None,
        )
    success, message, change = apply_routing_fix(suggestion)
    if success and change:
        await store_policy_change_event(change)
    return ApplyRoutingFixResponse(success=success, message=message, change=change)


# ── Existing endpoints (backward-compatible) ──────────────────────────────────

@app.post("/query", response_model=QueryResponse, summary="Run a query through Obsidian")
async def query_endpoint(body: QueryRequest) -> QueryResponse:
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty")

    agent_id = body.agent_id or "default"
    logger.info("Received query [agent=%s]: %r", agent_id, body.query[:80])

    category = classify_category(body.query)
    logger.info("Category: %s", category)

    answer, trace_events, summary, flags = run_query(body.query, agent_id=agent_id)
    
    if "pii_detected" in flags and get_settings().strictSensitive:
        category = "sensitive_data"

    if trace_events and not (answer.startswith("[POLICY STOP]") or answer.startswith("[BUDGET STOP]")):
        audit_event: dict[str, Any] = trace_events[-1]
    else:
        action = "unknown"
        reason = "no_trace"
        if answer.startswith("[POLICY STOP]"):
            action = "block"
            reason = answer.replace("[POLICY STOP] ", "").strip()
        elif answer.startswith("[BUDGET STOP]"):
            action = "block"
            reason = "budget_exceeded"
            
        audit_event = {
            "action":          action,
            "model":           None,
            "cost_total":      0.0,
            "latency_used_ms": 0.0,
            "decision_mode":   "enforce",
            "timestamp_ms":    time.time() * 1000,
            "run_id":          "n/a",
            "step":            0,
            "reason":          reason,
            "query":           body.query,
        }
    audit_event["agent_id"] = agent_id   # stamp agent_id on the event
    audit_event["flags"] = flags         # stamp flags on the event

    blocked = audit_event.get("action") in ("stop", "deny_tool", "block")

    # Store in both legacy store AND agent-isolated store
    await store_event(category, audit_event, agent_id=agent_id)

    # ── Slack alerts & Low Budget Warning ──────────────────────────────────────
    cost        = float(audit_event.get("cost_total") or 0)
    action_str  = str(audit_event.get("action") or "unknown")
    budget_state = audit_event.get("budget_state") or {}
    remaining   = float(budget_state.get("remaining", DEMO_BUDGET))
    budget_cap  = float(budget_state.get("max", DEMO_BUDGET))
    
    settings = get_settings()
    budget_warning = False

    # Check for compliance block
    if blocked:
        if settings.slackAlerts:
            post_slack_alert(
                settings.webhookUrl,
                f"⚠️ *[{agent_id}]* compliance STOP fired — cost=${cost:.5f}, action=`{action_str}`"
            )

    # Check for low budget
    elif budget_cap > 0:
        percent_remaining = (remaining / budget_cap) * 100
        run_id = audit_event.get("run_id")
        
        if percent_remaining <= settings.warningThreshold:
            if run_id not in _budget_warnings_sent:
                _budget_warnings_sent.add(run_id)
                budget_warning = True
                
                if settings.slackAlerts:
                    msg = f"⚠️ [{agent_id}] budget at {percent_remaining:.1f}% remaining (${remaining:.4f} left of ${budget_cap:.4f})"
                    post_slack_alert(settings.webhookUrl, msg)
                    
    # Stamp budget_warning on response event
    audit_event["budget_warning"] = budget_warning
    # ─────────────────────────────────────────────────────────────────────────

    # Escalation check (scoped to this agent's events)
    routing_suggestion = await check_escalation_pattern(agent_id=agent_id)

    if routing_suggestion and routing_suggestion.get("category") != "sensitive_data":
        logger.info("Auto-applying routing fix for agent=%s category=%s", agent_id, routing_suggestion.get("category"))
        try:
            success, message, change = apply_routing_fix(routing_suggestion)
            if success and change:
                await store_policy_change_event(change)
                logger.info("Auto-fix applied: %s", message)
        except Exception:
            logger.exception("Auto-fix failed")

    logger.info(
        "Query done | agent=%s category=%s action=%s blocked=%s cost=%.5f",
        agent_id, category, audit_event.get("action"), blocked, audit_event.get("cost_total", 0),
    )

    return QueryResponse(
        response=answer,
        category=category,
        blocked=blocked,
        audit_event=audit_event,
        summary=summary,
        routing_suggestion=routing_suggestion,
        agent_id=agent_id,
    )


@app.get("/events", response_model=EventsResponse, summary="Audit event history (optionally filtered by agent_id)")
async def events_endpoint(
    agent_id: Optional[str] = Query(default=None, description="Filter by agent_id (omit for all events)")
) -> EventsResponse:
    events = get_all_events(agent_id=agent_id)
    records = []
    for e in events:
        try:
            records.append(EventRecord(**e))
        except Exception:
            records.append(EventRecord(
                timestamp_ms=e.get("timestamp_ms", 0),
                category=e.get("category", "unknown"),
                agent_id=e.get("agent_id", "default"),
                audit_event=e.get("audit_event", {}),
            ))
    return EventsResponse(total=len(records), events=records, agent_id=agent_id)


@app.get("/insights", response_model=InsightsResponse, summary="Hindsight routing insights (optionally per-agent)")
async def insights_endpoint(
    agent_id: Optional[str] = Query(default=None, description="Agent to fetch insights for (omit for global)")
) -> InsightsResponse:
    recall_text, reflect_text, suggestion = await get_insights(agent_id=agent_id)

    # Surface auto-remediation history from the live remediation log
    log = get_remediation_log()   # newest first
    auto_applied   = len(log) > 0
    last           = log[0] if log else None

    return InsightsResponse(
        recall=recall_text,
        reflect=reflect_text,
        routing_suggestion=suggestion,
        agent_id=agent_id,
        auto_applied=auto_applied,
        applied_at=last["applied_at_iso"] if last else None,
        applied_at_ms=last["applied_at_ms"] if last else None,
        last_remediation=last,
    )


@app.delete("/session", response_model=SessionResetResponse, summary="Reset default agent budget + routing policy")
async def reset_session_endpoint() -> SessionResetResponse:
    previous = reset_session()
    logger.info("Session reset. Previous cost: %.5f", previous.get("cost", 0))
    return SessionResetResponse(
        message="Budget session AND routing policy reset. Default agent back to $1.00 cap.",
        previous_summary=previous,
    )


@app.get("/settings/routing")
async def get_routing_policy_endpoint() -> dict:
    return get_settings().routingPolicy

class UpdateCategoryRequest(BaseModel):
    model: Optional[str] = None
    action: Optional[str] = None
    priority: Optional[str] = None

@app.put("/settings/routing/{category}")
async def update_routing_category_endpoint(category: str, update: UpdateCategoryRequest) -> dict:
    settings = get_settings()
    policy = settings.routingPolicy
    if category not in policy:
        raise HTTPException(status_code=404, detail="Category not found")
        
    if update.model is not None:
        policy[category]["model"] = update.model
    if update.action is not None:
        policy[category]["action"] = update.action
    if update.priority is not None:
        policy[category]["priority"] = update.priority
        
    save_settings(settings)
    return policy[category]


@app.post("/apply-suggestion", response_model=ApplyRoutingFixResponse)
async def apply_suggestion_endpoint() -> ApplyRoutingFixResponse:
    _, _, suggestion = await get_insights()
    return await _internal_apply_suggestion(suggestion)


@app.post("/apply-routing-fix", response_model=ApplyRoutingFixResponse)
async def apply_routing_fix_endpoint(body: ApplyRoutingFixRequest) -> ApplyRoutingFixResponse:
    return await _internal_apply_suggestion(body.suggestion)


@app.post("/demo/mark", summary="Add a visual marker for the demo")
async def demo_mark_endpoint(body: DemoMarkRequest) -> dict:
    from hindsight_store import store_event
    import time
    audit_event = {
        "action": "demo_mark",
        "model": None,
        "cost_total": 0.0,
        "latency_used_ms": 0.0,
        "decision_mode": "demo",
        "timestamp_ms": time.time() * 1000,
        "run_id": "demo",
        "step": 0,
        "reason": body.label,
        "query": f"--- DEMO MARKER: {body.label} ---",
        "is_marker": True,
    }
    await store_event("__demo_marker__", audit_event, agent_id=body.agent_id)
    return {"success": True, "label": body.label}


# ── New endpoints (Part A + B) ────────────────────────────────────────────────

@app.get("/agents", response_model=AgentListResponse, summary="List all agent_ids with stats")
async def list_agents() -> AgentListResponse:
    """
    Returns a list of all agent_ids that have at least one audit event,
    along with their event count, total spend, and compliance pass rate.
    This proves budget isolation: each agent has its own independent view.
    """
    agent_ids = get_agent_ids()
    summaries: list[AgentSummary] = []
    for aid in agent_ids:
        events = get_all_events(agent_id=aid)
        total_spend   = sum(float(e["audit_event"].get("cost_total") or 0) for e in events)
        blocked_count = sum(1 for e in events if e["audit_event"].get("action") in ("stop", "deny_tool"))
        pass_rate     = round((1 - blocked_count / len(events)) * 100, 1) if events else 100.0
        summaries.append(AgentSummary(
            agent_id=aid,
            event_count=len(events),
            total_spend=round(total_spend, 6),
            blocked_count=blocked_count,
            compliance_pass_rate=pass_rate,
        ))
    return AgentListResponse(agents=summaries)


@app.get("/trust-score", response_model=TrustScoreResponse, summary="0-100 Trust Score for an agent (Part B)")
async def trust_score_endpoint(
    agent_id: str = Query(..., description="The agent_id to score (e.g. 'support-bot', 'sales-bot')")
) -> TrustScoreResponse:
    """
    Returns a composite 0-100 Trust Score built from three real sub-scores:

    1. **Compliance score** (40%) — % of events where cascadeflow allowed the request.
    2. **Cost efficiency score** (30%) — how close the agent's avg cost is to the
       cheapest possible model routing.
    3. **Recall accuracy score** (30%) — Hindsight arecall is asked a factual question
       about a PAST event we already know the ground truth for (e.g. which model handled
       query #2). Score = 100 if Hindsight recalls correctly, 0 if not.

    The 'math' field in the response shows the exact calculation live.
    """
    logger.info("Computing trust score for agent_id=%s", agent_id)
    result = await compute_trust_score(agent_id)
    return TrustScoreResponse(**result)


@app.delete(
    "/agents/{agent_id}/reset",
    response_model=SessionResetResponse,
    summary="Reset a specific agent's cascadeflow budget session",
)
async def reset_agent_session(agent_id: str) -> SessionResetResponse:
    """
    Resets the cascadeflow HarnessRunContext for the given agent_id only.
    All other agents' budgets are completely unaffected — proving isolation.
    """
    previous = reset_session(agent_id)
    return SessionResetResponse(
        message=f"Agent '{agent_id}' budget reset. Other agents unaffected.",
        previous_summary=previous,
    )


@app.get("/roi", summary="ROI calculator — actual vs worst-case baseline cost")
async def roi_endpoint(
    agent_id: Optional[str] = Query(default=None, description="Agent to calculate ROI for (omit for all events)")
) -> dict:
    """
    Returns a stat card showing what the total cost WOULD have been if every
    query had used the most expensive model seen in the event history, vs what
    was actually spent thanks to intelligent routing.

    All numbers come from existing /events data — no new logic.
    """
    events = get_all_events(agent_id=agent_id)

    # Strip policy-change and demo marker pseudo-events
    billable = [
        e for e in events
        if e.get("category") not in ("__policy_change__", "__demo_marker__")
        and float(e.get("audit_event", {}).get("cost_total") or 0) > 0
    ]

    if not billable:
        return {
            "agent_id":        agent_id or "all",
            "query_count":     0,
            "actual_cost":     0.0,
            "baseline_cost":   0.0,
            "savings_dollars": 0.0,
            "savings_percent": 0.0,
            "most_expensive_model":      None,
            "most_expensive_cost_seen":  0.0,
            "note": "No billable events yet. Send some queries first.",
        }

    # Actual spend
    actual_cost = sum(float(e["audit_event"].get("cost_total") or 0) for e in billable)

    # Most expensive single-query cost in history → proxy for "always used worst model"
    costs_by_event = [(float(e["audit_event"].get("cost_total") or 0), e) for e in billable]
    max_cost_event = max(costs_by_event, key=lambda x: x[0])
    max_cost_per_query = max_cost_event[0]
    max_model = max_cost_event[1]["audit_event"].get("model") or "unknown"

    # Baseline: if EVERY query had cost max_cost_per_query
    query_count   = len(billable)
    baseline_cost = max_cost_per_query * query_count

    # Savings
    savings_dollars = round(baseline_cost - actual_cost, 6)
    savings_percent = round((savings_dollars / baseline_cost) * 100, 1) if baseline_cost > 0 else 0.0

    # Per-model breakdown
    model_breakdown: dict[str, dict] = {}
    for e in billable:
        ae    = e["audit_event"]
        model = ae.get("model") or "unknown"
        cost  = float(ae.get("cost_total") or 0)
        if model not in model_breakdown:
            model_breakdown[model] = {"count": 0, "total_cost": 0.0}
        model_breakdown[model]["count"]      += 1
        model_breakdown[model]["total_cost"] += cost

    # Round for display
    for m in model_breakdown.values():
        m["total_cost"]   = round(m["total_cost"], 6)
        m["avg_cost"]     = round(m["total_cost"] / m["count"], 6) if m["count"] else 0.0
        m["pct_of_spend"] = round(m["total_cost"] / actual_cost * 100, 1) if actual_cost else 0.0

    return {
        "agent_id":                  agent_id or "all",
        "query_count":               query_count,
        "actual_cost":               round(actual_cost, 6),
        "baseline_cost":             round(baseline_cost, 6),
        "savings_dollars":           savings_dollars,
        "savings_percent":           savings_percent,
        "most_expensive_model":      max_model,
        "most_expensive_cost_seen":  round(max_cost_per_query, 6),
        "model_breakdown":           model_breakdown,
        "math": (
            f"baseline={query_count} queries × ${max_cost_per_query:.6f}/query = ${baseline_cost:.6f}  |  "
            f"actual=${actual_cost:.6f}  |  savings=${savings_dollars:.6f} ({savings_percent}%)"
        ),
    }


@app.get("/remediations", summary="Full log of every autonomous routing fix Obsidian has applied")
async def remediations_endpoint() -> dict:
    """
    Returns every routing policy change Obsidian applied autonomously,
    plus the current live policy — so you can see before vs after.
    Used by the dashboard to display 'Obsidian detected X and fixed it at Y'.
    """
    log = get_remediation_log()   # newest first
    return {
        "total_remediations": len(log),
        "auto_applied": len(log) > 0,
        "current_policy": get_settings().routingPolicy,
        "remediations": log,
    }


@app.get("/health", include_in_schema=False)
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.5.0"}


# ── Settings & Danger Zone ────────────────────────────────────────────────────

@app.get("/settings", response_model=ObsidianSettings, summary="Get global settings")
async def get_settings_endpoint() -> ObsidianSettings:
    return get_settings()


@app.post("/settings", response_model=ObsidianSettings, summary="Save global settings")
async def save_settings_endpoint(settings: ObsidianSettings) -> ObsidianSettings:
    save_settings(settings)
    return settings


@app.get("/settings/webhook/test", summary="Test the Slack webhook")
async def test_webhook_endpoint():
    settings = get_settings()
    if not settings.webhookUrl:
        return {"success": False, "error": "No webhook URL configured"}
    
    post_slack_alert(settings.webhookUrl, "🔔 *Obsidian Test* — Your Slack webhook is working correctly!")
    return {"success": True, "message": "Test message sent to Slack"}

@app.put("/settings", response_model=ObsidianSettings, summary="Partially update global settings")
async def partial_update_settings_endpoint(partial: dict) -> ObsidianSettings:
    current = get_settings()
    updated_dict = current.model_dump()
    
    # Map snake_case keys from Prompt 1 to our existing camelCase schema
    mapping = {
        "auto_remediate": "autoRemediate",
        "block_on_budget_exhaustion": "blockOnBudget",
        "log_all_queries": "logAllQueries",
        "hindsight_enabled": "hindsightEnabled",
        "recall_similarity_threshold": "recallThreshold",
        "session_budget_cap": "budgetCap",
        "low_budget_warning_pct": "warningThreshold",
        "in_app_cost_alerts": "costAlerts",
        "slack_alerts_enabled": "slackAlerts",
        "routing_strategy": "routingStrategy",
        "default_model": "defaultModel",
        "fallback_model": "fallbackModel",
        "max_latency_budget_ms": "latencyBudget",
        "strict_sensitive_blocking": "strictSensitive",
        "pii_detection_enabled": "piiDetection",
        "jailbreak_block_enabled": "jailbreakBlock",
        "audit_log_retention_days": "auditRetention"
    }
    
    for k, v in partial.items():
        field_name = mapping.get(k, k)
        if field_name in updated_dict:
            updated_dict[field_name] = v

    new_settings = ObsidianSettings(**updated_dict)
    save_settings(new_settings)
    return new_settings


@app.delete("/admin/audit-logs", summary="Danger: Purge all audit logs", dependencies=[Depends(verify_api_key)])
async def purge_logs_endpoint() -> dict:
    purge_all_events()
    return {"success": True, "message": "All audit logs have been purged."}


@app.delete("/admin/hindsight-memory", summary="Danger: Clear Hindsight memory banks", dependencies=[Depends(verify_api_key)])
async def clear_memory_endpoint() -> dict:
    await clear_hindsight_memory()
    return {"success": True, "message": "Hindsight memory banks cleared."}


@app.post("/admin/reset-budgets", summary="Danger: Reset all active agent budgets", dependencies=[Depends(verify_api_key)])
async def reset_all_budgets_endpoint() -> dict:
    count = reset_all_budgets()
    return {"success": True, "message": f"Reset budgets for {count} agents."}

# ── OpenAI Compatible Gateway ────────────────────────────────────────────────
@app.post("/v1/chat/completions", summary="OpenAI compatible chat completions gateway", dependencies=[Depends(verify_api_key)])
async def openai_chat_completions(
    body: OpenAIChatRequest,
    x_obsidian_agent_id: str = Header(...)
):
    if body.stream:
        raise HTTPException(status_code=400, detail="Streaming is not supported for this demo.")
        
    query = ""
    if body.messages:
        query = body.messages[-1].get("content", "")
        
    answer, trace_events, summary, flags = run_query(query, agent_id=x_obsidian_agent_id)
    
    # Store event in pipeline
    category = classify_category(query)
    if "pii_detected" in flags and get_settings().strictSensitive:
        category = "sensitive_data"
        
    if trace_events and not (answer.startswith("[POLICY STOP]") or answer.startswith("[BUDGET STOP]")):
        audit_event = trace_events[-1]
    else:
        action = "unknown"
        reason = "no_trace"
        if answer.startswith("[POLICY STOP]"):
            action = "block"
            reason = answer.replace("[POLICY STOP] ", "").strip()
        elif answer.startswith("[BUDGET STOP]"):
            action = "block"
            reason = "budget_exceeded"
            
        audit_event = {
            "action":          action,
            "model":           None,
            "cost_total":      0.0,
            "latency_used_ms": 0.0,
            "decision_mode":   "enforce",
            "timestamp_ms":    time.time() * 1000,
            "run_id":          "n/a",
            "step":            0,
            "reason":          reason,
            "query":           query,
        }
    audit_event["agent_id"] = x_obsidian_agent_id
    audit_event["flags"] = flags
    
    await store_event(category, audit_event, agent_id=x_obsidian_agent_id)
    
    # Return OpenAI shape
    return {
        "id": "chatcmpl-demo",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": body.model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": answer
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }
