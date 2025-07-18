# FFmpeg Lambda Layer using S3 upload
resource "aws_lambda_layer_version" "ffmpeg_layer" {
  s3_bucket        = "podly-dev-lambda-layers-1752016973"
  s3_key           = "ffmpeg-layer.zip"
  layer_name       = "${var.project_name}-${var.environment}-ffmpeg-layer"

  compatible_runtimes = ["nodejs18.x"]

  description = "FFmpeg and FFprobe binaries for audio processing - version 7.0.2"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "create_script_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-createScript"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-createScript-logs"
  }
}

resource "aws_cloudwatch_log_group" "create_preview_audio_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-createPreviewAudio"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-createPreviewAudio-logs"
  }
}

# Lambda Function: createScript
resource "aws_lambda_function" "create_script" {
  function_name    = "${var.project_name}-${var.environment}-createScript"
  filename         = var.lambda_packages.create_script.filename
  source_code_hash = var.lambda_packages.create_script.source_code_hash
  role            = var.lambda_execution_role_arn
  handler         = "index.createScript"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = var.environment_variables
  }

  depends_on = [
    aws_cloudwatch_log_group.create_script_logs
  ]

  tags = {
    Name = "${var.project_name}-${var.environment}-createScript"
  }
}

# Lambda Function: createPreviewAudio
resource "aws_lambda_function" "create_preview_audio" {
  function_name    = "${var.project_name}-${var.environment}-createPreviewAudio"
  filename         = var.lambda_packages.create_preview_audio.filename
  source_code_hash = var.lambda_packages.create_preview_audio.source_code_hash
  role            = var.lambda_execution_role_arn
  handler         = "index.createPreviewAudio"
  runtime         = "nodejs18.x"
  timeout         = 900  # 15 minutes for audio processing
  memory_size     = 2048  # Increased from 1024MB to 2048MB for audio processing

  layers = [aws_lambda_layer_version.ffmpeg_layer.arn]

  environment {
    variables = var.environment_variables
  }

  depends_on = [
    aws_cloudwatch_log_group.create_preview_audio_logs
  ]

  tags = {
    Name = "${var.project_name}-${var.environment}-createPreviewAudio"
  }
} 