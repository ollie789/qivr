#!/bin/bash

# Script to set up IAM roles for Elastic Beanstalk
set -e

echo "🔐 Setting up IAM roles for Elastic Beanstalk..."

# Create service role for Elastic Beanstalk
echo "Creating Elastic Beanstalk service role..."
aws iam create-role --role-name aws-elasticbeanstalk-service-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "elasticbeanstalk.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "  Service role already exists"

# Attach managed policies to service role
aws iam attach-role-policy --role-name aws-elasticbeanstalk-service-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth 2>/dev/null || true
aws iam attach-role-policy --role-name aws-elasticbeanstalk-service-role \
  --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy 2>/dev/null || true

# Create EC2 role for Elastic Beanstalk
echo "Creating Elastic Beanstalk EC2 role..."
aws iam create-role --role-name aws-elasticbeanstalk-ec2-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null || echo "  EC2 role already exists"

# Attach managed policies to EC2 role
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier 2>/dev/null || true
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier 2>/dev/null || true
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker 2>/dev/null || true

# Create instance profile
echo "Creating instance profile..."
aws iam create-instance-profile --instance-profile-name aws-elasticbeanstalk-ec2-role 2>/dev/null || echo "  Instance profile already exists"
aws iam add-role-to-instance-profile --instance-profile-name aws-elasticbeanstalk-ec2-role \
  --role-name aws-elasticbeanstalk-ec2-role 2>/dev/null || true

echo "✅ IAM roles setup complete!"
echo ""
echo "Roles created:"
echo "  • aws-elasticbeanstalk-service-role"
echo "  • aws-elasticbeanstalk-ec2-role"
echo "  • Instance profile: aws-elasticbeanstalk-ec2-role"