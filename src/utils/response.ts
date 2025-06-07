import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse, ErrorCode } from '../types/api';
import { HTTP_STATUS } from '../constants/api';

// 成功レスポンスの作成
export const createSuccessResponse = <T>(
  data: T,
  statusCode: number = HTTP_STATUS.OK
): APIGatewayProxyResult => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(response),
  };
};

// エラーレスポンスの作成
export const createErrorResponse = (
  code: ErrorCode,
  message: string,
  statusCode: number = HTTP_STATUS.BAD_REQUEST,
  details?: any
): APIGatewayProxyResult => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(response),
  };
};

// バリデーションエラーレスポンス
export const createValidationErrorResponse = (
  errors: string[]
): APIGatewayProxyResult => {
  return createErrorResponse(
    'VALIDATION_ERROR',
    'バリデーションエラーが発生しました',
    HTTP_STATUS.BAD_REQUEST,
    { errors }
  );
};

// 認証エラーレスポンス
export const createUnauthorizedResponse = (
  message: string = '認証が必要です'
): APIGatewayProxyResult => {
  return createErrorResponse(
    'UNAUTHORIZED',
    message,
    HTTP_STATUS.UNAUTHORIZED
  );
};

// 権限エラーレスポンス
export const createForbiddenResponse = (
  message: string = 'アクセス権限がありません'
): APIGatewayProxyResult => {
  return createErrorResponse(
    'FORBIDDEN',
    message,
    HTTP_STATUS.FORBIDDEN
  );
};

// リソースが見つからないエラーレスポンス
export const createNotFoundResponse = (
  message: string = 'リソースが見つかりません'
): APIGatewayProxyResult => {
  return createErrorResponse(
    'NOT_FOUND',
    message,
    HTTP_STATUS.NOT_FOUND
  );
};

// 内部サーバーエラーレスポンス
export const createInternalErrorResponse = (
  message: string = '内部サーバーエラーが発生しました'
): APIGatewayProxyResult => {
  return createErrorResponse(
    'INTERNAL_ERROR',
    message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};

// リクエストIDの生成
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}; 