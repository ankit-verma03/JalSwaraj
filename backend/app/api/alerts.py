# Alerts API routes

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Alert, AuditLog, User
from app.schemas.reports import AlertUpdateIn
from app.security.deps import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def alert_out(a: Alert):
    return {c: getattr(a, c) for c in ["id", "water_report_id", "alert_type", "severity", "message",
            "explanation", "trigger_data", "status", "committee_comment", "created_at", "resolved_at"]}


@router.get("")
def list_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = select(Alert).where(Alert.society_id == user.society_id).order_by(Alert.created_at.desc())
    return [alert_out(a) for a in db.scalars(q)]


@router.patch("/{alert_id}")
def update_alert(alert_id: int, body: AlertUpdateIn, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    a = db.get(Alert, alert_id)
    if not a or a.society_id != user.society_id:
        raise HTTPException(404, "Alert not found")
    old = a.status
    a.status = body.status
    a.committee_comment = body.committee_comment or a.committee_comment
    a.resolved_at = datetime.utcnow() if body.status == "resolved" else None
    db.add(AuditLog(society_id=a.society_id, user_id=user.id, action="alert_status_changed",
                    entity_type="alert", entity_id=a.id, relevant_change_summary=f"{old} -> {body.status}"))
    db.commit()
    return alert_out(a)