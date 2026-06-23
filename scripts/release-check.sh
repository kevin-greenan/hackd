#!/usr/bin/env bash
set -euo pipefail

npm run lint
npm run test
npm run security:check
npm run build

echo "Release checks passed. Run the compose smoke test before tagging from main."
