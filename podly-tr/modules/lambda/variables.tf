variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for Lambda functions"
  type        = map(string)
  default     = {}
}

variable "lambda_packages" {
  description = "Lambda deployment packages"
  type = object({
    create_script = object({
      filename         = string
      source_code_hash = string
    })
    create_preview_audio = object({
      filename         = string
      source_code_hash = string
    })
  })
} 