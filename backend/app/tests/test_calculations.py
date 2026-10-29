# Tests for calculations

from datetime import date
from app.calculations import water as W


def test_spec_example():
    b = W.water_balance(100_000, 10_000, 5_000, 65_000, 12_000 + 5_000 + 3_000, 0)
    assert b["adjusted"] == 105_000
    assert b["accounted"] == 85_000
    assert b["unaccounted"] == 20_000
    assert round(b["pct"], 2) == 19.05
    assert not b["approximate"]


def test_missing_storage_is_approximate_not_zero_silently():
    assert W.water_balance(1000, None, 50, 500, 0)["approximate"]


def test_negative_discrepancy_not_clamped():
    b = W.water_balance(1000, 0, 0, 1500, 0)
    assert b["unaccounted"] < 0 and b["inconsistent"]


def test_lpcd_uses_days():
    days = W.days_in_period(date(2025, 1, 1), date(2025, 1, 30))   # 30 days
    assert W.per_person_per_day(135_000, 100, days) == 45


def test_zero_residents_returns_none():
    assert W.per_person_per_day(1000, 0, 30) is None


def test_improvement():
    assert W.improvement_pct(150, 135) == 10
    assert W.improvement_pct(0, 135) is None
    assert W.improvement_pct(None, 135) is None


def test_zero_denominator_safe():
    assert W.water_balance(0, None, None, 0, 0)["pct"] is None