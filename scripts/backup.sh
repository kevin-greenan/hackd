#!/usr/bin/env sh
set -eu

backup_root="${BACKUP_DIR:-backups}"
timestamp="${BACKUP_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
backup_dir="${backup_root%/}/${timestamp}"
uploads_volume="${UPLOADS_VOLUME:-hackd-file-uploads}"

mkdir -p "$backup_dir"

printf "Writing database backup to %s/postgres.sql...\n" "$backup_dir"
docker compose exec -T db pg_dump -U hackd -d hackd > "$backup_dir/postgres.sql"

printf "Writing upload backup to %s/uploads.tgz...\n" "$backup_dir"
docker run --rm \
  -v "${uploads_volume}:/data:ro" \
  -v "$(pwd)/${backup_dir}:/backup" \
  node:22-bookworm-slim \
  tar -czf /backup/uploads.tgz -C /data .

cat > "$backup_dir/manifest.txt" <<EOF
created_at=${timestamp}
database=postgres.sql
uploads=uploads.tgz
uploads_volume=${uploads_volume}
EOF

printf "Backup complete: %s\n" "$backup_dir"
