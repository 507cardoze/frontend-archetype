output "bucket_name" {
  description = "S3 bucket for the build (repository variable S3_BUCKET)."
  value       = aws_s3_bucket.site.bucket
}

output "distribution_id" {
  description = "CloudFront distribution (repository variable CLOUDFRONT_DISTRIBUTION_ID)."
  value       = aws_cloudfront_distribution.site.id
}

output "url" {
  description = "Public URL of the app."
  value       = "https://${coalesce(one(var.domain_names), aws_cloudfront_distribution.site.domain_name)}"
}

output "deploy_role_arn" {
  description = "Role for GitHub Actions (repository variable AWS_DEPLOY_ROLE_ARN). Null when not created."
  value       = one(aws_iam_role.deploy[*].arn)
}
