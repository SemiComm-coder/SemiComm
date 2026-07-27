#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUBSCRIBER_EXPORT_URL:-}" ]]; then
  echo "Missing SUBSCRIBER_EXPORT_URL environment variable."
  exit 1
fi

if [[ -z "${SUBSCRIBER_EXPORT_TOKEN:-}" ]]; then
  echo "Missing SUBSCRIBER_EXPORT_TOKEN environment variable."
  exit 1
fi

timestamp="$(date -u +%Y%m%d-%H%M%S)"
output_file="subscribers-${timestamp}.csv"

curl -fsSL "${SUBSCRIBER_EXPORT_URL}?action=export&token=${SUBSCRIBER_EXPORT_TOKEN}" -o "${output_file}"

if grep -q "Unauthorized" "${output_file}"; then
  echo "Export failed: unauthorized token."
  rm -f "${output_file}"
  exit 1
fi

echo "Subscriber export saved to ${output_file}"
