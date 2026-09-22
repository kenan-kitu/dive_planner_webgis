from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import CurrentUser, require_roles
from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models import User, UserRole
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(tags=["authentication"])


@router.post(
    "/api/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> User:
    user = User(
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        display_name=payload.display_name.strip(),
        role=UserRole.USER,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc
    db.refresh(user)
    return user


@router.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    email = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    access_token, expires_in = create_access_token(user.id)
    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=UserResponse.model_validate(user),
    )


@router.get("/api/auth/me", response_model=UserResponse)
def me(current_user: CurrentUser) -> User:
    return current_user


@router.get("/api/account/profile")
def account_profile(current_user: CurrentUser) -> dict[str, str]:
    return {
        "status": "ok",
        "message": "Authenticated account area",
        "role": current_user.role.value,
    }


@router.get("/api/dive-center/dashboard")
def dive_center_dashboard(
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.DIVE_CENTER, UserRole.ADMIN)),
    ],
) -> dict[str, str]:
    return {
        "status": "ok",
        "message": "Dive center dashboard access granted",
        "role": current_user.role.value,
    }


@router.get("/api/admin/status")
def admin_status(
    current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> dict[str, str]:
    return {
        "status": "ok",
        "message": "Administrator access granted",
        "role": current_user.role.value,
    }
