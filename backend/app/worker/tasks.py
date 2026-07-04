from backend.app.worker.celery_app import celery_app


@celery_app.task(name="foundation.ping")
def ping() -> dict[str, str]:
    return {"status": "ok"}


@celery_app.task(name="foundation.rebuild_indexes")
def rebuild_indexes() -> dict[str, str]:
    return {"status": "queued"}
