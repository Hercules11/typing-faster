/**
 * localStorage 统一存取层：
 * - 固定键名集中在 STORAGE_KEYS，避免散落在组件里硬编码
 * - JSON 读取带损坏兜底：解析失败回退 fallback 而不是抛错
 */

export const STORAGE_KEYS = {
  /** 主题（'light' | 'dark'） */
  theme: 'typing-faster-theme',
  /** 自定义词库索引（CustomCate[]） */
  customCates: 'typing-faster-custom-cates'
} as const;

export function readString(key: string): string | null {
  return localStorage.getItem(key);
}

export function writeString(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}
