"""
ETL Lambda: Extract tenant and usage data from Production RDS to Data Lake.
Runs nightly via EventBridge.
"""
import json
import os
import boto3
import psycopg2
from datetime import datetime, timedelta

s3 = boto3.client('s3')
secrets = boto3.client('secretsmanager')

BUCKET = os.environ.get('DATA_LAKE_BUCKET', 'qivr-analytics-lake')
SECRET_ID = os.environ.get('DB_SECRET_ID', 'qivr/production/db-readonly')

def get_db_connection():
    """Get read-only connection to production DB."""
    secret = secrets.get_secret_value(SecretId=SECRET_ID)
    creds = json.loads(secret['SecretString'])
    return psycopg2.connect(
        host=creds['host'],
        database=creds['database'],
        user=creds['username'],
        password=creds['password'],
        port=creds.get('port', 5432)
    )

def extract_tenants(cursor):
    """Extract tenant data (sanitized - no PHI)."""
    cursor.execute("""
        SELECT 
            t.id,
            t.name,
            t.slug,
            t.status,
            t.plan,
            t.state,
            t.created_at,
            t.updated_at,
            COUNT(DISTINCT CASE WHEN u.user_type = 0 THEN u.id END) as patient_count,
            COUNT(DISTINCT CASE WHEN u.user_type IN (1, 2) THEN u.id END) as staff_count
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.id AND u.deleted_at IS NULL
        WHERE t.deleted_at IS NULL
        GROUP BY t.id
    """)
    return cursor.fetchall()

def extract_usage_stats(cursor, start_date):
    """Extract usage metrics per tenant."""
    cursor.execute("""
        SELECT 
            t.id as tenant_id,
            DATE(a.created_at) as date,
            COUNT(DISTINCT a.id) as appointments,
            COUNT(DISTINCT d.id) as documents,
            COUNT(DISTINCT m.id) as messages,
            COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.id END) as completed_appointments
        FROM tenants t
        LEFT JOIN appointments a ON a.tenant_id = t.id AND a.created_at >= %s
        LEFT JOIN documents d ON d.tenant_id = t.id AND d.created_at >= %s
        LEFT JOIN messages m ON m.tenant_id = t.id AND m.created_at >= %s
        WHERE t.deleted_at IS NULL
        GROUP BY t.id, DATE(a.created_at)
    """, (start_date, start_date, start_date))
    return cursor.fetchall()

def extract_prom_outcomes(cursor, start_date):
    """Extract anonymized PROM outcomes."""
    cursor.execute("""
        SELECT 
            t.state as region,
            e.prom_type,
            CASE 
                WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 25 THEN '18-24'
                WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 35 THEN '25-34'
                WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 45 THEN '35-44'
                WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 55 THEN '45-54'
                WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 65 THEN '55-64'
                ELSE '65+'
            END as age_bracket,
            u.gender,
            AVG(e.baseline_score) as avg_baseline,
            AVG(e.final_score) as avg_final,
            COUNT(*) as patient_count
        FROM evaluations e
        JOIN users u ON u.id = e.patient_id
        JOIN tenants t ON t.id = e.tenant_id
        WHERE e.created_at >= %s
          AND e.baseline_score IS NOT NULL
          AND e.final_score IS NOT NULL
        GROUP BY t.state, e.prom_type, age_bracket, u.gender
        HAVING COUNT(*) >= 10  -- K-anonymity
    """, (start_date,))
    return cursor.fetchall()

def write_to_s3(data, prefix, filename):
    """Write data as JSON lines to S3."""
    body = '\n'.join(json.dumps(row, default=str) for row in data)
    key = f"{prefix}/{datetime.utcnow().strftime('%Y-%m-%d')}/{filename}"
    s3.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType='application/jsonl')
    return f"s3://{BUCKET}/{key}"

def handler(event, context):
    """Lambda handler - triggered nightly."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    start_date = datetime.utcnow() - timedelta(days=30)
    results = {}
    
    try:
        # Extract tenants (sanitized)
        tenants = extract_tenants(cursor)
        tenant_dicts = [
            {'id': str(t[0]), 'name': t[1], 'slug': t[2], 'status': t[3], 
             'plan': t[4], 'region': t[5], 'created_at': t[6], 'updated_at': t[7],
             'patient_count': t[8], 'staff_count': t[9]}
            for t in tenants
        ]
        results['tenants'] = write_to_s3(tenant_dicts, 'tenants', 'data.jsonl')
        
        # Extract usage stats
        usage = extract_usage_stats(cursor, start_date)
        usage_dicts = [
            {'tenant_id': str(u[0]), 'date': u[1], 'appointments': u[2],
             'documents': u[3], 'messages': u[4], 'completed': u[5]}
            for u in usage if u[1]  # Skip null dates
        ]
        results['usage'] = write_to_s3(usage_dicts, 'usage', 'data.jsonl')
        
        # Extract PROM outcomes (anonymized)
        proms = extract_prom_outcomes(cursor, start_date)
        prom_dicts = [
            {'region': p[0], 'prom_type': p[1], 'age_bracket': p[2], 'gender': p[3],
             'avg_baseline': float(p[4]) if p[4] else None, 
             'avg_final': float(p[5]) if p[5] else None,
             'patient_count': p[6]}
            for p in proms
        ]
        results['proms'] = write_to_s3(prom_dicts, 'prom-outcomes', 'data.jsonl')
        
    finally:
        cursor.close()
        conn.close()
    
    return {'statusCode': 200, 'body': json.dumps(results)}
