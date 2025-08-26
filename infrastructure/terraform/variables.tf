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
