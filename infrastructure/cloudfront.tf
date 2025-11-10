resource "aws_cloudfront_distribution" "clinic_dashboard" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Clinic Dashboard HTTPS"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  aliases             = ["clinic.qivr.pro"]

  origin {
    domain_name = "qivr-clinic-dashboard-staging.s3.ap-southeast-2.amazonaws.com"
    origin_id   = "S3-clinic"

    s3_origin_config {
      origin_access_identity = "origin-access-identity/cloudfront/E1F7BZSJ14NNOL"
    }
  }

  origin {
    domain_name = "qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com"
    origin_id   = "ALB-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-clinic"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-backend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = false

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:818084701597:certificate/16f4ceb1-77ad-48d1-89c6-7f5af7880d7d"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
