#!/bin/bash
# Script to rotate database password and store in AWS Secrets Manager
# Usage: ./rotate-db-password.sh [environment]
# Example: ./rotate-db-password.sh production

set -e

ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-ap-southeast-2}
SECRET_NAME="qivr/api/${ENVIRONMENT}"

echo "=== Database Password Rotation Script ==="
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "Secret Name: $SECRET_NAME"
echo ""

# Generate a new secure password (32 characters, alphanumeric + special chars)
NEW_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9!@#$%^&*()_+-=' | head -c 32)

echo "Generated new password (hidden for security)"

# Check if secret exists
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo "Secret exists, updating..."

    # Get current secret value
    CURRENT_SECRET=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$AWS_REGION" --query 'SecretString' --output text)

    # Update with new password (preserving other values)
    UPDATED_SECRET=$(echo "$CURRENT_SECRET" | jq --arg pwd "$NEW_PASSWORD" '. + {"QIVR_DB_PWD": $pwd, "INTAKE_DB_PWD": $pwd}')

    aws secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "$UPDATED_SECRET" \
        --region "$AWS_REGION"

    echo "Secret updated successfully"
else
    echo "Secret does not exist, creating..."

    # Create new secret with database password
    SECRET_VALUE=$(cat <<EOF
{
    "QIVR_DB_PWD": "$NEW_PASSWORD",
    "INTAKE_DB_PWD": "$NEW_PASSWORD",
    "JWT_SECRET_KEY": "$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)"
}
EOF
)

    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Qivr API secrets for $ENVIRONMENT" \
        --secret-string "$SECRET_VALUE" \
        --region "$AWS_REGION"

    echo "Secret created successfully"
fi

echo ""
echo "=== IMPORTANT: Manual Steps Required ==="
echo "1. Update the RDS database password using AWS Console or CLI:"
echo "   aws rds modify-db-instance --db-instance-identifier qivr-${ENVIRONMENT}-db --master-user-password 'NEW_PASSWORD'"
echo ""
echo "2. Update ECS task definition to use Secrets Manager ARN for DB password"
echo ""
echo "3. Redeploy the ECS service to pick up new credentials"
echo ""
echo "Password rotation initiated. Follow the manual steps above to complete."
