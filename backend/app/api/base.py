from fastapi import APIRouter


class BaseAPIRouter(APIRouter):
    def __init__(self, *args, **kwargs) -> None:
        kwargs.setdefault("responses", {401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}})
        super().__init__(*args, **kwargs)
