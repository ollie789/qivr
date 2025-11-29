# QIVR SaaS Admin Portal & Analytics Data Lake Architecture

## Executive Summary

This document outlines the architecture for two interconnected systems:

1. **SaaS Admin Portal** - Internal platform for tenant management, billing, and operations
2. **Analytics Data Lake** - Anonymized clinical outcomes data for external API consumers

Both systems are designed with HIPAA compliance, data privacy, and scalability as core requirements.

---

## Part 1: SaaS Admin Portal

### Purpose

Centralized management console for QIVR operations team to:

- Onboard/offboard clinic tenants
- Manage billing and subscriptions
- Monitor platform health
- Configure feature flags per tenant
- Handle support escalations

### Architecture Options

#### Option A: Standalone Admin App (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Portal (React)                      │
│                   admin.qivr.internal                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Admin API (.NET)                          │
│              Separate from main Qivr.Api                     │
│         - TenantManagementController                         │
│         - BillingController                                  │
│         - FeatureFlagController                              │
│         - AnalyticsController                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Main DB │  │ Stripe  │  │ Cognito │
   │  (RDS)  │  │   API   │  │  Pools  │
   └─────────┘  └─────────┘  └─────────┘
```

**Pros:**

- Complete isolation from production app
- Can deploy/update independently
- Simpler security model (internal only)

**Cons:**

- Additional infrastructure to maintain
- Some code duplication

#### Option B: Integrated Admin Module

Add admin routes to existing Qivr.Api with role-based access.

**Pros:**

- Single codebase
- Shared models and services

**Cons:**

- Larger attack surface
- Deployment coupling
- More complex authorization

#### Option C: Serverless Admin Functions

AWS Lambda functions behind API Gateway for each admin operation.

**Pros:**

- Pay-per-use pricing
- Auto-scaling
- No servers to manage

**Cons:**

- Cold start latency
- Harder to debug
- State management complexity

### Recommended: Option A with these components:

### Core Features

#### 1. Tenant Management

```
Tenants Table (existing, extended)
├── id (UUID)
├── name
├── slug
├── status (active, suspended, churned)
├── plan_tier (starter, professional, enterprise)
├── created_at
├── billing_customer_id (Stripe)
├── feature_flags (JSONB)
├── usage_limits (JSONB)
└── metadata (JSONB)
```

**Operations:**

- Create tenant → Provisions Cognito pool, S3 folder, DB schema
- Suspend tenant → Disables login, preserves data
- Delete tenant → GDPR-compliant data removal (30-day grace)

#### 2. Billing Integration (Stripe)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Admin Portal │────▶│  Stripe API  │────▶│   Webhooks   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  Update DB   │
                                          │ subscription │
                                          │    status    │
                                          └──────────────┘
```

**Pricing Tiers:**
| Tier | Monthly | Practitioners | Patients | Features |
|------|---------|---------------|----------|----------|
| Starter | $99 | 1-2 | 500 | Core features |
| Professional | $299 | 3-10 | 2,000 | + AI triage, analytics |
| Enterprise | Custom | Unlimited | Unlimited | + API access, SSO, SLA |

**Stripe Integration Points:**

- `stripe.customers.create()` on tenant signup
- `stripe.subscriptions.create()` for plan selection
- Webhook handlers for: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`

#### 3. Feature Flags

```json
{
  "ai_triage": true,
  "ai_treatment_plans": true,
  "document_ocr": true,
  "sms_reminders": false,
  "api_access": false,
  "custom_branding": false,
  "hipaa_audit_logs": true
}
```

**Implementation Options:**

| Option          | Pros                     | Cons                      |
| --------------- | ------------------------ | ------------------------- |
| DB JSONB column | Simple, no external deps | No real-time updates      |
| LaunchDarkly    | Powerful, A/B testing    | $$$, external dependency  |
| AWS AppConfig   | AWS-native, free tier    | Learning curve            |
| Redis cache     | Fast, real-time          | Another service to manage |

**Recommendation:** Start with DB JSONB, migrate to AppConfig when needed.

#### 4. Usage Monitoring

Track per-tenant:

- API calls/month
- Storage used (S3)
- Active patients
- AI inference calls (Bedrock)
- SMS/email sent

```sql
CREATE TABLE tenant_usage (
  tenant_id UUID REFERENCES tenants(id),
  period DATE,  -- First of month
  api_calls BIGINT DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  active_patients INT DEFAULT 0,
  ai_calls INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  PRIMARY KEY (tenant_id, period)
);
```

---

## Part 2: Analytics Data Lake

### Purpose

Aggregate anonymized clinical outcomes data to:

- Sell insights to researchers, insurers, health systems
- Benchmark clinic performance
- Power industry reports
- Train ML models (future)

### Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION DATABASE                          │
│                    (PHI - Protected Health Info)                     │
│  patients, appointments, clinical_notes, treatment_plans, proms     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              │ Nightly ETL (Lambda)
                              │ - Strip all identifiers
                              │ - Apply k-anonymity (N≥10)
                              │ - Aggregate to clinic level
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ANALYTICS DATA LAKE                          │
│                    (Anonymized - No PHI)                             │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   S3 Raw    │  │  S3 Curated │  │   Athena    │                  │
│  │  (Parquet)  │──▶│  (Parquet)  │──▶│  (Query)    │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                            │                         │
│                                            ▼                         │
│                                    ┌─────────────┐                   │
│                                    │ QuickSight  │                   │
│                                    │ Dashboards  │                   │
│                                    └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

### De-identification Strategy

#### What Gets Removed (PHI under HIPAA Safe Harbor)

- Patient names, addresses, phone, email
- Medicare/TFN numbers
- Dates more specific than year
- Provider names
- Clinic names (replaced with anonymous IDs)
- Any free-text clinical notes

#### What Gets Kept (Anonymized)

- Age brackets (18-25, 26-35, etc.)
- Gender
- Condition categories (ICD-10 codes)
- Treatment types
- PROM scores (aggregated)
- Outcome metrics
- Geographic region (state level only)

#### K-Anonymity Implementation

```python
# Only include data points where N >= 10 similar records exist
# Example: Don't report if only 3 patients in NSW aged 65+ had shoulder surgery

def apply_k_anonymity(df, k=10, quasi_identifiers=['age_bracket', 'gender', 'state', 'condition']):
    counts = df.groupby(quasi_identifiers).size()
    valid_groups = counts[counts >= k].index
    return df[df.set_index(quasi_identifiers).index.isin(valid_groups)]
```

### Data Models

#### Aggregated PROM Outcomes

```sql
-- Analytics DB (separate from production)
CREATE TABLE prom_outcomes_agg (
  id UUID PRIMARY KEY,
  period DATE,                    -- Month
  region VARCHAR(50),             -- State/territory
  condition_category VARCHAR(100),-- e.g., "Musculoskeletal - Shoulder"
  treatment_type VARCHAR(100),    -- e.g., "Physiotherapy"
  age_bracket VARCHAR(20),        -- e.g., "35-44"
  gender VARCHAR(20),
  patient_count INT,              -- Must be >= 10
  avg_baseline_score DECIMAL,
  avg_final_score DECIMAL,
  avg_improvement_pct DECIMAL,
  median_sessions INT,
  avg_days_to_discharge INT
);
```

#### Clinic Benchmarks

```sql
CREATE TABLE clinic_benchmarks_agg (
  id UUID PRIMARY KEY,
  period DATE,
  clinic_anonymous_id VARCHAR(50), -- Hashed, not traceable
  region VARCHAR(50),
  specialty VARCHAR(100),
  patient_volume_bracket VARCHAR(20), -- "Small", "Medium", "Large"
  avg_prom_improvement DECIMAL,
  avg_patient_satisfaction DECIMAL,
  avg_wait_time_days DECIMAL,
  no_show_rate DECIMAL,
  percentile_rank INT              -- vs peers
);
```

### ETL Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  EventBridge│────▶│   Lambda    │────▶│   S3 Raw    │────▶│  Glue Job   │
│  (Nightly)  │     │  Extract    │     │  (Parquet)  │     │  Transform  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                    ┌─────────────┐     ┌─────────────┐             │
                    │   Athena    │◀────│ S3 Curated  │◀────────────┘
                    │   Tables    │     │  (Parquet)  │
                    └─────────────┘     └─────────────┘
```

**Lambda Extract Function:**

```python
def handler(event, context):
    # 1. Query production DB for yesterday's completed treatments
    # 2. Strip PHI using de-identification rules
    # 3. Write to S3 as Parquet
    # 4. Trigger Glue job for aggregation
```

**Glue Transform Job:**

- Apply k-anonymity filtering
- Calculate aggregates
- Update Athena tables
- Generate clinic benchmark rankings

### External API

#### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  External   │────▶│ API Gateway │────▶│   Lambda    │────▶│   Athena    │
│  Consumer   │     │  + API Key  │     │   Handler   │     │   Query     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### Endpoints

```
GET /v1/outcomes
  ?condition=musculoskeletal
  &region=NSW
  &period=2024-Q4

GET /v1/benchmarks
  ?specialty=physiotherapy
  &period=2024-11

GET /v1/trends
  ?metric=prom_improvement
  &condition=shoulder
  &from=2023-01
  &to=2024-12
```

#### Pricing Model Options

| Model               | Description                   | Pros                | Cons                     |
| ------------------- | ----------------------------- | ------------------- | ------------------------ |
| Per-query           | $0.10 per API call            | Simple, predictable | Discourages exploration  |
| Tiered subscription | $500/mo for 10K calls         | Predictable revenue | May over/under provision |
| Data licensing      | Annual fee for dataset access | High value          | Complex contracts        |
| Freemium            | Free tier + paid premium      | Adoption            | Revenue uncertainty      |

**Recommendation:** Tiered subscription with overage charges

---

## Part 3: Implementation Roadmap

### Phase 1: Foundation (4-6 weeks)

- [ ] Create admin portal React app
- [ ] Build tenant management API
- [ ] Stripe integration (basic)
- [ ] Feature flags in DB

### Phase 2: Billing & Usage (4-6 weeks)

- [ ] Full Stripe subscription flow
- [ ] Usage tracking implementation
- [ ] Billing dashboard
- [ ] Invoice generation

### Phase 3: Analytics Lake (6-8 weeks)

- [ ] S3 data lake setup
- [ ] ETL Lambda functions
- [ ] De-identification service
- [ ] Athena tables and queries
- [ ] Internal dashboards (QuickSight)

### Phase 4: External API (4-6 weeks)

- [ ] API Gateway setup
- [ ] Lambda query handlers
- [ ] API key management
- [ ] Rate limiting
- [ ] Documentation portal

### Phase 5: Polish & Scale (Ongoing)

- [ ] Advanced analytics (ML models)
- [ ] Real-time streaming option
- [ ] Partner integrations
- [ ] Compliance certifications

---

## Part 4: AWS Services & Costs

### Admin Portal

| Service         | Purpose        | Est. Monthly Cost |
| --------------- | -------------- | ----------------- |
| ECS Fargate     | Admin API      | $30-50            |
| S3 + CloudFront | Admin frontend | $5                |
| Secrets Manager | Stripe keys    | $1                |
| **Total**       |                | **~$40-60**       |

### Analytics Data Lake

| Service     | Purpose         | Est. Monthly Cost         |
| ----------- | --------------- | ------------------------- |
| S3          | Data storage    | $10-50 (scales with data) |
| Lambda      | ETL functions   | $5-20                     |
| Glue        | Data transforms | $20-50                    |
| Athena      | Queries         | $5-30 (per query)         |
| API Gateway | External API    | $10-50                    |
| QuickSight  | Dashboards      | $24/user                  |
| **Total**   |                 | **~$75-225**              |

### Cost Optimization Tips

- Use S3 Intelligent Tiering (already enabled ✓)
- Partition Athena tables by date
- Cache frequent API responses in ElastiCache
- Use Glue job bookmarks to process only new data

---

## Part 5: Security & Compliance

### Data Separation

```
┌─────────────────────────────────────────────────────────────┐
│                    VPC - Production                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   ECS API   │  │     RDS     │  │  S3 (PHI)   │         │
│  │   (PHI)     │  │   (PHI)     │  │  Documents  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ One-way ETL (no reverse access)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    VPC - Analytics                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Lambda    │  │   Athena    │  │ S3 (Anon)   │         │
│  │   (ETL)     │  │  (Queries)  │  │  Data Lake  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Access Controls

- Admin portal: Internal IPs only (VPN/office)
- Analytics API: API key + rate limiting
- Data lake S3: No public access, IAM roles only
- ETL Lambda: Read-only access to production DB

### Audit Requirements

- CloudTrail for all API calls (already recommended ✓)
- S3 access logging on data lake buckets
- API Gateway access logs
- Athena query history

### Compliance Checklist

- [ ] BAA with AWS (required for HIPAA)
- [ ] Data Processing Agreement for API consumers
- [ ] Privacy policy update for analytics
- [ ] Patient consent for anonymized data use
- [ ] Annual security audit
- [ ] Penetration testing

---

## Part 6: Revenue Projections

### SaaS Subscriptions

| Year | Clinics | Avg MRR | Annual Revenue |
| ---- | ------- | ------- | -------------- |
| Y1   | 20      | $200    | $48,000        |
| Y2   | 75      | $250    | $225,000       |
| Y3   | 200     | $300    | $720,000       |

### Analytics API

| Year | Subscribers | Avg Annual | Revenue  |
| ---- | ----------- | ---------- | -------- |
| Y1   | 2           | $10,000    | $20,000  |
| Y2   | 8           | $15,000    | $120,000 |
| Y3   | 20          | $20,000    | $400,000 |

### Combined Potential

- Year 1: ~$70K
- Year 2: ~$345K
- Year 3: ~$1.1M

---

## Appendix A: Alternative Approaches

### Build vs Buy

| Component     | Build                     | Buy                   | Recommendation         |
| ------------- | ------------------------- | --------------------- | ---------------------- |
| Billing       | Custom Stripe integration | Stripe Billing Portal | Build (more control)   |
| Feature Flags | DB + cache                | LaunchDarkly ($)      | Build initially        |
| Analytics     | Custom data lake          | Segment + Mixpanel    | Build (data ownership) |
| Admin UI      | Custom React              | Retool ($)            | Build (customization)  |

### Data Lake Alternatives

| Option                        | Pros                        | Cons                |
| ----------------------------- | --------------------------- | ------------------- |
| **S3 + Athena** (Recommended) | Serverless, cheap, scalable | Query latency       |
| Redshift                      | Fast queries, familiar SQL  | Always-on cost      |
| Snowflake                     | Powerful, easy              | Expensive, external |
| BigQuery                      | Great for analytics         | GCP lock-in         |

### API Monetization Platforms

| Platform        | Cut    | Features                |
| --------------- | ------ | ----------------------- |
| RapidAPI        | 20%    | Marketplace exposure    |
| AWS Marketplace | 15-20% | Enterprise buyers       |
| Direct sales    | 0%     | Full control, more work |

---

## Appendix B: Sample Code Snippets

### Stripe Webhook Handler

```csharp
[HttpPost("webhook")]
public async Task<IActionResult> HandleStripeWebhook()
{
    var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
    var stripeEvent = EventUtility.ConstructEvent(json,
        Request.Headers["Stripe-Signature"], _webhookSecret);

    switch (stripeEvent.Type)
    {
        case "invoice.paid":
            var invoice = stripeEvent.Data.Object as Invoice;
            await _tenantService.ActivateSubscription(invoice.CustomerId);
            break;
        case "invoice.payment_failed":
            await _tenantService.SuspendForNonPayment(invoice.CustomerId);
            break;
    }
    return Ok();
}
```

### De-identification Lambda (Python)

```python
import hashlib
from datetime import datetime

def deidentify_record(record):
    return {
        'anonymous_id': hashlib.sha256(str(record['patient_id']).encode()).hexdigest()[:16],
        'age_bracket': get_age_bracket(record['date_of_birth']),
        'gender': record['gender'],
        'region': record['state'],  # State only, no suburb
        'condition_code': record['icd10_code'],
        'treatment_type': record['treatment_category'],
        'prom_baseline': record['prom_baseline_score'],
        'prom_final': record['prom_final_score'],
        'sessions': record['total_sessions'],
        # Excluded: name, address, phone, email, medicare, provider_name
    }

def get_age_bracket(dob):
    age = (datetime.now() - dob).days // 365
    brackets = [(18, '0-17'), (25, '18-24'), (35, '25-34'),
                (45, '35-44'), (55, '45-54'), (65, '55-64'), (999, '65+')]
    return next(label for max_age, label in brackets if age < max_age)
```

---

## Document History

| Version | Date       | Author | Changes                       |
| ------- | ---------- | ------ | ----------------------------- |
| 1.0     | 2024-11-29 | Oliver | Initial architecture document |

---

## Next Steps

1. Review this document and decide on approach for each component
2. Prioritize Phase 1 (Admin Portal) vs Phase 3 (Analytics Lake)
3. Get legal review on data licensing and privacy implications
4. Create detailed technical specs for chosen approach
5. Estimate development resources needed
