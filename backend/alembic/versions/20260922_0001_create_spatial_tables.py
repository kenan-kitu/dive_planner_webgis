"""Create PostGIS tables for the three existing GeoPackage layers."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision: str = "20260922_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "dive_sites",
        sa.Column("fid", sa.Integer(), primary_key=True),
        sa.Column("geom", Geometry("POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("site_name", sa.Text()),
        sa.Column("mooring_count", sa.Integer()),
        sa.Column("site_type", sa.String(30)),
        sa.Column("depth_m", sa.Float()),
        sa.Column("depth_source", sa.String(50)),
        sa.Column("data_quality", sa.String(20)),
        sa.Column("min_depth_m", sa.Float()),
        sa.Column("max_depth_m", sa.Float()),
        sa.Column("access_type", sa.String(20)),
        sa.Column("depth_class", sa.String(30)),
        sa.Column("data_origin", sa.String(20)),
        sa.Column("description", sa.String(250)),
    )
    op.create_index("ix_dive_sites_geom_gist", "dive_sites", ["geom"], postgresql_using="gist")

    op.create_table(
        "dive_centers_clean",
        sa.Column("fid", sa.Integer(), primary_key=True),
        sa.Column("geom", Geometry("POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("record_id", sa.Integer()),
        sa.Column("name", sa.String(150)),
        sa.Column("category", sa.String(50)),
        sa.Column("phone", sa.String(100)),
        sa.Column("website", sa.String(250)),
        sa.Column("address", sa.String(250)),
        sa.Column("osm_id", sa.String(100)),
        sa.Column("source", sa.String(50)),
        sa.Column("nearest_dive_m", sa.Float()),
    )
    op.create_index(
        "ix_dive_centers_clean_geom_gist",
        "dive_centers_clean",
        ["geom"],
        postgresql_using="gist",
    )

    op.create_table(
        "departure_points_clean",
        sa.Column("fid", sa.Integer(), primary_key=True),
        sa.Column("geom", Geometry("POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("record_id", sa.Integer()),
        sa.Column("name", sa.String(150)),
        sa.Column("type", sa.String(50)),
        sa.Column("operator", sa.String(150)),
        sa.Column("website", sa.String(250)),
        sa.Column("osm_id", sa.String(100)),
        sa.Column("source", sa.String(50)),
        sa.Column("nearest_dive_m", sa.Float()),
    )
    op.create_index(
        "ix_departure_points_clean_geom_gist",
        "departure_points_clean",
        ["geom"],
        postgresql_using="gist",
    )


def downgrade() -> None:
    op.drop_table("departure_points_clean")
    op.drop_table("dive_centers_clean")
    op.drop_table("dive_sites")
