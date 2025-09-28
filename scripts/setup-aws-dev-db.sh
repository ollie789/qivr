#!/bin/bash

# AWS RDS Development Database Setup Script for QIVR
# This creates a minimal RDS PostgreSQL instance suitable for development

set -e

echo "🚀 Setting up AWS RDS PostgreSQL for QIVR Development"

# Configuration variables
DB_INSTANCE_ID="qivr-dev-db"
DB_NAME="qivr"
DB_USERNAME="qivr_user"
DB_PORT="5432"
REGION="ap-southeast-2"  # Sydney region as per your Cognito config

# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 32)

# Check if instance already exists
echo "Checking if database instance already exists..."
if aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $REGION 2>/dev/null; then
    echo "❌ Database instance $DB_INSTANCE_ID already exists!"
    echo "To get connection details, run: aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $REGION"
    exit 1
fi

# Create security group for database
echo "Creating security group for database access..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name qivr-dev-db-sg \
    --description "Security group for QIVR dev database" \
    --region $REGION \
    --query 'GroupId' \
    --output text 2>/dev/null || echo "")

if [ -z "$SECURITY_GROUP_ID" ]; then
    echo "Security group might already exist, finding it..."
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=qivr-dev-db-sg" \
        --region $REGION \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
fi

# Allow PostgreSQL access from your IP
echo "Configuring security group rules..."
MY_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port $DB_PORT \
    --cidr $MY_IP/32 \
    --region $REGION 2>/dev/null || echo "Rule might already exist"

# Create the RDS instance
echo "Creating RDS PostgreSQL instance (this will take a few minutes)..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.7 \
    --master-username $DB_USERNAME \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --vpc-security-group-ids $SECURITY_GROUP_ID \
    --backup-retention-period 0 \
    --publicly-accessible \
    --storage-encrypted \
    --region $REGION \
    --no-multi-az \
    --no-auto-minor-version-upgrade

echo "⏳ Waiting for database to be available (this takes 5-10 minutes)..."
aws rds wait db-instance-available \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION

# Get the endpoint
ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

# Create the database
echo "Database instance created! Setting up QIVR database..."

# Generate connection strings
CONNECTION_STRING="Host=$ENDPOINT;Port=$DB_PORT;Database=postgres;Username=$DB_USERNAME;Password=$DB_PASSWORD;SslMode=Require"
QIVR_CONNECTION_STRING="Host=$ENDPOINT;Port=$DB_PORT;Database=$DB_NAME;Username=$DB_USERNAME;Password=$DB_PASSWORD;SslMode=Require"

# Save configuration to .env file
ENV_FILE="/Users/oliver/Projects/qivr/backend/.env.aws-dev"
cat > $ENV_FILE << EOF
# AWS RDS Development Database Configuration
# Generated on $(date)
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$ENDPOINT:$DB_PORT/$DB_NAME?sslmode=require
ConnectionStrings__DefaultConnection=$QIVR_CONNECTION_STRING
AWS_RDS_ENDPOINT=$ENDPOINT
AWS_RDS_DB_NAME=$DB_NAME
AWS_RDS_USERNAME=$DB_USERNAME
AWS_RDS_PASSWORD=$DB_PASSWORD
AWS_RDS_INSTANCE_ID=$DB_INSTANCE_ID
AWS_REGION=$REGION
EOF

# Also update appsettings.Development.json
APPSETTINGS_FILE="/Users/oliver/Projects/qivr/backend/Qivr.Api/appsettings.Development.json"
echo "Updating appsettings.Development.json with RDS connection string..."

# Create a backup first
cp $APPSETTINGS_FILE ${APPSETTINGS_FILE}.backup.$(date +%Y%m%d%H%M%S)

# Use jq to update the connection string if available, otherwise provide instructions
if command -v jq &> /dev/null; then
    jq --arg conn "$QIVR_CONNECTION_STRING" '.ConnectionStrings.DefaultConnection = $conn' $APPSETTINGS_FILE > ${APPSETTINGS_FILE}.tmp && mv ${APPSETTINGS_FILE}.tmp $APPSETTINGS_FILE
else
    echo "Please manually update $APPSETTINGS_FILE with:"
    echo "  \"ConnectionStrings\": {"
    echo "    \"DefaultConnection\": \"$QIVR_CONNECTION_STRING\""
    echo "  }"
fi

echo ""
echo "✅ AWS RDS PostgreSQL instance created successfully!"
echo ""
echo "📝 Connection Details (saved to $ENV_FILE):"
echo "   Endpoint: $ENDPOINT"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo "   Instance ID: $DB_INSTANCE_ID"
echo ""
echo "🔧 Next steps:"
echo "1. Create the database schema:"
echo "   psql \"$CONNECTION_STRING\" -c \"CREATE DATABASE $DB_NAME;\""
echo ""
echo "2. Run migrations:"
echo "   cd /Users/oliver/Projects/qivr/backend"
echo "   dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api"
echo ""
echo "3. Seed the database:"
echo "   dotnet run --project Qivr.Tools -- seed"
echo ""
echo "4. To stop the instance when not in use (to save costs):"
echo "   aws rds stop-db-instance --db-instance-identifier $DB_INSTANCE_ID --region $REGION"
echo ""
echo "5. To restart the instance:"
echo "   aws rds start-db-instance --db-instance-identifier $DB_INSTANCE_ID --region $REGION"
echo ""
echo "6. To delete the instance completely:"
echo "   aws rds delete-db-instance --db-instance-identifier $DB_INSTANCE_ID --skip-final-snapshot --region $REGION"
echo ""
echo "💡 Tip: Stop the instance when not developing to minimize costs!"