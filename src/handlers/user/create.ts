import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
  createErrorResponse,
} from "../../utils/response";
import { UserService } from "../../services/UserService";
import { HTTP_STATUS } from "../../constants/api";
import type {
  CreateUserRequest,
  CreateUserOperation,
  UserApiTypes,
} from "../../types";

// 自動生成された型から必要な型を抽出
type CreateUserRequestBody =
  UserApiTypes.components["schemas"]["CreateUserRequest"];
type CreateUserResponseData =
  UserApiTypes.components["schemas"]["CreateUserResponse"];

/**
 * ユーザー作成
 * POST /users
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Creating user with event:", JSON.stringify(event, null, 2));

    // リクエストボディのパースと型チェック
    if (!event.body) {
      return createValidationErrorResponse(["リクエストボディが必要です"]);
    }

    let requestBody: CreateUserRequestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return createValidationErrorResponse([
        "有効なJSONフォーマットで送信してください",
      ]);
    }

    console.log("Request body:", requestBody);

    // 必須フィールドのバリデーション
    const validationErrors: string[] = [];

    if (!requestBody.email) {
      validationErrors.push("メールアドレスは必須です");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestBody.email)) {
      validationErrors.push("有効なメールアドレスを入力してください");
    }

    if (!requestBody.username) {
      validationErrors.push("ユーザー名は必須です");
    } else if (!/^[a-zA-Z0-9_]+$/.test(requestBody.username)) {
      validationErrors.push(
        "ユーザー名は英数字とアンダースコアのみ使用できます"
      );
    }

    if (!requestBody.displayName) {
      validationErrors.push("表示名は必須です");
    }

    if (validationErrors.length > 0) {
      return createValidationErrorResponse(validationErrors);
    }

    const userService = new UserService();
    const newUser = await userService.createUser(requestBody);

    console.log("User created successfully:", newUser.id);

    // 自動生成された型に準拠したレスポンスを作成
    const response: CreateUserResponseData = {
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
        bio: newUser.bio || null,
        avatarUrl: newUser.avatarUrl || null,
        isVerified: newUser.isVerified || false,
        followersCount: newUser.followersCount || 0,
        followingCount: newUser.followingCount || 0,
        podcastsCount: newUser.podcastsCount || 0,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    };

    return createSuccessResponse(response, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Error creating user:", error);

    // エラーオブジェクトの型ガード
    const err = error as any;

    if (err.name === "ValidationError") {
      return createValidationErrorResponse(
        Array.isArray(err.errors)
          ? err.errors.map((e: any) => e.message || e.toString())
          : [err.message]
      );
    }

    if (err.name === "ConflictError") {
      return createErrorResponse(
        "ALREADY_EXISTS",
        err.message ||
          "このメールアドレスまたはユーザー名は既に使用されています",
        HTTP_STATUS.CONFLICT
      );
    }

    return createInternalErrorResponse();
  }
};
