# 测试指南

本项目使用 **Vitest 2 + jsdom + @testing-library/vue** 做单元/组件测试，
**Playwright** 做端到端冒烟测试，**@vitest/coverage-v8** 统计覆盖率。

## 分层结构

```text
src/__tests__/          # 单元与组件测试（Vitest，jsdom 环境）
├── setup.ts            # 全局 setup：jest-dom matchers、matchMedia stub
├── test-utils.ts       # renderWithI18n：注入真实 i18n 文案 + antd 按需组件
├── utils.spec.ts       # 第 1 层：纯逻辑（匹配、空白处理、词库加载）
├── TypingArea.spec.ts  # 第 2/3 层：核心打字状态机 + 用户可见行为
├── GraphicsArea.spec.ts# 图表组件（chart.js mock）
└── App.spec.ts         # 页面级：主题持久化、语言切换、词库加载传递

e2e/typing.spec.ts      # 第 4 层：Playwright 冒烟（生产构建 + vite preview）
```

| 层     | 对象           | 环境          | mock 原则                                                |
| ------ | -------------- | ------------- | -------------------------------------------------------- |
| 纯逻辑 | `src/utils.ts` | node/jsdom    | 不 mock，`loadWordsData` 走真实 `import.meta.glob`       |
| 组件   | `.vue` 组件    | jsdom         | 只 mock 外部依赖：ant Modal、chart.js（jsdom 无 canvas） |
| E2E    | 完整应用       | 真实 Chromium | 什么都不 mock                                            |

## 命令

```sh
pnpm test            # 全量单元/组件测试
pnpm test:watch      # 监听模式
pnpm test:coverage   # 覆盖率报告（text + html + lcov）
pnpm test:e2e        # Playwright（自动 build + preview，base 为 /typing-faster/）
```

## 覆盖率要求

配置在 `vitest.config.ts` 的 `coverage.thresholds`：

- **全局语句/行覆盖 ≥ 60%**（硬阈值，不达标测试失败）
- **`src/utils.ts` ≥ 80%**（核心纯逻辑；vitest 2 暂不支持 per-glob 阈值，
  在覆盖率报告中人工核对，当前为 100%）
- 覆盖率统计**排除**：`main.ts`（入口装配代码）、`types.ts`/`*.d.ts`（纯类型）、
  `components/icons/**`（纯展示 SVG）

## 如何新增测试

1. 文件放在 `src/__tests__/`，命名 `*.spec.ts`（自动被 `include` 匹配）。
2. 组件测试用 `renderWithI18n` 挂载，保证与 `main.ts` 相同的 i18n/antd 环境。
3. 命名描述**行为**而非实现：`空格提交一个错误的单词：完成区标红，准确率下降` ✓，
   `调用 changeCurrentWord` ✗。
4. 断言用户可见的东西：渲染出的文本、class（标红）、localStorage、DOM 属性、
   组件 emit 的语义事件；不要断言内部函数被调用。
5. jsdom 注意事项：
   - `contentEditable` 属性赋值不会反射到 attribute（真实浏览器会），断言用属性值；
   - 事件与 `rerender` 之后要 `await nextTick()` 再断言；
   - `window.matchMedia` 已在 `setup.ts` 中 stub。
6. E2E 用例放 `e2e/`，URL 以 `/` 开头即可（baseURL 已含 `/typing-faster/`）。

## Mock 规范

- **允许 mock**：网络/外部服务、浏览器未实现的 API（canvas 2d context）、
  全局弹层（ant Modal 的命令式调用）、jsdom 缺失的 matchMedia。
- **禁止 mock**：被测组件的内部逻辑、被测工具函数、Vuex/Pinia 级别的状态源
  （本项目为组件内状态）；词库 JSON 不 mock，让真实加载/缓存路径被测试覆盖。
- mock 必须有行为价值：本项目的 Modal mock 捕获 `onOk/onCancel` 用于驱动重置流程，
  chart.js mock 捕获构造参数用于断言图表数据来源，而不是"让它不报错"。
- 组件会改写 props 传入的数组元素时，测试应传入副本，避免用例间串扰
  （真实污染问题已修复，见 docs/BUGFIXES.md Bug 1）。

## 质量红线

1. 禁止无断言或只断言"函数被调用"的空壳用例。
2. 禁止为凑覆盖率测常量、测 getter/setter 的机械用例。
3. 发现 bug：最小修复 + `docs/BUGFIXES.md` 记录 + 回归测试守护；
   拿不准的用 `it.skip` 标记并注明原因。
4. pre-commit 会跑 `lint-staged + pnpm test + pnpm build`，不要用 `--no-verify`
   绕过红线。
