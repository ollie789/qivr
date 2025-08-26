# Google Identity Provider for Patient Pool
resource "aws_cognito_identity_provider" "google_patient" {
  count = var.google_client_id != "" ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.patient_pool.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "profile email openid"
  }

  attribute_mapping = {
    email          = "email"
    given_name     = "given_name"
    family_name    = "family_name"
    username       = "sub"
    email_verified = "email_verified"
  }

  lifecycle {
    ignore_changes = [provider_details["client_secret"]]
  }
}

# Facebook Identity Provider for Patient Pool  
resource "aws_cognito_identity_provider" "facebook_patient" {
  count = var.facebook_app_id != "" ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.patient_pool.id
  provider_name = "Facebook"
  provider_type = "Facebook"

  provider_details = {
    client_id        = var.facebook_app_id
    client_secret    = var.facebook_app_secret
    authorize_scopes = "public_profile,email"
    api_version      = "v17.0"
  }

  attribute_mapping = {
    email       = "email"
    given_name  = "first_name"
    family_name = "last_name"
    username    = "id"
  }

  lifecycle {
    ignore_changes = [provider_details["client_secret"]]
  }
}
