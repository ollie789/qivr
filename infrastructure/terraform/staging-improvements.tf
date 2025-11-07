# Staging Environment Improvements
# CloudFront distributions for S3 frontends + HTTPS for ALB + Monitoring

# Data sources for existing resources
data "aws_s3_bucket" "clinic_dashboard" {
  bucket = "qivr-clinic-dashboard-staging"
}

data "aws_s3_bucket" "patient_portal" {
  bucket = "qivr-patient-portal-staging"
}

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

# CloudFront Origin Access Identity for S3 buckets
resource "aws_cloudfront_origin_access_identity" "clinic" {
  comment = "OAI for clinic dashboard"
}

resource "aws_cloudfront_origin_access_identity" "patient" {
  comment = "OAI for patient portal"
}

# S3 bucket policies to allow CloudFront access
resource "aws_s3_bucket_policy" "clinic_dashboard" {
  bucket = data.aws_s3_bucket.clinic_dashboard.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.clinic.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${data.aws_s3_bucket.clinic_dashboard.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "patient_portal" {
  bucket = data.aws_s3_bucket.patient_portal.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.patient.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${data.aws_s3_bucket.patient_portal.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution for Clinic Dashboard
resource "aws_cloudfront_distribution" "clinic" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Clinic Dashboard Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = data.aws_s3_bucket.clinic_dashboard.bucket_regional_domain_name
    origin_id   = "S3-clinic-dashboard"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.clinic.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-clinic-dashboard"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # SPA routing - return index.html for 404s
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "qivr-clinic-dashboard-cdn"
    Environment = "staging"
  }
}

# CloudFront Distribution for Patient Portal
resource "aws_cloudfront_distribution" "patient" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Patient Portal Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = data.aws_s3_bucket.patient_portal.bucket_regional_domain_name
    origin_id   = "S3-patient-portal"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.patient.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-patient-portal"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "qivr-patient-portal-cdn"
    Environment = "staging"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "staging_alerts" {
  name = "qivr-staging-alerts"

  tags = {
    Environment = "staging"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.staging_alerts.arn
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
  alarm_actions       = [aws_sns_topic.staging_alerts.arn]

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
  alarm_actions       = [aws_sns_topic.staging_alerts.arn]

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
  alarm_actions       = [aws_sns_topic.staging_alerts.arn]

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
  alarm_actions       = [aws_sns_topic.staging_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = data.aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "db_storage" {
  alarm_name          = "qivr-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5368709120" # 5GB in bytes
  alarm_description   = "Alert when database storage is low"
  alarm_actions       = [aws_sns_topic.staging_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = data.aws_db_instance.main.id
  }
}

# CloudWatch Alarms for ECS
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
  alarm_actions       = [aws_sns_topic.staging_alerts.arn]

  dimensions = {
    ServiceName = data.aws_ecs_service.api.service_name
    ClusterName = data.aws_ecs_cluster.main.cluster_name
  }
}

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
  alarm_actions       = [aws_sns_topic.staging_alerts.arn]

  dimensions = {
    ServiceName = data.aws_ecs_service.api.service_name
    ClusterName = data.aws_ecs_cluster.main.cluster_name
  }
}

# Outputs
output "clinic_dashboard_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.clinic.domain_name}"
  description = "CloudFront URL for clinic dashboard"
}

output "patient_portal_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.patient.domain_name}"
  description = "CloudFront URL for patient portal"
}

output "clinic_dashboard_cloudfront_id" {
  value       = aws_cloudfront_distribution.clinic.id
  description = "CloudFront distribution ID for clinic dashboard"
}

output "patient_portal_cloudfront_id" {
  value       = aws_cloudfront_distribution.patient.id
  description = "CloudFront distribution ID for patient portal"
}
