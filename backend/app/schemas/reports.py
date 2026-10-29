# Report schemas

from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, model_validator

Unit = Literal["L", "KL"]
Method = Literal["measured", "estimated", "unavailable"]


class SourceIn(BaseModel):
    source: Literal["municipal", "tanker", "borewell", "recycled", "other"]
    quantity: float = Field(ge=0)
    unit: Unit = "L"
    method: Method = "estimated"
    note: str | None = None


class UsageIn(BaseModel):
    category: str = Field(min_length=1, max_length=60)
    quantity: float = Field(ge=0)
    unit: Unit = "L"
    method: Method = "estimated"
    notes: str | None = None


class ReportIn(BaseModel):
    period_start: date
    period_end: date
    frequency: Literal["daily", "weekly", "monthly"] = "monthly"
    sources: list[SourceIn] = Field(min_length=1)
    household_quantity: float = Field(ge=0)
    household_unit: Unit = "L"
    household_method: Method = "estimated"
    non_household: list[UsageIn] = []
    beginning_storage: float | None = Field(None, ge=0)
    ending_storage: float | None = Field(None, ge=0)
    storage_unit: Unit = "L"
    other_outflows: float = Field(0, ge=0)
    notes: str | None = None

    @model_validator(mode="after")
    def check_dates(self):
        if self.period_end < self.period_start:
            raise ValueError("Period end must not be before period start")
        if self.period_end > date.today():
            raise ValueError("Period end cannot be in the future")
        if (self.period_end - self.period_start).days > 400:
            raise ValueError("A reporting period cannot be longer than about a year")
        return self


class ReportRevisionIn(BaseModel):
    reason: str = Field(min_length=5)
    data: ReportIn


class AlertUpdateIn(BaseModel):
    status: Literal["under_review", "resolved", "unverified"]
    committee_comment: str | None = None