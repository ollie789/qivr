-- QIVR Analytics Data Lake - Athena Table Definitions
-- These tables query the anonymized data in S3

-- Raw PROM outcomes (partitioned by month)
CREATE EXTERNAL TABLE IF NOT EXISTS qivr_analytics.prom_outcomes_raw (
  anonymous_patient_id STRING,
  anonymous_clinic_id STRING,
  age_bracket STRING,
  gender STRING,
  region STRING,
  condition_category STRING,
  treatment_type STRING,
  prom_type STRING,
  baseline_score DOUBLE,
  final_score DOUBLE,
  improvement_pct DOUBLE,
  total_sessions INT,
  days_to_discharge INT
)
PARTITIONED BY (discharge_year_month STRING)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
LOCATION 's3://qivr-analytics-lake/curated/prom-outcomes/'
TBLPROPERTIES ('has_encrypted_data'='false');

-- Aggregated outcomes (k-anonymity applied, N>=10)
CREATE EXTERNAL TABLE IF NOT EXISTS qivr_analytics.prom_outcomes_agg (
  period STRING,
  region STRING,
  condition_category STRING,
  treatment_type STRING,
  age_bracket STRING,
  gender STRING,
  patient_count INT,
  avg_baseline_score DOUBLE,
  avg_final_score DOUBLE,
  avg_improvement_pct DOUBLE,
  median_sessions DOUBLE,
  avg_days_to_discharge DOUBLE
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
LOCATION 's3://qivr-analytics-lake/aggregated/prom-outcomes/'
TBLPROPERTIES ('has_encrypted_data'='false');

-- Clinic benchmarks (anonymized)
CREATE EXTERNAL TABLE IF NOT EXISTS qivr_analytics.clinic_benchmarks (
  period STRING,
  anonymous_clinic_id STRING,
  region STRING,
  specialty STRING,
  patient_volume_bracket STRING,
  avg_prom_improvement DOUBLE,
  avg_patient_satisfaction DOUBLE,
  avg_wait_time_days DOUBLE,
  no_show_rate DOUBLE,
  percentile_rank INT
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
LOCATION 's3://qivr-analytics-lake/aggregated/clinic-benchmarks/'
TBLPROPERTIES ('has_encrypted_data'='false');

-- Sample query: Average improvement by condition and region
-- SELECT 
--   condition_category,
--   region,
--   AVG(avg_improvement_pct) as avg_improvement,
--   SUM(patient_count) as total_patients
-- FROM qivr_analytics.prom_outcomes_agg
-- WHERE period >= '2024-01'
-- GROUP BY condition_category, region
-- HAVING SUM(patient_count) >= 10;
