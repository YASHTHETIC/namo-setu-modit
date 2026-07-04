from backend.app.api.base import BaseAPIRouter
from backend.app.api.v1 import admin, audit, auth, health, identity, media, modit, namo, notifications, organizations

api_router = BaseAPIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(identity.router, tags=["identity"])
api_router.include_router(organizations.router, tags=["organizations"])
api_router.include_router(media.router, tags=["media"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(audit.router, tags=["audit"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(namo.router)
api_router.include_router(modit.router)
