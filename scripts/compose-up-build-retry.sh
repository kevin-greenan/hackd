#!/usr/bin/env sh
set -eu

max_attempts="${COMPOSE_BUILD_ATTEMPTS:-3}"
attempt=1

while [ "$attempt" -le "$max_attempts" ]; do
  printf "Starting Docker Compose build attempt %s/%s...\n" "$attempt" "$max_attempts"

  if docker compose up -d --build; then
    exit 0
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    printf "Docker Compose build failed after %s attempts.\n" "$max_attempts" >&2
    exit 1
  fi

  docker compose down --remove-orphans >/dev/null 2>&1 || true
  sleep_seconds=$((attempt * 10))
  printf "Docker Compose build failed; retrying in %s seconds.\n" "$sleep_seconds" >&2
  sleep "$sleep_seconds"
  attempt=$((attempt + 1))
done
