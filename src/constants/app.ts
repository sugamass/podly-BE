// アプリケーション設定
export const APP_CONFIG = {
  NAME: 'Pods',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered podcast generation and distribution platform',
} as const;

// ポッドキャスト設定
export const PODCAST_CONFIG = {
  // 音声ファイル設定
  AUDIO: {
    MAX_DURATION: 3600, // 1時間（秒）
    MIN_DURATION: 10,   // 10秒
    SUPPORTED_FORMATS: ['mp3', 'wav', 'aac'] as const,
    DEFAULT_FORMAT: 'mp3',
    BITRATE: 128, // kbps
    SAMPLE_RATE: 44100, // Hz
  },
  
  // 原稿設定
  SCRIPT: {
    MAX_LENGTH: 10000, // 文字数
    MIN_LENGTH: 50,
  },
  
  // タグ設定
  TAGS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 20,
  },
} as const;

// ユーザー設定
export const USER_CONFIG = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  
  BIO: {
    MAX_LENGTH: 500,
  },
  
  AVATAR: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'] as const,
  },
} as const;

// 生成設定
export const GENERATION_CONFIG = {
  SCRIPT: {
    TONES: ['casual', 'formal', 'friendly', 'professional'] as const,
    LENGTHS: ['short', 'medium', 'long'] as const,
    DEFAULT_TONE: 'casual',
    DEFAULT_LENGTH: 'medium',
  },
  
  AUDIO: {
    SPEED: {
      MIN: 0.5,
      MAX: 2.0,
      DEFAULT: 1.0,
    },
    PITCH: {
      MIN: -20,
      MAX: 20,
      DEFAULT: 0,
    },
  },
  
  JOB: {
    TIMEOUT: 300000, // 5分
    RETRY_COUNT: 3,
  },
} as const;

// ファイルサイズ制限
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024,     // 5MB
  THUMBNAIL: 2 * 1024 * 1024,  // 2MB
  AUDIO: 100 * 1024 * 1024,    // 100MB
} as const;

// 正規表現パターン
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]+$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const;

// デフォルト値
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 20,
  },
  SORT: {
    FIELD: 'createdAt',
    ORDER: 'desc' as const,
  },
} as const; 