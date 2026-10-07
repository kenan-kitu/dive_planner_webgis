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

V2.3 adds small community resources without changing the GeoServer/WFS map pipeline:

```text
React -> FastAPI -> PostgreSQL/PostGIS

Authenticated USER -> Bearer JWT -> Comment / Rating / Favorite
Anonymous visitor  -> public GET  -> Comments / rating summary
```

The V2 final portfolio layer adds a Dive Center portal, spatial submissions, and an application Admin Panel. It deliberately keeps imported and contributed GIS records separate:

```text
React
   |
   v
FastAPI
   |
   v
PostgreSQL/PostGIS

GeoServer
   |
   v
existing official GIS data (unchanged)

DIVE_CENTER -> submission -> PENDING -> ADMIN REVIEW
                                      |-> APPROVED -> public contributed layer
                                      |-> REJECTED -> owner status and admin note
```

Approved contributed points come from `GET /api/community/dive-sites`. They are displayed with a distinct map symbol and provenance label; they are never inserted into the imported `dive_sites` table.

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
- `DIVE_CENTER`: account access plus its own profile and dive-site submissions.
- `ADMIN`: application administration, moderation, verification, and submission review.

Public registration always creates `USER`; the request cannot choose a privileged role.

Authentication endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Role examples:

- `GET /api/account/profile`: any authenticated user.
- `GET /api/dive-center/dashboard`: `DIVE_CENTER` only.
- `GET /api/admin/status`: `ADMIN` only.

## Dive Center portal and contributed sites

Migration `20260922_0004` creates:

- `dive_center_profiles`: one profile per `DIVE_CENTER` user through a unique `user_id` foreign key. Business information is separate from authentication fields. An optional PostGIS `geometry(Point, 4326)` stores the map-picked business location independently from the address text. `is_verified` is only an application-level status.
- `dive_site_submissions`: a PostGIS `geometry(Point, 4326)` proposal with a GiST index, owner, depth validation, review state, reviewer, timestamp, and optional admin note.

Profile endpoints (`DIVE_CENTER` only):

- `GET /api/dive-center/profile`
- `PUT /api/dive-center/profile`
- `PATCH /api/dive-center/profile`

Submission endpoints (`DIVE_CENTER` owner only):

- `POST /api/dive-center/submissions`
- `GET /api/dive-center/submissions`
- `GET /api/dive-center/submissions/{id}`
- `PATCH /api/dive-center/submissions/{id}` — only while `PENDING`
- `DELETE /api/dive-center/submissions/{id}` — only while `PENDING`

Longitude/latitude, the three supported site types, non-negative depths, and depth order are validated in the API and reinforced by database constraints. A Dive Center cannot access another account's submission or review its own submission.

Public contributed endpoint:

- `GET /api/community/dive-sites` — anonymous GeoJSON; includes only `APPROVED` records.

`PENDING` and `REJECTED` records never appear in the public response. The response includes the submitting account/business name and `data_origin: dive_center_submitted` so the UI never represents it as official imported data.

## Application Admin Panel

The Admin Panel is an application UI, not a database-management tool. Its API endpoints require the `ADMIN` role:

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}` — activate/deactivate or change between `USER` and `DIVE_CENTER`
- `GET /api/admin/dive-centers`
- `PATCH /api/admin/dive-centers/{id}/verification`
- `GET /api/admin/comments`
- `DELETE /api/comments/{id}` — reuses V2.3 moderation authorization
- `GET /api/admin/submissions?status=PENDING`
- `POST /api/admin/submissions/{id}/approve`
- `POST /api/admin/submissions/{id}/reject`
- `POST /api/admin/submissions/{id}/archive` — unpublishes an approved contribution without deleting its history

Public registration still creates only `USER`. The management endpoint cannot create or assign `ADMIN`, cannot modify an existing admin account, and prevents the current admin from disabling or changing itself. Approval stores the reviewer and review time. Rejection exposes the optional admin note only to the submission owner and administrators. `ARCHIVED` submissions remain visible to their owner and administrators but are excluded from the public community GeoJSON.

## Comments, ratings, and favorites

Comments are normal CRUD resources tied to one user and one dive site. The API stores the user foreign key instead of duplicating a display name. Anyone can read comments; authenticated users can create comments and edit or delete their own. `ADMIN` may edit or delete any comment. Comment text is trimmed, cannot be empty, and is limited to 2,000 characters.

- `GET /api/dive-sites/{site_id}/comments` — public list
- `POST /api/dive-sites/{site_id}/comments` — authenticated create
- `PATCH /api/comments/{comment_id}` — owner or `ADMIN`
- `DELETE /api/comments/{comment_id}` — owner or `ADMIN`

Ratings are integers from 1 to 5. The database unique constraint on `(user_id, dive_site_id)` guarantees one active rating per user/site pair. Sending a second rating updates that row. Public summaries return a one-decimal average and count; an authenticated response also includes that user's current rating.

- `GET /api/dive-sites/{site_id}/rating` — public aggregate
- `PUT /api/dive-sites/{site_id}/rating` — authenticated create/update
- `DELETE /api/dive-sites/{site_id}/rating` — remove the current user's rating

Favorites implement the user-to-dive-site many-to-many relationship. The unique `(user_id, dive_site_id)` constraint prevents duplicates. Favorite lists are private because `/api/account/favorites` always derives the user from the JWT; it never accepts another user id.

- `GET /api/account/favorites` — current user's GeoJSON dive-site list
- `GET /api/dive-sites/{site_id}/favorite-status` — current user's state
- `POST /api/dive-sites/{site_id}/favorite` — add idempotently
- `DELETE /api/dive-sites/{site_id}/favorite` — remove idempotently

All three tables use explicit foreign keys to `users.id` and `dive_sites.fid`. `ON DELETE CASCADE` prevents orphan community rows if a user or dive site is deliberately removed. Migration `20260922_0003` creates these tables, indexes, range checks, and unique constraints without changing imported GIS rows.

Example authenticated comment request:

```http
POST /api/dive-sites/1/comments
Authorization: Bearer <token>
Content-Type: application/json

{"body":"Good visibility during our morning dive."}
```

Example rating request:

```http
PUT /api/dive-sites/1/rating
Authorization: Bearer <token>
Content-Type: application/json

{"rating":5}
```

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

Use development-only addresses such as:

```text
DEV_USER_EMAIL=diver@diveplanner.dev
DEV_DIVE_CENTER_EMAIL=center@diveplanner.dev
DEV_ADMIN_EMAIL=admin@diveplanner.dev
```

Set the three password variables only in your local shell or untracked `.env` file. Never commit development passwords.

Then run:

```powershell
docker compose exec backend python -m scripts.create_dev_users
```

The command can be rerun: it creates missing accounts and updates existing local accounts. It never prints passwords.

### Security scope

This is a portfolio-oriented local implementation. The JWT signing secret in `.env.example` is explicitly development-only and must be replaced in any non-local environment. Access tokens are stored in browser `localStorage` to keep this version understandable; this is convenient but JavaScript-accessible and therefore more exposed to cross-site scripting than an `HttpOnly`, `Secure` cookie design. Refresh-token rotation, password reset, email verification, login throttling, MFA, external OAuth providers, threaded replies, legal/business verification, and complex moderation/reporting workflows are intentionally outside this version.

CORS permits only the documented local Vite origins. Credentials are not enabled and tokens/passwords are not logged.

## Tests

With the Compose stack running:

```powershell
docker compose exec backend pytest -q
```

The integration suite checks database/PostGIS availability, health, exact layer counts, filters, detail lookup, the real PostGIS nearby query, registration/login, token authentication, Argon2 hashing, all three role boundaries, comment ownership, rating upserts/aggregates, favorite uniqueness, private favorite lists, profile ownership, submission geometry/validation, pending-only edits, admin safeguards, approval/rejection visibility, verification, moderation, and the complete promotion-to-publication workflow.

## Stop

```powershell
docker compose down
```

The named database volume is retained. Use `docker compose down -v` only when you intentionally want to delete the local database.
