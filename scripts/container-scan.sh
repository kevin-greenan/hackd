#!/usr/bin/env bash
set -euo pipefail

images=("hackd-web:latest" "hackd-runner:latest")

for image in "${images[@]}"; do
  echo "Scanning ${image} for high and critical vulnerabilities..."
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy:0.58.2 image \
    --exit-code 1 \
    --ignore-unfixed \
    --severity HIGH,CRITICAL \
    "${image}"
done
