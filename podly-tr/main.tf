terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# IAM resources
module "iam" {
  source       = "./modules/iam"
  project_name = var.project_name
  environment  = var.environment
}

# Lambda functions
module "lambda" {
  source = "./modules/lambda"

  project_name = var.project_name
  environment  = var.environment

  # IAM
  lambda_execution_role_arn = module.iam.lambda_execution_role_arn

  # Environment variables
  environment_variables = {
    NODE_ENV         = var.environment
    STAGE           = var.environment
    OPENAI_API_KEY  = var.openai_api_key
    TAVILY_API_KEY  = var.tavily_api_key
    FFMPEG_PATH     = "/opt/bin/ffmpeg"
    FFPROBE_PATH    = "/opt/bin/ffprobe"
  }

  # Lambda packages
  lambda_packages = var.lambda_packages
}

# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"

  project_name = var.project_name
  environment  = var.environment

  # Lambda functions
  create_script_function_arn         = module.lambda.create_script_function_arn
  create_script_function_name        = module.lambda.create_script_function_name
  create_preview_audio_function_arn  = module.lambda.create_preview_audio_function_arn
  create_preview_audio_function_name = module.lambda.create_preview_audio_function_name

  # CORS settings
  cors_allow_origins = var.cors_allow_origins
  cors_allow_methods = var.cors_allow_methods
  cors_allow_headers = var.cors_allow_headers
} 