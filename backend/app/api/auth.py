# Auth API routes

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import get_db
from app.models.models import AuditLog, FlatCategory, Society, User, WaterInfrastructure
from app.schemas.auth import LoginIn, RegisterIn
from app.security.deps import get_current_user
from app.security.passwords import hash_password, verify_password
from app.security.tokens import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    s, c = payload.society, payload.committee
    if db.scalar(select(User.id).where(User.user_id == c.user_id)):
        raise HTTPException(409, "This User ID is already taken")
    if db.scalar(select(User.id).where(User.email == c.email.lower())):
        raise HTTPException(409, "An account with this email already exists")
    if db.scalar(select(Society.id).where(Society.society_name == s.society_name,
                                          Society.pin_code == s.pin_code)):
        raise HTTPException(409, "A society with this name and PIN code is already registered")

    area = None if s.total_area is None else (s.total_area * 0.092903 if s.area_unit == "sqft" else s.total_area)
    society = Society(
        society_name=s.society_name, address=s.address, locality=s.locality, city=s.city,
        state=s.state, pin_code=s.pin_code, registration_identifier=s.registration_identifier,
        establishment_year=s.establishment_year, total_area_sqm=area,
        total_buildings=s.total_buildings, total_floors=s.total_floors, total_flats=s.total_flats,
        occupied_flats=s.occupied_flats, actual_residents=s.actual_residents)
    society.flat_categories = [FlatCategory(**fc.model_dump()) for fc in s.flat_categories]
    society.infrastructure = [WaterInfrastructure(**i.model_dump()) for i in s.infrastructure]
    db.add(society)
    db.flush()
    user = User(society_id=society.id, full_name=c.full_name, user_id=c.user_id,
                email=c.email.lower(), mobile_number=c.mobile_number,
                password_hash=hash_password(c.password), role="committee")
    db.add(user)
    db.flush()
    db.add(AuditLog(society_id=society.id, user_id=user.id, action="society_registered",
                    entity_type="society", entity_id=society.id))
    db.commit()  # one transaction: society + users + children
    return {"message": "Society registered. Please log in.", "society_id": society.id}


@router.post("/login")
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.user_id == payload.user_id))
    # Same message for unknown user and wrong password
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid User ID or password")
    response.set_cookie("access_token", create_access_token(user.id), httponly=True,
                        samesite="lax", secure=settings.COOKIE_SECURE,
                        max_age=settings.ACCESS_TOKEN_MINUTES * 60)
    return {"message": "Logged in"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    soc = db.get(Society, user.society_id)
    return {"user_id": user.user_id, "full_name": user.full_name, "email": user.email, "role": user.role,
            "society": {"id": soc.id, "society_name": soc.society_name, "locality": soc.locality,
                        "total_flats": soc.total_flats, "occupied_flats": soc.occupied_flats,
                        "actual_residents": soc.actual_residents}}