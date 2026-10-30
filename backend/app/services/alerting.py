"""Production error alerting via an optional webhook.

Launch aid for the solo-ops setup: PM2 logs already capture every 500 with
an error_id, but nobody is tailing logs at 2am. When ERROR_WEBHOOK_URL is
set on the server (Discord/Slack-style "post a message" webhook), every
unexpected server exception is pushed there too — fire-and-forget from the
request, strictly rate-limited so an outage storm can neither spam the
channel nor add latency to the response itself.

Unset URL = fully disabled: zero behavior change, zero secrets in git.
"""

from __future__ import annotations

import asyncio
import logging
import time
import traceback

import httpx

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)

# At most one alert per window, no matter how many 500s the app pours out.
_MIN_INTERVAL_SECONDS = 10.0
_HTTP_TIMEOUT = httpx.Timeout(4.0)

_state: dict[str, float] = {"last_sent_at": 0.0}
_tasks: set[asyncio.Task] = set()  # keep Task refs alive (see asyncio docs)


def reset_alert_throttle() -> None:
    """Test seam: clear the rate-limit window between tests."""
    _state["last_sent_at"] = 0.0


def build_alert_payload(error_id: str, method: str, path: str, exc: Exception) -> dict:
    """Webhook body. `content`/`text` together cover Discord and Slack-style
    endpoints; both endpoints ignore the key they don't use."""
    summary = f"{type(exc).__name__}: {exc}"
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))[-1800:]
    text = "\n".join(
        (
            f"`{error_id}` {method} {path}",
            f"```{summary}```",
            f"environment: {get_settings().environment}",
        )
    )
    return {"content": text, "text": text, "error_id": error_id, "traceback": tb}


async def _post_webhook(url: str, payload: dict) -> None:
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        await client.post(url, json=payload)


def schedule_error_alert(error_id: str, method: str, path: str, exc: Exception) -> None:
    """Fire the webhook in a background task. NEVER raises and never blocks
    the request — alerting failures only log."""
    url = get_settings().error_webhook_url
    if not url:
        return

    now = time.monotonic()
    if now - _state["last_sent_at"] < _MIN_INTERVAL_SECONDS:
        logger.info("error webhook throttled (%s suppressed)", error_id)
        return
    _state["last_sent_at"] = now

    try:
        task = asyncio.create_task(
            _post_webhook(url, build_alert_payload(error_id, method, path, exc))
        )
    except RuntimeError:
        # No running loop (called outside a request/task context): send inline
        # best-effort via a short-lived loop. Never let this break the caller.
        try:
            asyncio.run(
                asyncio.wait_for(
                    _post_webhook(url, build_alert_payload(error_id, method, path, exc)),
                    timeout=_HTTP_TIMEOUT.read + 1,
                )
            )
        except Exception as e:  # pragma: no cover - defensive
            logger.warning("error webhook inline send failed: %s", e)
        return
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)

    def _on_done(t: asyncio.Task) -> None:
        if t.cancelled():
            return
        err = t.exception()
        if err is None:
            logger.info("error webhook delivered (%s)", error_id)
        else:
            logger.warning("error webhook failed (%s): %s", error_id, err)

    task.add_done_callback(_on_done)
