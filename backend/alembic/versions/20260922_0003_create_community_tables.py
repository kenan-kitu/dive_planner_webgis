"""Create comments, ratings, and favorites community tables."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260922_0003"
down_revision: Union[str, None] = "20260922_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


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
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "dive_site_id",
            sa.Integer(),
            sa.ForeignKey("dive_sites.fid", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("body", sa.String(2000), nullable=False),
        created_at,
        updated_at,
    )
    op.create_index("ix_comments_user_id", "comments", ["user_id"])
    op.create_index("ix_comments_dive_site_id", "comments", ["dive_site_id"])

    created_at, updated_at = timestamp_columns()
    op.create_table(
        "ratings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "dive_site_id",
            sa.Integer(),
            sa.ForeignKey("dive_sites.fid", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rating", sa.Integer(), nullable=False),
        created_at,
        updated_at,
        sa.UniqueConstraint("user_id", "dive_site_id", name="uq_ratings_user_site"),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_ratings_range"),
    )
    op.create_index("ix_ratings_user_id", "ratings", ["user_id"])
    op.create_index("ix_ratings_dive_site_id", "ratings", ["dive_site_id"])

    op.create_table(
        "favorites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "dive_site_id",
            sa.Integer(),
            sa.ForeignKey("dive_sites.fid", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("user_id", "dive_site_id", name="uq_favorites_user_site"),
    )
    op.create_index("ix_favorites_user_id", "favorites", ["user_id"])
    op.create_index("ix_favorites_dive_site_id", "favorites", ["dive_site_id"])


def downgrade() -> None:
    op.drop_table("favorites")
    op.drop_table("ratings")
    op.drop_table("comments")
