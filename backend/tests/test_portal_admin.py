from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select

from app.auth.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import (
    Comment,
    DiveCenter,
    DiveCenterProfile,
    DiveSite,
    DiveSiteSubmission,
    DeparturePoint,
    User,
    UserRole,
)

client = TestClient(app)
TEST_PASSWORD = "Portal-admin-test-password-2026!"
EMAILS = {
    "user": "portal-normal-user@example.com",
    "center": "portal-other-center@example.com",
    "admin": "portal-admin@example.com",
}


@pytest.fixture(scope="module", autouse=True)
def portal_users() -> Generator[None, None, None]:
    with SessionLocal.begin() as session:
        existing_ids = select(User.id).where(User.email.in_(EMAILS.values()))
        session.execute(delete(Comment).where(Comment.user_id.in_(existing_ids)))
        session.execute(delete(DiveSiteSubmission).where(DiveSiteSubmission.submitted_by.in_(existing_ids)))
        session.execute(delete(DiveCenterProfile).where(DiveCenterProfile.user_id.in_(existing_ids)))
        session.execute(delete(User).where(User.email.in_(EMAILS.values())))
        session.add_all(
            [
                User(
                    email=EMAILS["user"],
                    password_hash=hash_password(TEST_PASSWORD),
                    display_name="Portal User",
                    role=UserRole.USER,
                    is_active=True,
                ),
                User(
                    email=EMAILS["center"],
                    password_hash=hash_password(TEST_PASSWORD),
                    display_name="Other Center",
                    role=UserRole.DIVE_CENTER,
                    is_active=True,
                ),
                User(
                    email=EMAILS["admin"],
                    password_hash=hash_password(TEST_PASSWORD),
                    display_name="Portal Admin",
                    role=UserRole.ADMIN,
                    is_active=True,
                ),
            ]
        )
    yield
    with SessionLocal.begin() as session:
        user_ids = select(User.id).where(User.email.in_(EMAILS.values()))
        session.execute(delete(Comment).where(Comment.user_id.in_(user_ids)))
        session.execute(delete(DiveSiteSubmission).where(DiveSiteSubmission.submitted_by.in_(user_ids)))
        session.execute(delete(DiveCenterProfile).where(DiveCenterProfile.user_id.in_(user_ids)))
        session.execute(delete(User).where(User.email.in_(EMAILS.values())))


@pytest.fixture(autouse=True)
def clean_portal_data(portal_users: None) -> Generator[None, None, None]:
    with SessionLocal.begin() as session:
        users = list(session.scalars(select(User).where(User.email.in_(EMAILS.values()))))
        user_ids = [user.id for user in users]
        session.execute(delete(Comment).where(Comment.user_id.in_(user_ids)))
        session.execute(delete(DiveSiteSubmission).where(DiveSiteSubmission.submitted_by.in_(user_ids)))
        session.execute(delete(DiveCenterProfile).where(DiveCenterProfile.user_id.in_(user_ids)))
        for user in users:
            user.role = {
                EMAILS["user"]: UserRole.USER,
                EMAILS["center"]: UserRole.DIVE_CENTER,
                EMAILS["admin"]: UserRole.ADMIN,
            }[user.email]
            user.is_active = True
    yield


def token_for(key: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": EMAILS[key], "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth(key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token_for(key)}"}


def user_id(key: str) -> int:
    with SessionLocal() as session:
        return session.scalar(select(User.id).where(User.email == EMAILS[key]))


def profile_payload(name: str = "Keys Test Dive Center") -> dict:
    return {
        "business_name": name,
        "description": "A local test profile used only by the automated suite.",
        "phone": "+1 305 555 0100",
        "website": "https://example.com/dive-center",
        "address": "Florida Keys",
        "agencies": ["PADI", "SSI"],
        "services": ["Boat trips", "Rentals"],
    }


def submission_payload(name: str = "Portal Test Reef", longitude: float = -80.2) -> dict:
    return {
        "name": name,
        "site_type": "Reef",
        "min_depth_m": 8,
        "max_depth_m": 24,
        "description": "A contributed test location for the portal approval workflow.",
        "longitude": longitude,
        "latitude": 25.1,
    }


def test_user_cannot_access_dive_center_or_admin_apis() -> None:
    headers = auth("user")
    assert client.get("/api/dive-center/profile", headers=headers).status_code == 403
    assert client.post(
        "/api/dive-center/submissions",
        headers=headers,
        json=submission_payload(),
    ).status_code == 403
    assert client.get("/api/admin/dashboard", headers=headers).status_code == 403


def test_dive_center_profile_is_one_per_account_and_role_protected() -> None:
    headers = auth("center")
    assert client.get("/api/dive-center/profile", headers=headers).status_code == 404
    incomplete_location = profile_payload()
    incomplete_location["longitude"] = -80.12
    assert client.put(
        "/api/dive-center/profile", headers=headers, json=incomplete_location
    ).status_code == 422
    created = client.put(
        "/api/dive-center/profile", headers=headers, json=profile_payload()
    )
    assert created.status_code == 200
    assert created.json()["is_verified"] is False
    assert created.json()["longitude"] is None
    assert created.json()["latitude"] is None
    located_payload = profile_payload("Updated Test Dive Center")
    located_payload.update({"longitude": -80.12, "latitude": 25.08})
    updated = client.patch(
        "/api/dive-center/profile",
        headers=headers,
        json=located_payload,
    )
    assert updated.status_code == 200
    assert updated.json()["id"] == created.json()["id"]
    assert updated.json()["longitude"] == pytest.approx(-80.12)
    assert updated.json()["latitude"] == pytest.approx(25.08)
    with SessionLocal() as session:
        assert session.scalar(
            select(func.count())
            .select_from(DiveCenterProfile)
            .where(DiveCenterProfile.user_id == user_id("center"))
        ) == 1


@pytest.mark.parametrize(
    "changes",
    [
        {"longitude": -181},
        {"latitude": 91},
        {"site_type": "Cave"},
        {"min_depth_m": -1},
        {"min_depth_m": 30, "max_depth_m": 10},
    ],
)
def test_submission_validation_rejects_invalid_spatial_or_depth_data(changes: dict) -> None:
    payload = submission_payload()
    payload.update(changes)
    response = client.post(
        "/api/dive-center/submissions", headers=auth("center"), json=payload
    )
    assert response.status_code == 422


def test_pending_submission_owner_can_edit_and_delete() -> None:
    headers = auth("center")
    created = client.post(
        "/api/dive-center/submissions", headers=headers, json=submission_payload()
    )
    assert created.status_code == 201
    submission_id = created.json()["id"]
    changed = submission_payload("Edited Portal Test Reef", -80.25)
    edited = client.patch(
        f"/api/dive-center/submissions/{submission_id}",
        headers=headers,
        json=changed,
    )
    assert edited.status_code == 200
    assert edited.json()["name"] == "Edited Portal Test Reef"
    assert edited.json()["longitude"] == -80.25
    assert client.delete(
        f"/api/dive-center/submissions/{submission_id}", headers=headers
    ).status_code == 204


def test_dive_center_cannot_modify_other_submission_or_use_admin_review() -> None:
    owner_headers = auth("center")
    created = client.post(
        "/api/dive-center/submissions",
        headers=owner_headers,
        json=submission_payload(),
    ).json()
    admin_headers = auth("admin")
    user_identifier = user_id("user")
    promote = client.patch(
        f"/api/admin/users/{user_identifier}",
        headers=admin_headers,
        json={"role": "DIVE_CENTER"},
    )
    assert promote.status_code == 200
    other_headers = auth("user")
    assert client.get(
        f"/api/dive-center/submissions/{created['id']}", headers=other_headers
    ).status_code == 403
    assert client.patch(
        f"/api/dive-center/submissions/{created['id']}",
        headers=other_headers,
        json=submission_payload("Unauthorized edit"),
    ).status_code == 403
    assert client.post(
        f"/api/admin/submissions/{created['id']}/approve",
        headers=owner_headers,
        json={},
    ).status_code == 403


def test_admin_user_management_safeguards() -> None:
    headers = auth("admin")
    admin_identifier = user_id("admin")
    assert client.patch(
        f"/api/admin/users/{admin_identifier}",
        headers=headers,
        json={"is_active": False},
    ).status_code == 400
    center_identifier = user_id("center")
    demoted = client.patch(
        f"/api/admin/users/{center_identifier}",
        headers=headers,
        json={"role": "USER", "is_active": False},
    )
    assert demoted.status_code == 200
    assert demoted.json()["role"] == "USER"
    assert demoted.json()["is_active"] is False


def test_complete_promotion_profile_review_publication_and_moderation_flow() -> None:
    official_count_before = len(client.get("/api/dive-sites").json()["features"])
    assert official_count_before == 63
    public_before = client.get("/api/community/dive-sites").json()["features"]
    admin_headers = auth("admin")
    dashboard_before = client.get("/api/admin/dashboard", headers=admin_headers).json()
    promoted_user_id = user_id("user")

    promoted = client.patch(
        f"/api/admin/users/{promoted_user_id}",
        headers=admin_headers,
        json={"role": "DIVE_CENTER"},
    )
    assert promoted.status_code == 200
    center_headers = auth("user")
    profile = client.put(
        "/api/dive-center/profile",
        headers=center_headers,
        json=profile_payload("Promoted User Dive Center"),
    )
    assert profile.status_code == 200

    verification = client.patch(
        f"/api/admin/dive-centers/{profile.json()['id']}/verification",
        headers=admin_headers,
        json={"is_verified": True},
    )
    assert verification.status_code == 200
    assert verification.json()["is_verified"] is True

    pending = client.post(
        "/api/dive-center/submissions",
        headers=center_headers,
        json=submission_payload("Approved Community Reef", -80.31),
    )
    assert pending.status_code == 201
    assert pending.json()["status"] == "PENDING"
    assert client.get("/api/community/dive-sites").json()["features"] == public_before

    admin_queue = client.get(
        "/api/admin/submissions?status=PENDING", headers=admin_headers
    )
    assert admin_queue.status_code == 200
    assert [item["id"] for item in admin_queue.json()] == [pending.json()["id"]]
    approved = client.post(
        f"/api/admin/submissions/{pending.json()['id']}/approve",
        headers=admin_headers,
        json={"admin_note": "Location reviewed for portfolio demonstration."},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "APPROVED"
    assert client.patch(
        f"/api/dive-center/submissions/{pending.json()['id']}",
        headers=center_headers,
        json=submission_payload("Too late to edit"),
    ).status_code == 409

    public_features = client.get("/api/community/dive-sites").json()["features"]
    assert len(public_features) == len(public_before) + 1
    published = next(item for item in public_features if item["id"] == pending.json()["id"])
    assert published["properties"]["site_name"] == "Approved Community Reef"
    assert published["properties"]["business_name"] == "Promoted User Dive Center"
    assert published["properties"]["data_origin"] == "dive_center_submitted"

    archived = client.post(
        f"/api/admin/submissions/{pending.json()['id']}/archive",
        headers=admin_headers,
        json={"admin_note": "Unpublished while preserving contribution history."},
    )
    assert archived.status_code == 200
    assert archived.json()["status"] == "ARCHIVED"
    assert client.get("/api/community/dive-sites").json()["features"] == public_before
    assert client.delete(
        f"/api/dive-center/submissions/{pending.json()['id']}",
        headers=center_headers,
    ).status_code == 409
    owner_archived = client.get(
        "/api/dive-center/submissions", headers=center_headers
    ).json()
    assert next(item for item in owner_archived if item["id"] == pending.json()["id"])[
        "status"
    ] == "ARCHIVED"

    rejected_pending = client.post(
        "/api/dive-center/submissions",
        headers=center_headers,
        json=submission_payload("Rejected Community Wall", -80.32),
    ).json()
    rejected = client.post(
        f"/api/admin/submissions/{rejected_pending['id']}/reject",
        headers=admin_headers,
        json={"admin_note": "Location evidence is insufficient."},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "REJECTED"
    own_submissions = client.get(
        "/api/dive-center/submissions", headers=center_headers
    ).json()
    rejected_owner_view = next(item for item in own_submissions if item["status"] == "REJECTED")
    assert rejected_owner_view["admin_note"] == "Location evidence is insufficient."
    assert client.get("/api/community/dive-sites").json()["features"] == public_before

    comment = client.post(
        "/api/dive-sites/1/comments",
        headers=center_headers,
        json={"body": "Temporary moderation test comment."},
    )
    assert comment.status_code == 201
    moderation_queue = client.get("/api/admin/comments", headers=admin_headers)
    assert any(item["id"] == comment.json()["id"] for item in moderation_queue.json())
    assert client.delete(
        f"/api/comments/{comment.json()['id']}", headers=admin_headers
    ).status_code == 204

    dashboard = client.get("/api/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["approved_submissions"] == dashboard_before["approved_submissions"]
    assert dashboard.json()["rejected_submissions"] == dashboard_before["rejected_submissions"] + 1
    assert dashboard.json()["archived_submissions"] == dashboard_before["archived_submissions"] + 1
    assert len(client.get("/api/dive-sites").json()["features"]) == 63


def test_existing_reference_counts_remain_unchanged() -> None:
    assert len(client.get("/api/dive-sites").json()["features"]) == 63
    assert len(client.get("/api/dive-centers").json()["features"]) == 19
    assert len(client.get("/api/departure-points").json()["features"]) == 85
