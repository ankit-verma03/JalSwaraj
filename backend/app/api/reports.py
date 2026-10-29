# Reports API routes

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Alert, ReportRevision, Society, User, WaterReport
from app.schemas.reports import ReportIn, ReportRevisionIn
from app.security.deps import get_current_user
from app.services import report_service as RS

router = APIRouter(prefix="/api/water-reports", tags=["reports"])


def report_out(r: WaterReport) -> dict:
    cols = ["id", "period_start", "period_end", "days", "frequency", "total_water_input_litres",
            "household_water_litres", "household_method", "non_household_water_litres",
            "beginning_storage_litres", "ending_storage_litres", "adjusted_water_available_litres",
            "accounted_water_litres", "unaccounted_water_litres", "unaccounted_percentage",
            "balance_approximate", "balance_inconsistent", "lpcd", "lpfd", "flat_basis",
            "data_quality", "reporting_status", "notes", "created_at", "updated_at", "sources"]
    d = {c: getattr(r, c) for c in cols}
    d["non_household"] = [{"category": c.category, "litres": c.quantity_litres,
                           "method": c.measurement_method} for c in r.categories]
    return d


def _own_report(db, report_id, user: User) -> WaterReport:
    r = db.get(WaterReport, report_id)
    if not r or r.society_id != user.society_id:   # 404 (not 403) so IDs are not revealed
        raise HTTPException(404, "Report not found")
    return r


@router.post("", status_code=201)
def submit(data: ReportIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if RS.has_overlap(db, user.society_id, data.period_start, data.period_end):
        raise HTTPException(409, "A report already exists that overlaps this period. Revise it instead.")
    society = db.get(Society, user.society_id)
    report = RS.create_report(db, society, user.id, data)
    alerts = db.scalars(select(Alert).where(Alert.water_report_id == report.id)).all()
    return {"report": report_out(report),
            "alerts": [{"id": a.id, "severity": a.severity, "message": a.message} for a in alerts]}


@router.get("")
def list_reports(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = (select(WaterReport).where(WaterReport.society_id == user.society_id)
         .order_by(WaterReport.period_end.desc()).offset((page - 1) * page_size).limit(page_size))
    return [report_out(r) for r in db.scalars(q)]


@router.get("/{report_id}")
def get_report(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return report_out(_own_report(db, report_id, user))


@router.patch("/{report_id}")
def revise(report_id: int, body: ReportRevisionIn, user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    r = _own_report(db, report_id, user)
    if RS.has_overlap(db, user.society_id, body.data.period_start, body.data.period_end, exclude_id=r.id):
        raise HTTPException(409, "Revised period overlaps another report")
    return report_out(RS.revise_report(db, r, user.id, body.data, body.reason))


@router.get("/{report_id}/history")
def history(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = _own_report(db, report_id, user)
    revs = db.scalars(select(ReportRevision).where(ReportRevision.water_report_id == r.id)
                      .order_by(ReportRevision.revision_number)).all()
    return {"current": report_out(r),
            "revisions": [{"revision_number": v.revision_number, "reason": v.reason,
                           "changed_at": v.changed_at, "changed_by": v.changed_by,
                           "previous_values": v.previous_values, "revised_values": v.revised_values}
                          for v in revs]}