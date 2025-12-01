"""
ETL Lambda: Extract tenant and usage data from Production RDS to Data Lake.
Runs nightly via EventBridge.
"""
import json
import os
import boto3
import pg8000.native
from datetime import datetime, timedelta

s3 = boto3.client('s3')
secrets = boto3.client('secretsmanager')

BUCKET = os.environ.get('DATA_LAKE_BUCKET', 'qivr-analytics-lake')
SECRET_ID = os.environ.get('DB_SECRET_ID', 'qivr/production')

def get_db_connection():
    """Get read-only connection to production DB."""
    secret = secrets.get_secret_value(SecretId=SECRET_ID)
    creds = json.loads(secret['SecretString'])
    return pg8000.native.Connection(
        host=creds['host'],
        database=creds.get('database', creds.get('dbname', 'qivr')),
        user=creds['username'],
        password=creds['password'],
        port=int(creds.get('port', 5432))
    )

def extract_tenants(conn):
    """Extract tenant data with usage counts (sanitized - no PHI)."""
    return conn.run("""
        SELECT
            t.id::text,
            t.name,
            t.slug,
            CASE WHEN t.is_active THEN 'Active' ELSE 'Suspended' END as status,
            COALESCE(t.settings->>'plan', 'starter') as plan,
            t.state as region,
            COUNT(DISTINCT CASE WHEN u.role = 'Patient' THEN u.id END)::int as patient_count,
            COUNT(DISTINCT CASE WHEN u.role != 'Patient' THEN u.id END)::int as staff_count,
            t.created_at::text
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.id
        WHERE t.is_active = true
        GROUP BY t.id, t.name, t.slug, t.is_active, t.settings, t.state, t.created_at
    """)

def extract_usage_stats(conn, start_date):
    """Extract usage metrics per tenant."""
    return conn.run("""
        SELECT 
            t.id::text as tenant_id,
            DATE(a.created_at)::text as date,
            COUNT(DISTINCT a.id)::int as appointments,
            COUNT(DISTINCT d.id)::int as documents,
            COUNT(DISTINCT m.id)::int as messages,
            COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.id END)::int as completed
        FROM tenants t
        LEFT JOIN appointments a ON a.tenant_id = t.id AND a.created_at >= :start
        LEFT JOIN documents d ON d.tenant_id = t.id AND d.created_at >= :start
        LEFT JOIN messages m ON m.tenant_id = t.id AND m.created_at >= :start
        WHERE t.deleted_at IS NULL
        GROUP BY t.id, DATE(a.created_at)
    """, start=start_date)

def extract_prom_outcomes(conn, start_date):
    """Extract anonymized PROM outcomes."""
    return conn.run("""
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
            AVG(e.baseline_score)::float as avg_baseline,
            AVG(e.final_score)::float as avg_final,
            COUNT(*)::int as patient_count
        FROM evaluations e
        JOIN users u ON u.id = e.patient_id
        JOIN tenants t ON t.id = e.tenant_id
        WHERE e.created_at >= :start
          AND e.baseline_score IS NOT NULL
          AND e.final_score IS NOT NULL
        GROUP BY t.state, e.prom_type, age_bracket, u.gender
        HAVING COUNT(*) >= 10
    """, start=start_date)

def write_to_s3(data, prefix, filename):
    """Write data as JSON lines to S3."""
    body = '\n'.join(json.dumps(row, default=str) for row in data)
    key = f"{prefix}/{datetime.utcnow().strftime('%Y-%m-%d')}/{filename}"
    s3.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType='application/jsonl')
    return f"s3://{BUCKET}/{key}"

def handler(event, context):
    """Lambda handler - triggered nightly."""
    conn = get_db_connection()
    results = {}
    
    try:
        # Extract tenants (sanitized)
        tenants = extract_tenants(conn)
        tenant_dicts = [
            {
                'id': t[0],
                'name': t[1],
                'slug': t[2],
                'status': t[3],
                'plan': t[4],
                'region': t[5],
                'patient_count': t[6],
                'staff_count': t[7],
                'created_at': t[8]
            }
            for t in tenants
        ]
        results['tenants'] = write_to_s3(tenant_dicts, 'tenants', 'data.jsonl')
        results['tenant_count'] = len(tenant_dicts)
        
    finally:
        conn.close()
    
    return {'statusCode': 200, 'body': json.dumps(results)}
