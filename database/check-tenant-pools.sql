-- Check tenants and their Cognito pool configuration
SELECT 
    "Id",
    "Name",
    "Slug",
    "Status",
    "CognitoUserPoolId",
    "CognitoUserPoolClientId",
    "CreatedAt"
FROM "Tenants"
ORDER BY "CreatedAt" DESC
LIMIT 10;
