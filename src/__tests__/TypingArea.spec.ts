import { fireEvent, screen } from '@testing-library/vue'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TypingArea from '@/components/TypingArea.vue'

import { renderWithI18n } from './test-utils'

// Modal 只用于测试结束后的弹窗展示，mock 掉以便捕获 reset 回调
const modalSuccess = vi.fn()
vi.mock('ant-design-vue/es/modal/Modal', () => ({
  default: { success: (...args: any[]) => modalSuccess(...args), confirm: vi.fn() }
}))

const words: [string, string][] = [
  ['apple', 'n. 苹果'],
  ['bee', 'n. 蜜蜂']
]

async function mountTypingArea() {
  const utils = renderWithI18n(TypingArea, {
    props: { data: [] as [string, string][] }
  })
  // 与 App.vue 一致：词库加载完成后以新的数组引用传入
  // （传入副本：组件在打字过程中会改写词条前缀，避免用例间共享数据被污染）
  await utils.rerender({ data: words.map((w) => [...w]) as [string, string][] })
  return utils
}

/** 在 contenteditable 输入区模拟一次真实输入（先写入文本，再派发 input 事件） */
async function typeIntoInput(text: string, eventData: string | null, inputType = 'insertText') {
  const inputEl = document.querySelector('div[contenteditable="true"]') as HTMLElement
  inputEl.textContent = text
  await fireEvent.input(inputEl, { data: eventData, inputType })
  await nextTick()
  return inputEl
}

/** 统计面板上的三个数字：词数、字母数、准确率 */
function statNumbers(): NodeListOf<HTMLElement> {
  return document.querySelectorAll('.indicator > div > div:nth-child(1)')
}

beforeEach(() => {
  modalSuccess.mockClear()
})

describe('TypingArea（打字测速区）', () => {
  it('初始状态：显示 0 词/0 字母/0% 准确率，60 秒倒计时待启动', async () => {
    await mountTypingArea()
    expect(screen.getByText('60')).toBeInTheDocument()
    const numbers = statNumbers()
    expect(numbers).toHaveLength(3)
    expect(numbers[0]!.textContent).toBe('0')
    expect(numbers[1]!.textContent).toBe('0')
    expect(numbers[2]!.textContent).toBe('0')
    expect(screen.getByText('%准确率')).toBeInTheDocument()
  })

  it('传入词库后展示待输入单词，并显示当前词的中文释义', async () => {
    await mountTypingArea()
    const comingArea = document.querySelectorAll('.input-wrapper')[1]!
    expect(comingArea.textContent).toContain('apple')
    expect(comingArea.textContent).toContain('bee')
    expect(document.querySelector('.translation')!.textContent).toContain('n. 苹果')
  })

  it('逐字符输入正确单词：待输入区展示剩余后缀，当前词保持高亮', async () => {
    await mountTypingArea()
    const inputEl = await typeIntoInput('ap', 'p')

    const comingArea = document.querySelectorAll('.input-wrapper')[1]!
    expect(comingArea.textContent).toContain('ple') // apple 剩余后缀
    expect(inputEl.className).not.toContain('error')
  })

  it('输入错误字符：当前词标红（error 划线样式）提示用户', async () => {
    await mountTypingArea()
    const inputEl = await typeIntoInput('x', 'x')
    expect(inputEl.className).toContain('error')
  })

  it('打字过程只裁剪组件内部的待输入队列，不改写父组件传入的词库数据', async () => {
    const source: [string, string][] = [
      ['apple', 'n. 苹果'],
      ['bee', 'n. 蜜蜂']
    ]
    const utils = renderWithI18n(TypingArea, { props: { data: [] as [string, string][] } })
    await utils.rerender({ data: source })

    // 输入前缀触发"剩余后缀"裁剪
    await typeIntoInput('ap', 'p')
    expect(source[0]).toEqual(['apple', 'n. 苹果'])

    // 空格换词后，原始词条依然完整
    await typeIntoInput('apple', ' ')
    expect(source[0]).toEqual(['apple', 'n. 苹果'])
    expect(source[1]).toEqual(['bee', 'n. 蜜蜂'])
  })

  it('空格提交一个完全正确的单词：计入完成区，词数与字母数变为 1 和 5', async () => {
    await mountTypingArea()
    await typeIntoInput('apple', ' ')

    const finishedArea = document.querySelectorAll('.input-wrapper')[0]!
    const finishedSpan = finishedArea.querySelector('span')!
    expect(finishedSpan.textContent).toBe('apple')
    expect(finishedSpan.className).not.toContain('error')

    expect(statNumbers()[0]!.textContent).toBe('1') // words
    expect(statNumbers()[1]!.textContent).toBe('5') // chars
    expect(statNumbers()[2]!.textContent).toBe('100') // accuracy

    // 当前词切换到下一个，释义同步更新
    expect(document.querySelector('.translation')!.textContent).toContain('n. 蜜蜂')
  })

  it('空格提交一个错误的单词：完成区标红，准确率下降', async () => {
    await mountTypingArea()
    await typeIntoInput('applx', ' ')

    const finishedSpan = document.querySelectorAll('.input-wrapper')[0]!.querySelector('span')!
    expect(finishedSpan.textContent).toBe('applx')
    expect(finishedSpan.className).toContain('error')

    expect(statNumbers()[0]!.textContent).toBe('0') // 有效词 0
    expect(statNumbers()[2]!.textContent).toBe('0') // 准确率 0%
  })

  it('回车同样可以提交单词', async () => {
    await mountTypingArea()
    await typeIntoInput('apple', null, 'insertParagraph')

    const finishedArea = document.querySelectorAll('.input-wrapper')[0]!
    expect(finishedArea.textContent).toContain('apple')
  })

  it('完成 60 秒计时后禁用输入并弹出成绩，确认后重置数据并请求换一批词', async () => {
    vi.useFakeTimers()
    try {
      const { emitted } = await mountTypingArea()

      // 先完成一个单词，让统计有数据
      const inputEl = await typeIntoInput('apple', ' ')
      expect(emitted('changeData')).toBeUndefined()

      await vi.advanceTimersByTimeAsync(61_000)
      await nextTick()
      expect(modalSuccess).toHaveBeenCalledTimes(1)
      // 计时结束：输入被禁用（断言 contentEditable 属性；jsdom 不把它反射到 attribute）
      expect(String(inputEl.contentEditable)).toBe('false')

      // 模拟用户点击弹窗的“确定”
      const config = modalSuccess.mock.calls[0][0]
      await config.onOk()
      await nextTick()

      expect(statNumbers()[0]!.textContent).toBe('0') // 统计归零
      expect(screen.getByText('60')).toBeInTheDocument() // 倒计时复位
      expect(emitted('changeData')).toHaveLength(1) // 通知父组件换词
      expect(String(inputEl.contentEditable)).toBe('true')
    } finally {
      vi.useRealTimers()
    }
  })
})
