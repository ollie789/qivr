#!/bin/bash
# Monitor CodeBuild pipeline status

echo "🚀 MONITORING CI/CD PIPELINE"
echo "============================="

PROJECT_NAME="qivr-build"
REGION="ap-southeast-2"

while true; do
    # Get latest build status
    BUILD_INFO=$(aws codebuild list-builds-for-project \
        --project-name $PROJECT_NAME \
        --region $REGION \
        --query 'ids[0]' --output text | \
        xargs -I {} aws codebuild batch-get-builds \
        --ids {} \
        --region $REGION \
        --query 'builds[0].[buildStatus,currentPhase,startTime]' \
        --output text)
    
    STATUS=$(echo "$BUILD_INFO" | head -1 | awk '{print $1}')
    PHASE=$(echo "$BUILD_INFO" | head -1 | awk '{print $2}')
    START_TIME=$(echo "$BUILD_INFO" | head -1 | awk '{print $3}')
    
    echo "$(date '+%H:%M:%S') - Status: $STATUS | Phase: $PHASE"
    
    if [ "$STATUS" = "SUCCEEDED" ]; then
        echo "🎉 BUILD SUCCEEDED!"
        echo "✅ SES integration deployed successfully"
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "❌ BUILD FAILED!"
        echo "🔍 Check CloudWatch logs for details"
        break
    elif [ "$STATUS" = "IN_PROGRESS" ]; then
        echo "⏳ Build in progress..."
        sleep 15
    else
        echo "⚠️  Unknown status: $STATUS"
        break
    fi
done

echo ""
echo "🎯 Next: Test SES integration once deployed"
