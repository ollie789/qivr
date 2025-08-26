# Patient User Pool
resource "aws_cognito_user_pool" "patient_pool" {
  name = "${var.project_name}-patient-pool-${var.environment}"

  # Account recovery settings
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # Sign-in options
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Email configuration
  email_configuration {
    email_sending_account = "DEVELOPER"
    from_email_address    = var.ses_email_from
    source_arn           = aws_ses_email_identity.qivr_email.arn
  }

  # MFA Configuration - Optional for patients
  mfa_configuration = "OPTIONAL"
  
  software_token_mfa_configuration {
    enabled = true
  }

  # User attribute schema
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "given_name"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "family_name"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "phone_number"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Custom attributes
  schema {
    name                     = "tenant_id"
    attribute_data_type      = "String"
    mutable                  = false
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "date_of_birth"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 10
      max_length = 10
    }
  }

  schema {
    name                     = "medicare_number"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  schema {
    name                     = "private_health_fund"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  schema {
    name                     = "emergency_contact"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 500
    }
  }

  # Verification message templates
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Welcome to Qivr Health - Verify Your Email"
    email_message        = "Welcome to Qivr Health! Your verification code is {####}"
  }

  # Device tracking
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = true
  }

  # Lambda triggers
  lambda_config {
    pre_sign_up          = aws_lambda_function.pre_signup_patient.arn
    post_confirmation    = aws_lambda_function.post_confirmation_patient.arn
    custom_message       = aws_lambda_function.custom_message.arn
    pre_authentication   = aws_lambda_function.pre_authentication.arn
    post_authentication  = aws_lambda_function.post_authentication.arn
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-patient-pool-${var.environment}"
    UserType = "Patient"
  })
}

# Patient User Pool Client
resource "aws_cognito_user_pool_client" "patient_client" {
  name         = "${var.project_name}-patient-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.patient_pool.id

  # OAuth Configuration
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["openid", "email", "profile", "phone", "aws.cognito.signin.user.admin"]
  allowed_oauth_flows_user_pool_client = true
  
  callback_urls = [
    "${var.patient_portal_url}/auth/callback",
    "${var.patient_portal_url}/",
    "http://localhost:3002/auth/callback"
  ]
  
  logout_urls = [
    "${var.patient_portal_url}/",
    "http://localhost:3002/"
  ]

  supported_identity_providers = ["COGNITO", "Google", "Facebook"]

  # Token configuration
  refresh_token_validity = 30
  access_token_validity  = 1
  id_token_validity      = 1
  
  token_validity_units {
    refresh_token = "days"
    access_token  = "hours"
    id_token      = "hours"
  }

  # Security settings
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  # Attributes
  read_attributes = [
    "email",
    "email_verified",
    "given_name",
    "family_name",
    "phone_number",
    "phone_number_verified",
    "custom:tenant_id",
    "custom:date_of_birth",
    "custom:medicare_number",
    "custom:private_health_fund",
    "custom:emergency_contact"
  ]

  write_attributes = [
    "email",
    "given_name",
    "family_name",
    "phone_number",
    "custom:date_of_birth",
    "custom:medicare_number",
    "custom:private_health_fund",
    "custom:emergency_contact"
  ]

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# Patient User Pool Domain
resource "aws_cognito_user_pool_domain" "patient_domain" {
  domain       = "${var.project_name}-patient-${var.environment}"
  user_pool_id = aws_cognito_user_pool.patient_pool.id
}

# Identity Pool for Patients
resource "aws_cognito_identity_pool" "patient_identity_pool" {
  identity_pool_name               = "${var.project_name}_patient_identity_pool_${var.environment}"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.patient_client.id
    provider_name           = aws_cognito_user_pool.patient_pool.endpoint
    server_side_token_check = true
  }

  # Add social identity providers when configured
  dynamic "supported_login_providers" {
    for_each = var.google_client_id != "" || var.facebook_app_id != "" ? [1] : []
    content {
      "accounts.google.com"  = var.google_client_id != "" ? var.google_client_id : null
      "graph.facebook.com"   = var.facebook_app_id != "" ? var.facebook_app_id : null
    }
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-patient-identity-pool-${var.environment}"
    UserType = "Patient"
  })
}
