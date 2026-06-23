#!/usr/bin/env sh
set -eu

cleanup() {
  docker compose down
  docker network rm hackd-runtime >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

sh scripts/compose-up-build-retry.sh

attempt=1
while [ "$attempt" -le 30 ]; do
  if curl -fsS http://localhost:3000/api/healthz >/tmp/hackd-healthz.json 2>/dev/null; then
    curl -fsS http://localhost:3000/api/readyz >/tmp/hackd-readyz.json
    docker compose exec -T runner node -e "fetch('http://127.0.0.1:4010/healthz').then((response) => { if (!response.ok) process.exit(1); return response.text(); }).then((body) => console.log(body));"
    cat /tmp/hackd-healthz.json
    printf "\n"
    cat /tmp/hackd-readyz.json
    printf "\n"
    exit 0
  fi

  attempt=$((attempt + 1))
  sleep 2
done

docker compose logs --no-color --tail=120 web
docker compose logs --no-color --tail=120 runner
exit 1
