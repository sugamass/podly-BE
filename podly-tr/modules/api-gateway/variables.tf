variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "create_script_function_arn" {
  description = "ARN of the createScript Lambda function"
  type        = string
}

variable "create_script_function_name" {
  description = "Name of the createScript Lambda function"
  type        = string
}

variable "create_preview_audio_function_arn" {
  description = "ARN of the createPreviewAudio Lambda function"
  type        = string
}

variable "create_preview_audio_function_name" {
  description = "Name of the createPreviewAudio Lambda function"
  type        = string
}

variable "cors_allow_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "POST", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"]
} 