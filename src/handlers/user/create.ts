import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
  createErrorResponse,
} from "../../utils/response";
import { UserService } from "../../services/UserService";
import { HTTP_STATUS } from "../../constants/api";
import { convertUserToApi } from "../../types/user";

/**
 * ユーザー作成
 * POST /users
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Creating user with event:", JSON.stringify(event, null, 2));

    const userService = new UserService();
    const body = JSON.parse(event.body || "{}");

    console.log("Request body:", body);

    const newUser = await userService.createUser(body);

    console.log("User created successfully:", newUser.id);

    // レスポンスをスネークケース形式に変換
    const apiResponse = convertUserToApi(newUser);

    return createSuccessResponse(apiResponse, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Error creating user:", error);

    // エラーオブジェクトの型ガード
    const err = error as any;

    if (err.name === "ValidationError") {
      return createValidationErrorResponse(err.errors || [err.message]);
    }

    if (err.name === "ConflictError") {
      return createErrorResponse(
        "USER_CONFLICT" as any,
        err.message,
        HTTP_STATUS.CONFLICT
      );
    }

    return createInternalErrorResponse();
  }
};
