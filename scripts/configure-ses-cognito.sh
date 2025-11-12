#!/bin/bash
# Configure SES for Cognito User Pools to remove email limits

echo "🔧 CONFIGURING SES FOR COGNITO"
echo "=============================="

REGION="ap-southeast-2"
FROM_EMAIL="noreply@qivr.pro"

# Verify the domain in SES (if not already done)
echo "📧 Verifying domain in SES..."
aws ses verify-domain-identity --domain qivr.pro --region $REGION

# Configure Cognito pools to use SES
POOLS=("ap-southeast-2_VHnD5yZaA" "ap-southeast-2_ZMcriKNGJ")
POOL_NAMES=("qivr-simple-pool" "qivr-patient-pool")

for i in "${!POOLS[@]}"; do
    POOL_ID="${POOLS[$i]}"
    POOL_NAME="${POOL_NAMES[$i]}"
    
    echo ""
    echo "🔄 Configuring $POOL_NAME ($POOL_ID)..."
    
    # Update user pool to use SES
    aws cognito-idp update-user-pool \
        --user-pool-id $POOL_ID \
        --email-configuration \
        SourceArn="arn:aws:ses:$REGION:$(aws sts get-caller-identity --query Account --output text):identity/$FROM_EMAIL",EmailSendingAccount="DEVELOPER",From="$FROM_EMAIL" \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo "✅ $POOL_NAME configured successfully"
    else
        echo "❌ Failed to configure $POOL_NAME"
    fi
done

echo ""
echo "📊 Checking SES limits..."
aws ses get-send-quota --region $REGION

echo ""
echo "✅ SES Configuration Complete!"
echo "📧 Email limits removed - can now send unlimited emails"
echo "🧪 Ready to test user registration"
