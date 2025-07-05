import { ApiResponse } from "../types/api";

export const createResponse = <T>(
  statusCode: number,
  data: T,
  headers?: Record<string, string>
): ApiResponse<T> => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(data),
  };
};

export const successResponse = <T>(data: T): ApiResponse<T> => {
  return createResponse(200, data);
};

export const errorResponse = (
  message: string,
  statusCode = 500
): ApiResponse => {
  return createResponse(statusCode, {
    error: "Error",
    message,
  });
};

export const notFoundResponse = (message = "Not Found"): ApiResponse => {
  return createResponse(404, {
    error: "Not Found",
    message,
  });
};

export const badRequestResponse = (message: string): ApiResponse => {
  return createResponse(400, {
    error: "Bad Request",
    message,
  });
};
