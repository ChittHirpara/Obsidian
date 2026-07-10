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


def post_slack_alert(webhook_url: str, text: str) -> None:
    """
    Fire-and-forget Slack alert using the provided webhook URL.
    Runs in a daemon thread so it never blocks the API response.
    """
    if not webhook_url:
        logger.warning("No slack webhook URL configured.")
        return

    def _send() -> None:
        try:
            resp = requests.post(
                webhook_url,
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
