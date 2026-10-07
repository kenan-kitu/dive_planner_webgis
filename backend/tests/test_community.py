from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement
from sqlalchemy import delete, func, select

from app.auth.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import Comment, DiveSite, Favorite, Rating, User, UserRole

client = TestClient(app)
TEST_PASSWORD = "Community-test-password-2026!"
USER_EMAILS = {
    "owner": "community-owner@example.com",
    "other": "community-other@example.com",
    "admin": "community-admin@example.com",
}
SITE_ID = 900001
SECOND_SITE_ID = 900002


@pytest.fixture(scope="module", autouse=True)
def community_users() -> Generator[None, None, None]:
    with SessionLocal.begin() as session:
        session.execute(delete(DiveSite).where(DiveSite.fid.in_([SITE_ID, SECOND_SITE_ID])))
        session.execute(delete(User).where(User.email.in_(USER_EMAILS.values())))
        session.add_all(
            [
                DiveSite(
                    fid=SITE_ID,
                    geom=WKTElement("POINT(-80.3 25.1)", srid=4326),
                    site_name="Community Test Site",
                    site_type="Reef",
                ),
                DiveSite(
                    fid=SECOND_SITE_ID,
                    geom=WKTElement("POINT(-80.4 25.2)", srid=4326),
                    site_name="Community Second Test Site",
                    site_type="Reef",
                ),
                User(
                    email=USER_EMAILS["owner"],
                    password_hash=hash_password(TEST_PASSWORD),
                    display_name="Community Owner",
                    role=UserRole.USER,
                    is_active=True,
                ),
                User(
                    email=USER_EMAILS["other"],
                    password_hash=hash_password(TEST_PASSWORD),
                    display_name="Community Other",
                    role=UserRole.DIVE_CENTER,
                    is_active=True,
                ),
                User(
                    email=USER_EMAILS["admin"],
                    password_hash=hash_password(TEST_PASSWORD),
                    display_name="Community Admin",
                    role=UserRole.ADMIN,
                    is_active=True,
                ),
            ]
        )
    yield
    with SessionLocal.begin() as session:
        session.execute(delete(User).where(User.email.in_(USER_EMAILS.values())))
        session.execute(delete(DiveSite).where(DiveSite.fid.in_([SITE_ID, SECOND_SITE_ID])))


@pytest.fixture(autouse=True)
def clean_community_rows(community_users: None) -> Generator[None, None, None]:
    with SessionLocal.begin() as session:
        user_ids = select(User.id).where(User.email.in_(USER_EMAILS.values()))
        session.execute(delete(Comment).where(Comment.user_id.in_(user_ids)))
        session.execute(delete(Rating).where(Rating.user_id.in_(user_ids)))
        session.execute(delete(Favorite).where(Favorite.user_id.in_(user_ids)))
    yield


def token_for(user_key: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": USER_EMAILS[user_key], "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth(user_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token_for(user_key)}"}


def create_comment(user_key: str, body: str = "A useful local test comment.") -> dict:
    response = client.post(
        f"/api/dive-sites/{SITE_ID}/comments",
        json={"body": body},
        headers=auth(user_key),
    )
    assert response.status_code == 201
    return response.json()


def test_anonymous_can_read_comments() -> None:
    create_comment("owner")
    response = client.get(f"/api/dive-sites/{SITE_ID}/comments")
    assert response.status_code == 200
    assert response.json()[0]["display_name"] == "Community Owner"


def test_anonymous_cannot_create_comment() -> None:
    response = client.post(
        f"/api/dive-sites/{SITE_ID}/comments",
        json={"body": "Anonymous comment"},
    )
    assert response.status_code == 401


def test_empty_comment_is_rejected() -> None:
    response = client.post(
        f"/api/dive-sites/{SITE_ID}/comments",
        json={"body": "   "},
        headers=auth("owner"),
    )
    assert response.status_code == 422


def test_user_can_create_and_edit_own_comment() -> None:
    comment = create_comment("owner")
    response = client.patch(
        f"/api/comments/{comment['id']}",
        json={"body": "Edited by its owner."},
        headers=auth("owner"),
    )
    assert response.status_code == 200
    assert response.json()["body"] == "Edited by its owner."


def test_dive_center_role_can_comment_like_a_user() -> None:
    comment = create_comment("other", "Dive center role comment.")
    assert comment["role"] == "DIVE_CENTER"


def test_user_cannot_edit_another_users_comment() -> None:
    comment = create_comment("owner")
    response = client.patch(
        f"/api/comments/{comment['id']}",
        json={"body": "Not allowed"},
        headers=auth("other"),
    )
    assert response.status_code == 403


def test_user_can_delete_own_comment() -> None:
    comment = create_comment("owner")
    response = client.delete(
        f"/api/comments/{comment['id']}",
        headers=auth("owner"),
    )
    assert response.status_code == 204
    assert client.get(f"/api/dive-sites/{SITE_ID}/comments").json() == []


def test_user_cannot_delete_another_users_comment() -> None:
    comment = create_comment("owner")
    response = client.delete(
        f"/api/comments/{comment['id']}",
        headers=auth("other"),
    )
    assert response.status_code == 403


def test_admin_can_delete_any_comment() -> None:
    comment = create_comment("owner")
    response = client.delete(
        f"/api/comments/{comment['id']}",
        headers=auth("admin"),
    )
    assert response.status_code == 204


def test_admin_can_edit_any_comment() -> None:
    comment = create_comment("owner")
    response = client.patch(
        f"/api/comments/{comment['id']}",
        json={"body": "Administrator correction."},
        headers=auth("admin"),
    )
    assert response.status_code == 200
    assert response.json()["body"] == "Administrator correction."


def test_anonymous_can_read_rating_aggregate_but_cannot_rate() -> None:
    response = client.get(f"/api/dive-sites/{SITE_ID}/rating")
    assert response.status_code == 200
    assert response.json() == {
        "average_rating": None,
        "rating_count": 0,
        "current_user_rating": None,
    }
    assert client.put(
        f"/api/dive-sites/{SITE_ID}/rating",
        json={"rating": 5},
    ).status_code == 401


@pytest.mark.parametrize("invalid_rating", [0, 6])
def test_rating_outside_range_is_rejected(invalid_rating: int) -> None:
    response = client.put(
        f"/api/dive-sites/{SITE_ID}/rating",
        json={"rating": invalid_rating},
        headers=auth("owner"),
    )
    assert response.status_code == 422


def test_second_rating_updates_without_duplicate() -> None:
    headers = auth("owner")
    first = client.put(
        f"/api/dive-sites/{SITE_ID}/rating",
        json={"rating": 3},
        headers=headers,
    )
    second = client.put(
        f"/api/dive-sites/{SITE_ID}/rating",
        json={"rating": 5},
        headers=headers,
    )
    assert first.status_code == 200
    assert second.json()["current_user_rating"] == 5
    with SessionLocal() as session:
        user_id = session.scalar(select(User.id).where(User.email == USER_EMAILS["owner"]))
        count = session.scalar(
            select(func.count(Rating.id)).where(
                Rating.user_id == user_id,
                Rating.dive_site_id == SITE_ID,
            )
        )
        assert count == 1


def test_rating_average_count_and_removal() -> None:
    owner_headers = auth("owner")
    other_headers = auth("other")
    client.put(
        f"/api/dive-sites/{SITE_ID}/rating",
        json={"rating": 4},
        headers=owner_headers,
    )
    client.put(
        f"/api/dive-sites/{SITE_ID}/rating",
        json={"rating": 5},
        headers=other_headers,
    )
    aggregate = client.get(f"/api/dive-sites/{SITE_ID}/rating").json()
    assert aggregate["average_rating"] == 4.5
    assert aggregate["rating_count"] == 2
    assert client.delete(
        f"/api/dive-sites/{SITE_ID}/rating",
        headers=owner_headers,
    ).status_code == 204
    assert client.get(f"/api/dive-sites/{SITE_ID}/rating").json()["rating_count"] == 1


def test_anonymous_cannot_favorite() -> None:
    response = client.post(f"/api/dive-sites/{SITE_ID}/favorite")
    assert response.status_code == 401


def test_user_can_favorite_without_duplicates_and_remove() -> None:
    headers = auth("owner")
    first = client.post(f"/api/dive-sites/{SITE_ID}/favorite", headers=headers)
    second = client.post(f"/api/dive-sites/{SITE_ID}/favorite", headers=headers)
    assert first.json() == {"favorited": True}
    assert second.json() == {"favorited": True}
    with SessionLocal() as session:
        user_id = session.scalar(select(User.id).where(User.email == USER_EMAILS["owner"]))
        count = session.scalar(
            select(func.count(Favorite.id)).where(
                Favorite.user_id == user_id,
                Favorite.dive_site_id == SITE_ID,
            )
        )
        assert count == 1
    assert client.delete(
        f"/api/dive-sites/{SITE_ID}/favorite",
        headers=headers,
    ).json() == {"favorited": False}


def test_user_lists_only_own_favorites() -> None:
    owner_headers = auth("owner")
    other_headers = auth("other")
    client.post(f"/api/dive-sites/{SITE_ID}/favorite", headers=owner_headers)
    client.post(f"/api/dive-sites/{SECOND_SITE_ID}/favorite", headers=other_headers)
    owner_ids = [
        feature["id"]
        for feature in client.get("/api/account/favorites", headers=owner_headers).json()["features"]
    ]
    other_ids = [
        feature["id"]
        for feature in client.get("/api/account/favorites", headers=other_headers).json()["features"]
    ]
    assert owner_ids == [SITE_ID]
    assert other_ids == [SECOND_SITE_ID]
