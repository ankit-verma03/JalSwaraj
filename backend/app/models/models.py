# Database models

from datetime import date, datetime
from sqlalchemy import (JSON, Boolean, Date, DateTime, Float, ForeignKey, Index,
                        Integer, String, Text, UniqueConstraint, func)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base


class Society(Base):
    __tablename__ = "societies"
    __table_args__ = (UniqueConstraint("society_name", "pin_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    society_name: Mapped[str] = mapped_column(String(200), index=True)
    address: Mapped[str] = mapped_column(Text)
    locality: Mapped[str] = mapped_column(String(100), index=True)
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    pin_code: Mapped[str] = mapped_column(String(6))
    registration_identifier: Mapped[str | None] = mapped_column(String(100))
    establishment_year: Mapped[int | None]
    total_area_sqm: Mapped[float | None]          # always stored in square metres
    total_buildings: Mapped[int]
    total_floors: Mapped[int | None]
    total_flats: Mapped[int]
    occupied_flats: Mapped[int | None]
    actual_residents: Mapped[int]
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    flat_categories = relationship("FlatCategory", cascade="all, delete-orphan")
    infrastructure = relationship("WaterInfrastructure", cascade="all, delete-orphan")


class FlatCategory(Base):
    __tablename__ = "flat_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int] = mapped_column(ForeignKey("societies.id"), index=True)
    flat_type: Mapped[str] = mapped_column(String(20))
    flat_count: Mapped[int]
    average_residents_per_flat: Mapped[float]


class WaterInfrastructure(Base):
    __tablename__ = "water_infrastructure"
    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int] = mapped_column(ForeignKey("societies.id"), index=True)
    source_type: Mapped[str] = mapped_column(String(50))  # municipal, tanker, borewell, rainwater...
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    meter_available: Mapped[bool] = mapped_column(Boolean, default=False)
    storage_capacity_litres: Mapped[float | None]
    measurement_method: Mapped[str] = mapped_column(String(20), default="estimated")
    infrastructure_notes: Mapped[str | None] = mapped_column(Text)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int] = mapped_column(ForeignKey("societies.id"), index=True)
    full_name: Mapped[str] = mapped_column(String(150))
    user_id: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    mobile_number: Mapped[str | None] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="committee")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class WaterReport(Base):
    __tablename__ = "water_reports"
    __table_args__ = (Index("ix_report_society_period", "society_id", "period_end"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int] = mapped_column(ForeignKey("societies.id"))
    submitted_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    days: Mapped[int]
    frequency: Mapped[str] = mapped_column(String(10), default="monthly")
    sources: Mapped[list] = mapped_column(JSON)               # each source with litres + method
    total_water_input_litres: Mapped[float]
    household_water_litres: Mapped[float]
    household_method: Mapped[str] = mapped_column(String(20))
    non_household_water_litres: Mapped[float]
    other_outflows_litres: Mapped[float] = mapped_column(Float, default=0)
    beginning_storage_litres: Mapped[float | None]
    ending_storage_litres: Mapped[float | None]
    adjusted_water_available_litres: Mapped[float]
    accounted_water_litres: Mapped[float]
    unaccounted_water_litres: Mapped[float]
    unaccounted_percentage: Mapped[float | None]
    balance_approximate: Mapped[bool] = mapped_column(Boolean, default=False)
    balance_inconsistent: Mapped[bool] = mapped_column(Boolean, default=False)
    # Snapshots so later profile edits never silently change old reports
    residents_snapshot: Mapped[int]
    flats_snapshot: Mapped[int]
    flat_basis: Mapped[str] = mapped_column(String(12))       # occupied | registered
    lpcd: Mapped[float | None]                                # household L/person/day
    lpfd: Mapped[float | None]                                # household L/flat/day
    data_quality: Mapped[str] = mapped_column(String(12))     # measured | estimated | mixed
    reporting_status: Mapped[str] = mapped_column(String(15), default="submitted")  # submitted | needs_review
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    categories = relationship("UsageCategory", cascade="all, delete-orphan")


class UsageCategory(Base):
    """Non-household usage only (garden, cleaning, pool...). Household is on the report."""
    __tablename__ = "usage_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    water_report_id: Mapped[int] = mapped_column(ForeignKey("water_reports.id"), index=True)
    category: Mapped[str] = mapped_column(String(60))
    quantity_litres: Mapped[float]
    measurement_method: Mapped[str] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)


class ReportRevision(Base):
    __tablename__ = "report_revisions"
    id: Mapped[int] = mapped_column(primary_key=True)
    water_report_id: Mapped[int] = mapped_column(ForeignKey("water_reports.id"), index=True)
    revision_number: Mapped[int]
    previous_values: Mapped[dict] = mapped_column(JSON)
    revised_values: Mapped[dict] = mapped_column(JSON)
    reason: Mapped[str] = mapped_column(Text)
    changed_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int] = mapped_column(ForeignKey("societies.id"), index=True)
    water_report_id: Mapped[int] = mapped_column(ForeignKey("water_reports.id"), index=True)
    alert_type: Mapped[str] = mapped_column(String(40))
    severity: Mapped[str] = mapped_column(String(10))         # info | warning | high
    message: Mapped[str] = mapped_column(Text)                # what was detected
    explanation: Mapped[str] = mapped_column(Text)            # why it matters + what to check
    trigger_data: Mapped[dict] = mapped_column(JSON)          # which values triggered it
    status: Mapped[str] = mapped_column(String(15), default="unverified")  # unverified|under_review|resolved
    committee_comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    society_id: Mapped[int | None] = mapped_column(ForeignKey("societies.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(50))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[int | None]
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    relevant_change_summary: Mapped[str | None] = mapped_column(Text)


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    summary: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    cover_image: Mapped[str | None] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(60), index=True)
    reading_minutes: Mapped[int] = mapped_column(Integer, default=4)
    actions: Mapped[list | None] = mapped_column(JSON)        # practical water-saving actions
    sources: Mapped[list | None] = mapped_column(JSON)
    published_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)