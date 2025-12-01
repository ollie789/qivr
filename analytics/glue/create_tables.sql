-- Qivr Analytics Data Lake - Glue/Athena Table Definitions
-- Run these in Athena console to create the tables

-- Create database
CREATE DATABASE IF NOT EXISTS qivr_analytics;

-- Tenants table (daily snapshot)
CREATE EXTERNAL TABLE IF NOT EXISTS qivr_analytics.tenants (
    id STRING,
    name STRING,
    slug STRING,
    status STRING,
    plan STRING,
    region STRING,
    created_at TIMESTAMP,
    patient_count BIGINT,
    staff_count BIGINT,
    mrr BIGINT
)
PARTITIONED BY (dt STRING)
STORED AS PARQUET
LOCATION 's3://qivr-analytics-lake/curated/tenants/'
TBLPROPERTIES ('parquet.compression'='SNAPPY');

-- Usage table (daily metrics per tenant)
CREATE EXTERNAL TABLE IF NOT EXISTS qivr_analytics.usage (
    tenant_id STRING,
    date DATE,
    appointments BIGINT,
    completed_appointments BIGINT,
    messages BIGINT,
    documents BIGINT
)
PARTITIONED BY (dt STRING)
STORED AS PARQUET
LOCATION 's3://qivr-analytics-lake/curated/usage/'
TBLPROPERTIES ('parquet.compression'='SNAPPY');

-- PROM outcomes (anonymized, k-anonymity enforced)
CREATE EXTERNAL TABLE IF NOT EXISTS qivr_analytics.prom_outcomes (
    region STRING,
    prom_type STRING,
    age_bracket STRING,
    gender STRING,
    avg_baseline DOUBLE,
    avg_final DOUBLE,
    patient_count BIGINT
)
PARTITIONED BY (dt STRING)
STORED AS PARQUET
LOCATION 's3://qivr-analytics-lake/curated/prom_outcomes/'
TBLPROPERTIES ('parquet.compression'='SNAPPY');

-- After creating tables, run this to discover partitions:
-- MSCK REPAIR TABLE qivr_analytics.tenants;
-- MSCK REPAIR TABLE qivr_analytics.usage;
-- MSCK REPAIR TABLE qivr_analytics.prom_outcomes;
