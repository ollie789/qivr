# Qivr OCR Processor Lambda Function

AWS Lambda function that processes uploaded documents using AWS Textract for OCR.

## Architecture

```
Document Upload → S3 → SQS Queue → Lambda → Textract → Database
```

1. **API** uploads document to S3 and sends message to SQS
2. **SQS** triggers Lambda function
3. **Lambda** retrieves document from S3
4. **Textract** extracts text and metadata
5. **Lambda** updates database with results

## Deployment

### Quick Deploy (All Steps)

```bash
cd aws/lambda/ocr-processor
./deploy-all.sh
```

### Manual Steps

```bash
# 1. Setup IAM role and policies
./setup-iam.sh

# 2. Deploy Lambda function
./deploy.sh

# 3. Setup SQS queue and trigger
./setup-sqs.sh
```

## Configuration

### Environment Variables

Set in Lambda configuration:

- `AWS_REGION` - AWS region (ap-southeast-2)
- `DB_HOST` - RDS endpoint
- `DB_PORT` - Database port (5432)
- `DB_NAME` - Database name (qivr)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password

### IAM Permissions

The Lambda role needs:

- **Textract**: `DetectDocumentText`, `AnalyzeDocument`
- **S3**: `GetObject` on documents bucket
- **SQS**: `ReceiveMessage`, `DeleteMessage`
- **Secrets Manager**: `GetSecretValue` for database credentials
- **CloudWatch Logs**: Basic execution role

## Testing

```bash
# Run integration test
node scripts/tests/test-ocr-textract.mjs email@example.com password

# Monitor Lambda logs
aws logs tail /aws/lambda/qivr-ocr-processor --follow

# Check SQS queue
aws sqs get-queue-attributes \
  --queue-url https://sqs.ap-southeast-2.amazonaws.com/818084701597/qivr-ocr-queue \
  --attribute-names ApproximateNumberOfMessages
```

## Extracted Data

The Lambda function extracts:

- **Full Text**: Complete OCR text from document
- **Patient Name**: Parsed from "Patient Name:" or "Name:" fields
- **Date of Birth**: Parsed from "DOB:" or "Date of Birth:" fields
- **Confidence Score**: Average confidence from Textract blocks

## Troubleshooting

### Documents stuck in "processing"

1. Check SQS queue has messages:

   ```bash
   aws sqs get-queue-attributes --queue-url <QUEUE_URL> --attribute-names All
   ```

2. Check Lambda is triggered:

   ```bash
   aws logs tail /aws/lambda/qivr-ocr-processor --since 10m
   ```

3. Check Lambda errors:
   ```bash
   aws logs filter-pattern /aws/lambda/qivr-ocr-processor --filter-pattern "ERROR"
   ```

### Low confidence scores

- Document quality may be poor
- Try with clearer scans
- Check Textract service limits

### Database connection errors

- Verify RDS security group allows Lambda
- Check database credentials in Secrets Manager
- Ensure Lambda has VPC access if RDS is in VPC

## Cost Optimization

- **Textract**: ~$1.50 per 1000 pages
- **Lambda**: Free tier covers most usage
- **SQS**: Free tier covers most usage
- **S3**: Standard storage rates

## Monitoring

CloudWatch metrics:

- `Invocations` - Number of Lambda executions
- `Errors` - Failed executions
- `Duration` - Processing time
- `Throttles` - Rate limit hits

## Updates

To update the Lambda function:

```bash
# Make code changes
vim index.mjs

# Redeploy
./deploy.sh
```

## Security

- Database credentials stored in Secrets Manager
- IAM role follows least privilege principle
- S3 bucket access restricted to specific prefix
- VPC configuration recommended for production
