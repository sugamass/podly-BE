# API Gateway HTTP API
resource "aws_apigatewayv2_api" "podly_api" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"
  description   = "Podly API Gateway for Lambda functions"

  cors_configuration {
    allow_origins  = var.cors_allow_origins
    allow_methods  = var.cors_allow_methods
    allow_headers  = var.cors_allow_headers
    expose_headers = ["Content-Length", "Date"]
    max_age        = 300
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api"
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.podly_api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    detailed_metrics_enabled = true
    logging_level            = "INFO"
    throttling_burst_limit   = 100
    throttling_rate_limit    = 50
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-stage"
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "create_script_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.create_script_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.podly_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "create_preview_audio_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.create_preview_audio_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.podly_api.execution_arn}/*/*"
}

# Lambda integrations
resource "aws_apigatewayv2_integration" "create_script_integration" {
  api_id           = aws_apigatewayv2_api.podly_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.create_script_function_arn

  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "create_preview_audio_integration" {
  api_id           = aws_apigatewayv2_api.podly_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.create_preview_audio_function_arn

  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Routes
resource "aws_apigatewayv2_route" "create_script_route" {
  api_id    = aws_apigatewayv2_api.podly_api.id
  route_key = "POST /script/create"
  target    = "integrations/${aws_apigatewayv2_integration.create_script_integration.id}"
}

resource "aws_apigatewayv2_route" "create_preview_audio_route" {
  api_id    = aws_apigatewayv2_api.podly_api.id
  route_key = "POST /audio/preview"
  target    = "integrations/${aws_apigatewayv2_integration.create_preview_audio_integration.id}"
}

# OPTIONS routes for CORS preflight
resource "aws_apigatewayv2_route" "create_script_options" {
  api_id    = aws_apigatewayv2_api.podly_api.id
  route_key = "OPTIONS /script/create"
  target    = "integrations/${aws_apigatewayv2_integration.create_script_integration.id}"
}

resource "aws_apigatewayv2_route" "create_preview_audio_options" {
  api_id    = aws_apigatewayv2_api.podly_api.id
  route_key = "OPTIONS /audio/preview"
  target    = "integrations/${aws_apigatewayv2_integration.create_preview_audio_integration.id}"
} 