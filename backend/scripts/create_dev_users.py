"""Create or update local USER, DIVE_CENTER, and ADMIN development accounts."""

import os
from dataclasses import dataclass

from sqlalchemy import select

from app.auth.security import hash_password
from app.database import SessionLocal
from app.models import User, UserRole


@dataclass(frozen=True)
class DevUserConfig:
    role: UserRole
    prefix: str


DEV_USERS = (
    DevUserConfig(UserRole.USER, "DEV_USER"),
    DevUserConfig(UserRole.DIVE_CENTER, "DEV_DIVE_CENTER"),
    DevUserConfig(UserRole.ADMIN, "DEV_ADMIN"),
)


def required_environment(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Required local development variable is missing: {name}")
    return value


def create_or_update_dev_users() -> None:
    with SessionLocal.begin() as session:
        for config in DEV_USERS:
            email = required_environment(f"{config.prefix}_EMAIL").lower()
            password = required_environment(f"{config.prefix}_PASSWORD")
            display_name = required_environment(f"{config.prefix}_DISPLAY_NAME")

            user = session.scalar(select(User).where(User.email == email))
            if user is None:
                user = User(email=email, display_name=display_name, role=config.role)
                session.add(user)

            user.display_name = display_name
            user.role = config.role
            user.password_hash = hash_password(password)
            user.is_active = True
            print(f"Prepared local {config.role.value} account: {email}")


if __name__ == "__main__":
    create_or_update_dev_users()
