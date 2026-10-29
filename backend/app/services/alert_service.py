# Alert service

from datetime import date
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Alert, WaterReport


def regenerate_alerts(db: Session, report: WaterReport) -> None:
    # Re-run rules; keep alerts the committee already worked on
    db.execute(delete(Alert).where(Alert.water_report_id == report.id, Alert.status == "unverified"))
    prev = db.scalars(
        select(WaterReport).where(WaterReport.society_id == report.society_id,
                                  WaterReport.period_end < report.period_start)
        .order_by(WaterReport.period_end.desc()).limit(1)).first()

    def add(kind, sev, msg, why, data):
        db.add(Alert(society_id=report.society_id, water_report_id=report.id, alert_type=kind,
                     severity=sev, message=msg, explanation=why, trigger_data=data, status="unverified"))

    if report.balance_inconsistent:
        add("inconsistent_totals", "high",
            "Recorded usage is higher than the water available for the period.",
            "This can mean a data-entry error, an unrecorded inflow or storage change, or a meter issue. "
            "Check units, storage readings and whether any source was left out. Verification required.",
            {"adjusted_litres": report.adjusted_water_available_litres,
             "accounted_litres": report.accounted_water_litres})
    elif (report.unaccounted_percentage is not None
          and report.unaccounted_percentage > settings.UNACCOUNTED_ALERT_PCT):
        add("high_unaccounted", "high",
            f"Unaccounted water is {report.unaccounted_percentage:.1f}% of adjusted available water.",
            "A gap can come from potential leakage, meter inaccuracy, missing usage records, timing "
            "differences or unrecorded storage changes. It does not confirm a leak. Inspect pipes, "
            "tanks and meters and review the recorded categories.",
            {"unaccounted_litres": report.unaccounted_water_litres,
             "threshold_pct": settings.UNACCOUNTED_ALERT_PCT})

    if report.balance_approximate:
        add("missing_storage", "info",
            "Storage volumes were not provided, so the water balance is approximate.",
            "Enter beginning and ending tank volumes to make the reconciliation more reliable.",
            {"beginning": report.beginning_storage_litres, "ending": report.ending_storage_litres})

    if report.lpcd is not None and report.lpcd < settings.LPCD_MIN_PLAUSIBLE:
        add("implausible_low", "warning",
            "Household use per person per day is unusually low.",
            "Check the resident count, the household figure and its unit. Unusually low values "
            "earn no efficiency score until verified.", {"lpcd": report.lpcd})

    if (date.today() - report.period_end).days > settings.LATE_REPORT_DAYS:
        add("late_report", "info", "This report was submitted late.",
            "Timely reporting keeps comparisons meaningful.", {"period_end": str(report.period_end)})

    if prev and prev.lpcd and report.lpcd:  # compare per-day values so durations are normalised
        change = (report.lpcd - prev.lpcd) / prev.lpcd * 100
        if change > settings.SUDDEN_INCREASE_PCT:
            add("sudden_increase", "warning",
                f"Household use per person per day rose {change:.0f}% versus the previous period.",
                "Possible causes: potential leakage, more occupants, or an estimation change. "
                "Check meter readings and recent events.", {"previous": prev.lpcd, "current": report.lpcd})
        prev_nh = prev.non_household_water_litres / prev.days
        cur_nh = report.non_household_water_litres / report.days
        if change < -30 and prev_nh > 0 and (cur_nh - prev_nh) / prev_nh * 100 > 30:
            add("shift_between_categories", "warning",
                "Household use fell sharply while non-household use rose.",
                "Check that usage is classified in the right category (unusual usage pattern).",
                {"household_change_pct": round(change, 1)})
        if prev.household_water_litres == report.household_water_litres:
            add("unchanged_value", "info", "Household total is identical to the previous period.",
                "Confirm that fresh meter readings were used.", {"value": report.household_water_litres})