output "patient_user_pool_id" {
  description = "ID of the patient user pool"
  value       = aws_cognito_user_pool.patient_pool.id
}

output "patient_user_pool_arn" {
  description = "ARN of the patient user pool"
  value       = aws_cognito_user_pool.patient_pool.arn
}

output "patient_client_id" {
  description = "ID of the patient app client"
  value       = aws_cognito_user_pool_client.patient_client.id
}

output "patient_identity_pool_id" {
  description = "ID of the patient identity pool"
  value       = aws_cognito_identity_pool.patient_identity_pool.id
}

output "patient_domain" {
  description = "Domain for patient user pool"
  value       = aws_cognito_user_pool_domain.patient_domain.domain
}

output "patient_domain_url" {
  description = "Full URL for patient user pool hosted UI"
  value       = "https://${aws_cognito_user_pool_domain.patient_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "clinic_user_pool_id" {
  description = "ID of the clinic staff user pool"
  value       = aws_cognito_user_pool.clinic_pool.id
}

output "clinic_user_pool_arn" {
  description = "ARN of the clinic staff user pool"
  value       = aws_cognito_user_pool.clinic_pool.arn
}

output "clinic_client_id" {
  description = "ID of the clinic app client"
  value       = aws_cognito_user_pool_client.clinic_client.id
}

output "clinic_identity_pool_id" {
  description = "ID of the clinic identity pool"
  value       = aws_cognito_identity_pool.clinic_identity_pool.id
}

output "clinic_domain" {
  description = "Domain for clinic user pool"
  value       = aws_cognito_user_pool_domain.clinic_domain.domain
}

output "clinic_domain_url" {
  description = "Full URL for clinic user pool hosted UI"
  value       = "https://${aws_cognito_user_pool_domain.clinic_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

# Output environment variables for applications
output "patient_portal_env" {
  description = "Environment variables for patient portal"
  value = {
    VITE_COGNITO_USER_POOL_ID     = aws_cognito_user_pool.patient_pool.id
    VITE_COGNITO_CLIENT_ID         = aws_cognito_user_pool_client.patient_client.id
    VITE_COGNITO_IDENTITY_POOL_ID  = aws_cognito_identity_pool.patient_identity_pool.id
    VITE_COGNITO_DOMAIN            = aws_cognito_user_pool_domain.patient_domain.domain
  }
  sensitive = false
}

output "clinic_dashboard_env" {
  description = "Environment variables for clinic dashboard"
  value = {
    VITE_COGNITO_USER_POOL_ID     = aws_cognito_user_pool.clinic_pool.id
    VITE_COGNITO_CLIENT_ID         = aws_cognito_user_pool_client.clinic_client.id
    VITE_COGNITO_IDENTITY_POOL_ID  = aws_cognito_identity_pool.clinic_identity_pool.id
    VITE_COGNITO_DOMAIN            = aws_cognito_user_pool_domain.clinic_domain.domain
  }
  sensitive = false
}
