#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  printf "Usage: %s <backup-directory>\n" "$0" >&2
  exit 2
fi

backup_dir="${1%/}"
uploads_volume="${UPLOADS_VOLUME:-hackd-file-uploads}"

if [ ! -f "$backup_dir/postgres.sql" ]; then
  printf "Missing database backup: %s/postgres.sql\n" "$backup_dir" >&2
  exit 1
fi

if [ ! -f "$backup_dir/uploads.tgz" ]; then
  printf "Missing uploads backup: %s/uploads.tgz\n" "$backup_dir" >&2
  exit 1
fi

printf "Restoring database from %s/postgres.sql...\n" "$backup_dir"
cat "$backup_dir/postgres.sql" | docker compose exec -T db psql -U hackd -d hackd

printf "Restoring uploads into volume %s...\n" "$uploads_volume"
docker run --rm \
  -v "${uploads_volume}:/data" \
  -v "$(pwd)/${backup_dir}:/backup:ro" \
  node:22-bookworm-slim \
  sh -c "rm -rf /data/* && tar -xzf /backup/uploads.tgz -C /data"

printf "Restore complete from %s\n" "$backup_dir"
