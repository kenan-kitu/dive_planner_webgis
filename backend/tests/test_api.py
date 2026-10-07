from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import SessionLocal
from app.main import app

client = TestClient(app)


def test_database_has_postgis() -> None:
    with SessionLocal() as session:
        assert session.execute(text("SELECT 1")).scalar_one() == 1
        assert session.execute(text("SELECT PostGIS_Version()")).scalar_one()


def test_health_reports_api_and_database() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["api"] == "ok"
    assert payload["database"] == "ok"
    assert payload["postgis_version"]


def test_expected_layer_counts() -> None:
    assert len(client.get("/api/dive-sites").json()["features"]) == 63
    assert len(client.get("/api/dive-centers").json()["features"]) == 19
    assert len(client.get("/api/departure-points").json()["features"]) == 85


def test_dive_site_type_and_depth_filters() -> None:
    response = client.get("/api/dive-sites", params={"type": "Wreck", "max_depth": 30})
    assert response.status_code == 200
    features = response.json()["features"]
    assert features
    assert all(feature["properties"]["site_type"] == "Wreck" for feature in features)
    assert all(feature["properties"]["max_depth_m"] <= 30 for feature in features)


def test_dive_site_detail_and_missing_site() -> None:
    response = client.get("/api/dive-sites/1")
    assert response.status_code == 200
    assert response.json()["id"] == 1
    assert client.get("/api/dive-sites/999999").status_code == 404


def test_nearby_uses_spatial_distance_and_returns_nm() -> None:
    first_site = client.get("/api/dive-sites/1").json()
    longitude, latitude = first_site["geometry"]["coordinates"]
    response = client.get(
        "/api/dive-sites/nearby",
        params={"lat": latitude, "lon": longitude, "radius_nm": 0.1},
    )
    assert response.status_code == 200
    features = response.json()["features"]
    assert features
    assert features[0]["id"] == 1
    assert features[0]["properties"]["distance_nm"] == 0
    distances = [feature["properties"]["distance_nm"] for feature in features]
    assert distances == sorted(distances)
