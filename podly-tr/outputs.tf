output "api_gateway_base_url" {
  description = "Base URL for API Gateway"
  value       = module.api_gateway.api_gateway_base_url
}

output "api_gateway_endpoints" {
  description = "API Gateway endpoints"
  value = {
    create_script      = "${module.api_gateway.api_gateway_base_url}/script/create"
    create_preview_audio = "${module.api_gateway.api_gateway_base_url}/audio/preview"
  }
}

output "lambda_function_names" {
  description = "Lambda function names"
  value = {
    create_script        = module.lambda.create_script_function_name
    create_preview_audio = module.lambda.create_preview_audio_function_name
  }
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    create_script        = module.lambda.create_script_function_arn
    create_preview_audio = module.lambda.create_preview_audio_function_arn
  }
}

output "iam_roles" {
  description = "IAM role ARNs"
  value = {
    lambda_execution_role = module.iam.lambda_execution_role_arn
  }
} 