# Main FastAPI application entry point

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import alerts, analytics, articles, auth, leaderboard, reports
from app.core.config import settings
from app.database.session import Base, engine
import app.models.models  # noqa: F401  (registers tables)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jalswaraj")

# Dev convenience. For real deployments use: alembic upgrade head
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JalSwaraj API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

for r in (auth.router, reports.router, alerts.router, analytics.router,
          leaderboard.router, articles.router):
    app.include_router(r)


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    log.exception("Unhandled error")   # details go to logs, not to the client
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our side."})


@app.get("/api/health")
def health():
    return {"status": "ok"}