#!/bin/sh
set -eu

python -m scripts.ensure_postgis
alembic upgrade head

if [ -n "${INITIAL_ADMIN_EMAIL:-}" ] \
  && [ -n "${INITIAL_ADMIN_PASSWORD:-}" ] \
  && [ -n "${INITIAL_ADMIN_DISPLAY_NAME:-}" ]; then
  python -m scripts.create_initial_admin
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
