from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from backend.app.repositories.base import BaseRepository
from backend.app.services.base import BaseService


class AuthService(BaseService[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(BaseRepository(session, User))
        self.session = session


