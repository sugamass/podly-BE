output "create_script_function_arn" {
  description = "ARN of the createScript Lambda function"
  value       = aws_lambda_function.create_script.arn
}

output "create_script_function_name" {
  description = "Name of the createScript Lambda function"
  value       = aws_lambda_function.create_script.function_name
}

output "create_preview_audio_function_arn" {
  description = "ARN of the createPreviewAudio Lambda function"
  value       = aws_lambda_function.create_preview_audio.arn
}

output "create_preview_audio_function_name" {
  description = "Name of the createPreviewAudio Lambda function"
  value       = aws_lambda_function.create_preview_audio.function_name
}

# output "ffmpeg_layer_arn" {
#   description = "ARN of the FFmpeg Lambda layer"
#   value       = aws_lambda_layer_version.ffmpeg_layer.arn
# } 