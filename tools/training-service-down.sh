#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${SIMLAB_TRAINING_POSTGRES_CONTAINER:-simlab-training-postgres}"
SERVICE_CONTAINER="${SIMLAB_TRAINING_SERVICE_CONTAINER:-simlab-training-service}"

stop_if_exists() {
  local name="$1"
  if docker container inspect "$name" >/dev/null 2>&1; then
    docker stop "$name" >/dev/null || true
    echo "Stopped $name"
  else
    echo "$name does not exist"
  fi
}

stop_if_exists "$SERVICE_CONTAINER"
stop_if_exists "$POSTGRES_CONTAINER"

echo "Data was kept in the Docker volume and simlab-runtime/tutorials."
