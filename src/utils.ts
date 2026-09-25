import { type CustomCate, type isMatch, type WordsData } from './types';
import { readJSON, removeItem, STORAGE_KEYS, writeJSON } from './utils/storage';

// 类型集中定义在 types.ts，这里保留导出以维持既有 `from '@/utils'` 的引用方式
export type { CustomCate, WordsData } from './types';

/**
 *
 * @param elem Node Element
 * 滚动光标到元素内容末尾
 */
export function setEndOfContenteditable(elem: Node) {
  const sel = window.getSelection()!;
  sel.selectAllChildren(elem);
  sel.collapseToEnd();
}

/**
 * 读取 :root 上的 CSS 变量值（已去首尾空白）。
 * base.css 是颜色的唯一事实源，JS 侧（antd token、图表配色）需要颜色时从这里读取；
 * 变量不存在或测试环境没有样式表时返回空串，调用方应保留回退值
 */
export function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * @param source 用户输入的字符串
 * @param target 要匹配的字符串
 * @return {isMatch} isMatch 是否匹配
 */
export function matchSourceAndTarget(source: string, target: string): isMatch {
  if (source.length > target.length) {
    return {
      match: false,
      full: false,
      pos: -1
    };
  }
  for (let i = 0; i < target.length; i++) {
    if (source[i] === undefined) {
      return {
        match: true,
        full: false,
        pos: i
      };
    }
    if (source[i] !== target[i]) {
      return {
        match: false,
        full: false,
        pos: -1
      };
    }
  }
  return {
    match: true,
    full: true,
    pos: target.length
  };
}

/**
 * 把词库数据归一化为 { default: [[word, trans], ...] } 形状
 */
function normalizeWordsShape(data: unknown): WordsData {
  return Array.isArray(data) ? { default: data as [string, string][] } : (data as WordsData);
}

/** 自定义词库索引在 localStorage 中的 key（统一收口在 STORAGE_KEYS） */
export const CUSTOM_CATES_KEY = STORAGE_KEYS.customCates;

/** 下拉框里「新增自定义词库」入口的占位 value，不会对应真实词库 */
export const CUSTOM_ADD_VALUE = '__custom-add__';

/**
 * 载入单词数据，有本地缓存优先使用
 * 自定义词库的缓存是纯数组（[[word, trans], ...]），内置词库缓存保留了模块的 default 包装，
 * 这里统一归一化成 { default: [...] }，调用方无需区分来源
 * @throws 传入不存在的词库分类时抛出错误（而不是返回 undefined 让调用方崩溃）
 */
export async function loadWordsData(cate: string): Promise<WordsData> {
  // 缓存损坏时回退 null 走重新加载，而不是让 JSON.parse 的异常冒泡
  const cachedData = readJSON<unknown>(cate, null);
  if (cachedData !== null) {
    return normalizeWordsShape(cachedData);
  }
  // 动态加载 JSON 数据
  const modules = import.meta.glob('./data/*.json');
  for (const path in modules) {
    // 缓存包含类别的路径对应的模块
    if (!path.includes(cate)) {
      continue;
    }
    const loader = modules[path];
    if (!loader) {
      continue;
    }
    const mod = (await loader()) as WordsData;
    writeJSON(cate, mod);
    return mod;
  }
  throw new Error(`loadWordsData: 未知的词库分类 "${cate}"`);
}

/** 英文单词：字母为主体，允许内部的连字符与撇号（如 well-known、don't） */
const ENGLISH_WORD_RE = /[a-zA-Z]+(?:['’-][a-zA-Z]+)*/g;

/**
 * 从纯英文文本中提取单词，格式与内置词库一致：[[word, ''], ...]
 * 统一转小写、去重（保留首次出现顺序），翻译列用空字符串占位
 */
export function extractWordsFromText(text: string): [string, string][] {
  const seen = new Set<string>();
  const words: [string, string][] = [];
  for (const match of text.matchAll(ENGLISH_WORD_RE)) {
    const word = match[0].toLowerCase();
    if (seen.has(word)) {
      continue;
    }
    seen.add(word);
    words.push([word, '']);
  }
  return words;
}

/** 读取全部自定义词库索引 */
export function getCustomCates(): CustomCate[] {
  const parsed = readJSON<unknown>(STORAGE_KEYS.customCates, []);
  return Array.isArray(parsed) ? (parsed as CustomCate[]) : [];
}

/**
 * 单次测试随机取 180 词；自定义词库提取结果不足该数量时复制整份单词列表，
 * 直到总数超过它，保证文本偏少时也能练满一分钟
 */
const MIN_CUSTOM_WORDS = 180;

/**
 * 保存一个自定义词库：提取单词、必要时复制扩充到超过单次测试所需数量，
 * 按纯数组格式写入 localStorage，并更新自定义词库索引
 * @returns 新建词库的索引信息，文本中没有可提取的单词时返回 null
 */
export function saveCustomCate(title: string, text: string): CustomCate | null {
  const extracted = extractWordsFromText(text);
  if (!extracted.length) {
    return null;
  }

  const words = [...extracted];
  while (words.length <= MIN_CUSTOM_WORDS) {
    words.push(...extracted);
  }

  const cate: CustomCate = {
    title: title.trim(),
    // 追加随机段，避免同一毫秒连续保存时 value 冲突
    value: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    length: words.length
  };
  writeJSON(cate.value, words);
  writeJSON(STORAGE_KEYS.customCates, [...getCustomCates(), cate]);
  return cate;
}

/** 删除自定义词库：同时移除索引与词库数据 */
export function removeCustomCate(value: string) {
  removeItem(value);
  writeJSON(
    STORAGE_KEYS.customCates,
    getCustomCates().filter((item) => item.value !== value)
  );
}

/**
 * 移除字符串内的空白字符
 * 按照字符匹配的方式去除空格，遇到了平台表现不一致的问题
 */
export function omitBlankLetter(str: string) {
  return str.replace(/[\s\u00A0]+/g, '');
}

/**
 * 空格的正则
 */
export const regexp = /[\s\u00A0\u3000\u2000-\u200F\u202F\u205F\u3000\uFEFF]/;

/**
 * 替换单词中间的空格为下划线
 * 按照字符匹配的方式去除空格，遇到了平台表现不一致的问题
 * 词库中存在含空格的连词（如 "parallel lines"）：
 * 空格被交互占用（按空格切下一个词），词内分隔符统一用下划线呈现；
 * 连续多个空格合并为一个下划线，首尾空格直接去除
 */
export function replaceBlankWord(str: string) {
  return str.trim().replace(/[\s\u00A0]+/g, '_');
}
