output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.podly_api.id
}

output "api_gateway_base_url" {
  description = "Base URL for API Gateway"
  value       = aws_apigatewayv2_api.podly_api.api_endpoint
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_apigatewayv2_stage.default.name
} 