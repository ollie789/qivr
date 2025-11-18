# SQS Queue for OCR processing
resource "aws_sqs_queue" "document_ocr" {
  name                      = "qivr-document-ocr"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  receive_wait_time_seconds = 0
  visibility_timeout_seconds = 300

  tags = {
    Environment = "production"
    Service     = "qivr"
  }
}

# Lambda IAM Role
resource "aws_iam_role" "document_ocr_lambda" {
  name = "qivr-document-ocr-lambda"

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

# Lambda Policy
resource "aws_iam_role_policy" "document_ocr_lambda" {
  name = "qivr-document-ocr-lambda-policy"
  role = aws_iam_role.document_ocr_lambda.id

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
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.document_ocr.arn
      },
      {
        Effect = "Allow"
        Action = [
          "textract:DetectDocumentText"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "arn:aws:s3:::qivr-documents-*/*"
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "document_ocr" {
  filename      = "document-ocr.zip"
  function_name = "qivr-document-ocr"
  role          = aws_iam_role.document_ocr_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300
  memory_size   = 512

  environment {
    variables = {
      DB_HOST     = var.db_host
      DB_PORT     = var.db_port
      DB_NAME     = var.db_name
      DB_USER     = var.db_user
      DB_PASSWORD = var.db_password
    }
  }
}

# SQS trigger for Lambda
resource "aws_lambda_event_source_mapping" "document_ocr" {
  event_source_arn = aws_sqs_queue.document_ocr.arn
  function_name    = aws_lambda_function.document_ocr.arn
  batch_size       = 1
}

# Output queue URL
output "document_ocr_queue_url" {
  value = aws_sqs_queue.document_ocr.url
}
