#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NETWORK_NAME="${SIMLAB_TRAINING_NETWORK:-simlab-training-net}"
POSTGRES_CONTAINER="${SIMLAB_TRAINING_POSTGRES_CONTAINER:-simlab-training-postgres}"
SERVICE_CONTAINER="${SIMLAB_TRAINING_SERVICE_CONTAINER:-simlab-training-service}"
SERVICE_IMAGE="${SIMLAB_TRAINING_SERVICE_IMAGE:-simlab-training-service:latest}"
POSTGRES_IMAGE="${SIMLAB_TRAINING_POSTGRES_IMAGE:-postgres:16}"
POSTGRES_DB="${SIMLAB_TRAINING_POSTGRES_DB:-simlab_training}"
POSTGRES_USER="${SIMLAB_TRAINING_POSTGRES_USER:-simlab}"
POSTGRES_PASSWORD="${SIMLAB_TRAINING_POSTGRES_PASSWORD:-simlab_training_password}"
POSTGRES_VOLUME="${SIMLAB_TRAINING_POSTGRES_VOLUME:-simlab-training-postgres-data}"
STORAGE_DIR="${SIMLAB_TRAINING_STORAGE_DIR_HOST:-${PROJECT_ROOT}/simlab-runtime/tutorials}"
ADMINS="${SIMLAB_TUTORIAL_ADMINS:-yuan}"
JUPYTERHUB_API_URL="${JUPYTERHUB_API_URL:-http://host.docker.internal:8000/hub/api}"
REBUILD=0

for arg in "$@"; do
  case "$arg" in
    --build)
      REBUILD=1
      ;;
    -h|--help)
      cat <<'USAGE'
Usage: tools/training-service-up.sh [--build]

Starts the SimLab training/comment service and PostgreSQL without Docker Compose.

Options:
  --build   Rebuild the service image and recreate the service container.
USAGE
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
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

echo "Waiting for PostgreSQL..."
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

if [ "$REBUILD" = "1" ] || ! docker image inspect "$SERVICE_IMAGE" >/dev/null 2>&1; then
  docker build -t "$SERVICE_IMAGE" "${PROJECT_ROOT}/simlab-training-service"
fi

if container_exists "$SERVICE_CONTAINER"; then
  if [ "$REBUILD" = "1" ]; then
    docker rm -f "$SERVICE_CONTAINER" >/dev/null
  elif ! container_running "$SERVICE_CONTAINER"; then
    docker start "$SERVICE_CONTAINER" >/dev/null
  fi
fi

if ! container_exists "$SERVICE_CONTAINER"; then
  docker run -d --name "$SERVICE_CONTAINER" \
    --restart unless-stopped \
    --network "$NETWORK_NAME" \
    --add-host=host.docker.internal:host-gateway \
    -p 127.0.0.1:8090:8090 \
    -e SIMLAB_TRAINING_DATABASE_URL="postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_CONTAINER}:5432/${POSTGRES_DB}" \
    -e SIMLAB_TRAINING_STORAGE_DIR=/srv/simlab/tutorials \
    -e SIMLAB_TUTORIAL_ADMINS="$ADMINS" \
    -e JUPYTERHUB_API_URL="$JUPYTERHUB_API_URL" \
    -e JUPYTERHUB_SERVICE_PREFIX=/services/simlab-training/ \
    -v "${STORAGE_DIR}":/srv/simlab/tutorials \
    "$SERVICE_IMAGE" >/dev/null
fi

echo "SimLab training service is starting on http://127.0.0.1:8090"
echo "Health check: curl http://127.0.0.1:8090/api/health"
