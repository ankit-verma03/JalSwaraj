# JWT token management

from datetime import datetime, timedelta, timezone
import jwt
from app.core.config import settings

ALGO = "HS256"


def create_access_token(user_pk: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    return jwt.encode({"sub": str(user_pk), "exp": exp}, settings.SECRET_KEY, algorithm=ALGO)


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGO])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None