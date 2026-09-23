"""Create the first production ADMIN without storing credentials in Git."""

import os

from sqlalchemy import select

from app.auth.security import hash_password
from app.database import SessionLocal
from app.models import User, UserRole
from app.schemas import RegisterRequest


def required_environment(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Required environment variable is missing: {name}")
    return value


def create_initial_admin() -> None:
    payload = RegisterRequest(
        email=required_environment("INITIAL_ADMIN_EMAIL"),
        password=required_environment("INITIAL_ADMIN_PASSWORD"),
        display_name=required_environment("INITIAL_ADMIN_DISPLAY_NAME"),
    )
    email = str(payload.email).lower()

    with SessionLocal.begin() as session:
        existing_admin = session.scalar(
            select(User).where(User.role == UserRole.ADMIN).limit(1)
        )
        if existing_admin is not None:
            if existing_admin.email == email:
                print(f"Initial ADMIN already exists: {email}")
                return
            raise RuntimeError("An ADMIN account already exists; no account was changed")

        existing_user = session.scalar(select(User).where(User.email == email))
        if existing_user is not None:
            raise RuntimeError(
                "The requested email belongs to a non-ADMIN account; no account was changed"
            )

        session.add(
            User(
                email=email,
                password_hash=hash_password(payload.password),
                display_name=payload.display_name.strip(),
                role=UserRole.ADMIN,
                is_active=True,
            )
        )
        print(f"Created initial ADMIN account: {email}")


if __name__ == "__main__":
    create_initial_admin()
