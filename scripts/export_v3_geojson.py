"""Export the three official GeoPackage point layers as deterministic GeoJSON."""

from __future__ import annotations

import json
import sqlite3
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "geoserver" / "data" / "dive_planner_data.gpkg"
OUTPUT = ROOT / "public" / "data"
LAYERS = {
    "dive_sites": "dive_sites.geojson",
    "dive_centers_clean": "dive_centers.geojson",
    "departure_points_clean": "departure_points.geojson",
}
EXPECTED_COUNTS = {
    "dive_sites": 63,
    "dive_centers_clean": 19,
    "departure_points_clean": 85,
}


def point_from_gpkg(blob: bytes) -> list[float]:
    if not blob or blob[:2] != b"GP":
        raise ValueError("Invalid GeoPackage geometry header")

    flags = blob[3]
    envelope_code = (flags >> 1) & 0b111
    envelope_sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    if envelope_code not in envelope_sizes:
        raise ValueError("Unsupported GeoPackage envelope")

    offset = 8 + envelope_sizes[envelope_code]
    byte_order = "<" if blob[offset] == 1 else ">"
    geometry_type = struct.unpack_from(f"{byte_order}I", blob, offset + 1)[0]
    base_type = geometry_type % 1000
    if base_type != 1:
        raise ValueError(f"Expected Point geometry, received type {geometry_type}")

    x, y = struct.unpack_from(f"{byte_order}dd", blob, offset + 5)
    return [x, y]


def export_layer(connection: sqlite3.Connection, layer: str, filename: str) -> None:
    columns = [
        row[1]
        for row in connection.execute(f'PRAGMA table_info("{layer}")').fetchall()
    ]
    if "fid" not in columns or "geom" not in columns:
        raise RuntimeError(f"{layer} is missing fid or geom")

    rows = connection.execute(f'SELECT * FROM "{layer}" ORDER BY fid').fetchall()
    expected = EXPECTED_COUNTS[layer]
    if len(rows) != expected:
        raise RuntimeError(f"{layer}: expected {expected} rows, found {len(rows)}")

    features = []
    for row in rows:
        record = dict(zip(columns, row, strict=True))
        fid = record.pop("fid")
        geometry = record.pop("geom")
        features.append(
            {
                "type": "Feature",
                "id": fid,
                "geometry": {"type": "Point", "coordinates": point_from_gpkg(geometry)},
                "properties": record,
            }
        )

    destination = OUTPUT / filename
    destination.write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": features},
            ensure_ascii=False,
            separators=(",", ":"),
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"{layer}: {len(features)} -> {destination.relative_to(ROOT)}")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(SOURCE) as connection:
        for layer, filename in LAYERS.items():
            export_layer(connection, layer, filename)


if __name__ == "__main__":
    main()
