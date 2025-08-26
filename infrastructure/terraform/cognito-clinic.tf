# Clinic Staff User Pool
resource "aws_cognito_user_pool" "clinic_pool" {
  name = "${var.project_name}-clinic-pool-${var.environment}"

  # Account recovery settings
  account_recovery_setting {
    recovery_mechanism {
      name     = "admin_only"
      priority = 1
    }
  }

  # Password policy - Stricter for clinic staff
  password_policy {
    minimum_length                   = 10
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 3
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

  # MFA Configuration - Required for clinic staff
  mfa_configuration = "ON"
  
  software_token_mfa_configuration {
    enabled = true
  }

  # User attribute schema
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    mutable                  = false
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
    required                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Custom attributes for clinic staff
  schema {
    name                     = "tenant_id"
    attribute_data_type      = "String"
    mutable                  = false
    required                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "clinic_id"
    attribute_data_type      = "String"
    mutable                  = false
    required                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "role"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    name                     = "employee_id"
    attribute_data_type      = "String"
    mutable                  = false
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    name                     = "license_number"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    name                     = "specialization"
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
    name                     = "department"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false
    
    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  # Verification message templates
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Qivr Clinic Dashboard - Verify Your Account"
    email_message        = "Welcome to Qivr Clinic Dashboard. Your verification code is {####}"
  }

  # Invitation message templates for admin-created users
  admin_create_user_config {
    allow_admin_create_user_only = false
    
    invite_message_template {
      email_subject = "Welcome to Qivr Clinic Dashboard"
      email_message = "Welcome to Qivr Clinic Dashboard. Your username is {username} and temporary password is {####}"
      sms_message   = "Your Qivr username is {username} and temporary password is {####}"
    }
  }

  # Device tracking
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = false
  }

  # Lambda triggers
  lambda_config {
    pre_sign_up          = aws_lambda_function.pre_signup_clinic.arn
    post_confirmation    = aws_lambda_function.post_confirmation_clinic.arn
    custom_message       = aws_lambda_function.custom_message.arn
    pre_authentication   = aws_lambda_function.pre_authentication_clinic.arn
    post_authentication  = aws_lambda_function.post_authentication_clinic.arn
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-clinic-pool-${var.environment}"
    UserType = "ClinicStaff"
  })
}

# Clinic Staff User Pool Client
resource "aws_cognito_user_pool_client" "clinic_client" {
  name         = "${var.project_name}-clinic-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.clinic_pool.id

  # OAuth Configuration
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile", "phone", "aws.cognito.signin.user.admin"]
  allowed_oauth_flows_user_pool_client = true
  
  callback_urls = [
    "${var.clinic_dashboard_url}/auth/callback",
    "${var.clinic_dashboard_url}/",
    "http://localhost:3001/auth/callback"
  ]
  
  logout_urls = [
    "${var.clinic_dashboard_url}/",
    "http://localhost:3001/"
  ]

  supported_identity_providers = ["COGNITO"]

  # Token configuration - Shorter for security
  refresh_token_validity = 8
  access_token_validity  = 30
  id_token_validity      = 30
  
  token_validity_units {
    refresh_token = "hours"
    access_token  = "minutes"
    id_token      = "minutes"
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
    "custom:clinic_id",
    "custom:role",
    "custom:employee_id",
    "custom:license_number",
    "custom:specialization",
    "custom:department"
  ]

  write_attributes = [
    "given_name",
    "family_name",
    "phone_number",
    "custom:license_number",
    "custom:specialization",
    "custom:department"
  ]

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_SRP_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# Clinic User Pool Domain
resource "aws_cognito_user_pool_domain" "clinic_domain" {
  domain       = "${var.project_name}-clinic-${var.environment}"
  user_pool_id = aws_cognito_user_pool.clinic_pool.id
}

# Identity Pool for Clinic Staff
resource "aws_cognito_identity_pool" "clinic_identity_pool" {
  identity_pool_name               = "${var.project_name}_clinic_identity_pool_${var.environment}"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.clinic_client.id
    provider_name           = aws_cognito_user_pool.clinic_pool.endpoint
    server_side_token_check = true
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-clinic-identity-pool-${var.environment}"
    UserType = "ClinicStaff"
  })
}

# User Groups for Role-Based Access Control
resource "aws_cognito_user_group" "admin_group" {
  name         = "Administrators"
  user_pool_id = aws_cognito_user_pool.clinic_pool.id
  description  = "Clinic administrators with full access"
  precedence   = 1
  role_arn     = aws_iam_role.clinic_admin_role.arn
}

resource "aws_cognito_user_group" "practitioner_group" {
  name         = "Practitioners"
  user_pool_id = aws_cognito_user_pool.clinic_pool.id
  description  = "Healthcare practitioners"
  precedence   = 2
  role_arn     = aws_iam_role.practitioner_role.arn
}

resource "aws_cognito_user_group" "receptionist_group" {
  name         = "Receptionists"
  user_pool_id = aws_cognito_user_pool.clinic_pool.id
  description  = "Clinic reception staff"
  precedence   = 3
  role_arn     = aws_iam_role.receptionist_role.arn
}

resource "aws_cognito_user_group" "manager_group" {
  name         = "Managers"
  user_pool_id = aws_cognito_user_pool.clinic_pool.id
  description  = "Clinic managers"
  precedence   = 2
  role_arn     = aws_iam_role.manager_role.arn
}
