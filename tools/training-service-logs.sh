#!/usr/bin/env bash
set -euo pipefail

SERVICE_CONTAINER="${SIMLAB_TRAINING_SERVICE_CONTAINER:-simlab-training-service}"

docker logs -f "$SERVICE_CONTAINER"
