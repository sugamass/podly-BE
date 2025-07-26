import { APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { badRequestResponse } from "../../utils/response";

export class ValidationError extends Error {
  public readonly details: Array<{ path: string; message: string; received?: unknown }>;
  public readonly validationType: 'request' | 'response';

  constructor(
    message: string,
    details: Array<{ path: string; message: string; received?: unknown }>,
    validationType: 'request' | 'response' = 'request'
  ) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.validationType = validationType;
  }

  static fromZodError(error: z.ZodError, validationType: 'request' | 'response' = 'request'): ValidationError {
    const details = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      received: (err as any).received,
    }));

    const message = `${validationType} validation failed: ${details.map(d => `${d.path}: ${d.message}`).join(', ')}`;
    
    return new ValidationError(message, details, validationType);
  }

  toApiResponse(): APIGatewayProxyResult {
    const errorMessage = `バリデーションエラー: ${this.details.map(d => `${d.path}: ${d.message}`).join(', ')}`;
    
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: errorMessage,
        details: this.details,
        validationType: this.validationType,
      }),
    };
  }

  toLogFormat(): string {
    return `ValidationError [${this.validationType}]: ${this.message}\nDetails: ${JSON.stringify(this.details, null, 2)}`;
  }
}