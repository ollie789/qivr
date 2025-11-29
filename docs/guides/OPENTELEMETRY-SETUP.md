# OpenTelemetry Setup with AWS X-Ray

OpenTelemetry is currently **disabled by default** to prevent startup issues. This document explains how to enable it properly with AWS X-Ray.

## Current Status

- ✅ OpenTelemetry packages installed
- ✅ AWS X-Ray instrumentation configured
- ✅ Code ready to enable with configuration flag
- ❌ Disabled by default (`OpenTelemetry:Enabled = false`)

## Why Disabled?

Previously, an empty `OPENTELEMETRY_ENDPOINT` environment variable was causing `UriFormatException` crashes on startup. The app would continuously crash and restart, making the entire system unavailable.

## How to Enable

### Option 1: Enable Without X-Ray (Local Development)

Set in `appsettings.Development.json`:

```json
{
  "OpenTelemetry": {
    "Enabled": true,
    "Endpoint": "http://localhost:4317",
    "ServiceName": "qivr-api",
    "ServiceVersion": "1.0.0"
  }
}
```

Then run a local OTLP collector:

```bash
docker run -p 4317:4317 otel/opentelemetry-collector:latest
```

### Option 2: Enable With AWS X-Ray (Production)

#### Step 1: Deploy AWS Distro for OpenTelemetry (ADOT) Collector

Deploy ADOT Collector as a sidecar container in your ECS task definition:

```json
{
  "name": "aws-otel-collector",
  "image": "public.ecr.aws/aws-observability/aws-otel-collector:latest",
  "essential": true,
  "command": ["--config=/etc/ecs/ecs-xray.yaml"],
  "portMappings": [
    {
      "containerPort": 4317,
      "protocol": "tcp"
    }
  ],
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/qivr-adot-collector",
      "awslogs-region": "ap-southeast-2",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

#### Step 2: Update Task Role Permissions

Add X-Ray permissions to your ECS task role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets",
        "xray:GetSamplingStatisticSummaries"
      ],
      "Resource": "*"
    }
  ]
}
```

#### Step 3: Enable OpenTelemetry in ECS Task Definition

Add environment variable to your qivr-api container:

```json
{
  "name": "OpenTelemetry__Enabled",
  "value": "true"
}
```

The endpoint will default to `http://localhost:4317` which will connect to the ADOT sidecar.

#### Step 4: Deploy

```bash
# Update task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Update service
aws ecs update-service \
  --cluster qivr-cluster \
  --service qivr-api-service \
  --task-definition qivr-api:LATEST \
  --force-new-deployment
```

## What Gets Traced

When enabled, OpenTelemetry will automatically instrument:

- ✅ ASP.NET Core requests (excluding /health)
- ✅ HTTP client calls
- ✅ AWS SDK calls (S3, SQS, Cognito, etc.)
- ✅ Database queries (via Entity Framework)
- ✅ Custom spans (if added)

## Viewing Traces in AWS X-Ray

1. Go to AWS Console → X-Ray → Service Map
2. View traces: X-Ray → Traces
3. Filter by service: `qivr-api`
4. Analyze performance bottlenecks

## Metrics

OpenTelemetry also exports metrics:

- Request duration
- Request count
- HTTP client metrics
- Custom metrics (if added)

## Cost Considerations

AWS X-Ray pricing:

- First 100,000 traces/month: Free
- Additional traces: $5 per 1 million traces
- Trace retrieval: $0.50 per 1 million traces

For a typical application:

- ~10,000 requests/day = ~300,000 traces/month
- Cost: ~$10/month

## Troubleshooting

### App crashes on startup

Check logs for `UriFormatException`. This means:

- `OPENTELEMETRY_ENDPOINT` is set to empty string
- Remove the environment variable entirely

### No traces appearing in X-Ray

1. Check ADOT collector logs:

   ```bash
   aws logs tail /ecs/qivr-adot-collector --follow
   ```

2. Verify task role has X-Ray permissions

3. Check OpenTelemetry is enabled:
   ```bash
   # Should see "OpenTelemetry enabled with AWS X-Ray"
   aws logs tail /ecs/qivr-api --follow | grep OpenTelemetry
   ```

### High latency after enabling

OpenTelemetry adds ~1-2ms overhead per request. If seeing higher:

- Check ADOT collector resource limits
- Reduce sampling rate
- Check network latency to X-Ray

## Future Enhancements

- [ ] Add custom spans for business logic
- [ ] Add custom metrics (e.g., queue depth, cache hit rate)
- [ ] Set up X-Ray sampling rules
- [ ] Configure trace retention
- [ ] Set up CloudWatch alarms on trace errors
- [ ] Add distributed tracing across services

## References

- [AWS Distro for OpenTelemetry](https://aws-otel.github.io/)
- [OpenTelemetry .NET](https://opentelemetry.io/docs/instrumentation/net/)
- [AWS X-Ray](https://docs.aws.amazon.com/xray/)
