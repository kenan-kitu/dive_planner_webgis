"""Import the three existing GeoPackage layers into their PostGIS tables."""

import argparse
from pathlib import Path

import fiona
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from sqlalchemy import delete, func, select

from app.config import get_settings
from app.database import SessionLocal
from app.models import DeparturePoint, DiveCenter, DiveSite

LAYER_MODELS = {
    "dive_sites": DiveSite,
    "dive_centers_clean": DiveCenter,
    "departure_points_clean": DeparturePoint,
}
EXPECTED_COUNTS = {
    "dive_sites": 63,
    "dive_centers_clean": 19,
    "departure_points_clean": 85,
}


def current_counts(session) -> dict[str, int]:
    return {
        layer_name: session.scalar(select(func.count()).select_from(model)) or 0
        for layer_name, model in LAYER_MODELS.items()
    }


def import_layer(session, geopackage: Path, layer_name: str, model: type) -> int:
    imported = 0
    with fiona.open(geopackage, layer=layer_name) as source:
        if source.crs.to_epsg() != 4326:
            raise RuntimeError(f"{layer_name} must use EPSG:4326; found {source.crs}")

        model_columns = {column.name for column in model.__table__.columns}
        for feature in source:
            geometry = shape(feature["geometry"])
            if geometry.geom_type != "Point":
                raise RuntimeError(f"{layer_name} feature {feature.id} is not a Point")

            values = {
                key: value
                for key, value in dict(feature["properties"]).items()
                if key in model_columns
            }
            values["fid"] = int(feature.id)
            values["geom"] = from_shape(geometry, srid=4326)
            session.add(model(**values))
            imported += 1
    return imported


def run_import(*, if_empty: bool, replace: bool) -> None:
    geopackage = Path(get_settings().geopackage_path)
    if not geopackage.is_file():
        raise FileNotFoundError(f"GeoPackage not found: {geopackage}")

    with SessionLocal.begin() as session:
        counts = current_counts(session)
        if counts == EXPECTED_COUNTS and if_empty:
            print(f"PostGIS already contains the expected rows: {counts}")
            return
        if any(counts.values()) and not replace:
            raise RuntimeError(
                f"PostGIS tables are not empty ({counts}). Use --replace for an explicit re-import."
            )
        if replace:
            for model in LAYER_MODELS.values():
                session.execute(delete(model))

        imported_counts = {
            layer_name: import_layer(session, geopackage, layer_name, model)
            for layer_name, model in LAYER_MODELS.items()
        }
        if imported_counts != EXPECTED_COUNTS:
            raise RuntimeError(
                f"Unexpected GeoPackage counts: {imported_counts}; expected {EXPECTED_COUNTS}"
            )
        print(f"Imported GeoPackage rows into PostGIS: {imported_counts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--if-empty", action="store_true", help="Skip when all expected rows exist")
    mode.add_argument("--replace", action="store_true", help="Delete and re-import the three tables")
    args = parser.parse_args()
    run_import(if_empty=args.if_empty, replace=args.replace)
