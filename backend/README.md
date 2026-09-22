# V2 backend foundation

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

V2.2 adds local email/password authentication and role-based access control. In simple terms:

- **Authentication** asks “Who are you?” Password verification and JWT access tokens answer this question.
- **Authorization** asks “What are you allowed to do?” Reusable role dependencies answer this question for each protected endpoint.

```text
React -> register/login -> FastAPI -> Argon2 verification -> JWT
React -> Bearer JWT -> FastAPI -> current PostgreSQL user -> role check
```

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

## Authentication and roles

Passwords are hashed with Argon2 and the hash is never returned by the API. A successful login returns a signed HS256 JWT access token that expires after 30 minutes by default. Protected requests send it as `Authorization: Bearer <token>`.

Roles are:

- `USER`: authenticated account/profile access.
- `DIVE_CENTER`: account access plus the dive-center area.
- `ADMIN`: access to all protected areas.

Public registration always creates `USER`; the request cannot choose a privileged role.

Authentication endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Role examples:

- `GET /api/account/profile`: any authenticated user.
- `GET /api/dive-center/dashboard`: `DIVE_CENTER` or `ADMIN`.
- `GET /api/admin/status`: `ADMIN` only.

Registration example:

```json
{
  "email": "diver@example.com",
  "password": "choose-a-local-password",
  "display_name": "Example Diver"
}
```

Send the same email/password fields to `/api/auth/login`, copy `access_token` from the response, then use the token for protected requests. The compact React header performs this flow without making login mandatory for the map.

### Swagger authentication

1. Open <http://127.0.0.1:8000/docs>.
2. Run `POST /api/auth/register` and `POST /api/auth/login`.
3. Copy the returned `access_token` without quotes.
4. Select **Authorize**, paste the token into the Bearer field, and confirm.
5. Call `/api/auth/me` and the role-protected examples.

### Create local role accounts

The development-user script requires environment variables so no credentials are stored in Git. Define these local-only variables in your current shell or pass them to the backend container:

```text
DEV_USER_EMAIL / DEV_USER_PASSWORD / DEV_USER_DISPLAY_NAME
DEV_DIVE_CENTER_EMAIL / DEV_DIVE_CENTER_PASSWORD / DEV_DIVE_CENTER_DISPLAY_NAME
DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD / DEV_ADMIN_DISPLAY_NAME
```

Then run:

```powershell
docker compose exec backend python -m scripts.create_dev_users
```

The command can be rerun: it creates missing accounts and updates existing local accounts. It never prints passwords.

### Security scope

This is a portfolio-oriented local implementation. The JWT signing secret in `.env.example` is explicitly development-only and must be replaced in any non-local environment. Access tokens are stored in browser `localStorage` to keep this phase understandable; this is convenient but JavaScript-accessible and therefore more exposed to cross-site scripting than an `HttpOnly`, `Secure` cookie design. Refresh-token rotation, password reset, email verification, login throttling, MFA, and external OAuth providers are intentionally outside V2.2.

CORS permits only the documented local Vite origins. Credentials are not enabled and tokens/passwords are not logged.

## Tests

With the Compose stack running:

```powershell
docker compose exec backend pytest -q
```

The integration suite checks database/PostGIS availability, health, exact layer counts, filters, detail lookup, the real PostGIS nearby query, registration/login, token authentication, Argon2 hashing, and all three role boundaries.

## Stop

```powershell
docker compose down
```

The named database volume is retained. Use `docker compose down -v` only when you intentionally want to delete the local database.
