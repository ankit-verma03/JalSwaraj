# Analytics API routes

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.calculations.water import improvement_pct
from app.database.session import get_db
from app.models.models import User, WaterReport
from app.security.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reps = db.scalars(select(WaterReport).where(WaterReport.society_id == user.society_id)
                      .order_by(WaterReport.period_end)).all()
    series, prev = [], None
    for r in reps:
        series.append({
            "label": r.period_end.strftime("%b %Y"), "period_end": str(r.period_end),
            "household_litres": r.household_water_litres, "lpcd": r.lpcd,
            "total_input": r.total_water_input_litres, "non_household": r.non_household_water_litres,
            "accounted": r.accounted_water_litres, "unaccounted": r.unaccounted_water_litres,
            "improvement_pct": improvement_pct(prev.lpcd, r.lpcd) if prev else None,
            "data_quality": r.data_quality})
        prev = r
    latest = None
    if reps:
        r = reps[-1]
        latest = {c: getattr(r, c) for c in [
            "id", "period_start", "period_end", "total_water_input_litres", "household_water_litres",
            "lpcd", "lpfd", "flat_basis", "non_household_water_litres", "unaccounted_water_litres",
            "unaccounted_percentage", "adjusted_water_available_litres", "accounted_water_litres",
            "balance_approximate", "balance_inconsistent", "data_quality", "reporting_status"]}
        latest["improvement_pct"] = series[-1]["improvement_pct"]
    return {"latest": latest, "series": series}