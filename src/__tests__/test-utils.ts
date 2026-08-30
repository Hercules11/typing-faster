import { render } from '@testing-library/vue'
import { ConfigProvider, Select, Switch } from 'ant-design-vue'
import { createI18n } from 'vue-i18n'

import en from '@/lang/en.json'
import zh from '@/lang/zh.json'

/**
 * 组件测试统一挂载入口：
 * - 复用应用真实的 i18n 文案（zh 为默认 locale，与 main.ts 一致）
 * - 按需注册 App 用到的 ant-design-vue 组件（与 main.ts 的 app.use 一致）
 */
export function renderWithI18n(component: any, options: Parameters<typeof render>[1] = {}) {
  const i18n = createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'en',
    messages: { en, zh }
  })
  return render(component, {
    global: { plugins: [i18n, Select, Switch, ConfigProvider] },
    ...options
  })
}
