variable "project" {
  description = "Short project name, used in resource names (kebab-case)."
  type        = string
}

variable "environment" {
  description = "Environment name, e.g. dev, qa, prod."
  type        = string
}

variable "region" {
  description = "AWS region for the S3 bucket. CloudFront is global."
  type        = string
  default     = "us-east-1"
}

variable "bff_origin_domain" {
  description = "BFF host (no scheme). When set, CloudFront routes api_path to it, so the SPA and the BFF share one origin and no CORS is needed."
  type        = string
  default     = null
}

variable "api_path" {
  description = "Path the SPA uses for the BFF. Must match VITE_API_BASE_URL."
  type        = string
  default     = "/api"
}

variable "domain_names" {
  description = "Custom domains (CNAMEs) for the distribution. Empty uses the *.cloudfront.net domain."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate in us-east-1 for domain_names. Required when domain_names is set."
  type        = string
  default     = null
}

variable "web_acl_arn" {
  description = "Optional WAF web ACL (e.g. corporate IP allow list for an internal app)."
  type        = string
  default     = null
}

variable "content_security_policy" {
  description = "CSP sent with every response. Add the hosts the app really uses (fonts, RUM, a BFF on another subdomain)."
  type        = string
  default     = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
}

variable "noncurrent_version_days" {
  description = "Days to keep replaced or deleted objects (versioning), so a bad release can be rolled back."
  type        = number
  default     = 30
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "github_repository" {
  description = "owner/repo allowed to deploy through GitHub Actions OIDC. Null skips the deploy role."
  type        = string
  default     = null
}

variable "github_environment" {
  description = "GitHub environment the deploy job runs in (approvals and variables live there)."
  type        = string
  default     = "production"
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider in the account. Null creates it (one per account)."
  type        = string
  default     = null
}
