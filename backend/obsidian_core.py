
"""
obsidian_core.py
-----------------
cascadeflow-wrapped Groq handler + query category classifier + routing policy.
Used by main.py (FastAPI) for every POST /query request.

Budget enforcement design
--------------------------
cascadeflow's budget check fires BEFORE each call using the current run's
accumulated cost. The `HarnessRunContext` stores cost as a plain float — it's
the same object across calls. But because cascadeflow uses a `ContextVar` to
store the active run, each async FastAPI handler starts with `get_current_run()`
returning None.

Fix: We keep ONE persistent `HarnessRunContext` object in `_active_ctx`. At the
start of each `run_query()` call, we call `_current_run.set(_active_ctx)` to
re-register it in the current async context. The budget accumulates across
calls because it's the same object, and the enforce check fires correctly.

To reset the budget mid-demo, call `reset_session()` or hit DELETE /session.

Routing policy design
----------------------
- Per-category model assignments, stored in-memory with thread-safe access (using threading.Lock)
- Default policy uses expensive model (qwen/qwen3-32b) for all categories
- Cheaper fallback: llama-3.1-8b-instant
- sensitive_data is permanently locked to default expensive model and cannot be downgraded, per governance guardrail
"""

from __future__ import annotations

import os
import threading
from dotenv import load_dotenv
import cascadeflow
from cascadeflow.harness.api import HarnessRunContext, _current_run, run as _cf_run
from cascadeflow.schema.exceptions import BudgetExceededError, HarnessStopError
from openai import OpenAI
from typing import Literal, TypedDict
import re

from settings_store import get_settings

# Load environment variables from .env file
load_dotenv()

# ── Groq client (OpenAI-compatible) ──────────────────────────────────────────
_groq_client = OpenAI(
    api_key=os.environ["GROQ_API_KEY"],
    base_url="https://api.groq.com/openai/v1",
)

# ── cascadeflow: enforce mode ─────────────────────────────────────────────────
cascadeflow.init(mode="enforce")

# Model definitions (valid Groq model names) - Defaults
DEFAULT_MODEL = "llama-3.3-70b-versatile"
CHEAP_FALLBACK_MODEL = "llama-3.1-8b-instant"
CATEGORIES = Literal["order_status", "refund", "sensitive_data", "general_faq"]
DEMO_BUDGET = 1.00

# ── Persistent HarnessRunContexts per agent ────────────────────────────────────
_session_lock = threading.Lock()
_active_ctxs: dict[str, HarnessRunContext] = {}
_session_cms: dict[str, object] = {}

# ── Routing Policy ────────────────────────────────────────────────────────────
_routing_lock = threading.Lock()

# ── Remediation log — written by apply_routing_fix on every real policy change ──
# Each entry: { applied_at_ms, category, old_model, new_model, reason, escalation_rate }
_remediation_log: list[dict] = []


def get_remediation_log() -> list[dict]:
    """Return all recorded autonomous routing fixes, newest first."""
    with _routing_lock:
        return list(reversed(_remediation_log))


class RoutingPolicyChange(TypedDict):
    category: CATEGORIES
    old_model: str
    new_model: str
    reason: str


def _make_ctx() -> HarnessRunContext:
    """Create a fresh HarnessRunContext via cascadeflow.run().__enter__()."""
    settings = get_settings()
    budget = float(settings.budgetCap)
    cm = _cf_run(budget=budget, max_tool_calls=10)
    ctx = cm.__enter__()
    return ctx, cm


def _ensure_session(agent_id: str) -> HarnessRunContext:
    """Return (or lazily create) the persistent HarnessRunContext for this agent."""
    global _active_ctxs, _session_cms
    with _session_lock:
        if agent_id not in _active_ctxs:
            ctx, cm = _make_ctx()
            _active_ctxs[agent_id] = ctx
            _session_cms[agent_id] = cm
    return _active_ctxs[agent_id]


def reset_session(agent_id: str = "default") -> dict:
    """Close the current session and start a fresh one for the agent. Returns the old summary. Also resets routing policy to defaults."""
    global _active_ctxs, _session_cms, _routing_policy, _remediation_log
    with _session_lock:
        old_summary: dict = {}
        if agent_id in _active_ctxs:
            try:
                old_summary = _active_ctxs[agent_id].summary()
            except Exception:
                pass
        if agent_id in _session_cms:
            try:
                _session_cms[agent_id].__exit__(None, None, None)
            except Exception:
                pass
        
        ctx, cm = _make_ctx()
        _active_ctxs[agent_id] = ctx
        _session_cms[agent_id] = cm
    # Also reset routing policy and remediation log
    with _routing_lock:
        settings = get_settings()
        settings.routingPolicy = {
            "order_status": {"model": settings.defaultModel, "action": "allow", "priority": "High"},
            "refund": {"model": settings.defaultModel, "action": "allow", "priority": "High"},
            "sensitive_data": {"model": settings.defaultModel, "action": "block", "priority": "Critical"},
            "general_faq": {"model": settings.defaultModel, "action": "allow", "priority": "Low"}
        }
        from settings_store import save_settings
        save_settings(settings)
        _remediation_log.clear()
    return old_summary

def reset_all_budgets() -> int:
    """Close all sessions and start fresh for all active agents. Returns count of agents reset."""
    global _active_ctxs, _session_cms
    count = 0
    with _session_lock:
        for agent_id in list(_active_ctxs.keys()):
            try:
                if agent_id in _session_cms:
                    _session_cms[agent_id].__exit__(None, None, None)
            except Exception:
                pass
            ctx, cm = _make_ctx()
            _active_ctxs[agent_id] = ctx
            _session_cms[agent_id] = cm
            count += 1
    return count





def apply_routing_fix(suggestion: dict) -> tuple[bool, str, RoutingPolicyChange | None]:
    """
    Apply a routing fix from a structured suggestion.
    Returns (success: bool, message: str, change: RoutingPolicyChange | None)
    """
    with _routing_lock:
        settings = get_settings()
        policy = settings.routingPolicy
        
        # Extract category from structured suggestion
        category = suggestion.get("category")
        if category not in policy:
            return False, "No valid category in structured suggestion", None
        
        # Governance guardrail: never downgrade sensitive_data
        if category == "sensitive_data":
            return False, "Governance guardrail: sensitive_data queries may not be automatically downgraded", None
        
        cheap_model = settings.fallbackModel or CHEAP_FALLBACK_MODEL
        
        old_model = policy[category].get("model", settings.defaultModel)
        # Check if it's already using the cheap model
        if old_model == cheap_model:
            return False, "No change needed: already using cheaper model", None
        
        # Apply the fix — mutates the live routing policy immediately
        import time as _time
        from settings_store import save_settings
        policy[category]["model"] = cheap_model
        settings.routingPolicy = policy
        save_settings(settings)
        applied_at_ms = _time.time() * 1000
        reason_str = f"Cost escalation detected: {suggestion.get('escalation_rate', 'unknown')} escalation rate"
        change = RoutingPolicyChange(
            category=category,
            old_model=old_model,
            new_model=cheap_model,
            reason=reason_str,
        )
        # Record in remediation log so GET /insights can surface it
        _remediation_log.append({
            "applied_at_ms":    applied_at_ms,
            "applied_at_iso":   _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime(applied_at_ms / 1000)),
            "category":         category,
            "old_model":        old_model,
            "new_model":        cheap_model,
            "reason":           reason_str,
            "escalation_rate":  suggestion.get("escalation_rate"),
        })
        return True, "Routing fix applied successfully", change


# ── Category classifier ───────────────────────────────────────────────────────
_CATEGORY_RULES: list[tuple[list[str], str]] = [
    (["order", "#", "tracking", "shipment", "delivery", "where is my"], "order_status"),
    (["refund", "money back", "charge", "cancel", "return"], "refund"),
    (["credit card", "ssn", "password", "cvv", "card number", "bank account",
      "social security", "date of birth", "personal"], "sensitive_data"),
]


def classify_category(query: str) -> str:
    """Return one of: order_status | refund | sensitive_data | general_faq."""
    lower = query.lower()
    for keywords, category in _CATEGORY_RULES:
        if any(kw in lower for kw in keywords):
            return category
    return "general_faq"


# ── cascadeflow agent decorator ───────────────────────────────────────────────
# We need a way to pass model dynamically. Let's modify approach!
# Wait: cascadeflow.harness_agent decorator binds to the model at definition time?
# Oh, maybe better to handle model selection inside the function and use cascadeflow with variable model?
# Wait, let's check: the original _handle_query uses MODEL directly. Let's adjust to make it use a parameter.

# Let's rewrite this part to allow dynamic model
def _create_handle_query(model: str):
    @cascadeflow.harness_agent(
        budget=DEMO_BUDGET,
        compliance="gdpr",
        kpi_weights={"quality": 0.6, "cost": 0.3, "latency": 0.1},
    )
    def _inner_handle_query(query: str) -> str:
        resp = _groq_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": query}],
        )
        return resp.choices[0].message.content
    return _inner_handle_query


def run_query(query: str, agent_id: str = "default") -> tuple[str, list[dict], dict, list[str]]:
    """
    Run a query through the persistent cascadeflow enforce-mode session.

    Key: We call `_current_run.set(ctx)` at the start of every request so the
    cascadeflow interceptor sees the correct accumulated-cost HarnessRunContext
    for this specific agent.
    """
    ctx = _ensure_session(agent_id)
    settings = get_settings()
    
    # Dynamically update the active context's budget in case it changed via PUT /settings
    ctx.budget_max = float(settings.budgetCap)

    # Re-register the persistent context in the current async task's ContextVar
    _current_run.set(ctx)

    flags = []
    try:
        # Pre-flight compliance checks
        if settings.piiDetection:
            has_cc = re.search(r'\b(?:\d[ -]*?){13,19}\b', query)
            has_ssn = re.search(r'\b\d{3}-\d{2}-\d{4}\b', query) or "ssn" in query.lower()
            has_email = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', query)
            
            if has_cc or has_ssn or has_email or "credit card" in query.lower():
                flags.append("pii_detected")
                
        if settings.jailbreakBlock:
            q_lower = query.lower()
            if "ignore previous instructions" in q_lower or "ignore all previous instructions" in q_lower or "disregard your rules" in q_lower or "you are now dan" in q_lower or "system prompt:" in q_lower:
                flags.append("jailbreak_attempt")
                raise HarnessStopError("Prompt injection / jailbreak attempt detected. Blocked.", reason="jailbreak_attempt")
                
        # Classify query
        category = classify_category(query)
        if "pii_detected" in flags and settings.strictSensitive:
            category = "sensitive_data"
            
        with _routing_lock:
            policy = settings.routingPolicy.get(category, {})
            if policy.get("action") == "block":
                raise HarnessStopError("Query blocked by routing policy.", reason="policy_blocked")
                
            if settings.routingStrategy == "single-model":
                model = settings.defaultModel
            else:
                model = policy.get("model", settings.defaultModel)

        # Create the handle_query function with the correct model and run it
        handle_query = _create_handle_query(model)
        answer = handle_query(query)
    except BudgetExceededError as exc:
        if settings.blockOnBudget:
            answer = (
                f"[BUDGET STOP] ₹{abs(getattr(exc, 'remaining', 0)):.4f} over the "
                f"₹{settings.budgetCap:.4f} cap. Query blocked by Obsidian. "
                f"Use DELETE /session to reset for a new demo run."
            )
        else:
            # Bypass budget stop
            answer = handle_query(query) if 'handle_query' in locals() else "[ERROR] Budget Exceeded & bypass failed."
    except HarnessStopError as exc:
        answer = f"[POLICY STOP] {getattr(exc, 'reason', str(exc))}"
    except Exception as exc:
        answer = f"[ERROR] {exc}"

    try:
        trace_events = ctx.trace()
        summary = ctx.summary()
    except Exception:
        trace_events = []
        summary = {}

    return answer, trace_events, summary, flags
