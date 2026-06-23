#!/usr/bin/env sh
set -eu

cleanup() {
  docker compose down
}

trap cleanup EXIT INT TERM

docker compose up -d --build

attempt=1
while [ "$attempt" -le 30 ]; do
  if curl -fsS http://localhost:3000/api/healthz >/tmp/hackd-healthz.json 2>/dev/null; then
    cat /tmp/hackd-healthz.json
    printf "\n"
    exit 0
  fi

  attempt=$((attempt + 1))
  sleep 2
done

docker compose logs --no-color --tail=120 web
exit 1
