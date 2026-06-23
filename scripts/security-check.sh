#!/usr/bin/env bash
set -euo pipefail

echo "Running dependency audit..."
npm audit --omit=dev

echo "Scanning tracked source files for common secret patterns..."
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked_files="$(git ls-files \
    ':!:package-lock.json' \
    ':!:docs/security.md' \
    ':!:README.md' \
    ':!:requirements.md')"
else
  tracked_files="$(find app components docs examples lib prisma scripts tests -type f \
    ! -name package-lock.json \
    ! -path docs/security.md \
    ! -path README.md \
    ! -path requirements.md)"
fi

if [ -n "$tracked_files" ]; then
  echo "$tracked_files" | xargs grep -nE \
    '(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|ghp_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{80,}|xox[baprs]-[A-Za-z0-9-]{20,})' \
    && {
      echo "Potential secret found in tracked files."
      exit 1
    }
fi

echo "Security checks passed."
