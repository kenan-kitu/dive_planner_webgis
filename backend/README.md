# V2.1 backend foundation

This directory adds a local FastAPI and PostgreSQL/PostGIS backend without changing the V1 frontend, GeoServer, Turf calculations, or source GeoPackage.

## Architecture

```text
Local client / Swagger
        |
        v
FastAPI :8000
        |
        v
PostgreSQL + PostGIS :5432
        ^
        |
read-only import from geoserver/data/dive_planner_data.gpkg
```

The Alembic migration creates three `geometry(Point, 4326)` tables and GiST spatial indexes. The import script reads the existing GeoPackage without editing it. The nearby endpoint executes `ST_DWithin` and `ST_Distance` in PostGIS geography units, then converts metres to nautical miles.

## Start locally

1. Copy `.env.example` to `.env` only if you need to override the safe local defaults.
2. From the repository root run:

   ```powershell
   docker compose up --build -d
   ```

3. Open the API documentation at <http://127.0.0.1:8000/docs>.
4. Check API and database health at <http://127.0.0.1:8000/health>.

On first startup, Compose waits for PostgreSQL, runs `alembic upgrade head`, and imports the GeoPackage only when the tables are empty. Expected row counts are `63 / 19 / 85`.

## Import data again

The normal startup command is safe and idempotent:

```powershell
docker compose exec backend python -m scripts.import_geopackage --if-empty
```

To deliberately replace only the three imported PostGIS tables:

```powershell
docker compose exec backend python -m scripts.import_geopackage --replace
```

The original GeoPackage is mounted read-only and is never changed.

## API endpoints

- `GET /health`
- `GET /api/dive-sites?type=Wreck&max_depth=30`
- `GET /api/dive-sites/{id}`
- `GET /api/dive-sites/nearby?lat=24.5&lon=-81.8&radius_nm=10`
- `GET /api/dive-centers`
- `GET /api/departure-points`

All spatial responses are GeoJSON-compatible and use longitude/latitude coordinate order.

## Tests

With the Compose stack running:

```powershell
docker compose exec backend pytest -q
```

The integration suite checks database/PostGIS availability, health, exact layer counts, filters, detail lookup, and the real PostGIS nearby query.

## Stop

```powershell
docker compose down
```

The named database volume is retained. Use `docker compose down -v` only when you intentionally want to delete the local database.
