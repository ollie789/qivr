#!/bin/bash
set -e

echo "Updating Elastic Beanstalk environment variables..."

aws elasticbeanstalk update-environment \
  --environment-name qivr-api-production \
  --region ap-southeast-2 \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=ASPNETCORE_ENVIRONMENT,Value=Production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_HOST,Value=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_PORT,Value=5432 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_NAME,Value=qivr \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_USER,Value=qivr_user \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_PASSWORD,Value="Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__UserPoolId,Value=ap-southeast-2_jbutB4tj1 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__UserPoolClientId,Value=4l510mm689hhpgr12prbuch2og \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__PatientPool__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__PatientPool__UserPoolId,Value=ap-southeast-2_ZMcriKNGJ \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__PatientPool__ClientId,Value=4kugfmvk56o3otd0grc4gddi8r \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__ClinicPool__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__ClinicPool__UserPoolId,Value=ap-southeast-2_jbutB4tj1 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__ClinicPool__ClientId,Value=4l510mm689hhpgr12prbuch2og \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Security__DefaultTenantId,Value=b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11 \
    Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=StreamLogs,Value=true \
    Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=RetentionInDays,Value=7

echo "Update initiated. Waiting for environment to update..."
aws elasticbeanstalk wait environment-updated --environment-name qivr-api-production --region ap-southeast-2

echo "Checking environment health..."
aws elasticbeanstalk describe-environments \
  --application-name qivr-api-staging \
  --environment-names qivr-api-production \
  --region ap-southeast-2 \
  --query 'Environments[0].{Status:Status,Health:Health,HealthStatus:HealthStatus}' \
  --output table
