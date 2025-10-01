#!/bin/bash

# Configuration
REGION="ap-southeast-2"
POOL_ID="ap-southeast-2_b48ZBE35F"
CLIENT_ID="3u1j21aero8u8c7a4gh52g9qhb"
CLIENT_SECRET="1sfitrb0486vqg0gqve60q7neqnhkkrfkulkkptnvfkgv1v74amm"

# Compute SECRET_HASH for Cognito
SECRET_HASH=$(echo -n "doctor@test.com${CLIENT_ID}" | openssl dgst -sha256 -hmac "${CLIENT_SECRET}" -binary | base64)

# Authenticate and get tokens
AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
    --region "$REGION" \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id "$CLIENT_ID" \
    --auth-parameters USERNAME="doctor@test.com",PASSWORD="TestPass123!",SECRET_HASH="$SECRET_HASH" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.AccessToken')
    ID_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')
    REFRESH_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.RefreshToken')
    
    echo "export AUTH_TOKEN=\"$ID_TOKEN\""
    echo "export AUTH_ACCESS_TOKEN=\"$ACCESS_TOKEN\""
    echo "export AUTH_REFRESH_TOKEN=\"$REFRESH_TOKEN\""
    echo ""
    echo "# Tokens exported. To use them:"
    echo "# source <(./get-auth-tokens.sh)"
else
    echo "Authentication failed:"
    echo "$AUTH_RESPONSE"
    exit 1
fi
