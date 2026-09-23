"""Create Dive Center profile and dive-site submission tables."""

from typing import Sequence, Union

from alembic import op
from geoalchemy2 import Geometry
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260922_0004"
down_revision: Union[str, None] = "20260922_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

submission_status = postgresql.ENUM(
    "PENDING",
    "APPROVED",
    "REJECTED",
    name="submission_status",
    create_type=False,
)


def timestamp_columns() -> tuple[sa.Column, sa.Column]:
    return (
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def upgrade() -> None:
    created_at, updated_at = timestamp_columns()
    op.create_table(
        "dive_center_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("business_name", sa.String(150), nullable=False),
        sa.Column("description", sa.String(2000)),
        sa.Column("phone", sa.String(100)),
        sa.Column("website", sa.String(500)),
        sa.Column("address", sa.String(500)),
        sa.Column(
            "agencies",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
        sa.Column(
            "services",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        created_at,
        updated_at,
        sa.UniqueConstraint("user_id", name="uq_dive_center_profiles_user_id"),
    )
    op.create_index(
        "ix_dive_center_profiles_user_id",
        "dive_center_profiles",
        ["user_id"],
        unique=True,
    )

    op.execute("CREATE TYPE submission_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')")
    created_at, updated_at = timestamp_columns()
    op.create_table(
        "dive_site_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "submitted_by",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("site_type", sa.String(20), nullable=False),
        sa.Column("min_depth_m", sa.Float()),
        sa.Column("max_depth_m", sa.Float()),
        sa.Column("description", sa.String(2000), nullable=False),
        sa.Column("geom", Geometry("POINT", srid=4326), nullable=False),
        sa.Column(
            "status",
            submission_status,
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("admin_note", sa.String(1000)),
        sa.Column(
            "reviewed_by",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        created_at,
        updated_at,
        sa.CheckConstraint(
            "site_type IN ('Reef', 'Wreck', 'Wall')",
            name="ck_submission_site_type",
        ),
        sa.CheckConstraint(
            "min_depth_m IS NULL OR min_depth_m >= 0",
            name="ck_submission_min_depth",
        ),
        sa.CheckConstraint(
            "max_depth_m IS NULL OR max_depth_m >= 0",
            name="ck_submission_max_depth",
        ),
        sa.CheckConstraint(
            "min_depth_m IS NULL OR max_depth_m IS NULL OR max_depth_m >= min_depth_m",
            name="ck_submission_depth_order",
        ),
    )
    op.create_index(
        "ix_dive_site_submissions_submitted_by",
        "dive_site_submissions",
        ["submitted_by"],
    )
    op.create_index(
        "ix_dive_site_submissions_status",
        "dive_site_submissions",
        ["status"],
    )
    op.create_index(
        "ix_dive_site_submissions_geom",
        "dive_site_submissions",
        ["geom"],
        postgresql_using="gist",
    )


def downgrade() -> None:
    op.drop_table("dive_site_submissions")
    op.execute("DROP TYPE submission_status")
    op.drop_table("dive_center_profiles")
