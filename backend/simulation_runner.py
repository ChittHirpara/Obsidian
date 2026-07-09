"""
simulation_runner.py
---------------------
Concurrent multi-agent simulation engine.

Runs 3 agent workers (Support / Sales / Internal-Ops) concurrently against
the SAME cascadeflow + Hindsight backend instance — proving shared-infrastructure
behavior, not 3 isolated sandboxes.

Each synthetic request goes through the full existing pipeline:
  classify_category → select model tier → @harness_agent → Groq →
  cascadeflow audit → Hindsight store → compliance check → agent event store

The runner is controlled via:
  POST /simulation/start  { req_per_min_support, req_per_min_sales, req_per_min_internal_ops }
  POST /simulation/stop
  GET  /simulation/status
"""

from __future__ import annotations

import asyncio
import logging
import random
import time
from dataclasses import dataclass, field
from typing import Optional

from agent_profiles import AgentProfile, ALL_PROFILES, get_profile
from obsidian_core import classify_category, DEFAULT_MODEL, CHEAP_FALLBACK_MODEL
from cascadeflow.harness.api import _current_run
from cascadeflow.schema.exceptions import BudgetExceededError, HarnessStopError
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("obsidian.simulation")

# Lazy Groq client for simulation (same credentials as obsidian_core)
_sim_groq: Optional[OpenAI] = None

def _get_groq() -> OpenAI:
    global _sim_groq
    if _sim_groq is None:
        _sim_groq = OpenAI(
            api_key=os.environ["GROQ_API_KEY"],
            base_url="https://api.groq.com/openai/v1",
        )
    return _sim_groq


# ── SimConfig ─────────────────────────────────────────────────────────────────
@dataclass
class SimConfig:
    req_per_min_support:      float = 4.0   # ~1 req every 15s
    req_per_min_sales:        float = 6.0   # ~1 req every 10s  (higher traffic = more cost)
    req_per_min_internal_ops: float = 3.0   # ~1 req every 20s

    def interval_for(self, agent_id: str) -> float:
        """Return sleep interval in seconds between requests for this agent."""
        rpm = {
            "support":      self.req_per_min_support,
            "sales":        self.req_per_min_sales,
            "internal_ops": self.req_per_min_internal_ops,
        }.get(agent_id, 4.0)
        return max(60.0 / rpm, 2.0)   # minimum 2s between requests


# ── Core request logic (synchronous — runs in thread pool) ────────────────────
def _sync_agent_request(profile: AgentProfile, query: str) -> dict:
    """
    Run a single query through the full cascadeflow + Groq pipeline for a given agent.
    This is synchronous and must be called via asyncio.to_thread().

    Returns a rich event dict suitable for agent_event_store.
    """
    import cascadeflow
    from cascadeflow.harness.api import _current_run

    ctx = profile.ensure_session()
    # Re-register in *this thread's* ContextVar copy so cascadeflow intercepts correctly
    _current_run.set(ctx)

    category = classify_category(query)
    model, routing_reason = profile.select_model(query, category)

    answer = ""
    action = "allow"
    blocked = False
    cost_total = 0.0
    latency_ms = 0.0
    budget_state: dict = {}
    trace_step = 0

    t0 = time.time()
    try:
        @cascadeflow.harness_agent(
            budget=profile.budget,
            compliance="gdpr",
            kpi_weights={"quality": 0.6, "cost": 0.3, "latency": 0.1},
        )
        def _call_llm(q: str) -> str:
            resp = _get_groq().chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": profile.system_prompt},
                    {"role": "user",   "content": q},
                ],
                max_tokens=256,
            )
            return resp.choices[0].message.content or ""

        answer = _call_llm(query)

    except BudgetExceededError as exc:
        answer = f"[BUDGET_STOP] Agent '{profile.agent_id}' hit ${profile.budget:.2f} cap."
        action = "stop"
        blocked = True
    except HarnessStopError as exc:
        answer = f"[POLICY_STOP] {getattr(exc, 'reason', str(exc))}"
        action = "stop"
        blocked = True
    except Exception as exc:
        answer = f"[ERROR] {exc}"
        action = "allow"
        logger.warning("Agent %s request error: %s", profile.agent_id, exc)

    latency_ms = (time.time() - t0) * 1000

    # Pull trace from the cascadeflow context
    try:
        trace = ctx.trace()
        summary = ctx.summary()
        if trace:
            last = trace[-1]
            cost_total    = float(last.get("cost_total", 0))
            action        = last.get("action", action)
            trace_step    = last.get("step", 0)
        budget_state = summary.get("budget_state", {})
        if not budget_state and summary:
            # Some versions of cascadeflow put budget directly in summary
            budget_state = {
                "remaining": summary.get("budget_remaining", profile.budget),
                "max": profile.budget,
            }
    except Exception:
        pass

    compliance_violations = profile.check_compliance(query, answer)

    audit_event = {
        "agent_id":          profile.agent_id,
        "agent_name":        profile.name,
        "action":            action,
        "model":             model,
        "model_tier":        "primary" if model == profile.model_primary else "fallback",
        "routing_reason":    routing_reason,
        "cost_total":        cost_total,
        "latency_used_ms":   latency_ms,
        "decision_mode":     "enforce",
        "timestamp_ms":      time.time() * 1000,
        "step":              trace_step,
        "query":             query,
        "response_snippet":  answer[:200],
        "budget_state":      budget_state,
        "blocked":           blocked,
        "compliance_pass":   len(compliance_violations) == 0,
        "compliance_violations": compliance_violations,
    }

    return {
        "timestamp_ms": audit_event["timestamp_ms"],
        "category":     category,
        "agent_id":     profile.agent_id,
        "audit_event":  audit_event,
    }


# ── SimulationRunner ──────────────────────────────────────────────────────────
class SimulationRunner:
    def __init__(self) -> None:
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._config = SimConfig()
        self._start_time: Optional[float] = None
        self._request_counts: dict[str, int] = {k: 0 for k in ALL_PROFILES}
        self._lock = asyncio.Lock()

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def elapsed_seconds(self) -> float:
        if self._start_time is None:
            return 0.0
        return time.time() - self._start_time

    @property
    def request_counts(self) -> dict[str, int]:
        return dict(self._request_counts)

    def configure(self, **kwargs: float) -> None:
        """Update SimConfig fields by name."""
        for k, v in kwargs.items():
            if hasattr(self._config, k):
                setattr(self._config, k, float(v))

    async def start(self) -> None:
        async with self._lock:
            if self._running:
                return
            self._running = True
            self._start_time = time.time()
            self._request_counts = {k: 0 for k in ALL_PROFILES}
            self._task = asyncio.create_task(self._run_all())
            logger.info("Simulation started: %s", self._config)

    async def stop(self) -> None:
        async with self._lock:
            if not self._running:
                return
            self._running = False
            if self._task:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
                self._task = None
        logger.info("Simulation stopped after %.1fs", self.elapsed_seconds)

    async def _run_all(self) -> None:
        """Run all agent loops concurrently."""
        try:
            await asyncio.gather(
                *[self._agent_loop(profile) for profile in ALL_PROFILES.values()]
            )
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("Simulation runner crashed: %s", exc)
        finally:
            self._running = False

    async def _agent_loop(self, profile: AgentProfile) -> None:
        """Continuous request loop for one agent. Runs until stopped."""
        interval = self._config.interval_for(profile.agent_id)
        # Stagger start times so all 3 don't fire simultaneously at t=0
        await asyncio.sleep(random.uniform(0, interval * 0.5))

        while self._running:
            query = random.choice(profile.query_bank)
            try:
                # Run the synchronous LLM call in a thread pool so we don't block the event loop
                event = await asyncio.to_thread(_sync_agent_request, profile, query)
                self._request_counts[profile.agent_id] = (
                    self._request_counts.get(profile.agent_id, 0) + 1
                )
                # Import here to avoid circular import
                from hindsight_store import store_agent_event
                await store_agent_event(event)
                logger.debug(
                    "Agent %-12s | %-14s | model=%-28s | cost=$%.5f | violations=%d",
                    profile.agent_id,
                    event["category"],
                    event["audit_event"]["model"],
                    event["audit_event"]["cost_total"],
                    len(event["audit_event"]["compliance_violations"]),
                )
            except asyncio.CancelledError:
                return
            except Exception as exc:
                logger.warning("Agent %s request failed: %s", profile.agent_id, exc)

            # Add ±20% jitter to the interval to simulate realistic variance
            jitter = interval * random.uniform(-0.2, 0.2)
            await asyncio.sleep(max(interval + jitter, 1.0))


# ── Singleton ─────────────────────────────────────────────────────────────────
simulation = SimulationRunner()
