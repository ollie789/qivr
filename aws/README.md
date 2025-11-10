# AWS Configuration Files

## Active Files (Use These)

### ECS
- **task-definition-template.json** - Template for ECS task definitions (used by CodeBuild)

### IAM Policies
- **iam-policy-codebuild.json** - CodeBuild service role policy
- **codebuild-policy.json** - CodeBuild permissions
- **codepipeline-policy.json** - CodePipeline permissions

### Lambda
- **lambda/cognito-post-confirmation.js** - Post-signup Lambda function
- **lambda/package.json** - Lambda dependencies
- **lambda/lambda-trust-policy.json** - Lambda execution role
- **lambda/lambda-test-event.json** - Test event for Lambda

## Archived Files

### `/archive/old-task-defs/`
Old ECS task definition versions (v2, v3, v8, etc.) - kept for reference

### `/archive/old-lambda/`
Old Lambda function versions and zip files - kept for reference

### `/archive/`
- fix-cors-task-def.json - Old CORS fix (no longer needed)
- user-pool-update.json - Old Cognito pool config

## Usage

**Deploy ECS:**
```bash
# Template is used automatically by CodeBuild
# See buildspec.yml for how it's processed
```

**Update Lambda:**
```bash
cd lambda
npm install
zip -r function.zip .
aws lambda update-function-code --function-name cognito-post-confirmation --zip-file fileb://function.zip
```

**Update IAM Policies:**
```bash
aws iam put-role-policy --role-name qivr-codebuild-role --policy-name CodeBuildPolicy --policy-document file://iam-policy-codebuild.json
```
