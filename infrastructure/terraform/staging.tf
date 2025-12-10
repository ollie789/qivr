# Staging Environment Infrastructure
# Shares: RDS database, ECS cluster, ALB, ECR repo
# Separate: ECS service, target group, CloudFront distributions

locals {
  staging_enabled = var.environment == "production" # Create staging alongside production
}

# =============================================================================
# Staging ECS Service
# =============================================================================

resource "aws_ecs_task_definition" "api_staging" {
  count = local.staging_enabled ? 1 : 0

  family                   = "qivr-api-staging"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = data.aws_iam_role.ecs_execution.arn
  task_role_arn            = data.aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "qivr-api-staging"
      image = "${data.aws_ecr_repository.api.repository_url}:staging"
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "ASPNETCORE_ENVIRONMENT", value = "Staging" },
        { name = "ASPNETCORE_URLS", value = "http://+:8080" }
      ]
      secrets = [
        {
          name      = "ConnectionStrings__DefaultConnection"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:qivr/database-connection-string"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/qivr-api-staging"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Environment = "staging"
  }
}

resource "aws_ecs_service" "api_staging" {
  count = local.staging_enabled ? 1 : 0

  name            = "qivr-api-staging"
  cluster         = data.aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_staging[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.private.ids
    security_groups  = [data.aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_staging[0].arn
    container_name   = "qivr-api-staging"
    container_port   = 8080
  }

  tags = {
    Environment = "staging"
  }
}

# =============================================================================
# Staging ALB Target Group & Listener Rule
# =============================================================================

resource "aws_lb_target_group" "api_staging" {
  count = local.staging_enabled ? 1 : 0

  name        = "qivr-api-staging-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Environment = "staging"
  }
}

# Route staging-api.qivr.pro to staging target group
resource "aws_lb_listener_rule" "api_staging" {
  count = local.staging_enabled ? 1 : 0

  listener_arn = data.aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_staging[0].arn
  }

  condition {
    host_header {
      values = ["staging-api.qivr.pro"]
    }
  }
}

# =============================================================================
# Staging CloudFront Distributions
# =============================================================================

resource "aws_cloudfront_distribution" "clinic_staging" {
  count = local.staging_enabled ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["staging-clinic.qivr.pro"]

  origin {
    domain_name = "qivr-clinic-dashboard-staging.s3.${var.aws_region}.amazonaws.com"
    origin_id   = "S3-staging-clinic"

    s3_origin_config {
      origin_access_identity = ""
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-staging-clinic"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA routing - return index.html for 404s
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.wildcard.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "staging"
  }
}

resource "aws_cloudfront_distribution" "patient_staging" {
  count = local.staging_enabled ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["staging-patient.qivr.pro"]

  origin {
    domain_name = "qivr-patient-portal-staging.s3.${var.aws_region}.amazonaws.com"
    origin_id   = "S3-staging-patient"

    s3_origin_config {
      origin_access_identity = ""
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-staging-patient"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.wildcard.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "staging"
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_caller_identity" "current" {}

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["qivr-vpc"]
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

data "aws_security_group" "ecs" {
  filter {
    name   = "group-name"
    values = ["qivr-ecs-sg"]
  }
}

data "aws_iam_role" "ecs_execution" {
  name = "qivr-ecs-execution-role"
}

data "aws_iam_role" "ecs_task" {
  name = "qivr-ecs-task-role"
}

data "aws_ecr_repository" "api" {
  name = "qivr-api"
}

data "aws_lb_listener" "https" {
  load_balancer_arn = data.aws_lb.api.arn
  port              = 443
}

data "aws_acm_certificate" "wildcard" {
  domain      = "*.qivr.pro"
  statuses    = ["ISSUED"]
  most_recent = true
}

# =============================================================================
# Outputs
# =============================================================================

output "staging_api_url" {
  value       = local.staging_enabled ? "https://staging-api.qivr.pro" : null
  description = "Staging API URL"
}

output "staging_clinic_url" {
  value       = local.staging_enabled ? "https://staging-clinic.qivr.pro" : null
  description = "Staging clinic dashboard URL"
}

output "staging_patient_url" {
  value       = local.staging_enabled ? "https://staging-patient.qivr.pro" : null
  description = "Staging patient portal URL"
}

output "staging_clinic_cloudfront_domain" {
  value       = local.staging_enabled ? aws_cloudfront_distribution.clinic_staging[0].domain_name : null
  description = "CloudFront domain for staging clinic (point DNS here)"
}

output "staging_patient_cloudfront_domain" {
  value       = local.staging_enabled ? aws_cloudfront_distribution.patient_staging[0].domain_name : null
  description = "CloudFront domain for staging patient (point DNS here)"
}
