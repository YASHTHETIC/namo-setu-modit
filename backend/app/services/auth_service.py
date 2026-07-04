from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import hash_password, verify_password
from backend.app.models.user import User
from backend.app.repositories.base import BaseRepository
from backend.app.services.base import BaseService


class AuthService(BaseService[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(BaseRepository(session, User))
        self.session = session

    async def create_user(self, email: str, password: str, full_name: str | None = None) -> User:
        user = User(email=email.lower(), full_name=full_name, hashed_password=hash_password(password))
        await self.repository.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
