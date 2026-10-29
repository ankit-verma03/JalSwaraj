# Security dependencies

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User
from app.security.tokens import decode_access_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    uid = decode_access_token(token)
    user = db.get(User, uid) if uid else None
    if not user or not user.is_active:
        raise HTTPException(401, "Session expired or invalid")
    return user