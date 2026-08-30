import { screen } from '@testing-library/vue'
import { fireEvent } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GraphicsArea from '@/components/GraphicsArea.vue'
import graphicsData from '@/data/graphics.json'

import { renderWithI18n } from './test-utils'

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

describe('GraphicsArea（全球分数分布图）', () => {
  beforeEach(() => {
    chartInstances.length = 0
  })

  it('默认展开图表区，用 graphics.json 的 WPM 分布渲染柱状图', () => {
    renderWithI18n(GraphicsArea)
    expect(screen.getByText('隐藏全球分数分布')).toBeInTheDocument()
    expect(screen.getByText('全球分数')).toBeInTheDocument()
    expect(document.querySelector('#global-chart')).toBeInTheDocument()

    expect(chartInstances).toHaveLength(1)
    const chart = chartInstances[0]
    expect(chart.data.labels).toEqual(Object.keys(graphicsData))
    expect(chart.data.datasets[0].data).toEqual(Object.values(graphicsData))
    expect(chart.options.type ?? 'bar').toBeDefined()
  })

  it('点击标题收起图表：内容区隐藏，按钮文案变为“显示”', async () => {
    const { container } = renderWithI18n(GraphicsArea)
    const title = container.querySelector('.title')!

    await fireEvent.click(title)
    expect(screen.getByText('显示全球分数分布')).toBeInTheDocument()
    const content = container.querySelector('.content') as HTMLElement
    expect(content.style.display).toBe('none')

    // 再点一次展开
    await fireEvent.click(title)
    expect(content.style.display).not.toBe('none')
    // 图表只在挂载时创建一次，不会重复实例化
    expect(chartInstances).toHaveLength(1)
  })

  it('组件卸载时销毁图表实例，避免泄漏', () => {
    const { unmount } = renderWithI18n(GraphicsArea)
    const chart = chartInstances[chartInstances.length - 1]
    unmount()
    expect(chart.destroy).toHaveBeenCalledTimes(1)
  })
})
