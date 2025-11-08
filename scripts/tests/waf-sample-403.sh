#!/usr/bin/env bash
set -euo pipefail

# Sample WAF requests for CloudFront to investigate 403s.
# Requires: aws cli. Region must be us-east-1 for CLOUDFRONT scope.
# Usage:
#   DIST_ID=E3O811C5PUN12D ./scripts/tests/waf-sample-403.sh

SCOPE="CLOUDFRONT"
REGION="us-east-1"
DIST_ID="${DIST_ID:-}"

if [[ -z "$DIST_ID" ]]; then
  echo "Set DIST_ID to the CloudFront distribution ID (e.g., E3O811C5PUN12D)." >&2
  exit 1
fi

# Find the Web ACL associated with the distribution
WEB_ACL_ARN=$(aws cloudfront get-distribution --id "$DIST_ID" \
  --query 'Distribution.DistributionConfig.WebACLId' --output text 2>/dev/null || true)

if [[ -z "$WEB_ACL_ARN" || "$WEB_ACL_ARN" == "None" ]]; then
  echo "No WAF Web ACL attached to distribution $DIST_ID" >&2
  exit 0
fi

echo "Using WebACL ARN: $WEB_ACL_ARN"

# Time window: last 15 minutes
END_TIME=$(date -u +%s)
START_TIME=$((END_TIME - 900))

aws wafv2 get-sampled-requests \
  --region "$REGION" \
  --scope "$SCOPE" \
  --web-acl-arn "$WEB_ACL_ARN" \
  --rule-metric-name "ALL" \
  --time-window StartTime=$START_TIME,EndTime=$END_TIME \
  --max-items 25 \
  --query '{Count: SampledRequests | length(@), Blocks: SampledRequests[?Action==`BLOCK`].[Timestamp,RuleNameWithinRuleGroup,Request.Headers]}' \
  --output table