from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from geoalchemy2 import Geography
from sqlalchemy import Float, cast, func, select, text
from sqlalchemy.orm import Session

from app.auth.routes import router as auth_router
from app.community.routes import router as community_router
from app.portal.routes import router as portal_router
from app.config import get_settings
from app.database import get_db
from app.geojson import collection, feature_from_record
from app.models import DeparturePoint, DiveCenter, DiveSite
from app.schemas import GeoJSONFeature, GeoJSONFeatureCollection, HealthResponse

settings = get_settings()
app = FastAPI(title=settings.app_name, version="2.4.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(community_router)
app.include_router(portal_router)


def point_columns(model: type) -> tuple:
    return func.ST_X(model.geom).label("longitude"), func.ST_Y(model.geom).label("latitude")


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        postgis_version = db.execute(text("SELECT PostGIS_Version()")).scalar_one()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not ready",
        ) from exc
    return HealthResponse(api="ok", database="ok", postgis_version=postgis_version)


@app.get(
    "/api/dive-sites/nearby",
    response_model=GeoJSONFeatureCollection,
    tags=["dive sites"],
)
def nearby_dive_sites(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    radius_nm: float = Query(gt=0, le=200),
    db: Session = Depends(get_db),
) -> GeoJSONFeatureCollection:
    site_geography = cast(DiveSite.geom, Geography(srid=4326))
    search_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
    search_geography = cast(search_point, Geography(srid=4326))
    distance_m = cast(func.ST_Distance(site_geography, search_geography), Float).label(
        "distance_m"
    )
    longitude, latitude = point_columns(DiveSite)

    rows = db.execute(
        select(DiveSite, longitude, latitude, distance_m)
        .where(func.ST_DWithin(site_geography, search_geography, radius_nm * 1852.0))
        .order_by(distance_m)
    ).all()

    return collection(
        [
            feature_from_record(
                site,
                row_longitude,
                row_latitude,
                extra_properties={"distance_nm": round(row_distance_m / 1852.0, 3)},
            )
            for site, row_longitude, row_latitude, row_distance_m in rows
        ]
    )


@app.get("/api/dive-sites", response_model=GeoJSONFeatureCollection, tags=["dive sites"])
def list_dive_sites(
    type: str | None = Query(default=None),
    max_depth: float | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
) -> GeoJSONFeatureCollection:
    longitude, latitude = point_columns(DiveSite)
    statement = select(DiveSite, longitude, latitude).order_by(DiveSite.fid)
    if type:
        statement = statement.where(func.lower(DiveSite.site_type) == type.strip().lower())
    if max_depth is not None:
        statement = statement.where(DiveSite.max_depth_m <= max_depth)

    rows = db.execute(statement).all()
    return collection(
        [feature_from_record(site, row_longitude, row_latitude) for site, row_longitude, row_latitude in rows]
    )


@app.get("/api/dive-sites/{site_id}", response_model=GeoJSONFeature, tags=["dive sites"])
def get_dive_site(site_id: int, db: Session = Depends(get_db)) -> GeoJSONFeature:
    longitude, latitude = point_columns(DiveSite)
    row = db.execute(
        select(DiveSite, longitude, latitude).where(DiveSite.fid == site_id)
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Dive site not found")
    site, row_longitude, row_latitude = row
    return feature_from_record(site, row_longitude, row_latitude)


@app.get("/api/dive-centers", response_model=GeoJSONFeatureCollection, tags=["reference data"])
def list_dive_centers(db: Session = Depends(get_db)) -> GeoJSONFeatureCollection:
    longitude, latitude = point_columns(DiveCenter)
    rows = db.execute(select(DiveCenter, longitude, latitude).order_by(DiveCenter.fid)).all()
    return collection(
        [feature_from_record(center, row_longitude, row_latitude) for center, row_longitude, row_latitude in rows]
    )


@app.get(
    "/api/departure-points",
    response_model=GeoJSONFeatureCollection,
    tags=["reference data"],
)
def list_departure_points(db: Session = Depends(get_db)) -> GeoJSONFeatureCollection:
    longitude, latitude = point_columns(DeparturePoint)
    rows = db.execute(
        select(DeparturePoint, longitude, latitude).order_by(DeparturePoint.fid)
    ).all()
    return collection(
        [feature_from_record(point, row_longitude, row_latitude) for point, row_longitude, row_latitude in rows]
    )
