#!/bin/bash

# Enhanced end-to-end test with comprehensive CloudWatch logging
# Monitors: ECS API logs, RDS logs, CodeBuild logs

set -e

REGION="ap-southeast-2"
CLUSTER="qivr_cluster"
ECS_LOG_GROUP="/ecs/qivr-api"
RDS_INSTANCE="qivr-dev-db"
TEST_START=$(date +%s)000

echo "🧪 Starting enhanced end-to-end test with full observability..."
echo "📊 Monitoring:"
echo "   - ECS API logs: $ECS_LOG_GROUP"
echo "   - RDS instance: $RDS_INSTANCE"
echo "   - Test start time: $(date -r $(($TEST_START/1000)))"
echo ""

# Enable RDS CloudWatch logs if not already enabled
echo "🔧 Checking RDS CloudWatch log exports..."
ENABLED_LOGS=$(aws rds describe-db-instances \
    --db-instance-identifier $RDS_INSTANCE \
    --region $REGION \
    --query 'DBInstances[0].EnabledCloudwatchLogsExports' \
    --output text)

if [ -z "$ENABLED_LOGS" ]; then
    echo "⚠️  RDS CloudWatch logs not enabled. Enabling postgresql logs..."
    aws rds modify-db-instance \
        --db-instance-identifier $RDS_INSTANCE \
        --cloudwatch-logs-export-configuration '{"LogTypesToEnable":["postgresql"]}' \
        --region $REGION \
        --apply-immediately > /dev/null
    echo "✅ RDS logs enabled (may take a few minutes to appear)"
else
    echo "✅ RDS logs already enabled: $ENABLED_LOGS"
fi
echo ""

# Run the test
echo "🚀 Running test suite..."
if node /Users/oliver/Projects/qivr/scripts/tests/test-live-system.mjs; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "📋 Recent API activity:"
    aws logs tail $ECS_LOG_GROUP --since 2m --format short --region $REGION | tail -20
    exit 0
else
    TEST_EXIT=$?
    echo ""
    echo "❌ Test failed! Gathering diagnostic logs..."
    echo ""
    
    # Get ECS task info
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 ECS Task Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    aws ecs describe-services \
        --cluster $CLUSTER \
        --services qivr-api \
        --region $REGION \
        --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Deployment:deployments[0].status}' \
        --output table
    echo ""
    
    # Get API logs with errors
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔴 API Error Logs (last 5 minutes)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    aws logs tail $ECS_LOG_GROUP \
        --since 5m \
        --format short \
        --region $REGION \
        --filter-pattern "?ERROR ?Exception ?Failed ?signup" | tail -50
    echo ""
    
    # Get RDS logs if available
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🗄️  RDS Database Logs (last 5 minutes)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    RDS_LOG_GROUP="/aws/rds/instance/$RDS_INSTANCE/postgresql"
    if aws logs describe-log-groups --log-group-name-prefix "$RDS_LOG_GROUP" --region $REGION &>/dev/null; then
        aws logs tail "$RDS_LOG_GROUP" \
            --since 5m \
            --format short \
            --region $REGION \
            --filter-pattern "?ERROR ?FATAL ?INSERT ?UPDATE" 2>/dev/null | tail -30 || echo "  (no recent database logs)"
    else
        echo "  (RDS logs not yet available in CloudWatch - may take a few minutes after enabling)"
    fi
    echo ""
    
    # Get database connection info
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔌 Database Connection Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    aws rds describe-db-instances \
        --db-instance-identifier $RDS_INSTANCE \
        --region $REGION \
        --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address,Engine:Engine,Version:EngineVersion}' \
        --output table
    echo ""
    
    # Show recent signup attempts
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Recent Signup Attempts"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    aws logs tail $ECS_LOG_GROUP \
        --since 5m \
        --format short \
        --region $REGION \
        --filter-pattern "signup" | grep -E "POST|signup|SignUp" | tail -20
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Full logs available at:"
    echo "   ECS: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group/\$252Fecs\$252Fqivr-api"
    echo "   RDS: https://console.aws.amazon.com/rds/home?region=$REGION#database:id=$RDS_INSTANCE;is-cluster=false;tab=logs"
    
    exit $TEST_EXIT
fi
