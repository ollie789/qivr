# RDS PostgreSQL Database for Qivr Production

resource "aws_db_subnet_group" "qivr_db_subnet" {
  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-subnet"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
    description     = "Allow PostgreSQL from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-sg"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "random_password" "db_master_password" {
  length  = 32
  special = true
}

resource "aws_db_parameter_group" "qivr_db_params" {
  name   = "${var.project_name}-${var.environment}-db-params"
  family = "postgres15"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking more than 1 second
  }

  parameter {
    name  = "auto_explain.log_min_duration"
    value = "1000"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "16384" # 16MB
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "524288" # 512MB
  }

  parameter {
    name  = "effective_cache_size"
    value = "3145728" # 3GB
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1" # Optimized for SSD
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-params"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_db_instance" "qivr_db" {
  identifier = "${var.project_name}-${var.environment}-db"

  # Engine configuration
  engine               = "postgres"
  engine_version       = "15.7"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  storage_encrypted    = true
  storage_type         = "gp3"
  iops                 = var.db_iops
  
  # Database configuration
  db_name  = "qivr_production"
  username = "qivr_admin"
  password = random_password.db_master_password.result
  port     = 5432

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.qivr_db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # High availability
  multi_az               = var.enable_multi_az
  availability_zone      = var.enable_multi_az ? null : var.availability_zone

  # Backup configuration
  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-db-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.rds_monitoring.arn

  # Parameter group
  parameter_group_name = aws_db_parameter_group.qivr_db_params.name

  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  apply_immediately         = false

  # Deletion protection
  deletion_protection = var.enable_deletion_protection

  tags = {
    Name        = "${var.project_name}-${var.environment}-database"
    Environment = var.environment
    Project     = var.project_name
    Backup      = "Required"
    HIPAA       = "true"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Read replica for production (optional)
resource "aws_db_instance" "qivr_db_replica" {
  count = var.enable_read_replica ? 1 : 0

  identifier = "${var.project_name}-${var.environment}-db-replica"
  
  replicate_source_db = aws_db_instance.qivr_db.identifier
  
  instance_class = var.db_replica_instance_class
  
  # Different AZ for better availability
  availability_zone = var.replica_availability_zone
  
  # Monitoring
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-database-replica"
    Environment = var.environment
    Project     = var.project_name
    Type        = "ReadReplica"
  }
}

# IAM role for enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-monitoring"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store database credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.project_name}/${var.environment}/database/master"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-credentials"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  
  secret_string = jsonencode({
    username = aws_db_instance.qivr_db.username
    password = random_password.db_master_password.result
    engine   = "postgres"
    host     = aws_db_instance.qivr_db.address
    port     = aws_db_instance.qivr_db.port
    dbname   = aws_db_instance.qivr_db.db_name
  })
}

# CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-db-cpu-high"
  alarm_description   = "This metric monitors database CPU utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.qivr_db.id
  }

  alarm_actions = [var.sns_topic_arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-cpu-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-db-storage-low"
  alarm_description   = "This metric monitors database free storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "FreeStorageSpace"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "10737418240" # 10 GB in bytes
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.qivr_db.id
  }

  alarm_actions = [var.sns_topic_arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-storage-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-${var.environment}-db-connections-high"
  alarm_description   = "This metric monitors database connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "DatabaseConnections"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "180" # 90% of max_connections
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.qivr_db.id
  }

  alarm_actions = [var.sns_topic_arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-connections-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Outputs
output "db_endpoint" {
  value       = aws_db_instance.qivr_db.endpoint
  description = "The database endpoint"
  sensitive   = true
}

output "db_name" {
  value       = aws_db_instance.qivr_db.db_name
  description = "The database name"
}

output "db_secret_arn" {
  value       = aws_secretsmanager_secret.db_credentials.arn
  description = "The ARN of the database credentials secret"
}

output "db_replica_endpoint" {
  value       = var.enable_read_replica ? aws_db_instance.qivr_db_replica[0].endpoint : null
  description = "The read replica endpoint"
  sensitive   = true
}
