import { REGEX_PATTERNS, USER_CONFIG, PODCAST_CONFIG } from '../constants/app';

// メールアドレスの検証
export const isValidEmail = (email: string): boolean => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

// ユーザー名の検証
export const isValidUsername = (username: string): boolean => {
  if (username.length < USER_CONFIG.USERNAME.MIN_LENGTH || 
      username.length > USER_CONFIG.USERNAME.MAX_LENGTH) {
    return false;
  }
  return USER_CONFIG.USERNAME.PATTERN.test(username);
};

// URLの検証
export const isValidUrl = (url: string): boolean => {
  return REGEX_PATTERNS.URL.test(url);
};

// パスワード強度の検証
export const isStrongPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// ファイルサイズの検証
export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// ファイル形式の検証
export const isValidFileFormat = (filename: string, allowedFormats: readonly string[]): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedFormats.includes(extension) : false;
};

// 音声ファイルの検証
export const isValidAudioFile = (filename: string, size: number): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!isValidFileFormat(filename, PODCAST_CONFIG.AUDIO.SUPPORTED_FORMATS)) {
    errors.push(`サポートされていないファイル形式です。対応形式: ${PODCAST_CONFIG.AUDIO.SUPPORTED_FORMATS.join(', ')}`);
  }
  
  // ファイルサイズの制限は定数から取得する必要があるが、ここでは100MBとする
  if (!isValidFileSize(size, 100 * 1024 * 1024)) {
    errors.push('ファイルサイズが大きすぎます（最大100MB）');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 原稿の検証
export const isValidScript = (script: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (script.length < PODCAST_CONFIG.SCRIPT.MIN_LENGTH) {
    errors.push(`原稿が短すぎます（最小${PODCAST_CONFIG.SCRIPT.MIN_LENGTH}文字）`);
  }
  
  if (script.length > PODCAST_CONFIG.SCRIPT.MAX_LENGTH) {
    errors.push(`原稿が長すぎます（最大${PODCAST_CONFIG.SCRIPT.MAX_LENGTH}文字）`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// タグの検証
export const isValidTags = (tags: string[]): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (tags.length > PODCAST_CONFIG.TAGS.MAX_COUNT) {
    errors.push(`タグが多すぎます（最大${PODCAST_CONFIG.TAGS.MAX_COUNT}個）`);
  }
  
  for (const tag of tags) {
    if (tag.length > PODCAST_CONFIG.TAGS.MAX_LENGTH) {
      errors.push(`タグが長すぎます: "${tag}"（最大${PODCAST_CONFIG.TAGS.MAX_LENGTH}文字）`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 汎用的なバリデーション結果の型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 複数のバリデーション結果をマージ
export const mergeValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(result => result.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}; 