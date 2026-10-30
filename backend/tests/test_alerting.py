"""Optional 500-alert webhook (see backend/app/services/alerting.py).

By default (no ERROR_WEBHOOK_URL) alerting is fully disabled and the
exception handler must behave exactly as before. When the URL is set,
every alert is fire-and-forget and rate-limited.
"""

import asyncio

import pytest

from backend.app.core.config import get_settings
from backend.app.services import alerting


@pytest.fixture(autouse=True)
def _clear_throttle():
    alerting.reset_alert_throttle()
    yield
    alerting.reset_alert_throttle()


def test_payload_shape():
    class Boom(RuntimeError):
        pass

    payload = alerting.build_alert_payload("ERR_abc", "GET", "/api/v1/modit/products", Boom("x"))
    # content/text cover Discord and Slack-style endpoints.
    assert payload["content"] == payload["text"]
    assert "ERR_abc" in payload["content"]
    assert "GET /api/v1/modit/products" in payload["content"]
    assert payload["error_id"] == "ERR_abc"
    assert "Boom" in payload["traceback"]


def test_unset_url_never_posts_or_schedules(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("ERROR_WEBHOOK_URL", "")
    scheduled = []

    def _no_task(coro):
        raise AssertionError("create_task must not be called when webhook unset")

    monkeypatch.setattr(alerting.asyncio, "create_task", _no_task)
    assert alerting.schedule_error_alert("ERR_1", "GET", "/x", RuntimeError("y")) is None


def test_webhook_posts_and_throttles(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("ERROR_WEBHOOK_URL", "https://hooks.example.test/abc123")
    posted = []

    async def _fake_post(url, payload):
        posted.append((url, payload))
        return None

    monkeypatch.setattr(alerting, "_post_webhook", _fake_post)

    async def _run():
        alerting.schedule_error_alert("ERR_1", "GET", "/one", RuntimeError("one"))
        alerting.schedule_error_alert("ERR_2", "GET", "/two", RuntimeError("two"))
        # Let scheduled tasks run (throttled one never becomes a task).
        await asyncio.sleep(0)
        pending = [t for t in alerting._tasks if not t.done()]
        await asyncio.gather(*pending, return_exceptions=True)

    asyncio.run(_run())

    assert len(posted) == 1  # throttled to one alert inside the window
    url, payload = posted[0]
    assert url == "https://hooks.example.test/abc123"
    assert payload["error_id"] == "ERR_1"


def test_reset_allows_next_alert(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("ERROR_WEBHOOK_URL", "https://hooks.example.test/abc123")
    alerting._state["last_sent_at"] = alerting.time.monotonic()
    posted = []

    async def _fake_post(url, payload):
        posted.append(url)
        return None

    monkeypatch.setattr(alerting, "_post_webhook", _fake_post)
    alerting.reset_alert_throttle()

    async def _run():
        alerting.schedule_error_alert("ERR_2", "GET", "/two", RuntimeError())
        pending = [t for t in alerting._tasks if not t.done()]
        await asyncio.gather(*pending, return_exceptions=True)

    asyncio.run(_run())
    assert len(posted) == 1
