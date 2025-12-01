"""
Qivr Analytics ETL Lambda
Exports data from RDS to S3 in Parquet format for Athena queries.
Runs nightly via EventBridge schedule.
"""
import json
import os
import boto3
import psycopg2
import pyarrow as pa
import pyarrow.parquet as pq
from datetime import datetime, timedelta
from io import BytesIO

S3_BUCKET = os.environ.get('S3_BUCKET', 'qivr-analytics-lake')
DB_SECRET_ARN = os.environ.get('DB_SECRET_ARN')

s3 = boto3.client('s3')
secrets = boto3.client('secretsmanager')


def get_db_connection():
    """Get database connection from Secrets Manager."""
    secret = secrets.get_secret_value(SecretId=DB_SECRET_ARN)
    creds = json.loads(secret['SecretString'])
    return psycopg2.connect(
        host=creds['host'],
        port=creds.get('port', 5432),
        database=creds['dbname'],
        user=creds['username'],
        password=creds['password'],
        options='-c statement_timeout=300000'  # 5 min timeout
    )


def write_parquet_to_s3(df_dict, schema, s3_key):
    """Write data to S3 as Parquet."""
    table = pa.Table.from_pydict(df_dict, schema=schema)
    buffer = BytesIO()
    pq.write_table(table, buffer, compression='snappy')
    buffer.seek(0)
    s3.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=buffer.getvalue())
    print(f"Wrote {len(df_dict[list(df_dict.keys())[0]])} rows to s3://{S3_BUCKET}/{s3_key}")


def export_tenants(conn, date_str):
    """Export tenant metrics."""
    query = """
        SELECT 
            t.id::text as id,
            t.name,
            t.slug,
            t.status::text as status,
            t.plan,
            t.timezone as region,
            t.created_at,
            COUNT(DISTINCT CASE WHEN u.user_type = 'Patient' THEN u.id END) as patient_count,
            COUNT(DISTINCT CASE WHEN u.user_type != 'Patient' THEN u.id END) as staff_count,
            COALESCE(SUM(CASE 
                WHEN t.plan = 'starter' THEN 99
                WHEN t.plan = 'professional' THEN 299
                WHEN t.plan = 'enterprise' THEN 599
                ELSE 0
            END), 0) as mrr
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.id AND u.deleted_at IS NULL
        WHERE t.deleted_at IS NULL
        GROUP BY t.id, t.name, t.slug, t.status, t.plan, t.timezone, t.created_at
    """
    
    with conn.cursor() as cur:
        cur.execute(query)
        rows = cur.fetchall()
    
    if not rows:
        print("No tenants to export")
        return
    
    data = {
        'id': [r[0] for r in rows],
        'name': [r[1] for r in rows],
        'slug': [r[2] for r in rows],
        'status': [r[3] for r in rows],
        'plan': [r[4] for r in rows],
        'region': [r[5] or 'Australia/Sydney' for r in rows],
        'created_at': [r[6] for r in rows],
        'patient_count': [r[7] or 0 for r in rows],
        'staff_count': [r[8] or 0 for r in rows],
        'mrr': [r[9] or 0 for r in rows],
    }
    
    schema = pa.schema([
        ('id', pa.string()),
        ('name', pa.string()),
        ('slug', pa.string()),
        ('status', pa.string()),
        ('plan', pa.string()),
        ('region', pa.string()),
        ('created_at', pa.timestamp('us')),
        ('patient_count', pa.int64()),
        ('staff_count', pa.int64()),
        ('mrr', pa.int64()),
    ])
    
    write_parquet_to_s3(data, schema, f'curated/tenants/dt={date_str}/data.parquet')


def export_usage(conn, date_str):
    """Export daily usage metrics per tenant."""
    yesterday = (datetime.utcnow() - timedelta(days=1)).date()
    
    query = """
        SELECT 
            t.id::text as tenant_id,
            %s::date as date,
            COUNT(DISTINCT a.id) as appointments,
            COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.id END) as completed_appointments,
            COUNT(DISTINCT m.id) as messages,
            0 as documents
        FROM tenants t
        LEFT JOIN appointments a ON a.tenant_id = t.id 
            AND a.scheduled_start::date = %s
        LEFT JOIN messages m ON m.tenant_id = t.id 
            AND m.created_at::date = %s
        WHERE t.deleted_at IS NULL
        GROUP BY t.id
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (yesterday, yesterday, yesterday))
        rows = cur.fetchall()
    
    if not rows:
        print("No usage data to export")
        return
    
    data = {
        'tenant_id': [r[0] for r in rows],
        'date': [r[1] for r in rows],
        'appointments': [r[2] or 0 for r in rows],
        'completed_appointments': [r[3] or 0 for r in rows],
        'messages': [r[4] or 0 for r in rows],
        'documents': [r[5] or 0 for r in rows],
    }
    
    schema = pa.schema([
        ('tenant_id', pa.string()),
        ('date', pa.date32()),
        ('appointments', pa.int64()),
        ('completed_appointments', pa.int64()),
        ('messages', pa.int64()),
        ('documents', pa.int64()),
    ])
    
    write_parquet_to_s3(data, schema, f'curated/usage/dt={date_str}/data.parquet')


def export_prom_outcomes(conn, date_str):
    """Export anonymized PROM outcomes with k-anonymity (min 5 patients per group)."""
    query = """
        WITH prom_data AS (
            SELECT 
                t.timezone as region,
                pt.name as prom_type,
                CASE 
                    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 30 THEN '18-29'
                    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 45 THEN '30-44'
                    WHEN EXTRACT(YEAR FROM AGE(u.date_of_birth)) < 60 THEN '45-59'
                    ELSE '60+'
                END as age_bracket,
                COALESCE(u.gender, 'Unknown') as gender,
                pi.baseline_score,
                pi.current_score as final_score
            FROM prom_instances pi
            JOIN prom_templates pt ON pt.id = pi.template_id
            JOIN users u ON u.id = pi.patient_id
            JOIN tenants t ON t.id = u.tenant_id
            WHERE pi.status = 'Completed'
              AND pi.baseline_score IS NOT NULL
              AND pi.current_score IS NOT NULL
              AND t.deleted_at IS NULL
        )
        SELECT 
            region,
            prom_type,
            age_bracket,
            gender,
            AVG(baseline_score) as avg_baseline,
            AVG(final_score) as avg_final,
            COUNT(*) as patient_count
        FROM prom_data
        GROUP BY region, prom_type, age_bracket, gender
        HAVING COUNT(*) >= 5  -- K-anonymity threshold
    """
    
    with conn.cursor() as cur:
        cur.execute(query)
        rows = cur.fetchall()
    
    if not rows:
        print("No PROM outcomes to export (or none meet k-anonymity threshold)")
        return
    
    data = {
        'region': [r[0] or 'Unknown' for r in rows],
        'prom_type': [r[1] for r in rows],
        'age_bracket': [r[2] for r in rows],
        'gender': [r[3] for r in rows],
        'avg_baseline': [float(r[4]) if r[4] else 0.0 for r in rows],
        'avg_final': [float(r[5]) if r[5] else 0.0 for r in rows],
        'patient_count': [r[6] for r in rows],
    }
    
    schema = pa.schema([
        ('region', pa.string()),
        ('prom_type', pa.string()),
        ('age_bracket', pa.string()),
        ('gender', pa.string()),
        ('avg_baseline', pa.float64()),
        ('avg_final', pa.float64()),
        ('patient_count', pa.int64()),
    ])
    
    write_parquet_to_s3(data, schema, f'curated/prom_outcomes/dt={date_str}/data.parquet')


def handler(event, context):
    """Lambda handler - runs nightly ETL."""
    print(f"Starting ETL at {datetime.utcnow().isoformat()}")
    
    date_str = datetime.utcnow().strftime('%Y-%m-%d')
    
    try:
        conn = get_db_connection()
        
        print("Exporting tenants...")
        export_tenants(conn, date_str)
        
        print("Exporting usage...")
        export_usage(conn, date_str)
        
        print("Exporting PROM outcomes...")
        export_prom_outcomes(conn, date_str)
        
        conn.close()
        
        print(f"ETL completed successfully at {datetime.utcnow().isoformat()}")
        return {'statusCode': 200, 'body': 'ETL completed'}
        
    except Exception as e:
        print(f"ETL failed: {str(e)}")
        raise
