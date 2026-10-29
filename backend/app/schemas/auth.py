# Authentication schemas

import re
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class FlatCategoryIn(BaseModel):
    flat_type: Literal["1BHK", "2BHK", "3BHK", "4BHK", "other"]
    flat_count: int = Field(ge=0)
    average_residents_per_flat: float = Field(ge=0, le=20)


class InfraIn(BaseModel):
    source_type: str = Field(max_length=50)
    available: bool = True
    meter_available: bool = False
    storage_capacity_litres: float | None = Field(None, ge=0)
    measurement_method: Literal["measured", "estimated", "unavailable"] = "estimated"
    infrastructure_notes: str | None = None


class SocietyIn(BaseModel):
    society_name: str = Field(min_length=2, max_length=200)
    address: str = Field(min_length=5)
    locality: str = Field(min_length=2, max_length=100)
    city: str = "Mumbai"
    state: str = "Maharashtra"
    pin_code: str = Field(pattern=r"^\d{6}$")
    registration_identifier: str | None = None
    establishment_year: int | None = Field(None, ge=1800, le=2100)
    total_area: float | None = Field(None, gt=0)
    area_unit: Literal["sqm", "sqft"] = "sqm"
    total_buildings: int = Field(ge=1)
    total_floors: int | None = Field(None, ge=1)
    total_flats: int = Field(ge=1)
    occupied_flats: int | None = Field(None, ge=0)
    actual_residents: int = Field(ge=1)
    flat_categories: list[FlatCategoryIn]
    infrastructure: list[InfraIn] = []

    @model_validator(mode="after")
    def check(self):
        if sum(c.flat_count for c in self.flat_categories) != self.total_flats:
            raise ValueError("Flat category counts must add up to the total number of flats")
        if self.occupied_flats is not None and self.occupied_flats > self.total_flats:
            raise ValueError("Occupied flats cannot exceed total flats")
        return self


class CommitteeIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    mobile_number: str | None = Field(None, max_length=20)
    user_id: str = Field(pattern=r"^[A-Za-z0-9_.-]{4,30}$")
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str
    accepted_terms: bool

    @field_validator("password")
    @classmethod
    def strong(cls, v):
        if not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
            raise ValueError("Password must contain at least one letter and one number")
        return v

    @model_validator(mode="after")
    def check(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not self.accepted_terms:
            raise ValueError("You must accept the data and privacy terms")
        return self


class RegisterIn(BaseModel):
    society: SocietyIn
    committee: CommitteeIn


class LoginIn(BaseModel):
    user_id: str
    password: str