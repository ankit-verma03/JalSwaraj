# Leaderboard service

from calendar import monthrange
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.calculations import scoring as S
from app.calculations.water import improvement_pct
from app.models.models import Society, WaterReport

SORT_KEYS = {"rank", "society_name", "locality", "total_water_input_litres", "household_water_litres",
             "lpcd", "lpfd", "improvement_pct", "overall_score"}


def build_leaderboard(db: Session, search=None, locality=None, period=None,
                      sort_by="rank", order="asc"):
    q = select(Society)
    if search:
        q = q.where(Society.society_name.ilike(f"%{search}%"))
    if locality:
        q = q.where(Society.locality == locality)

    rows = []
    for soc in db.scalars(q):
        rq = select(WaterReport).where(
            WaterReport.society_id == soc.id,
            WaterReport.reporting_status == "submitted",   # needs_review is NOT ranked
            WaterReport.lpcd.is_not(None))
        if period:  # "YYYY-MM"
            y, m = map(int, period.split("-"))
            rq = rq.where(WaterReport.period_end >= f"{y}-{m:02d}-01",
                          WaterReport.period_end <= f"{y}-{m:02d}-{monthrange(y, m)[1]}")
        reps = db.scalars(rq.order_by(WaterReport.period_end.desc()).limit(2)).all()
        if not reps:
            continue
        cur, prev = reps[0], (reps[1] if len(reps) > 1 else None)
        imp = improvement_pct(prev.lpcd, cur.lpcd) if prev else None
        comps_in = (S.efficiency_score(cur.lpcd), S.improvement_score(imp),
                    S.accountability_score(cur.unaccounted_percentage, cur.balance_approximate))
        overall, comps = S.overall_score(*comps_in)
        if overall is None:
            continue
        rows.append({
            "society_id": soc.id, "society_name": soc.society_name, "locality": soc.locality,
            "period_start": cur.period_start, "period_end": cur.period_end,
            "last_updated": cur.updated_at,
            "total_water_input_litres": round(cur.total_water_input_litres),
            "household_water_litres": round(cur.household_water_litres),
            "lpcd": round(cur.lpcd, 1), "lpfd": round(cur.lpfd, 1) if cur.lpfd else None,
            "flat_basis": cur.flat_basis,
            "improvement_pct": None if imp is None else round(imp, 1),
            "baseline": prev is None,
            "accountability_status": S.accountability_status(
                cur.unaccounted_percentage, cur.balance_approximate, cur.balance_inconsistent),
            "data_quality": cur.data_quality,
            "overall_score": overall, "components": comps,
            "is_demo": soc.is_demo, "verified": False,   # self-reported, never independently verified
        })

    rows.sort(key=lambda r: r["overall_score"], reverse=True)
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    if sort_by in SORT_KEYS and sort_by != "rank":
        rows.sort(key=lambda r: (r[sort_by] is None, r[sort_by]), reverse=(order == "desc"))
    elif order == "desc":
        rows.reverse()
    return rows