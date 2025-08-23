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

# S3 resources
resource "aws_s3_bucket" "audio_files" {
  bucket = "${var.project_name}-${var.environment}-audio-files"

  tags = {
    Name = "${var.project_name}-${var.environment}-audio-files"
  }
}

resource "aws_s3_bucket" "music_files" {
  bucket = "${var.project_name}-${var.environment}-music"

  tags = {
    Name = "${var.project_name}-${var.environment}-music"
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "audio_files_versioning" {
  bucket = aws_s3_bucket.audio_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "music_files_versioning" {
  bucket = aws_s3_bucket.music_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "audio_files_encryption" {
  bucket = aws_s3_bucket.audio_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "music_files_encryption" {
  bucket = aws_s3_bucket.music_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "audio_files_pab" {
  bucket = aws_s3_bucket.audio_files.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "music_files_pab" {
  bucket = aws_s3_bucket.music_files.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 bucket policy for public read access to audio files
resource "aws_s3_bucket_policy" "audio_files_policy" {
  bucket = aws_s3_bucket.audio_files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.audio_files.arn}/*"
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.audio_files_pab
  ]
}

# S3 bucket policy for public read access to music files
resource "aws_s3_bucket_policy" "music_files_policy" {
  bucket = aws_s3_bucket.music_files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.music_files.arn}/*"
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.music_files_pab
  ]
}

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
    GEMINI_API_KEY  = var.gemini_api_key
    FFMPEG_PATH     = "/opt/bin/ffmpeg"
    FFPROBE_PATH    = "/opt/bin/ffprobe"
    S3_BUCKET_NAME  = aws_s3_bucket.audio_files.bucket
    S3_MUSIC_BUCKET = aws_s3_bucket.music_files.bucket
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