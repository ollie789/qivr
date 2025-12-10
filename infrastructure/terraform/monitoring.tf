# Monitoring and Alerting
# Comprehensive CloudWatch alarms and dashboards for QIVR healthcare platform

# Data sources for existing resources
data "aws_lb" "api" {
  name = "qivr-alb"
}

data "aws_ecs_cluster" "main" {
  cluster_name = "qivr_cluster"
}

data "aws_ecs_service" "api" {
  service_name = "qivr-api"
  cluster_arn  = data.aws_ecs_cluster.main.arn
}

data "aws_db_instance" "main" {
  db_instance_identifier = "qivr-dev-db"
}

# SNS Topics for different severity levels
resource "aws_sns_topic" "alerts" {
  name = "qivr-alerts"

  tags = {
    Environment = var.environment
  }
}

resource "aws_sns_topic" "alerts_critical" {
  name = "qivr-alerts-critical"

  tags = {
    Environment = var.environment
    Severity    = "critical"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "email_critical" {
  topic_arn = aws_sns_topic.alerts_critical.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms for API
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "qivr-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert when API returns 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = data.aws_lb.api.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "api_response_time" {
  alarm_name          = "qivr-api-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "Alert when API response time is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = data.aws_lb.api.arn_suffix
  }
}

# CloudWatch Alarms for Database
resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "qivr-db-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when database connections are high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = data.aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "qivr-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when database CPU is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = data.aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "qivr-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert when ECS CPU is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = data.aws_ecs_service.api.service_name
    ClusterName = data.aws_ecs_cluster.main.cluster_name
  }
}

# ============================================================================
# Additional Health & Performance Alarms
# ============================================================================

# Health check failures - CRITICAL
resource "aws_cloudwatch_metric_alarm" "api_unhealthy_hosts" {
  alarm_name          = "qivr-api-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "CRITICAL: API has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.alerts_critical.arn]

  dimensions = {
    LoadBalancer = data.aws_lb.api.arn_suffix
  }
}

# No healthy hosts - CRITICAL
resource "aws_cloudwatch_metric_alarm" "api_no_healthy_hosts" {
  alarm_name          = "qivr-api-no-healthy-hosts"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "CRITICAL: No healthy API hosts available"
  alarm_actions       = [aws_sns_topic.alerts_critical.arn]

  dimensions = {
    LoadBalancer = data.aws_lb.api.arn_suffix
  }
}

# ECS Memory utilization
resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  alarm_name          = "qivr-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Alert when ECS memory is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = data.aws_ecs_service.api.service_name
    ClusterName = data.aws_ecs_cluster.main.cluster_name
  }
}

# Database free storage space
resource "aws_cloudwatch_metric_alarm" "db_storage_low" {
  alarm_name          = "qivr-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5368709120" # 5GB in bytes
  alarm_description   = "Alert when database storage is below 5GB"
  alarm_actions       = [aws_sns_topic.alerts_critical.arn]

  dimensions = {
    DBInstanceIdentifier = data.aws_db_instance.main.id
  }
}

# Database read/write latency
resource "aws_cloudwatch_metric_alarm" "db_read_latency" {
  alarm_name          = "qivr-db-read-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.1" # 100ms
  alarm_description   = "Alert when database read latency is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = data.aws_db_instance.main.id
  }
}

# 4xx errors (client errors - may indicate issues)
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "qivr-api-4xx-errors-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "HTTPCode_Target_4XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "High rate of 4xx errors may indicate client issues"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = data.aws_lb.api.arn_suffix
  }
}

# ============================================================================
# CloudWatch Dashboard
# ============================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "qivr-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# QIVR ${upper(var.environment)} Dashboard"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "API Response Time"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", data.aws_lb.api.arn_suffix, { stat = "Average", label = "Avg" }],
            ["...", { stat = "p99", label = "p99" }]
          ]
          period = 300
          yAxis = {
            left = { min = 0 }
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "API Request Count"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", data.aws_lb.api.arn_suffix]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "API Errors"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", data.aws_lb.api.arn_suffix, { color = "#d62728", label = "5xx" }],
            [".", "HTTPCode_Target_4XX_Count", ".", ".", { color = "#ff7f0e", label = "4xx" }]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 7
        width  = 12
        height = 6
        properties = {
          title  = "ECS CPU & Memory"
          region = var.aws_region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", data.aws_ecs_service.api.service_name, "ClusterName", data.aws_ecs_cluster.main.cluster_name, { label = "CPU %" }],
            [".", "MemoryUtilization", ".", ".", ".", ".", { label = "Memory %" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = { min = 0, max = 100 }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 7
        width  = 12
        height = 6
        properties = {
          title  = "Database Performance"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", data.aws_db_instance.main.id, { label = "CPU %" }],
            [".", "DatabaseConnections", ".", ".", { label = "Connections", yAxis = "right" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left  = { min = 0, max = 100 }
            right = { min = 0 }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 13
        width  = 8
        height = 6
        properties = {
          title  = "Healthy Hosts"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", "LoadBalancer", data.aws_lb.api.arn_suffix, { color = "#2ca02c" }],
            [".", "UnHealthyHostCount", ".", ".", { color = "#d62728" }]
          ]
          period = 60
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 13
        width  = 8
        height = 6
        properties = {
          title  = "Database Storage"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", data.aws_db_instance.main.id]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 13
        width  = 8
        height = 6
        properties = {
          title  = "Database Latency"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "ReadLatency", "DBInstanceIdentifier", data.aws_db_instance.main.id, { label = "Read" }],
            [".", "WriteLatency", ".", ".", { label = "Write" }]
          ]
          period = 300
          stat   = "Average"
        }
      }
    ]
  })
}
