"""Add Dive Center location and contributed-site archive status."""

from typing import Sequence, Union

from alembic import op
from geoalchemy2 import Geometry
import sqlalchemy as sa

revision: str = "20260923_0005"
down_revision: Union[str, None] = "20260922_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "dive_center_profiles",
        sa.Column(
            "geom",
            Geometry("POINT", srid=4326, spatial_index=False),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_dive_center_profiles_geom",
        "dive_center_profiles",
        ["geom"],
        postgresql_using="gist",
    )
    op.execute("ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'ARCHIVED'")


def downgrade() -> None:
    op.drop_index("ix_dive_center_profiles_geom", table_name="dive_center_profiles")
    op.drop_column("dive_center_profiles", "geom")
    # PostgreSQL enum values are intentionally retained to avoid rebuilding the
    # type and rewriting existing contribution history during a downgrade.
