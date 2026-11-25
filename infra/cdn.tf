locals {
  spa_origin = "spa"
  bff_origin = "bff"
}

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.project}-${var.environment}-spa"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# SPA routing: a path without a file extension is an app route, so it gets index.html.
# Done per request (not with custom error pages) so BFF errors under api_path pass through intact.
resource "aws_cloudfront_function" "spa_routing" {
  name    = "${var.project}-${var.environment}-spa-routing"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = file("${path.module}/spa-routing.js")
}

resource "aws_cloudfront_response_headers_policy" "security" {
  name = "${var.project}-${var.environment}-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    content_security_policy {
      content_security_policy = var.content_security_policy
      override                = true
    }
  }
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "${var.project} ${var.environment} SPA"
  default_root_object = "index.html"
  http_version        = "http2and3"
  price_class         = var.price_class
  aliases             = var.domain_names
  web_acl_id          = var.web_acl_arn

  origin {
    origin_id                = local.spa_origin
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  dynamic "origin" {
    for_each = var.bff_origin_domain == null ? [] : [var.bff_origin_domain]
    content {
      origin_id   = local.bff_origin
      domain_name = origin.value
      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  default_cache_behavior {
    target_origin_id           = local.spa_origin
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing.arn
    }
  }

  # Same origin for the BFF: cookies and requests go through CloudFront, never cached.
  dynamic "ordered_cache_behavior" {
    for_each = var.bff_origin_domain == null ? [] : [var.api_path]
    content {
      path_pattern             = "${ordered_cache_behavior.value}/*"
      target_origin_id         = local.bff_origin
      viewer_protocol_policy   = "https-only"
      allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods           = ["GET", "HEAD"]
      compress                 = true
      cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
      origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == null
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn == null ? null : "sni-only"
    minimum_protocol_version       = var.acm_certificate_arn == null ? "TLSv1" : "TLSv1.2_2021"
  }
}
