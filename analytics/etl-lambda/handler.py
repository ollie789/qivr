"""
QIVR Analytics ETL Lambda
Extracts and de-identifies clinical data for the analytics data lake.
"""
import json
import hashlib
import boto3
from datetime import datetime, timedelta
from typing import Any

s3 = boto3.client('s3')
BUCKET = 'qivr-analytics-lake'

def get_age_bracket(birth_date: datetime) -> str:
    """Convert birth date to age bracket for anonymization."""
    age = (datetime.now() - birth_date).days // 365
    brackets = [(18, '0-17'), (25, '18-24'), (35, '25-34'), 
                (45, '35-44'), (55, '45-54'), (65, '55-64'), (999, '65+')]
    return next(label for max_age, label in brackets if age < max_age)

def anonymize_id(original_id: str) -> str:
    """Create non-reversible anonymous ID."""
    return hashlib.sha256(f"qivr-salt-{original_id}".encode()).hexdigest()[:16]

def deidentify_prom_record(record: dict[str, Any]) -> dict[str, Any]:
    """Strip PHI from PROM outcome record."""
    return {
        'anonymous_patient_id': anonymize_id(str(record['patient_id'])),
        'anonymous_clinic_id': anonymize_id(str(record['tenant_id'])),
        'age_bracket': get_age_bracket(record['date_of_birth']),
        'gender': record.get('gender', 'unknown'),
        'region': record.get('state', 'unknown'),  # State only, no suburb
        'condition_category': record.get('icd10_category', 'unknown'),
        'treatment_type': record.get('treatment_category', 'unknown'),
        'prom_type': record.get('prom_type'),
        'baseline_score': record.get('baseline_score'),
        'final_score': record.get('final_score'),
        'improvement_pct': calculate_improvement(record),
        'total_sessions': record.get('session_count'),
        'days_to_discharge': record.get('days_in_treatment'),
        'discharge_year_month': record.get('discharge_date', datetime.now()).strftime('%Y-%m'),
    }

def calculate_improvement(record: dict) -> float | None:
    """Calculate percentage improvement in PROM score."""
    baseline = record.get('baseline_score')
    final = record.get('final_score')
    if baseline and final and baseline != 0:
        return round(((final - baseline) / baseline) * 100, 1)
    return None

def handler(event: dict, context: Any) -> dict:
    """
    Lambda handler - triggered nightly by EventBridge.
    Extracts yesterday's completed treatments, de-identifies, writes to S3.
    """
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # TODO: Replace with actual RDS query
    # This is a placeholder showing the structure
    records = []  # fetch_completed_treatments(yesterday)
    
    if not records:
        return {'statusCode': 200, 'body': json.dumps({'message': 'No records to process'})}
    
    # De-identify all records
    anonymized = [deidentify_prom_record(r) for r in records]
    
    # Write to S3 as JSON lines (convert to Parquet in Glue)
    key = f"raw/prom-outcomes/{yesterday}/data.jsonl"
    body = '\n'.join(json.dumps(r) for r in anonymized)
    
    s3.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType='application/jsonl')
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Processed {len(anonymized)} records',
            'output': f's3://{BUCKET}/{key}'
        })
    }
