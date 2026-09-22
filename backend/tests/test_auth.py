from collections.abc import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.auth.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import User, UserRole

client = TestClient(app)
TEST_PASSWORD = "Local-test-password-2026!"
ROLE_EMAILS = {
    UserRole.USER: "role-user@example.com",
    UserRole.DIVE_CENTER: "role-dive-center@example.com",
    UserRole.ADMIN: "role-admin@example.com",
}


@pytest.fixture
def fresh_email() -> Generator[str, None, None]:
    email = f"auth-{uuid4()}@example.com"
    yield email
    with SessionLocal.begin() as session:
        session.execute(delete(User).where(User.email == email))


@pytest.fixture(scope="module", autouse=True)
def role_users() -> Generator[None, None, None]:
    with SessionLocal.begin() as session:
        session.execute(delete(User).where(User.email.in_(ROLE_EMAILS.values())))
        for role, email in ROLE_EMAILS.items():
            session.add(
                User(
                    email=email,
                    password_hash=hash_password(TEST_PASSWORD),
                    display_name=f"Test {role.value}",
                    role=role,
                    is_active=True,
                )
            )
    yield
    with SessionLocal.begin() as session:
        session.execute(delete(User).where(User.email.in_(ROLE_EMAILS.values())))


def register(email: str) -> dict:
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": TEST_PASSWORD,
            "display_name": "Test Diver",
        },
    )
    assert response.status_code == 201
    return response.json()


def login(email: str, password: str = TEST_PASSWORD) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()


def authorization(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def role_token(role: UserRole) -> str:
    return login(ROLE_EMAILS[role])["access_token"]


def test_register_creates_active_user_without_password_hash(fresh_email: str) -> None:
    payload = register(fresh_email)
    assert payload["email"] == fresh_email
    assert payload["role"] == "USER"
    assert payload["is_active"] is True
    assert "password" not in payload
    assert "password_hash" not in payload


def test_duplicate_email_is_rejected(fresh_email: str) -> None:
    register(fresh_email)
    response = client.post(
        "/api/auth/register",
        json={
            "email": fresh_email.upper(),
            "password": TEST_PASSWORD,
            "display_name": "Duplicate Diver",
        },
    )
    assert response.status_code == 409


def test_login_success(fresh_email: str) -> None:
    register(fresh_email)
    payload = login(fresh_email)
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["expires_in"] == 1800
    assert payload["user"]["email"] == fresh_email


def test_browser_cors_preflight_allows_auth_post() -> None:
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://127.0.0.1:4173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:4173"
    allowed_methods = response.headers["access-control-allow-methods"]
    assert "POST" in allowed_methods
    assert "PUT" in allowed_methods
    assert "PATCH" in allowed_methods
    assert "DELETE" in allowed_methods


def test_invalid_password_is_rejected(fresh_email: str) -> None:
    register(fresh_email)
    response = client.post(
        "/api/auth/login",
        json={"email": fresh_email, "password": "Wrong-password-2026!"},
    )
    assert response.status_code == 401


def test_me_without_token_is_rejected() -> None:
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_valid_token_succeeds(fresh_email: str) -> None:
    register(fresh_email)
    token = login(fresh_email)["access_token"]
    response = client.get("/api/auth/me", headers=authorization(token))
    assert response.status_code == 200
    assert response.json()["email"] == fresh_email


def test_user_cannot_access_dive_center_endpoint() -> None:
    response = client.get(
        "/api/dive-center/dashboard",
        headers=authorization(role_token(UserRole.USER)),
    )
    assert response.status_code == 403


def test_user_cannot_access_admin_endpoint() -> None:
    response = client.get(
        "/api/admin/status",
        headers=authorization(role_token(UserRole.USER)),
    )
    assert response.status_code == 403


def test_dive_center_can_access_dive_center_endpoint() -> None:
    response = client.get(
        "/api/dive-center/dashboard",
        headers=authorization(role_token(UserRole.DIVE_CENTER)),
    )
    assert response.status_code == 200
    assert response.json()["role"] == "DIVE_CENTER"


def test_dive_center_cannot_access_admin_endpoint() -> None:
    response = client.get(
        "/api/admin/status",
        headers=authorization(role_token(UserRole.DIVE_CENTER)),
    )
    assert response.status_code == 403


def test_admin_can_access_all_protected_endpoints() -> None:
    headers = authorization(role_token(UserRole.ADMIN))
    assert client.get("/api/account/profile", headers=headers).status_code == 200
    assert client.get("/api/dive-center/dashboard", headers=headers).status_code == 200
    assert client.get("/api/admin/status", headers=headers).status_code == 200


def test_password_is_stored_as_argon2_hash(fresh_email: str) -> None:
    register(fresh_email)
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.email == fresh_email))
        assert user is not None
        assert user.password_hash.startswith("$argon2")
        assert TEST_PASSWORD not in user.password_hash
