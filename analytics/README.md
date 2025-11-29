# QIVR Analytics Data Lake

Anonymized clinical outcomes data for external API consumers.

## Structure

```
analytics/
├── etl-lambda/       # Lambda functions for data extraction
├── glue-jobs/        # AWS Glue transform scripts
└── athena-queries/   # SQL for Athena table definitions
```

## Architecture

See [docs/SAAS-ANALYTICS-ARCHITECTURE.md](../docs/SAAS-ANALYTICS-ARCHITECTURE.md) for full details.

## Privacy

- All PHI is stripped before data enters this pipeline
- K-anonymity (N≥10) applied to all aggregations
- No patient identifiers ever stored here
