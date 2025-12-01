# Qivr Analytics ETL Infrastructure

# Lambda execution role
resource "aws_iam_role" "etl_lambda_role" {
  name = "qivr-analytics-etl-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Lambda policy
resource "aws_iam_role_policy" "etl_lambda_policy" {
  name = "qivr-analytics-etl-policy"
  role = aws_iam_role.etl_lambda_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::qivr-analytics-lake",
          "arn:aws:s3:::qivr-analytics-lake/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.db_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function
resource "aws_lambda_function" "etl" {
  filename         = "${path.module}/../etl-lambda/deployment.zip"
  function_name    = "qivr-analytics-etl"
  role             = aws_iam_role.etl_lambda_role.arn
  handler          = "handler.handler"
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      S3_BUCKET     = "qivr-analytics-lake"
      DB_SECRET_ARN = var.db_secret_arn
    }
  }

  layers = [
    "arn:aws:lambda:ap-southeast-2:336392948345:layer:AWSSDKPandas-Python311:17"
  ]
}

# EventBridge rule - run at 2 AM UTC daily
resource "aws_cloudwatch_event_rule" "etl_schedule" {
  name                = "qivr-analytics-etl-schedule"
  description         = "Trigger analytics ETL daily"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "etl_target" {
  rule      = aws_cloudwatch_event_rule.etl_schedule.name
  target_id = "qivr-analytics-etl"
  arn       = aws_lambda_function.etl.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.etl.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.etl_schedule.arn
}

# Glue database
resource "aws_glue_catalog_database" "analytics" {
  name = "qivr_analytics"
}

# Glue crawler to auto-discover partitions
resource "aws_glue_crawler" "analytics" {
  name          = "qivr-analytics-crawler"
  role          = aws_iam_role.glue_crawler_role.arn
  database_name = aws_glue_catalog_database.analytics.name

  s3_target {
    path = "s3://qivr-analytics-lake/curated/"
  }

  schedule = "cron(30 2 * * ? *)"  # Run 30 min after ETL

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }
}

resource "aws_iam_role" "glue_crawler_role" {
  name = "qivr-glue-crawler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "glue.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "glue_service" {
  role       = aws_iam_role.glue_crawler_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_role_policy" "glue_s3_access" {
  name = "qivr-glue-s3-access"
  role = aws_iam_role.glue_crawler_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:ListBucket"
      ]
      Resource = [
        "arn:aws:s3:::qivr-analytics-lake",
        "arn:aws:s3:::qivr-analytics-lake/*"
      ]
    }]
  })
}

# Variables
variable "db_secret_arn" {
  description = "ARN of the RDS credentials secret"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda VPC config"
  type        = list(string)
}

variable "lambda_security_group_id" {
  description = "Security group ID for Lambda"
  type        = string
}
