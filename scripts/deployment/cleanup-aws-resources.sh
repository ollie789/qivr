#!/bin/bash

# AWS Cleanup Script for Qivr Project
# This script removes old and unused AWS resources

REGION="ap-southeast-2"

echo "================================================"
echo "AWS Resources Cleanup Script"
echo "Region: $REGION"
echo "Date: $(date)"
echo "================================================"

# Function to ask for confirmation
confirm() {
    read -p "$1 [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# 1. Clean up terminated Elastic Beanstalk environments
echo ""
echo "Step 1: Cleaning up terminated Elastic Beanstalk environments..."
TERMINATED_ENVS=$(aws elasticbeanstalk describe-environments --region $REGION | jq -r '.Environments[] | select(.Status == "Terminated") | .EnvironmentName')

if [ ! -z "$TERMINATED_ENVS" ]; then
    echo "Found terminated environments:"
    echo "$TERMINATED_ENVS"
    
    if confirm "Do you want to delete these terminated environments?"; then
        while IFS= read -r env; do
            echo "Deleting environment: $env"
            aws elasticbeanstalk terminate-environment --environment-name "$env" --region $REGION --force-terminate 2>/dev/null || true
        done <<< "$TERMINATED_ENVS"
    fi
else
    echo "No terminated environments found."
fi

# 2. Clean up old application versions (keep only the latest 3)
echo ""
echo "Step 2: Cleaning up old application versions..."
CURRENT_VERSION=$(aws elasticbeanstalk describe-environments --environment-names qivr-api-staging-prod --region $REGION | jq -r '.Environments[0].VersionLabel')
echo "Current deployed version: $CURRENT_VERSION"

ALL_VERSIONS=$(aws elasticbeanstalk describe-application-versions --application-name qivr-api-staging --region $REGION | jq -r '.ApplicationVersions[] | .VersionLabel' | sort -r)
VERSIONS_TO_DELETE=$(echo "$ALL_VERSIONS" | grep -v "$CURRENT_VERSION" | tail -n +3)

if [ ! -z "$VERSIONS_TO_DELETE" ]; then
    echo "Versions to delete:"
    echo "$VERSIONS_TO_DELETE"
    
    if confirm "Do you want to delete these old versions?"; then
        while IFS= read -r version; do
            echo "Deleting version: $version"
            aws elasticbeanstalk delete-application-version \
                --application-name qivr-api-staging \
                --version-label "$version" \
                --delete-source-bundle \
                --region $REGION
        done <<< "$VERSIONS_TO_DELETE"
    fi
else
    echo "No old versions to delete."
fi

# 3. Clean up old S3 deployment artifacts
echo ""
echo "Step 3: Cleaning up old S3 deployment artifacts..."
BUCKET="qivr-eb-deployments-818084701597"

# Keep only files from the last 24 hours
CUTOFF_DATE=$(date -u -v-24H '+%Y-%m-%d' 2>/dev/null || date -u -d '24 hours ago' '+%Y-%m-%d')
echo "Will delete files older than: $CUTOFF_DATE"

OLD_FILES=$(aws s3api list-objects-v2 --bucket $BUCKET --region $REGION --query "Contents[?LastModified<'$CUTOFF_DATE'].Key" --output text)

if [ ! -z "$OLD_FILES" ]; then
    echo "Files to delete:"
    echo "$OLD_FILES" | tr '\t' '\n'
    
    if confirm "Do you want to delete these old S3 artifacts?"; then
        for file in $OLD_FILES; do
            echo "Deleting s3://$BUCKET/$file"
            aws s3 rm "s3://$BUCKET/$file" --region $REGION
        done
    fi
else
    echo "No old S3 artifacts to delete."
fi

# 4. List any orphaned CloudFormation stacks
echo ""
echo "Step 4: Checking for orphaned CloudFormation stacks..."
ORPHANED_STACKS=$(aws cloudformation list-stacks --region $REGION --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE | jq -r '.StackSummaries[] | select(.StackName | contains("awseb") and (contains("qivr-api-staging-env") or contains("qivr-api-staging-env-v2"))) | .StackName')

if [ ! -z "$ORPHANED_STACKS" ]; then
    echo "Found potentially orphaned stacks:"
    echo "$ORPHANED_STACKS"
    echo "WARNING: These stacks might be associated with terminated environments. Manual review recommended."
else
    echo "No orphaned CloudFormation stacks found."
fi

# 5. Summary
echo ""
echo "================================================"
echo "Cleanup Summary"
echo "================================================"

# Check current status
ACTIVE_ENV=$(aws elasticbeanstalk describe-environments --environment-names qivr-api-staging-prod --region $REGION | jq -r '.Environments[0] | "\(.EnvironmentName): \(.Status) - \(.Health)"')
echo "Active Environment: $ACTIVE_ENV"

VERSION_COUNT=$(aws elasticbeanstalk describe-application-versions --application-name qivr-api-staging --region $REGION | jq '.ApplicationVersions | length')
echo "Remaining application versions: $VERSION_COUNT"

S3_COUNT=$(aws s3 ls s3://$BUCKET/ --region $REGION | wc -l)
echo "Remaining S3 deployment artifacts: $S3_COUNT"

echo ""
echo "Cleanup completed!"
echo "================================================"