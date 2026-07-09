"""
slack_alerts.py
----------------
One function. No retry. No config endpoint.
Fires a POST to the hardcoded Slack incoming-webhook URL when called.
"""

import logging
import threading

import requests

logger = logging.getLogger("obsidian.slack")

SLACK_WEBHOOK_URL = (
    "https://hooks.slack.com/services/"
    "T0BFVD343RV/B0BG4HASEUT/6Xyp6y6kzr8rZbATPd8yetb0"
)


def post_slack_alert(agent_id: str, reason: str, cost: float, action: str) -> None:
    """
    Fire-and-forget Slack alert.
    Runs in a daemon thread so it never blocks the API response.

    Args:
        agent_id: e.g. "support-bot"
        reason:   short human reason, e.g. "90% budget consumed" or "compliance stop"
        cost:     cost_total of the triggering event
        action:   cascadeflow action string, e.g. "stop", "switch_model"
    """
    text = (
        f"⚠️ *[{agent_id}]* {reason} — "
        f"cost=${cost:.5f}, action=`{action}`"
    )

    def _send() -> None:
        try:
            resp = requests.post(
                SLACK_WEBHOOK_URL,
                json={"text": text},
                timeout=5,
            )
            if resp.status_code != 200:
                logger.warning(
                    "Slack alert returned %s: %s", resp.status_code, resp.text[:120]
                )
            else:
                logger.info("Slack alert sent: %s", text)
        except Exception as exc:
            logger.warning("Slack alert failed (non-critical): %s", exc)

    threading.Thread(target=_send, daemon=True).start()
