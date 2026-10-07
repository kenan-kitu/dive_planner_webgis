from typing import Any

from app.schemas import GeoJSONFeature, GeoJSONFeatureCollection, PointGeometry


def feature_from_record(
    record: Any,
    longitude: float,
    latitude: float,
    *,
    extra_properties: dict[str, Any] | None = None,
) -> GeoJSONFeature:
    properties = {
        column.name: getattr(record, column.name)
        for column in record.__table__.columns
        if column.name != "geom"
    }
    if extra_properties:
        properties.update(extra_properties)

    return GeoJSONFeature(
        id=record.fid,
        geometry=PointGeometry(coordinates=(longitude, latitude)),
        properties=properties,
    )


def collection(features: list[GeoJSONFeature]) -> GeoJSONFeatureCollection:
    return GeoJSONFeatureCollection(features=features)
