# Leaderboard API routes

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, distinct
from app.database.session import get_db
from app.models.models import Society
from app.services.leaderboard_service import build_leaderboard

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("")
def leaderboard(search: str | None = None, locality: str | None = None,
                period: str | None = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
                sort_by: str = "rank", order: str = Query("asc", pattern="^(asc|desc)$"),
                page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=50),
                db: Session = Depends(get_db)):
    rows = build_leaderboard(db, search, locality, period, sort_by, order)
    start = (page - 1) * page_size
    localities = sorted(db.scalars(select(distinct(Society.locality))).all())
    # Only public, community-level fields are ever returned
    return {"total": len(rows), "page": page, "page_size": page_size,
            "localities": localities, "items": rows[start:start + page_size]}