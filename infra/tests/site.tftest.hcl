# Runs with `terraform test` and a mocked AWS provider: no account or credentials needed.
mock_provider "aws" {
  mock_data "aws_cloudfront_cache_policy" {
    defaults = { id = "cache-policy" }
  }
  mock_data "aws_cloudfront_origin_request_policy" {
    defaults = { id = "origin-request-policy" }
  }
  # The provider validates ARNs, so the mocked ones must look real.
  mock_resource "aws_cloudfront_function" {
    defaults = { arn = "arn:aws:cloudfront::123456789012:function/demo-dev-spa-routing" }
  }
  mock_resource "aws_cloudfront_distribution" {
    defaults = { arn = "arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE" }
  }
  mock_resource "aws_s3_bucket" {
    defaults = { arn = "arn:aws:s3:::demo-dev-example" }
  }
  mock_resource "aws_iam_openid_connect_provider" {
    defaults = { arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }
  }
  mock_resource "aws_iam_role" {
    defaults = { arn = "arn:aws:iam::123456789012:role/demo-dev-deploy" }
  }
}

variables {
  project     = "demo"
  environment = "dev"
}

run "minimal_site" {
  command = apply

  assert {
    condition     = length(aws_cloudfront_distribution.site.origin) == 1
    error_message = "Without a BFF, only the S3 origin is expected."
  }
  assert {
    condition     = length(aws_cloudfront_distribution.site.ordered_cache_behavior) == 0
    error_message = "Without a BFF, there is no api_path behavior."
  }
  assert {
    condition     = length(aws_iam_role.deploy) == 0
    error_message = "Without github_repository, no deploy role is created."
  }
  assert {
    condition     = aws_s3_bucket_public_access_block.site.block_public_policy
    error_message = "The bucket must stay private."
  }
  assert {
    condition     = strcontains(aws_cloudfront_response_headers_policy.security.security_headers_config[0].content_security_policy[0].content_security_policy, "frame-ancestors 'none'")
    error_message = "Every response must carry the CSP."
  }
}

run "same_origin_bff_and_deploy_role" {
  command = apply

  variables {
    bff_origin_domain = "bff.dev.example.com"
    github_repository = "my-org/my-app"
  }

  assert {
    condition     = one(aws_cloudfront_distribution.site.ordered_cache_behavior).path_pattern == "/api/*"
    error_message = "The BFF must be served under /api/* on the same origin."
  }
  assert {
    condition     = length(aws_iam_openid_connect_provider.github) == 1
    error_message = "The GitHub OIDC provider is created when none is given."
  }
  assert {
    condition     = strcontains(aws_iam_role.deploy[0].assume_role_policy, "repo:my-org/my-app:environment:production")
    error_message = "Only the repository's production environment may assume the deploy role."
  }
}
