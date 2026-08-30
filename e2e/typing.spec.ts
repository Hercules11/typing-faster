import { expect, test } from '@playwright/test'

/**
 * 关键用户路径冒烟测试（生产构建 + vite preview）
 * 项目 base 为 /typing-faster/，已在 playwright.config.ts 的 baseURL 中带上
 */

test('首页加载：标题、待输入单词与初始统计可见', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '测试你的打字技能' })).toBeVisible()
  await expect(page.getByText('60')).toBeVisible()

  // 词库加载完成后，待输入区出现单词，选项带上词库长度
  const comingArea = page.locator('.input-wrapper').nth(1)
  await expect(comingArea).toContainText(/\w/, { timeout: 15_000 })
  await expect(page.locator('.ant-select-selection-item')).toContainText('初中词汇')
  await expect(page.locator('.ant-select-selection-item')).not.toContainText('&nbsp;')
})

test('打字主流程：输入完整单词后空格换词，词数与字母数累计', async ({ page }) => {
  await page.goto('/')
  const comingArea = page.locator('.input-wrapper').nth(1)
  const firstWord = (await comingArea.locator('span').first().textContent())!.trim()
  expect(firstWord.length).toBeGreaterThan(0)

  // 点击输入区聚焦，逐字符输入当前单词后按空格提交
  await page.locator('.input-area').click()
  await page.keyboard.type(firstWord)
  await page.keyboard.press('Space')

  const finishedArea = page.locator('.input-wrapper').nth(0)
  await expect(finishedArea.locator('span').first()).toHaveText(firstWord)
  await expect(page.locator('.words-count > div:first-child')).toHaveText('1')
  await expect(page.locator('.chars-count > div:first-child')).toHaveText(
    String(firstWord.length)
  )
  // 下一个待输入单词变成新词，不再是刚完成的词
  await expect(comingArea.locator('span').first()).not.toHaveText(firstWord)
})

test('输入错误字符：当前词划线标红', async ({ page }) => {
  await page.goto('/')
  await page.locator('.input-area').click()
  await page.keyboard.type('zzzz')
  await expect(page.locator('div[contenteditable="true"]')).toHaveClass(/error/)
})

test('切换词库：选择四级词库后选项显示新的词库长度', async ({ page }) => {
  await page.goto('/')
  const comingArea = page.locator('.input-wrapper').nth(1)
  const before = await comingArea.textContent()
  await expect(comingArea).toContainText(/\w/, { timeout: 15_000 })

  await page.locator('.ant-select-selector').click()
  await page.getByText('大学英语四级', { exact: false }).first().click()

  await expect(page.locator('.ant-select-selection-item')).toContainText('7509')
  // 待输入队列刷新为新的词库内容
  await expect(comingArea).not.toHaveText(before!)
})

test('图表区可以收起与展开', async ({ page }) => {
  await page.goto('/')
  const title = page.locator('.container .title')
  const canvas = page.locator('#global-chart')
  await expect(canvas).toBeVisible()
  await expect(title).toContainText('隐藏全球分数分布')

  await title.click()
  await expect(title).toContainText('显示全球分数分布')
  await expect(canvas).toBeHidden()

  await title.click()
  await expect(title).toContainText('隐藏全球分数分布')
  await expect(canvas).toBeVisible()
})

test('主题切换持久化，释义开关切换界面语言', async ({ page }) => {
  await page.goto('/')
  await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  // 关闭中文释义开关 → locale 切到英文
  await page.getByRole('switch').click()
  await expect(page.getByRole('heading', { name: 'Test your typing skills' })).toBeVisible()
})
