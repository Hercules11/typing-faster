import { beforeEach, describe, expect, it } from 'vitest'

import {
  loadWordsData,
  matchSourceAndTarget,
  omitBlankLetter,
  regexp,
  replaceBlankWord,
  setEndOfContenteditable
} from '@/utils'

describe('matchSourceAndTarget（打字进度拟合匹配）', () => {
  it('输入与目标完全一致时判定为整词匹配完成', () => {
    expect(matchSourceAndTarget('apple', 'apple')).toEqual({
      match: true,
      full: true,
      pos: 5
    })
  })

  it('输入是目标前缀时判定为进行中，pos 指向下一个待输入字符', () => {
    expect(matchSourceAndTarget('app', 'apple')).toEqual({
      match: true,
      full: false,
      pos: 3
    })
  })

  it('空输入视为进行中的匹配，pos 为 0', () => {
    expect(matchSourceAndTarget('', 'apple')).toEqual({
      match: true,
      full: false,
      pos: 0
    })
  })

  it('中间字符输错时判定为不匹配', () => {
    expect(matchSourceAndTarget('apxle', 'apple')).toEqual({
      match: false,
      full: false,
      pos: -1
    })
  })

  it('首字符输错时判定为不匹配', () => {
    expect(matchSourceAndTarget('x', 'apple').match).toBe(false)
  })

  it('输入比目标更长时判定为不匹配（避免把超长输入误判为完成）', () => {
    expect(matchSourceAndTarget('applex', 'apple')).toEqual({
      match: false,
      full: false,
      pos: -1
    })
  })

  it('空目标与空输入判定为整词完成', () => {
    expect(matchSourceAndTarget('', '')).toEqual({
      match: true,
      full: true,
      pos: 0
    })
  })

  it('大小写敏感：小写输入不匹配大写目标', () => {
    expect(matchSourceAndTarget('Apple', 'apple').match).toBe(false)
  })
})

describe('omitBlankLetter（去除输入中的空白字符）', () => {
  it('去除半角空格', () => {
    expect(omitBlankLetter('he llo')).toBe('hello')
  })

  it('去除连续空格', () => {
    expect(omitBlankLetter('he   llo')).toBe('hello')
  })

  it('去除不间断空格（\\u00A0，macOS 输入法常见）', () => {
    expect(omitBlankLetter('he\u00A0llo')).toBe('hello')
  })

  it('去除制表符与换行', () => {
    expect(omitBlankLetter('he\tl\nlo')).toBe('hello')
  })

  it('无空白字符时原样返回', () => {
    expect(omitBlankLetter('hello')).toBe('hello')
    expect(omitBlankLetter('')).toBe('')
  })
})

describe('regexp（空白字符匹配正则）', () => {
  it('能识别各种空白字符', () => {
    expect(regexp.test(' ')).toBe(true)
    expect(regexp.test('\t')).toBe(true)
    expect(regexp.test('\u00A0')).toBe(true)
    expect(regexp.test('\u3000')).toBe(true) // 全角空格
  })

  it('不把普通字符当空白', () => {
    expect(regexp.test('a')).toBe(false)
    expect(regexp.test('')).toBe(false)
  })
})

describe('replaceBlankWord（词内空格转下划线）', () => {
  it('把词中间的空格替换为下划线', () => {
    expect(replaceBlankWord('ice cream')).toBe('ice_cream')
  })

  it('连续多个空格合并为单个下划线', () => {
    expect(replaceBlankWord('a  b   c')).toBe('a_b_c')
  })

  it('首尾空格直接去除，不产生下划线', () => {
    expect(replaceBlankWord(' give up ')).toBe('give_up')
  })

  it('不间断空格（\\u00A0）同样处理', () => {
    expect(replaceBlankWord('a\u00A0\u00A0b')).toBe('a_b')
  })

  it('没有空格时原样返回', () => {
    expect(replaceBlankWord('apple')).toBe('apple')
  })
})

describe('setEndOfContenteditable（光标移到可编辑元素末尾）', () => {
  it('把 selection 折叠到元素内容的末尾', () => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<span>abc</span>def'
    document.body.appendChild(el)

    // 先把光标移到开头，再调用工具函数
    const sel = window.getSelection()!
    const range = document.createRange()
    range.setStart(el.firstChild!.firstChild!, 0)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    expect(sel.anchorOffset).toBe(0)

    setEndOfContenteditable(el)
    // collapseToEnd 后光标折叠在容器的所有子节点之后
    expect(sel.isCollapsed).toBe(true)
    expect(sel.anchorNode).toBe(el)
    expect(sel.anchorOffset).toBe(el.childNodes.length)

    el.remove()
  })
})

describe('loadWordsData（词库加载与缓存）', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('无缓存时加载词库 JSON 并写入 localStorage 缓存', async () => {
    const mod = await loadWordsData('junior-high-school')
    // 模块命名空间对象：真实数据挂在 default 上
    expect(mod.default).toBeInstanceOf(Array)
    expect(mod.default.length).toBeGreaterThan(0)
    expect(mod.default[0]).toBeInstanceOf(Array)

    const cached = localStorage.getItem('junior-high-school')
    expect(cached).toBeTruthy()
    expect(JSON.parse(cached!).default[0]).toEqual(mod.default[0])
  })

  it('命中缓存时直接返回缓存内容，不再读词库文件', async () => {
    const fakeData = { default: [['cached', '缓存词条']] }
    localStorage.setItem('cet-4', JSON.stringify(fakeData))

    const mod = await loadWordsData('cet-4')
    expect(mod.default).toEqual([['cached', '缓存词条']])
  })

  it('未知分类抛出明确错误，且不写入缓存', async () => {
    await expect(loadWordsData('no-such-category')).rejects.toThrow(/未知的词库分类/)
    expect(localStorage.getItem('no-such-category')).toBeNull()
  })
})
