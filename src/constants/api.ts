// API エンドポイント
export const API_ENDPOINTS = {
  // 認証
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // ユーザー
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    FOLLOW: '/users/follow',
    UNFOLLOW: '/users/unfollow',
    FOLLOWERS: '/users/followers',
    FOLLOWING: '/users/following',
  },
  
  // ポッドキャスト
  PODCASTS: {
    LIST: '/podcasts',
    GET: '/podcasts/:id',
    CREATE: '/podcasts',
    UPDATE: '/podcasts/:id',
    DELETE: '/podcasts/:id',
    LIKE: '/podcasts/:id/like',
    UNLIKE: '/podcasts/:id/unlike',
    SAVE: '/podcasts/:id/save',
    UNSAVE: '/podcasts/:id/unsave',
    COMMENTS: '/podcasts/:id/comments',
    ADD_COMMENT: '/podcasts/:id/comments',
  },
  
  // 生成
  GENERATION: {
    GENERATE_SCRIPT: '/generation/script',
    GENERATE_AUDIO: '/generation/audio',
    GENERATE_PODCAST: '/generation/podcast',
    JOB_STATUS: '/generation/jobs/:id',
    VOICES: '/generation/voices',
  },
} as const;

// HTTP ステータスコード
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API バージョン
export const API_VERSION = 'v1';

// デフォルトのページネーション設定
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// リクエストタイムアウト（ミリ秒）
export const REQUEST_TIMEOUT = {
  DEFAULT: 10000, // 10秒
  UPLOAD: 60000,  // 60秒
  GENERATION: 300000, // 5分
} as const; 