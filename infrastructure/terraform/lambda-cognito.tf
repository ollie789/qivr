# Lambda execution role
resource "aws_iam_role" "lambda_cognito_role" {
  name = "${var.project_name}-lambda-cognito-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda policy
resource "aws_iam_role_policy_attachment" "lambda_cognito_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_cognito_role.name
}

# Additional permissions for Lambda
resource "aws_iam_role_policy" "lambda_cognito_policy" {
  name = "${var.project_name}-lambda-cognito-policy-${var.environment}"
  role = aws_iam_role.lambda_cognito_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.tenants.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Pre-Signup Lambda for Patients
resource "aws_lambda_function" "pre_signup_patient" {
  filename         = "${path.module}/lambda/pre-signup-patient.zip"
  function_name    = "${var.project_name}-pre-signup-patient-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/pre-signup-patient.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
      TENANTS_TABLE = aws_dynamodb_table.tenants.name
    }
  }

  tags = var.tags
}

# Post-Confirmation Lambda for Patients
resource "aws_lambda_function" "post_confirmation_patient" {
  filename         = "${path.module}/lambda/post-confirmation-patient.zip"
  function_name    = "${var.project_name}-post-confirmation-patient-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/post-confirmation-patient.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
      API_ENDPOINT = "https://api.${var.project_name}.health/v1"
    }
  }

  tags = var.tags
}

# Pre-Signup Lambda for Clinic Staff
resource "aws_lambda_function" "pre_signup_clinic" {
  filename         = "${path.module}/lambda/pre-signup-clinic.zip"
  function_name    = "${var.project_name}-pre-signup-clinic-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/pre-signup-clinic.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
      TENANTS_TABLE = aws_dynamodb_table.tenants.name
      CLINICS_TABLE = aws_dynamodb_table.clinics.name
    }
  }

  tags = var.tags
}

# Post-Confirmation Lambda for Clinic Staff
resource "aws_lambda_function" "post_confirmation_clinic" {
  filename         = "${path.module}/lambda/post-confirmation-clinic.zip"
  function_name    = "${var.project_name}-post-confirmation-clinic-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/post-confirmation-clinic.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
      API_ENDPOINT = "https://api.${var.project_name}.health/v1"
    }
  }

  tags = var.tags
}

# Custom Message Lambda
resource "aws_lambda_function" "custom_message" {
  filename         = "${path.module}/lambda/custom-message.zip"
  function_name    = "${var.project_name}-custom-message-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/custom-message.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
      APP_NAME = "Qivr Health"
    }
  }

  tags = var.tags
}

# Pre-Authentication Lambda
resource "aws_lambda_function" "pre_authentication" {
  filename         = "${path.module}/lambda/pre-authentication.zip"
  function_name    = "${var.project_name}-pre-authentication-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/pre-authentication.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = var.tags
}

# Post-Authentication Lambda
resource "aws_lambda_function" "post_authentication" {
  filename         = "${path.module}/lambda/post-authentication.zip"
  function_name    = "${var.project_name}-post-authentication-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/post-authentication.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = var.tags
}

# Pre-Authentication Lambda for Clinic
resource "aws_lambda_function" "pre_authentication_clinic" {
  filename         = "${path.module}/lambda/pre-authentication-clinic.zip"
  function_name    = "${var.project_name}-pre-authentication-clinic-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/pre-authentication-clinic.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
      CLINICS_TABLE = aws_dynamodb_table.clinics.name
    }
  }

  tags = var.tags
}

# Post-Authentication Lambda for Clinic
resource "aws_lambda_function" "post_authentication_clinic" {
  filename         = "${path.module}/lambda/post-authentication-clinic.zip"
  function_name    = "${var.project_name}-post-authentication-clinic-${var.environment}"
  role            = aws_iam_role.lambda_cognito_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/post-authentication-clinic.zip")
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = var.tags
}

# Lambda permissions for Cognito triggers
resource "aws_lambda_permission" "cognito_trigger_permissions" {
  for_each = {
    pre_signup_patient          = aws_lambda_function.pre_signup_patient.arn
    post_confirmation_patient   = aws_lambda_function.post_confirmation_patient.arn
    pre_signup_clinic           = aws_lambda_function.pre_signup_clinic.arn
    post_confirmation_clinic    = aws_lambda_function.post_confirmation_clinic.arn
    custom_message              = aws_lambda_function.custom_message.arn
    pre_authentication          = aws_lambda_function.pre_authentication.arn
    post_authentication         = aws_lambda_function.post_authentication.arn
    pre_authentication_clinic   = aws_lambda_function.pre_authentication_clinic.arn
    post_authentication_clinic  = aws_lambda_function.post_authentication_clinic.arn
  }

  statement_id  = "AllowExecutionFromCognito-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*"
}
