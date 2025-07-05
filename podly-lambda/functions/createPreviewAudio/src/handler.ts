import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  AudioPreviewUseCase,
  convertAudioPreviewApiRequestToDomainInput,
  convertAudioPreviewDomainOutputToApiResponse,
} from "@podly/shared";

// APIスキーマに基づく型定義
interface ScriptData {
  speaker: string;
  text: string;
  caption: string;
}

interface AudioPreviewRequest {
  script: ScriptData[];
  tts: string;
  voices: string[];
  speakers: string[];
  scriptId?: string;
}

interface AudioPreviewResponse {
  audioUrl?: string;
  separatedAudioUrls?: string[];
  scriptId?: string;
}

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
      return badRequestResponse("Request body is required");
    }

    let apiRequest: AudioPreviewRequest;
    try {
      apiRequest = JSON.parse(event.body);
      console.log(
        "📝 Parsed API Request:",
        JSON.stringify(apiRequest, null, 2)
      );
    } catch (error) {
      console.log("❌ JSON parse error:", error);
      return badRequestResponse("Invalid JSON format");
    }

    // 必須フィールドのバリデーション
    if (!apiRequest.script || !Array.isArray(apiRequest.script)) {
      console.log("❌ Missing or invalid script field");
      return badRequestResponse(
        "Field 'script' is required and must be an array"
      );
    }

    if (!apiRequest.tts || typeof apiRequest.tts !== "string") {
      console.log("❌ Missing or invalid tts field");
      return badRequestResponse("Field 'tts' is required and must be a string");
    }

    if (!apiRequest.voices || !Array.isArray(apiRequest.voices)) {
      console.log("❌ Missing or invalid voices field");
      return badRequestResponse(
        "Field 'voices' is required and must be an array"
      );
    }

    if (!apiRequest.speakers || !Array.isArray(apiRequest.speakers)) {
      console.log("❌ Missing or invalid speakers field");
      return badRequestResponse(
        "Field 'speakers' is required and must be an array"
      );
    }

    console.log("✅ Request validation passed");

    // ドメイン入力への変換
    const domainInput = convertAudioPreviewApiRequestToDomainInput(apiRequest);
    console.log("🔄 Domain Input:", JSON.stringify(domainInput, null, 2));

    // ビジネスロジック実行
    console.log("⚡ Executing AudioPreviewUseCase...");
    const domainOutput = await audioPreviewUseCase.execute(domainInput);
    console.log("✅ UseCase execution completed");
    console.log("📤 Domain Output:", JSON.stringify(domainOutput, null, 2));

    // API レスポンスへの変換
    const apiResponse: AudioPreviewResponse =
      convertAudioPreviewDomainOutputToApiResponse(domainOutput);
    console.log("🎯 Final API Response:", JSON.stringify(apiResponse, null, 2));

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
