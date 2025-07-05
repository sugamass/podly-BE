export interface ApiResponse<T = any> {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export interface PodcastRequest {
  title: string;
  description: string;
  category: string;
  duration?: number;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  category: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
