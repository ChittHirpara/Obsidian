"""
agent_profiles.py
------------------
AgentProfile — wraps the existing single-agent cascadeflow config into an
instantiable shape that can run multiple concurrent agents against the same
cascadeflow + Hindsight backend.

Each profile owns:
  - Its own HarnessRunContext (independent budget tracking per agent)
  - A routing policy (which model tier to use and when to escalate)
  - A compliance rule set (application-level checks on top of cascadeflow)
  - A system prompt / persona for synthetic traffic
  - A synthetic query bank appropriate to the persona

The 'support' profile is the existing single-agent config refactored into this
shape — nothing regresses; POST /query still works identically.
"""

from __future__ import annotations

import os
import re
import threading
from dataclasses import dataclass, field
from typing import Callable, Literal, Optional

from cascadeflow.harness.api import HarnessRunContext, run as _cf_run

# ── Model tiers (matching obsidian_core.py) ───────────────────────────────────
MODEL_PRIMARY  = "llama-3.3-70b-versatile"
MODEL_FALLBACK = "llama-3.1-8b-instant"

# ── Per-agent budget cap (independent from single-agent DEMO_BUDGET) ──────────
AGENT_BUDGET = float(os.getenv("AGENT_BUDGET", "1.00"))


# ── ComplianceRule ─────────────────────────────────────────────────────────────
@dataclass
class ComplianceRule:
    """
    An application-level compliance rule that runs AFTER the cascadeflow pipeline.
    check(query, response) returns True if the rule is VIOLATED.
    """
    rule_id: str
    description: str
    check: Callable[[str, str], bool]
    severity: Literal["warn", "block"] = "warn"


# ── AgentProfile ───────────────────────────────────────────────────────────────
@dataclass
class AgentProfile:
    """
    A self-contained agent persona with its own cascadeflow session, routing
    policy, and compliance rule set.

    Runtime state (_ctx, _ctx_cm, _lock) is initialised lazily on first use.
    """
    agent_id: str
    name: str
    color: str                       # UI accent colour hex
    budget: float
    model_primary: str
    model_fallback: str
    system_prompt: str
    escalation_keywords: list[str]   # query keywords that force primary model
    compliance_rules: list[ComplianceRule]
    query_bank: list[str]            # synthetic query pool for the simulator

    # Runtime — not included in repr / equality
    _lock: threading.Lock    = field(default_factory=threading.Lock, repr=False, compare=False)
    _ctx:  Optional[HarnessRunContext] = field(default=None, repr=False, compare=False)
    _ctx_cm: Optional[object]          = field(default=None, repr=False, compare=False)

    # ── cascadeflow session management ────────────────────────────────────────
    def ensure_session(self) -> HarnessRunContext:
        """Return (lazily creating) the persistent HarnessRunContext for this agent."""
        with self._lock:
            if self._ctx is None:
                cm = _cf_run(budget=self.budget, max_tool_calls=10)
                self._ctx = cm.__enter__()
                self._ctx_cm = cm
        return self._ctx

    def reset_session(self) -> dict:
        """Close the current session and start a fresh one. Returns previous summary."""
        with self._lock:
            old: dict = {}
            if self._ctx is not None:
                try:
                    old = self._ctx.summary()
                except Exception:
                    pass
            if self._ctx_cm is not None:
                try:
                    self._ctx_cm.__exit__(None, None, None)
                except Exception:
                    pass
            cm = _cf_run(budget=self.budget, max_tool_calls=10)
            self._ctx = cm.__enter__()
            self._ctx_cm = cm
        return old

    # ── Routing ───────────────────────────────────────────────────────────────
    def select_model(self, query: str, category: str) -> tuple[str, str]:
        """
        Return (model_name, routing_reason).

        Escalation logic:
        - sensitive_data always uses primary (compliance requirement)
        - If the query contains an escalation keyword → primary
        - Otherwise → fallback (cheaper)
        """
        if category == "sensitive_data":
            return self.model_primary, "compliance:sensitive_data"

        q = query.lower()
        for kw in self.escalation_keywords:
            if kw in q:
                return self.model_primary, f"escalation_keyword:{kw}"

        return self.model_fallback, "routine_query:fallback"

    # ── Compliance ────────────────────────────────────────────────────────────
    def check_compliance(self, query: str, response: str) -> list[dict]:
        """
        Run all compliance rules. Returns a list of violation records (empty = pass).
        """
        violations: list[dict] = []
        for rule in self.compliance_rules:
            try:
                violated = rule.check(query, response)
            except Exception:
                violated = False
            if violated:
                violations.append({
                    "rule_id": rule.rule_id,
                    "description": rule.description,
                    "severity": rule.severity,
                    "query_snippet": query[:120],
                    "response_snippet": response[:120] if response else "",
                })
        return violations


# ── Compliance rule helpers ───────────────────────────────────────────────────

def _contains_any(text: str, patterns: list[str]) -> bool:
    t = text.lower()
    return any(p in t for p in patterns)

def _price_without_citation(query: str, response: str) -> bool:
    """Violated if Sales response contains specific price ($X.XX) without citing a source."""
    price_in_response = bool(re.search(r'\$\d+[\d,.]*', response))
    citation_in_response = _contains_any(response, ["according to", "per our pricing", "see pricing page",
                                                      "listed at", "official price", "published rate"])
    price_query = _contains_any(query, ["price", "cost", "quote", "discount", "rate", "tier", "plan", "compare"])
    return price_in_response and price_query and not citation_in_response

def _pii_in_response(query: str, response: str) -> bool:
    """Violated if response contains patterns that look like PII."""
    pii_patterns = [
        r'\b\d{3}-\d{2}-\d{4}\b',             # SSN
        r'\b4[0-9]{12}(?:[0-9]{3})?\b',        # Visa card
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # email
        r'\b\d{10,}\b',                         # long number sequences (phone/acct)
    ]
    return any(re.search(p, response) for p in pii_patterns)

def _sensitive_data_query(query: str, response: str) -> bool:
    """Always flag internal-ops queries about sensitive data — requires enhanced logging."""
    return _contains_any(query, ["employee", "payroll", "salary", "ssn", "social security",
                                  "password", "api key", "secret", "credential", "bank account",
                                  "credit card", "cvv", "personal data", "pii"])

def _no_kb_citation(query: str, response: str) -> bool:
    """Violated if Support response looks like a hallucination (no grounding)."""
    # Heuristic: short responses on factual questions with no policy reference
    factual_query = _contains_any(query, ["policy", "return", "refund", "how do i", "what is", "how long"])
    no_citation = not _contains_any(response, ["our policy", "according to", "per our", "your order",
                                                "we offer", "you can", "please visit", "refer to"])
    too_short = len(response) < 80
    return factual_query and no_citation and too_short

def _competitor_disparagement(query: str, response: str) -> bool:
    """Violated if Sales disparages a competitor by name."""
    competitors = ["competitor", "rival", "other vendor", "alternative"]
    disparage = ["worse", "inferior", "bad", "terrible", "avoid", "don't use", "stay away"]
    return _contains_any(query, competitors) and _contains_any(response, disparage)


# ── Profile Definitions ───────────────────────────────────────────────────────

SUPPORT_PROFILE = AgentProfile(
    agent_id="support",
    name="Customer Support",
    color="#0D9488",   # teal
    budget=AGENT_BUDGET,
    model_primary=MODEL_PRIMARY,
    model_fallback=MODEL_FALLBACK,
    system_prompt=(
        "You are a helpful customer support agent. "
        "Answer questions about orders, refunds, and policies concisely. "
        "Always reference company policy when relevant. "
        "Never reveal personal data. Keep answers under 100 words."
    ),
    escalation_keywords=[
        # Support rarely escalates — only complex/legal situations
        "legal", "lawsuit", "fraud", "dispute", "chargeback", "attorney",
    ],
    compliance_rules=[
        ComplianceRule(
            rule_id="require_grounding",
            description="Response must cite policy or company info — not a bare hallucination",
            check=_no_kb_citation,
            severity="warn",
        ),
        ComplianceRule(
            rule_id="no_pii_disclosure",
            description="Response must not expose PII patterns",
            check=_pii_in_response,
            severity="block",
        ),
    ],
    query_bank=[
        "Where is my order #12345?",
        "Can you give me the tracking for my shipment?",
        "Has my order shipped yet?",
        "What is the delivery date for my package?",
        "I want a refund for my last purchase.",
        "Cancel my order and give me my money back.",
        "How do I return this item for a refund?",
        "What's your return policy?",
        "charge error on my account, need refund",
        "Can I get a refund please?",
        "My package was delivered damaged — what do I do?",
        "How long does a refund take to process?",
        "I didn't receive my order but tracking shows delivered.",
        "What are your business hours?",
        "Do you have a physical store?",
        "How can I contact customer support?",
        "What is your privacy policy?",
        "Are you open on weekends?",
        "How do I update my shipping address?",
        "Can I change my order before it ships?",
    ],
)

SALES_PROFILE = AgentProfile(
    agent_id="sales",
    name="Sales",
    color="#6366F1",   # indigo
    budget=AGENT_BUDGET,
    model_primary=MODEL_PRIMARY,
    model_fallback=MODEL_FALLBACK,
    system_prompt=(
        "You are a sales assistant helping prospects evaluate our product. "
        "Address pricing, competitor comparisons, and objection handling. "
        "Always cite the official pricing page when quoting prices. "
        "Be persuasive but accurate. Keep answers under 150 words."
    ),
    escalation_keywords=[
        # Sales escalates often — complex competitive/pricing questions need the better model
        "competitor", "vs ", "versus", "compare", "alternative", "pricing", "price",
        "quote", "discount", "enterprise", "roi", "contract", "negotiate", "volume",
        "cost", "tier", "plan", "feature", "benchmark", "switch", "migration",
    ],
    compliance_rules=[
        ComplianceRule(
            rule_id="no_unverified_pricing",
            description="Price quotes must cite an official source",
            check=_price_without_citation,
            severity="warn",
        ),
        ComplianceRule(
            rule_id="no_competitor_disparagement",
            description="Must not disparage competitors by name",
            check=_competitor_disparagement,
            severity="warn",
        ),
    ],
    query_bank=[
        "How does your pricing compare to Competitor X?",
        "What's the volume discount for 500 units?",
        "Can you beat a quote of $12.50 per unit?",
        "What features does the Enterprise tier include?",
        "We're evaluating you vs alternatives — what's your advantage?",
        "What is the ROI timeline for your solution?",
        "Can we negotiate the contract length?",
        "What's the difference between your Starter and Pro plans?",
        "Do you offer a free trial?",
        "What's the cost per seat for 100 users?",
        "How do you compare on performance benchmarks?",
        "What's your pricing for the API tier?",
        "Do you have a non-profit discount?",
        "Can we get custom pricing for a 3-year deal?",
        "What's included in onboarding?",
        "How does your solution compare to the market leader?",
        "What's the cost if we need to scale to 10x traffic?",
        "Is there an exit fee if we switch providers?",
        "What's the SLA for the Enterprise plan?",
        "Can you match a competitor's pricing?",
    ],
)

INTERNAL_OPS_PROFILE = AgentProfile(
    agent_id="internal_ops",
    name="Internal Ops",
    color="#D97706",   # amber
    budget=AGENT_BUDGET,
    model_primary=MODEL_PRIMARY,
    model_fallback=MODEL_FALLBACK,
    system_prompt=(
        "You are an internal operations assistant with access to company systems. "
        "Handle queries about HR, finance, IT operations, and compliance. "
        "Apply strict data governance: never expose PII or credentials. "
        "All sensitive data requests require approval workflow. Keep answers under 120 words."
    ),
    escalation_keywords=[
        # Internal ops escalates on anything sensitive or complex
        "employee", "payroll", "salary", "report", "compliance", "audit",
        "access", "permission", "security", "credential", "api key", "secret",
        "database", "backup", "incident", "breach", "gdpr", "hipaa",
    ],
    compliance_rules=[
        ComplianceRule(
            rule_id="no_pii_in_response",
            description="Response must not contain PII (SSN, email, phone, account numbers)",
            check=_pii_in_response,
            severity="block",
        ),
        ComplianceRule(
            rule_id="sensitive_data_audit",
            description="Any query touching personal/financial data requires enhanced audit logging",
            check=_sensitive_data_query,
            severity="warn",   # always fires on sensitive queries — intentional for demo
        ),
    ],
    query_bank=[
        "Pull the monthly expense report for Q2",
        "What's the SSH access policy for prod servers?",
        "List all employees who joined this quarter",          # → sensitive_data_audit fires
        "What's the API key rotation schedule?",
        "Generate a report of all customer credit card charges",  # → sensitive_data category → block
        "What's the IT security incident response process?",
        "How do I request elevated database permissions?",
        "What's the GDPR compliance checklist for new features?",
        "Who has admin access to the production environment?",  # → sensitive_data_audit fires
        "What's the process for offboarding an employee?",      # → employee keyword → escalation
        "Pull payroll data for the engineering team",           # → payroll keyword → escalation + audit
        "What are the current backup retention policies?",
        "How do I submit a HIPAA compliance report?",
        "What's the approved vendor list for cloud services?",
        "Request an audit log export for Q3",
        "What's the process for handling a data breach?",       # → breach keyword → escalation
        "How do I set up SSO for a new internal tool?",
        "What's the company's acceptable use policy?",
        "Generate a headcount report by department",            # → employee keyword → escalation
        "What security certifications does our infra hold?",
    ],
)

# ── Registry ─────────────────────────────────────────────────────────────────
ALL_PROFILES: dict[str, AgentProfile] = {
    p.agent_id: p
    for p in [SUPPORT_PROFILE, SALES_PROFILE, INTERNAL_OPS_PROFILE]
}


def get_profile(agent_id: str) -> AgentProfile:
    """Raise KeyError if agent_id not found."""
    return ALL_PROFILES[agent_id]
