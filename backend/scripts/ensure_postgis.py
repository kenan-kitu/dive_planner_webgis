"""Ensure the production database has the PostGIS extension enabled."""

import sys

from sqlalchemy import text


def ensure_postgis() -> int:
    try:
        from app.database import engine

        with engine.begin() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    except Exception:
        print(
            "ERROR: Could not connect to the database or enable PostGIS.",
            file=sys.stderr,
        )
        return 1

    print("PostGIS extension is ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(ensure_postgis())
