#!/bin/bash

# Helper script to manage AWS RDS dev database

DB_INSTANCE_ID="qivr-dev-db"
REGION="ap-southeast-2"

case "$1" in
    start)
        echo "Starting RDS instance $DB_INSTANCE_ID..."
        aws rds start-db-instance --db-instance-identifier $DB_INSTANCE_ID --region $REGION
        echo "Waiting for database to be available..."
        aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $REGION
        ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $REGION --query 'DBInstances[0].Endpoint.Address' --output text)
        echo "✅ Database started and available at: $ENDPOINT"
        ;;
    
    stop)
        echo "Stopping RDS instance $DB_INSTANCE_ID to save costs..."
        aws rds stop-db-instance --db-instance-identifier $DB_INSTANCE_ID --region $REGION
        echo "✅ Database stopped. Run './manage-dev-db.sh start' to restart."
        ;;
    
    status)
        echo "Checking status of $DB_INSTANCE_ID..."
        STATUS=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $REGION --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null)
        if [ -z "$STATUS" ]; then
            echo "❌ Database instance not found"
        else
            ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $REGION --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null)
            echo "📊 Status: $STATUS"
            if [ ! -z "$ENDPOINT" ] && [ "$ENDPOINT" != "None" ]; then
                echo "🔗 Endpoint: $ENDPOINT"
            fi
        fi
        ;;
    
    connect)
        if [ -f /Users/oliver/Projects/qivr/backend/.env.aws-dev ]; then
            source /Users/oliver/Projects/qivr/backend/.env.aws-dev
            echo "Connecting to database..."
            psql "$DATABASE_URL"
        else
            echo "❌ Configuration file not found. Run setup-aws-dev-db.sh first."
        fi
        ;;
    
    delete)
        echo "⚠️  This will permanently delete the RDS instance!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "Deleting RDS instance $DB_INSTANCE_ID..."
            aws rds delete-db-instance --db-instance-identifier $DB_INSTANCE_ID --skip-final-snapshot --region $REGION
            echo "✅ Database deletion initiated"
        else
            echo "Cancelled"
        fi
        ;;
    
    *)
        echo "Usage: $0 {start|stop|status|connect|delete}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the stopped RDS instance"
        echo "  stop    - Stop the RDS instance (saves costs)"
        echo "  status  - Check the current status"
        echo "  connect - Connect to the database using psql"
        echo "  delete  - Permanently delete the RDS instance"
        exit 1
        ;;
esac