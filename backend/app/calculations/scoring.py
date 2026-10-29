# Scoring calculations

"""
Overall score (0-100) = weighted average of AVAILABLE components.
  Efficiency (50%)     : linear between LPCD_BEST (100 pts) and LPCD_WORST (0 pts).
                         Implausibly low values (< LPCD_MIN_PLAUSIBLE) earn NO points.
  Improvement (30%)    : 50 pts at 0% change, +2.5 pts per 1% improvement (20% => 100),
                         clamped 0-100. Unavailable for a baseline (first) report.
  Accountability (20%) : 100 - 4 * |unaccounted %|, capped at 70 if balance approximate.
Missing-data policy: unavailable components are dropped and the remaining weights are
re-normalised. Without a valid efficiency score the society is not ranked.
"""
from app.core.config import settings


def _clamp(x, lo=0.0, hi=100.0):
    return max(lo, min(hi, x))


def efficiency_score(lpcd):
    if lpcd is None or lpcd < settings.LPCD_MIN_PLAUSIBLE:
        return None
    span = settings.LPCD_WORST - settings.LPCD_BEST
    return _clamp((settings.LPCD_WORST - lpcd) / span * 100)


def improvement_score(pct):
    return None if pct is None else _clamp(50 + pct * 2.5)


def accountability_score(unaccounted_pct, approximate):
    if unaccounted_pct is None:
        return None
    s = _clamp(100 - 4 * abs(unaccounted_pct))
    return min(s, 70.0) if approximate else s


def overall_score(eff, imp, acc):
    if eff is None:
        return None, {}
    parts = {
        "efficiency": (eff, settings.W_EFFICIENCY),
        "improvement": (imp, settings.W_IMPROVEMENT),
        "accountability": (acc, settings.W_ACCOUNTABILITY),
    }
    avail = {k: v for k, v in parts.items() if v[0] is not None}
    total_w = sum(w for _, w in avail.values())
    score = sum(s * w for s, w in avail.values()) / total_w
    return round(score, 1), {k: (round(v[0], 1) if v[0] is not None else None) for k, v in parts.items()}


def accountability_status(pct, approximate, inconsistent):
    if inconsistent:
        return "Verification required"
    if pct is None:
        return "Unavailable"
    label = "Reconciled" if abs(pct) <= 5 else "Minor gap" if abs(pct) <= 15 else "Verification required"
    return f"{label} (approximate)" if approximate else label