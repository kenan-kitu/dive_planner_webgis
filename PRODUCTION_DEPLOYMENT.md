# V2 Production Deployment Preparation

This branch contains configuration only. Committing or pushing it does not create a Render or Cloudflare deployment.

## Request path

```text
Browser -> Cloudflare Worker + Static Assets
          /api/*       -> Render FastAPI
          /geoserver/* -> existing Render GeoServer

Render FastAPI -> Render PostgreSQL/PostGIS
```

The browser uses same-origin `/api/...` and `/geoserver/...` URLs in production. During local Vite development, `vite.config.ts` proxies those paths to `127.0.0.1:8000` and `localhost:8080` respectively. `VITE_API_BASE_URL` remains an optional explicit override; it is not required in production.

## Render preparation

`render.yaml` builds the existing `backend/Dockerfile`. Its production `CMD` has no reload flag and runs:

```sh
python -m scripts.ensure_postgis && alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
```

The first command idempotently enables PostGIS before Alembic runs. Render supplies `PORT`; `/health` is the health-check path. Enter these service variables manually:

- `DATABASE_URL`: the Render PostgreSQL internal connection string, with the SQLAlchemy driver scheme `postgresql+psycopg://` instead of `postgresql://`.
- `JWT_SECRET`: a new cryptographically random production secret. Do not reuse the local development value.
- `CORS_ORIGINS`: the final Cloudflare site origin, for example `https://<worker-or-custom-domain>` with no trailing slash.
- `JWT_ACCESS_TOKEN_MINUTES`: `30` is declared in `render.yaml`; change it only if a different expiry policy is intended.

Do not add `PORT` manually unless Render support specifically requires an override.

## One-time official GIS import

Run migrations first. Then, from a trusted local checkout, set `DATABASE_URL` in the current PowerShell session to the Render PostgreSQL **external** connection string using the `postgresql+psycopg://` scheme. Run:

```powershell
docker compose run --rm --no-deps `
  -e DATABASE_URL=$env:DATABASE_URL `
  -e GEOPACKAGE_PATH=/data/dive_planner_data.gpkg `
  backend python -m scripts.import_geopackage --if-empty
```

The existing importer reads the source GeoPackage through its read-only mount and touches only `dive_sites`, `dive_centers_clean`, and `departure_points_clean`. It imports only when all three tables are empty, accepts the already-correct `63 / 19 / 85` state, and refuses partial or unexpected existing counts. It does not copy users, comments, ratings, favorites, profiles, or submissions.

## One-time first ADMIN

After migration, set these only in the trusted PowerShell session:

```text
INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD
INITIAL_ADMIN_DISPLAY_NAME
```

Then run:

```powershell
docker compose run --rm --no-deps `
  -e DATABASE_URL=$env:DATABASE_URL `
  -e INITIAL_ADMIN_EMAIL=$env:INITIAL_ADMIN_EMAIL `
  -e INITIAL_ADMIN_PASSWORD=$env:INITIAL_ADMIN_PASSWORD `
  -e INITIAL_ADMIN_DISPLAY_NAME=$env:INITIAL_ADMIN_DISPLAY_NAME `
  backend python -m scripts.create_initial_admin
```

The command validates the email/password/display name, hashes the password with the existing Argon2 configuration, creates an ADMIN only when none exists, and never prints the password. Clear the four shell variables after the command. Do not store them in Git.

## Cloudflare Worker preparation

The Worker serves Vite `dist`, uses SPA fallback, and executes Worker code first only for `/api/*` and `/geoserver/*`. Enter this Worker variable manually before deployment:

- `FASTAPI_ORIGIN`: the HTTPS Render FastAPI origin only, such as `https://<render-service>.onrender.com`; do not include `/api` or a trailing slash.

The GeoServer origin is intentionally fixed to the existing service:

```text
https://diveplanner-geoserver.onrender.com
```

No Render or Cloudflare resource is created until Kenan explicitly performs the later deployment steps.
