# Report service

from datetime import date
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.calculations import water as W
from app.models.models import AuditLog, ReportRevision, Society, UsageCategory, WaterReport
from app.schemas.reports import ReportIn
from app.services.alert_service import regenerate_alerts

REPORT_FIELDS = [
    "period_start", "period_end", "total_water_input_litres", "household_water_litres",
    "non_household_water_litres", "beginning_storage_litres", "ending_storage_litres",
    "adjusted_water_available_litres", "accounted_water_litres", "unaccounted_water_litres",
    "unaccounted_percentage", "lpcd", "lpfd", "reporting_status", "notes",
]


def snapshot(report: WaterReport) -> dict:
    d = {f: getattr(report, f) for f in REPORT_FIELDS}
    d["period_start"], d["period_end"] = str(d["period_start"]), str(d["period_end"])
    d["non_household"] = [
        {"category": c.category, "litres": c.quantity_litres, "method": c.measurement_method}
        for c in report.categories
    ]
    return d


def compute_fields(data: ReportIn, residents: int, flats: int, flat_basis: str) -> dict:
    """Backend is the only authority for calculated values."""
    sources = [{**s.model_dump(), "litres": W.to_litres(s.quantity, s.unit)} for s in data.sources]
    total_input = sum(s["litres"] for s in sources)
    household = W.to_litres(data.household_quantity, data.household_unit)
    non_house = [{**u.model_dump(), "litres": W.to_litres(u.quantity, u.unit)} for u in data.non_household]
    non_total = sum(u["litres"] for u in non_house)
    begin = None if data.beginning_storage is None else W.to_litres(data.beginning_storage, data.storage_unit)
    end = None if data.ending_storage is None else W.to_litres(data.ending_storage, data.storage_unit)

    bal = W.water_balance(total_input, begin, end, household, non_total, data.other_outflows)
    days = W.days_in_period(data.period_start, data.period_end)

    methods = {data.household_method, *[s.method for s in data.sources]}
    quality = "measured" if methods == {"measured"} else "estimated" if "measured" not in methods else "mixed"

    return {
        "fields": dict(
            period_start=data.period_start, period_end=data.period_end, days=days,
            frequency=data.frequency, sources=sources,
            total_water_input_litres=total_input, household_water_litres=household,
            household_method=data.household_method, non_household_water_litres=non_total,
            other_outflows_litres=data.other_outflows,
            beginning_storage_litres=begin, ending_storage_litres=end,
            adjusted_water_available_litres=bal["adjusted"], accounted_water_litres=bal["accounted"],
            unaccounted_water_litres=bal["unaccounted"], unaccounted_percentage=bal["pct"],
            balance_approximate=bal["approximate"], balance_inconsistent=bal["inconsistent"],
            residents_snapshot=residents, flats_snapshot=flats, flat_basis=flat_basis,
            lpcd=W.per_person_per_day(household, residents, days),
            lpfd=W.per_flat_per_day(household, flats, days),
            data_quality=quality,
            reporting_status="needs_review" if bal["inconsistent"] else "submitted",
            notes=data.notes,
        ),
        "non_house": non_house,
    }


def has_overlap(db: Session, society_id: int, start: date, end: date, exclude_id: int | None = None) -> bool:
    q = select(WaterReport.id).where(
        WaterReport.society_id == society_id,
        WaterReport.period_start <= end,
        WaterReport.period_end >= start,
    )
    if exclude_id:
        q = q.where(WaterReport.id != exclude_id)
    return db.scalar(q.limit(1)) is not None


def _set_categories(report: WaterReport, non_house: list[dict]):
    report.categories.clear()
    for u in non_house:
        report.categories.append(UsageCategory(
            category=u["category"], quantity_litres=u["litres"],
            measurement_method=u["method"], notes=u.get("notes")))


def create_report(db: Session, society: Society, user_pk: int, data: ReportIn) -> WaterReport:
    flats = society.occupied_flats or society.total_flats
    basis = "occupied" if society.occupied_flats else "registered"
    calc = compute_fields(data, society.actual_residents, flats, basis)
    report = WaterReport(society_id=society.id, submitted_by=user_pk, **calc["fields"])
    _set_categories(report, calc["non_house"])
    db.add(report)
    db.flush()
    regenerate_alerts(db, report)
    db.add(AuditLog(society_id=society.id, user_id=user_pk, action="report_submitted",
                    entity_type="water_report", entity_id=report.id,
                    relevant_change_summary=f"{data.period_start} to {data.period_end}"))
    db.commit()
    return report


def revise_report(db: Session, report: WaterReport, user_pk: int, data: ReportIn, reason: str) -> WaterReport:
    previous = snapshot(report)
    # Keep the ORIGINAL population snapshot: old reports are not silently recalculated
    calc = compute_fields(data, report.residents_snapshot, report.flats_snapshot, report.flat_basis)
    for k, v in calc["fields"].items():
        setattr(report, k, v)
    _set_categories(report, calc["non_house"])
    db.flush()
    n = len(db.scalars(select(ReportRevision.id).where(ReportRevision.water_report_id == report.id)).all()) + 1
    db.add(ReportRevision(water_report_id=report.id, revision_number=n, previous_values=previous,
                          revised_values=snapshot(report), reason=reason, changed_by=user_pk))
    regenerate_alerts(db, report)
    db.add(AuditLog(society_id=report.society_id, user_id=user_pk, action="report_revised",
                    entity_type="water_report", entity_id=report.id,
                    relevant_change_summary=f"Revision {n}: {reason[:200]}"))
    db.commit()
    return report