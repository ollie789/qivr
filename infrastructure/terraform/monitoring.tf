# Monitoring and Alerting
# Removed redundant staging S3 buckets - using CloudFront built-in staging

# Data sources for existing resources
data "aws_lb" "api" {
  name = "qivr-alb"
}

data "aws_ecs_cluster" "main" {
  cluster_name = "qivr-cluster"
}

data "aws_ecs_service" "api" {
  service_name = "qivr-api-service"
  cluster_arn  = data.aws_ecs_cluster.main.arn
}

data "aws_db_instance" "main" {
  db_instance_identifier = "qivr-dev-db"
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "qivr-alerts"

  tags = {
    Environment = "production"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
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
