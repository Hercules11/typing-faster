/**
 *
 * @param elem Node Element
 * 滚动光标到元素内容末尾
 */
export function setEndOfContenteditable(elem: Node) {
  const sel = window.getSelection()!
  sel.selectAllChildren(elem)
  sel.collapseToEnd()
}

import { type isMatch } from './types'
/**
 * @param source 用户输入的字符串
 * @param target 要匹配的字符串
 * @return {isMatch} isMatch 是否匹配
 */
export function matchSourceAndTarget(source: string, target: string): isMatch {
  if (source.length > target.length)
    return {
      match: false,
      full: false,
      pos: -1
    }
  for (let i = 0; i < target.length; i++) {
    if (source[i] === undefined)
      return {
        match: true,
        full: false,
        pos: i
      }
    if (source[i] !== target[i]) {
      return {
        match: false,
        full: false,
        pos: -1
      }
    }
  }
  return {
    match: true,
    full: true,
    pos: target.length
  }
}

/**
 * 载入单词数据，有本地缓存优先使用
 * @throws 传入不存在的词库分类时抛出错误（而不是返回 undefined 让调用方崩溃）
 */
export async function loadWordsData(cate: string) {
  const cachedData = localStorage.getItem(cate)
  if (cachedData) {
    return JSON.parse(cachedData)
  } else {
    // 动态加载 JSON 数据
    const modules = import.meta.glob('./data/*.json')
    for (const path in modules) {
      // 缓存包含类别的路径对应的模块
      if (path.includes(cate)) {
        const mod = await modules[path]()
        localStorage.setItem(cate, JSON.stringify(mod))
        return mod
      }
    }
    throw new Error(`loadWordsData: 未知的词库分类 "${cate}"`)
  }
}

/**
 * 移除字符串内的空白字符
 * 按照字符匹配的方式去除空格，遇到了平台表现不一致的问题
 */
export function omitBlankLetter(str: string) {
  return str.replace(/[\s\u00A0]+/g, '')
}

/**
 * 空格的正则
 */
export const regexp = /[\s\u00A0\u3000\u2000-\u200F\u202F\u205F\u3000\uFEFF]/

/**
 * 替换单词中间的空格为下划线
 * 按照字符匹配的方式去除空格，遇到了平台表现不一致的问题
 * 词库中存在含空格的连词（如 "parallel lines"）：
 * 空格被交互占用（按空格切下一个词），词内分隔符统一用下划线呈现；
 * 连续多个空格合并为一个下划线，首尾空格直接去除
 */
export function replaceBlankWord(str: string) {
  return str.trim().replace(/[\s\u00A0]+/g, '_')
}
