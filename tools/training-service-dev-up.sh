#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NETWORK_NAME="${SIMLAB_TRAINING_DEV_NETWORK:-simlab-training-dev-net}"
POSTGRES_CONTAINER="${SIMLAB_TRAINING_DEV_POSTGRES_CONTAINER:-simlab-training-dev-postgres}"
SERVICE_CONTAINER="${SIMLAB_TRAINING_DEV_SERVICE_CONTAINER:-simlab-training-dev-service}"
SERVICE_IMAGE="${SIMLAB_TRAINING_SERVICE_IMAGE:-simlab-training-service:latest}"
POSTGRES_IMAGE="${SIMLAB_TRAINING_POSTGRES_IMAGE:-postgres:16}"
POSTGRES_DB="${SIMLAB_TRAINING_POSTGRES_DB:-simlab_training}"
POSTGRES_USER="${SIMLAB_TRAINING_POSTGRES_USER:-simlab}"
POSTGRES_PASSWORD="${SIMLAB_TRAINING_POSTGRES_PASSWORD:-simlab_training_password}"
POSTGRES_VOLUME="${SIMLAB_TRAINING_DEV_POSTGRES_VOLUME:-simlab-training-dev-postgres-data}"
STORAGE_DIR="${SIMLAB_TRAINING_DEV_STORAGE_DIR_HOST:-${PROJECT_ROOT}/simlab-runtime/tutorials-dev}"
ADMINS="${SIMLAB_TUTORIAL_ADMINS:-yuan}"
JUPYTERHUB_API_URL="${JUPYTERHUB_API_URL:-http://host.docker.internal:8000/hub/api}"
HOST_PORT="${SIMLAB_TRAINING_DEV_PORT:-8090}"

usage() {
  cat <<'USAGE'
Usage: tools/training-service-dev-up.sh

Starts the SimLab training service in development mode:
- does not rebuild the service image
- mounts local Python source and Alembic migrations into the container
- runs alembic upgrade head on startup
- runs uvicorn with --reload

Run tools/training-service-up.sh --build once if simlab-training-service:latest
does not exist yet or if Python dependencies changed.
USAGE
}

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

container_exists() {
  docker container inspect "$1" >/dev/null 2>&1
}

container_running() {
  [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null || true)" = "true" ]
}

if ! docker image inspect "$SERVICE_IMAGE" >/dev/null 2>&1; then
  cat >&2 <<EOF
Missing image: $SERVICE_IMAGE

Build it once with:
  tools/training-service-up.sh --build

After that, use this dev script for source-mounted reloads without rebuilding.
EOF
  exit 1
fi

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  docker network create "$NETWORK_NAME" >/dev/null
fi

mkdir -p "$STORAGE_DIR"

if container_exists "$POSTGRES_CONTAINER"; then
  if ! container_running "$POSTGRES_CONTAINER"; then
    docker start "$POSTGRES_CONTAINER" >/dev/null
  fi
else
  docker run -d --name "$POSTGRES_CONTAINER" \
    --restart unless-stopped \
    --network "$NETWORK_NAME" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -v "$POSTGRES_VOLUME":/var/lib/postgresql/data \
    "$POSTGRES_IMAGE" >/dev/null
fi

docker network connect "$NETWORK_NAME" "$POSTGRES_CONTAINER" >/dev/null 2>&1 || true

echo "Waiting for development PostgreSQL..."
for _ in $(seq 1 60); do
  if docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
  echo "PostgreSQL did not become ready in time." >&2
  exit 1
fi

if container_exists "$SERVICE_CONTAINER"; then
  docker rm -f "$SERVICE_CONTAINER" >/dev/null
fi

docker run -d --name "$SERVICE_CONTAINER" \
  --restart unless-stopped \
  --network "$NETWORK_NAME" \
  --add-host=host.docker.internal:host-gateway \
  -p "127.0.0.1:${HOST_PORT}:8090" \
  -e SIMLAB_TRAINING_DATABASE_URL="postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_CONTAINER}:5432/${POSTGRES_DB}" \
  -e SIMLAB_TRAINING_STORAGE_DIR=/srv/simlab/tutorials \
  -e SIMLAB_TUTORIAL_ADMINS="$ADMINS" \
  -e JUPYTERHUB_API_URL="$JUPYTERHUB_API_URL" \
  -e JUPYTERHUB_SERVICE_PREFIX=/services/simlab-training/ \
  -v "${PROJECT_ROOT}/simlab-training-service/simlab_training_service:/app/simlab_training_service" \
  -v "${PROJECT_ROOT}/simlab-training-service/alembic:/app/alembic" \
  -v "${PROJECT_ROOT}/simlab-training-service/alembic.ini:/app/alembic.ini" \
  -v "${STORAGE_DIR}":/srv/simlab/tutorials \
  "$SERVICE_IMAGE" \
  sh -c "alembic upgrade head && uvicorn simlab_training_service.app:app --host 0.0.0.0 --port 8090 --reload --reload-dir /app/simlab_training_service --reload-dir /app/alembic" >/dev/null

echo "SimLab training service dev mode is starting on http://127.0.0.1:${HOST_PORT}"
echo "Health check: curl http://127.0.0.1:${HOST_PORT}/api/health"
echo "Logs: docker logs -f ${SERVICE_CONTAINER}"
