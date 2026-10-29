# Articles API routes

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Article

router = APIRouter(prefix="/api/articles", tags=["articles"])


def card(a: Article):
    return {"title": a.title, "slug": a.slug, "summary": a.summary, "cover_image": a.cover_image,
            "category": a.category, "reading_minutes": a.reading_minutes, "published_at": a.published_at}


@router.get("")
def list_articles(category: str | None = None, search: str | None = None,
                  limit: int = Query(20, ge=1, le=50), db: Session = Depends(get_db)):
    q = select(Article).where(Article.is_published.is_(True))
    if category:
        q = q.where(Article.category == category)
    if search:
        q = q.where(Article.title.ilike(f"%{search}%"))
    return [card(a) for a in db.scalars(q.order_by(Article.published_at.desc()).limit(limit))]


@router.get("/{slug}")
def get_article(slug: str, db: Session = Depends(get_db)):
    a = db.scalar(select(Article).where(Article.slug == slug, Article.is_published.is_(True)))
    if not a:
        raise HTTPException(404, "Article not found")
    return {**card(a), "body": a.body, "actions": a.actions or [], "sources": a.sources or []}