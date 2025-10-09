#!/bin/bash

# Update Elastic Beanstalk environment configuration
aws elasticbeanstalk update-environment \
  --environment-name qivr-api-staging-prod \
  --region ap-southeast-2 \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=ASPNETCORE_ENVIRONMENT,Value=Production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_URL,Value="postgresql://qivr_user:qivr_dev_password@qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com:5432/qivr" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=ConnectionStrings__DefaultConnection,Value="Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=qivr_dev_password" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Intake__ConnectionString,Value="Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=qivr_dev_password" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=COGNITO_REGION,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=COGNITO_USER_POOL_ID,Value=ap-southeast-2_jbutB4tj1 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=COGNITO_CLIENT_ID,Value=4l510mm689hhpgr12prbuch2og \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__UserPoolId,Value=ap-southeast-2_jbutB4tj1 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__UserPoolClientId,Value=4l510mm689hhpgr12prbuch2og \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=CORS_ALLOWED_ORIGINS,Value="http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com,http://qivr-clinic-dashboard-staging.s3-website-ap-southeast-2.amazonaws.com" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=ENVIRONMENT,Value=production

echo "Environment update initiated. Waiting for it to complete..."
sleep 30

# Check environment status
aws elasticbeanstalk describe-environments \
  --application-name qivr-api-staging \
  --environment-names qivr-api-staging-prod \
  --region ap-southeast-2 | jq '.Environments[0] | {Status, Health, VersionLabel}'