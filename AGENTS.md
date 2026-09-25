# AGENTS.md — AI 编码协作规范

本文件约束 AI 助手在本仓库的一切代码变更。人类贡献者同样适用，详见 `docs/贡献指南.md`。

## 验证口径

任何改动完成前必须通过：

```sh
pnpm check:all   # lint:check + typecheck + test + build + e2e
```

- `lint:check` 以 `--max-warnings 0` 运行：warning 也算失败。
- 不要用 `--no-verify` 绕过 pre-commit 钩子。

## 命令

- 修复 lint 违规优先 `pnpm lint:fix`（空行/花括号等规则均可自动修复），再手工处理剩余项。
- 依赖升级、工具链变更：独立提交 + 写明原因 + `check:all` 通过，不与功能改动混提交。

## TypeScript（tsconfig.app.json）

strict 之上启用：`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、
`noImplicitOverride`、`noFallthroughCasesInSwitch`、`noImplicitReturns`、
`noUnusedLocals`、`noUnusedParameters`、`useUnknownInCatchVariables`。

- 数组/字典索引访问结果视为可能 `undefined`，先判空再使用。
- 可选属性禁止显式赋 `undefined`（`withDefaults` 里不写 `prop: undefined`）。
- 共享类型集中在 `src/types.ts`。
- 禁止 `any`（`@typescript-eslint/no-explicit-any` 为 error）；mock/第三方场景定义接口。

## ESLint（.eslintrc.cjs，legacy 格式，勿升 9）

- 类型导入用内联写法 `import { x, type Foo }`（与 `no-duplicate-imports` 共存）。
- `if/else` 必须带花括号（`curly: all`）；`==` 换 `===`；函数/代码块之间留空行。
- props 必须类型化声明（`defineProps<{...}>()`），禁止数组式。
- 纯 JS/CJS 文件（如 `.eslintrc.cjs` 自身）在 overrides 中关闭 `consistent-type-imports`——
  它们没有 TS parser services，该规则会直接崩溃。

## 格式

Prettier 是格式的唯一权威（`semi: true`、单引号、宽度 100）：不要手工调整
Prettier 管辖的格式，改配置而不是逐文件手改。

## 测试

- **测行为不测实现**：命名描述行为，断言用户可见的东西（文本、class、localStorage、
  emit）；禁止断言内部函数被调用、禁止无断言用例、禁止凑覆盖率的机械用例。
- 全项目只有两处合法 mock：ant Modal（命令式弹层）、chart.js（jsdom 无 canvas）。
  被测组件内部逻辑、被测工具函数、词库 JSON 一律不 mock。
- 组件测试用 `renderWithI18n`（`src/__tests__/test-utils.ts`）挂载；新增 antd
  组件时同步更新 `main.ts` 与 `test-utils.ts` 两处。
- 覆盖率全局阈值 60% 只防劣化，不为凑数写测试。
- 组件会改写 props 数组元素时，测试传副本避免用例间串扰。

## 代码组织

- 组件只做 UI 编排与 DOM 副作用；领域逻辑提取到 `src/composables/`；纯函数进 `src/utils.ts`。
- 组件内禁止按引用修改 props 传入的数组/对象元素（历史数据污染 bug，见 `docs/现状.md`）。
- localStorage 读写必须走 `src/utils/storage.ts`（键名收口 `STORAGE_KEYS`），
  禁止在组件里硬编码键名。
- `base.css` 是颜色的唯一事实源：静态色只定义在 CSS 变量，JS 侧通过 `getCSSVar`
  读取；语义色由 `useTheme` 的种子变量（`--color-seed-*`）经算法生成，不要在
  base.css 写语义色的静态成品。

## Git 提交

Conventional Commits：`type(scope): 中文简述`（feat / fix / test / docs / chore）。
用户可见的行为修复同步记录到 `docs/现状.md` 第五节。
