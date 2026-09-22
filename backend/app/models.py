from datetime import datetime
from enum import Enum

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserRole(str, Enum):
    USER = "USER"
    DIVE_CENTER = "DIVE_CENTER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, name="user_role"),
        default=UserRole.USER,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class DiveSite(Base):
    __tablename__ = "dive_sites"

    fid: Mapped[int] = mapped_column(Integer, primary_key=True)
    geom: Mapped[object] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    site_name: Mapped[str | None] = mapped_column(Text)
    mooring_count: Mapped[int | None] = mapped_column(Integer)
    site_type: Mapped[str | None] = mapped_column(String(30))
    depth_m: Mapped[float | None] = mapped_column(Float)
    depth_source: Mapped[str | None] = mapped_column(String(50))
    data_quality: Mapped[str | None] = mapped_column(String(20))
    min_depth_m: Mapped[float | None] = mapped_column(Float)
    max_depth_m: Mapped[float | None] = mapped_column(Float)
    access_type: Mapped[str | None] = mapped_column(String(20))
    depth_class: Mapped[str | None] = mapped_column(String(30))
    data_origin: Mapped[str | None] = mapped_column(String(20))
    description: Mapped[str | None] = mapped_column(String(250))


class DiveCenter(Base):
    __tablename__ = "dive_centers_clean"

    fid: Mapped[int] = mapped_column(Integer, primary_key=True)
    geom: Mapped[object] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    record_id: Mapped[int | None] = mapped_column(Integer)
    name: Mapped[str | None] = mapped_column(String(150))
    category: Mapped[str | None] = mapped_column(String(50))
    phone: Mapped[str | None] = mapped_column(String(100))
    website: Mapped[str | None] = mapped_column(String(250))
    address: Mapped[str | None] = mapped_column(String(250))
    osm_id: Mapped[str | None] = mapped_column(String(100))
    source: Mapped[str | None] = mapped_column(String(50))
    nearest_dive_m: Mapped[float | None] = mapped_column(Float)


class DeparturePoint(Base):
    __tablename__ = "departure_points_clean"

    fid: Mapped[int] = mapped_column(Integer, primary_key=True)
    geom: Mapped[object] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    record_id: Mapped[int | None] = mapped_column(Integer)
    name: Mapped[str | None] = mapped_column(String(150))
    type: Mapped[str | None] = mapped_column(String(50))
    operator: Mapped[str | None] = mapped_column(String(150))
    website: Mapped[str | None] = mapped_column(String(250))
    osm_id: Mapped[str | None] = mapped_column(String(100))
    source: Mapped[str | None] = mapped_column(String(50))
    nearest_dive_m: Mapped[float | None] = mapped_column(Float)
