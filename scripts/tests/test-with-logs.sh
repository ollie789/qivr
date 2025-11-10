#!/bin/bash

# Run end-to-end test with CloudWatch log monitoring
# Automatically fetches API logs when test fails

set -e

REGION="ap-southeast-2"
CLUSTER="qivr_cluster"
LOG_GROUP="/ecs/qivr-api"
TEST_START=$(date +%s)000

echo "🧪 Starting end-to-end test..."
echo "📊 Monitoring CloudWatch logs: $LOG_GROUP"
echo ""

# Run the test
if node /Users/oliver/Projects/qivr/scripts/tests/test-live-system.mjs; then
    echo ""
    echo "✅ All tests passed!"
    exit 0
else
    TEST_EXIT=$?
    echo ""
    echo "❌ Test failed! Fetching CloudWatch logs..."
    echo ""
    
    # Get ECS task ARNs
    TASK_ARNS=$(aws ecs list-tasks \
        --cluster $CLUSTER \
        --service-name qivr-api \
        --region $REGION \
        --query 'taskArns[*]' \
        --output text)
    
    # Get log streams for each task
    for TASK_ARN in $TASK_ARNS; do
        TASK_ID=$(echo $TASK_ARN | cut -d'/' -f3)
        LOG_STREAM="ecs/qivr-api/$TASK_ID"
        
        echo "📋 Logs from task: $TASK_ID"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Fetch logs from test start time
        aws logs get-log-events \
            --log-group-name "$LOG_GROUP" \
            --log-stream-name "$LOG_STREAM" \
            --start-time $TEST_START \
            --region $REGION \
            --query 'events[*].[timestamp,message]' \
            --output text 2>/dev/null | \
            grep -E "(ERROR|Exception|Failed|401|403|500)" || echo "  (no errors found in logs)"
        
        echo ""
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Full logs available at:"
    echo "   https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group/\$252Fecs\$252Fqivr-api"
    
    exit $TEST_EXIT
fi
