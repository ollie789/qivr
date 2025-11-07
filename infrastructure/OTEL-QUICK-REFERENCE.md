# OpenTelemetry Quick Reference

## Current Status
🟢 **Disabled** - Safe and stable  
📦 **Ready** - Can enable anytime  
💰 **Cost** - $0/month (disabled), ~$5-10/month (enabled)

## Enable OpenTelemetry

```bash
cd /Users/oliver/Projects/qivr
./infrastructure/enable-otel.sh
```

## Disable OpenTelemetry

```bash
# Option 1: Revert to previous task definition
aws ecs update-service \
  --cluster qivr_cluster \
  --service qivr-api \
  --task-definition qivr-api:PREVIOUS_REVISION \
  --force-new-deployment \
  --region ap-southeast-2

# Option 2: Remove environment variable
# Edit task definition, remove OPENTELEMETRY__ENDPOINT, redeploy
```

## Check Status

```bash
# Is OTEL enabled?
aws logs tail /ecs/qivr-api --since 5m --region ap-southeast-2 | grep "OpenTelemetry"

# View traces
aws logs tail /aws/ecs/qivr-api-traces --follow --region ap-southeast-2

# View collector logs
aws logs tail /ecs/qivr-otel-collector --follow --region ap-southeast-2

# View metrics
aws cloudwatch list-metrics --namespace QIVR/API --region ap-southeast-2
```

## Configuration Files

| File | Purpose |
|------|---------|
| `appsettings.Production.json` | OTEL disabled by default |
| `appsettings.Development.json` | OTEL enabled for local dev |
| `otel-collector-config.yaml` | Collector configuration |
| `otel-sidecar-container.json` | ECS container definition |
| `enable-otel.sh` | Automated deployment |

## Environment Variables

| Variable | Value | Effect |
|----------|-------|--------|
| `OPENTELEMETRY__ENDPOINT` | (empty) | Disabled |
| `OPENTELEMETRY__ENDPOINT` | `http://localhost:4317` | Enabled with sidecar |
| `OPENTELEMETRY__SERVICENAME` | `qivr-api` | Service identifier |
| `OPENTELEMETRY__SERVICEVERSION` | `1.0.0` | Version tag |

## CloudWatch Resources

| Resource | Purpose |
|----------|---------|
| `/ecs/qivr-api` | Application logs |
| `/ecs/qivr-otel-collector` | Collector logs |
| `/aws/ecs/qivr-api-traces` | Distributed traces |
| `/aws/ecs/qivr-api-metrics` | Metrics (EMF format) |
| `QIVR/API` namespace | CloudWatch Metrics |

## Troubleshooting

### OTEL not starting
```bash
# Check collector logs
aws logs tail /ecs/qivr-otel-collector --since 10m --region ap-southeast-2

# Check IAM permissions
aws ecs describe-task-definition --task-definition qivr-api --region ap-southeast-2 \
  --query 'taskDefinition.taskRoleArn'
```

### No traces appearing
```bash
# Verify endpoint is set
aws ecs describe-services --cluster qivr_cluster --services qivr-api --region ap-southeast-2 \
  --query 'services[0].taskDefinition'

# Check application logs
aws logs tail /ecs/qivr-api --since 5m --region ap-southeast-2 | grep "OpenTelemetry"
```

### High costs
```bash
# Check ingestion volume
aws logs describe-log-groups --log-group-name-prefix /aws/ecs/qivr-api --region ap-southeast-2

# Consider adding sampling (see docs/opentelemetry-audit.md Phase 3)
```

## Documentation

- **Full Audit:** `docs/opentelemetry-audit.md`
- **Implementation Summary:** `docs/opentelemetry-implementation-summary.md`
- **This Reference:** `infrastructure/OTEL-QUICK-REFERENCE.md`

## When to Enable

✅ Enable when you need:
- Distributed tracing across services
- Performance profiling
- Production debugging insights
- Compliance/audit trails

❌ Keep disabled if:
- Single service architecture
- CloudWatch Logs are sufficient
- Cost is a concern
- No immediate observability needs

## Support

Questions? Check the full audit document:
```bash
cat docs/opentelemetry-audit.md
```
