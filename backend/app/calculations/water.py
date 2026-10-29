# Water calculations

"""All water maths lives here. Internal unit: litres."""
from datetime import date

UNIT_TO_LITRES = {"L": 1.0, "KL": 1000.0}


def to_litres(quantity: float, unit: str) -> float:
    return quantity * UNIT_TO_LITRES[unit]


def days_in_period(start: date, end: date) -> int:
    return (end - start).days + 1  # inclusive


def water_balance(total_input, beginning, ending, household, non_household, other_outflows=0.0):
    """
    Adjusted available = input + beginning storage - ending storage
    Accounted          = household + non-household
    Unaccounted        = adjusted - accounted - other documented outflows
    Missing storage -> storage terms are NOT assumed zero silently; result flagged approximate.
    """
    approximate = beginning is None or ending is None
    storage_change = 0.0 if approximate else (beginning - ending)
    adjusted = total_input + storage_change
    accounted = household + non_household
    unaccounted = adjusted - accounted - other_outflows   # may be negative; never clamped
    pct = (unaccounted / adjusted * 100) if adjusted > 0 else None
    return {
        "adjusted": adjusted,
        "accounted": accounted,
        "unaccounted": unaccounted,
        "pct": pct,
        "approximate": approximate,
        "inconsistent": unaccounted < 0,   # recorded use exceeds available water
    }


def per_person_per_day(household_litres, residents, days):
    if not residents or residents <= 0 or days <= 0:
        return None
    return household_litres / (residents * days)


def per_flat_per_day(household_litres, flats, days):
    if not flats or flats <= 0 or days <= 0:
        return None
    return household_litres / (flats * days)


def improvement_pct(previous, current):
    """Positive = consumption went down. None when no valid baseline."""
    if previous is None or current is None or previous <= 0:
        return None
    return (previous - current) / previous * 100