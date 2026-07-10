import json
import os
import threading
from typing import Optional
from pydantic import BaseModel

SETTINGS_FILE = "obsidian_settings.json"
_settings_lock = threading.Lock()

class ObsidianSettings(BaseModel):
    # Agent Behaviour
    autoRemediate: bool = True
    blockOnBudget: bool = True
    logAllQueries: bool = True
    streamEvents: bool = True
    hindsightEnabled: bool = True
    recallThreshold: float = 0.72

    # Budget & Cost Controls
    budgetCap: float = 1.00
    warningThreshold: int = 40
    costAlerts: bool = True
    slackAlerts: bool = False

    # Model & Routing
    routingStrategy: str = "category-based"
    defaultModel: str = "llama-3.3-70b-versatile"
    fallbackModel: str = "llama-3.1-8b-instant"
    latencyBudget: int = 5000
    routingPolicy: dict[str, dict[str, str]] = {
        "order_status": {"model": "llama-3.3-70b-versatile", "action": "allow", "priority": "High"},
        "refund": {"model": "llama-3.3-70b-versatile", "action": "allow", "priority": "High"},
        "sensitive_data": {"model": "llama-3.3-70b-versatile", "action": "block", "priority": "Critical"},
        "general_faq": {"model": "llama-3.3-70b-versatile", "action": "allow", "priority": "Low"}
    }

    # Safety & Compliance Policies
    strictSensitive: bool = True
    piiDetection: bool = True
    jailbreakBlock: bool = True
    auditRetention: str = "30"

    # Integration & API (read-only mostly, but kept for state)
    webhookUrl: str = ""
    corsOrigins: str = "http://localhost:3000"
    apiKey: str = "obsidian-demo-key"


def get_settings() -> ObsidianSettings:
    """Read settings from disk, or return defaults if file doesn't exist."""
    with _settings_lock:
        if not os.path.exists(SETTINGS_FILE):
            return ObsidianSettings()
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return ObsidianSettings(**data)
        except Exception:
            # If JSON is corrupted or invalid schema, return defaults
            return ObsidianSettings()


def save_settings(new_settings: ObsidianSettings) -> None:
    """Save settings to disk."""
    with _settings_lock:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            f.write(new_settings.model_dump_json(indent=2))
