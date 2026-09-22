from geoalchemy2 import Geometry
from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


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
