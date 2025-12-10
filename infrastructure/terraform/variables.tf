variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "qivr"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "patient_portal_url" {
  description = "Patient portal URL for callbacks"
  type        = string
  default     = "http://localhost:3002"
}

variable "clinic_dashboard_url" {
  description = "Clinic dashboard URL for callbacks"
  type        = string
  default     = "http://localhost:3001"
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "facebook_app_id" {
  description = "Facebook app ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "facebook_app_secret" {
  description = "Facebook app secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ses_email_from" {
  description = "SES verified email address for sending emails"
  type        = string
  default     = "noreply@qivr.health"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Qivr"
    ManagedBy   = "Terraform"
    Environment = "dev"
    Region      = "ap-southeast-2"
  }
}

# =============================================================================
# Monitoring & Alerting
# =============================================================================

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "api_cpu" {
  description = "CPU units for API task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory (MB) for API task"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "api_min_capacity" {
  description = "Minimum number of API tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "api_max_capacity" {
  description = "Maximum number of API tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "api_image_tag" {
  description = "Docker image tag for API"
  type        = string
  default     = "latest"
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MB) for frontend task"
  type        = number
  default     = 512
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 2
}

variable "frontend_image_tag" {
  description = "Docker image tag for frontend"
  type        = string
  default     = "latest"
}
