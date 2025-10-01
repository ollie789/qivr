#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH="${1:-$ROOT_DIR/backend/Qivr.Tools/dev-users.json}"
OUTPUT_CONFIG="$CONFIG_PATH"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "Config file not found: $CONFIG_PATH" >&2
  exit 1
fi

TEMP_CONFIG=""
cleanup() {
  if [ -n "$TEMP_CONFIG" ] && [ -f "$TEMP_CONFIG" ]; then
    rm -f "$TEMP_CONFIG"
  fi
}
trap cleanup EXIT

apply_override() {
  local jq_filter="$1"
  local value="$2"

  if [ -n "$value" ]; then
    if [ -z "$TEMP_CONFIG" ]; then
      TEMP_CONFIG="$(mktemp)"
      cp "$CONFIG_PATH" "$TEMP_CONFIG"
    fi
    jq --arg value "$value" "$jq_filter" "$TEMP_CONFIG" > "$TEMP_CONFIG.tmp"
    mv "$TEMP_CONFIG.tmp" "$TEMP_CONFIG"
  fi
}

if [ -n "${CLINIC_DOCTOR_SUB:-}" ] || [ -n "${PATIENT_SUB:-}" ]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required to override Cognito sub values. Install jq or unset CLINIC_DOCTOR_SUB/PATIENT_SUB." >&2
    exit 1
  fi
fi

apply_override '(.tenants[] | select(.slug == "demo-clinic").users[] | select(.email == "test.doctor@clinic.com").cognitoSub) = $value' "${CLINIC_DOCTOR_SUB:-}"
apply_override '(.tenants[] | select(.slug == "demo-clinic").users[] | select(.email == "ollie.bingemann@gmail.com").cognitoSub) = $value' "${PATIENT_SUB:-}"

if [ -n "$TEMP_CONFIG" ]; then
  OUTPUT_CONFIG="$TEMP_CONFIG"
fi

DOTNET_ARGS=("--project" "$ROOT_DIR/backend/Qivr.Tools/Qivr.Tools.csproj" "--" "--config" "$OUTPUT_CONFIG")

if [ -n "${QIVR_CONNECTION_STRING:-}" ]; then
  DOTNET_ARGS+=("--connection" "$QIVR_CONNECTION_STRING")
fi

if [ "${DRY_RUN:-false}" = "true" ]; then
  DOTNET_ARGS+=("--dry-run")
fi

echo "🚀 Syncing Cognito dev users into Postgres..."
dotnet run "${DOTNET_ARGS[@]}"
