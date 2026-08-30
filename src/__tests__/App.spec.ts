import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'

import { renderWithI18n } from './test-utils'

// App 里 Modal.confirm 仅在点击 GitHub 图标时弹出，mock 防止真实弹层
vi.mock('ant-design-vue/es/modal/Modal', () => ({
  default: { success: vi.fn(), confirm: vi.fn() }
}))

// GraphicsArea 子组件会实例化 Chart.js，jsdom 无 2D canvas，统一 mock
const chartInstances: any[] = []
vi.mock('chart.js', () => {
  class FakeChart {
    static register = vi.fn()
    data: any
    options: any
    constructor(_ctx: any, config: any) {
      this.data = config.data
      this.options = config.options
      chartInstances.push(this)
    }
    update = vi.fn()
    destroy = vi.fn()
  }
  return {
    Chart: FakeChart,
    Colors: {},
    BarController: {},
    BarElement: {},
    CategoryScale: {},
    LinearScale: {},
    Legend: {},
    Tooltip: {}
  }
})

describe('App（整体页面）', () => {
  it('渲染中文标题与副标题，默认初中词库', async () => {
    renderWithI18n(App)
    expect(screen.getByText('打字速度测试')).toBeInTheDocument()
    expect(screen.getByText('测试你的打字技能')).toBeInTheDocument()
    expect(document.querySelector('.ant-select-selection-item')!.textContent).toContain('初中词汇')
  })

  it('挂载后自动加载词库并把 180 个词传给打字区', async () => {
    const { container } = renderWithI18n(App)
    // loadWordsData 是异步的，等微任务与 watcher 跑完
    await vi.waitFor(() => {
      const comingArea = container.querySelectorAll('.input-wrapper')[1]
      expect(comingArea!.textContent!.length).toBeGreaterThan(100)
    })
    // 选项会带上词库长度
    expect(document.querySelector('.ant-select-selection-item')!.textContent).toMatch(/初中词汇/)
  })

  it('点击灯泡按钮切换主题：data-theme 与 localStorage 同步更新', async () => {
    localStorage.removeItem('typing-faster-theme')
    const { container } = renderWithI18n(App)
    // 测试环境 prefers-color-scheme 恒为 light，初始主题是 light
    expect(document.documentElement.dataset.theme).toBe('light')

    const toggle = container.querySelector('.theme-toggle')!
    const { fireEvent } = await import('@testing-library/vue')
    await fireEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('typing-faster-theme')).toBe('dark')

    await fireEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('typing-faster-theme')).toBe('light')
  })

  it('关闭中文释义开关后，界面文案切换为英文', async () => {
    renderWithI18n(App)
    expect(screen.getByText('测试你的打字技能')).toBeInTheDocument()

    const { fireEvent } = await import('@testing-library/vue')
    await fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByText('Test your typing skills')).toBeInTheDocument()
  })
})
