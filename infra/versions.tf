terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Local state by default. For a shared environment, configure a remote backend, e.g.:
  # backend "s3" {
  #   bucket       = "<state-bucket>"
  #   key          = "frontend/<environment>.tfstate"
  #   region       = "<region>"
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      project     = var.project
      environment = var.environment
      managed-by  = "terraform"
    }
  }
}
