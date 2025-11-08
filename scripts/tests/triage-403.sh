#!/usr/bin/env bash
set -eo pipefail

# Triage 403s across CloudFront vs ALB for the API.
# Fill the placeholders before running, or export them as env vars.
# This script does only read-only HTTP checks.

CF_DOMAIN="${CF_DOMAIN:-d2xnv2zqtx1fym.cloudfront.net}"   # API CloudFront domain (from docs)
ALB_DNS="${ALB_DNS:-qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com}" # ALB DNS (from docs)
API_HOST_HEADER="${API_HOST_HEADER:-}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "ERROR: Provide an access token via ACCESS_TOKEN=..." >&2
  echo "Tip: use a Cognito access token, not an ID token." >&2
  exit 1
fi

hdr_auth=( -H "Authorization: Bearer $ACCESS_TOKEN" )
hdr_host=()
if [[ -n "$API_HOST_HEADER" ]]; then
  hdr_host=( -H "Host: $API_HOST_HEADER" )
fi

set -x

# 1) Through CloudFront (what the browser hits)
curl -sS -D - "https://$CF_DOMAIN/api/health" \
  "${hdr_auth[@]}" \
  -o /dev/null

# 2) Bypass CloudFront directly to ALB
curl -sS -D - "https://$ALB_DNS/api/health" \
  "${hdr_host[@]}" \
  "${hdr_auth[@]}" \
  -o /dev/null

# 3) Example API call that typically requires tenant and auth (adjust path)
curl -sS -D - "https://$CF_DOMAIN/api/patients?limit=1" \
  "${hdr_auth[@]}" \
  -H "X-Tenant-Id: ${TENANT_ID:-}" \
  -o /dev/null

set +x

echo "\nNotes:"
echo "- If CloudFront shows 403 but ALB is 200, fix CF behavior/origin-request policy to forward Authorization and Cookies (already configured in terraform)."
echo "- If ALB returns 401/403, check app token validation and tenant claim/header (X-Tenant-Id)."
echo "- If both 403, check AWS WAF block logs for the distribution."
