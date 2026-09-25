export interface Word {
  data: string;
  trans: string;
  valid: boolean;
}

export interface isMatch {
  match: boolean;
  full: boolean;
  pos: number;
}

/**
 * 词库数据的统一形状：动态 import 的 JSON 模块挂在 default 上，
 * 自定义词库缓存是纯数组，loadWordsData 读取时统一归一化为该形状，
 * 调用方（App.vue / useWordBank）无需区分词库来源
 */
export type WordsData = { default: [string, string][] };

/** 自定义词库索引项（localStorage: typing-faster-custom-cates） */
export interface CustomCate {
  /** 下拉展示名（用户输入） */
  title: string;
  /** 词库数据的 localStorage 键，custom-<时间戳>-<随机段> */
  value: string;
  /** 扩充后的单词数（下拉选项展示） */
  length: number;
}
