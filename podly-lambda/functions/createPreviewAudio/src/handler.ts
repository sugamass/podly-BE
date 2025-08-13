import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  successResponse,
  errorResponse,
  AudioPreviewUseCase,
  convertAudioPreviewApiRequestToDomainInput,
  convertAudioPreviewDomainOutputToApiResponse,
  SchemaValidator,
  ValidationError,
  type AudioPreviewRequest,
  type AudioPreviewResponse,
} from "@podly/shared";

// 型定義は@podly/sharedからインポート

// UseCaseの初期化
const audioPreviewUseCase = new AudioPreviewUseCase();

export const createPreviewAudio = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("🚀 createPreviewAudio Lambda function started");
    console.log("📋 Request Event:", JSON.stringify(event, null, 2));

    // リクエストボディの検証
    if (!event.body) {
      console.log("❌ Request body is missing");
      return new ValidationError("Request body is required", [
        { path: "body", message: "Request body is required" },
      ]).toApiResponse();
    }

    let rawRequest: unknown;
    try {
      rawRequest = JSON.parse(event.body);
      console.log("📝 Parsed request:", JSON.stringify(rawRequest, null, 2));
    } catch (error) {
      console.log("❌ JSON parse error:", error);
      return new ValidationError("Invalid JSON format", [
        { path: "body", message: "Invalid JSON format" },
      ]).toApiResponse();
    }

    // OpenAPIスキーマに基づくバリデーション
    let apiRequest: AudioPreviewRequest;
    try {
      apiRequest = SchemaValidator.validateAudioPreviewRequest(rawRequest);
      console.log("✅ Request validation passed");
      console.log(
        "📝 Validated API Request:",
        JSON.stringify(apiRequest, null, 2)
      );
    } catch (error) {
      console.log("❌ Request validation failed:", error);
      if (error instanceof ValidationError) {
        console.log(error.toLogFormat());
        return error.toApiResponse();
      }
      return new ValidationError(
        error instanceof Error ? error.message : "Validation failed",
        [
          {
            path: "unknown",
            message:
              error instanceof Error ? error.message : "Validation failed",
          },
        ]
      ).toApiResponse();
    }

    // ドメイン入力への変換
    const domainInput = convertAudioPreviewApiRequestToDomainInput(apiRequest);
    console.log("🔄 Domain Input:", JSON.stringify(domainInput, null, 2));

    // ビジネスロジック実行
    const domainOutput = await audioPreviewUseCase.execute(domainInput);
    console.log("📤 Domain Output:", JSON.stringify(domainOutput, null, 2));

    // API レスポンスへの変換
    const rawApiResponse: AudioPreviewResponse =
      convertAudioPreviewDomainOutputToApiResponse(domainOutput);
    console.log(
      "🔄 Raw API Response:",
      JSON.stringify(rawApiResponse, null, 2)
    );

    // レスポンスのバリデーション
    let apiResponse: AudioPreviewResponse;
    try {
      apiResponse =
        SchemaValidator.validateAudioPreviewResponse(rawApiResponse);
      console.log("✅ Response validation passed");
      console.log(
        "🎯 Final API Response:",
        JSON.stringify(apiResponse, null, 2)
      );
    } catch (error) {
      console.error("❌ Response validation failed:", error);
      if (error instanceof ValidationError) {
        console.error(error.toLogFormat());
        return errorResponse("Internal response validation error", 500);
      }
      return errorResponse(
        error instanceof Error ? error.message : "Response validation failed",
        500
      );
    }

    return successResponse(apiResponse);
  } catch (error) {
    console.error("💥 Unexpected error in createPreviewAudio:", error);

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
};
