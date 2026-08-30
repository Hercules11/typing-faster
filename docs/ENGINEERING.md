# 工程规范

## 技术栈与工具链

| 项     | 选型                                                       | 说明                                                                                                                   |
| ------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 框架   | Vue 3.4（`<script setup>`）                                | 不升级                                                                                                                 |
| 构建   | Vite 5                                                     | 不升级；`base: '/typing-faster/'` 用于 Pages 子路径                                                                    |
| 类型   | TypeScript ~5.4 + vue-tsc                                  | 全量 TS，非 checkJs 渐进模式                                                                                           |
| Lint   | ESLint 8 + eslint-plugin-vue（legacy `.eslintrc.cjs`）     | **刻意未升级 ESLint 9 / flat config**：现有配置零 error 基线，且任务约束"非测试必需不升级依赖"；升级可作为后续独立任务 |
| 格式化 | Prettier 3（`.prettierrc.json`：无分号、单引号、宽度 100） |                                                                                                                        |
| 测试   | Vitest 2 + @testing-library/vue + Playwright               | 见 docs/TESTING.md                                                                                                     |
| 钩子   | simple-git-hooks + lint-staged                             | `pnpm install` 时经 `prepare` 自动安装                                                                                 |

## Lint 规则要点

- 继承 `plugin:vue/vue3-essential` + `eslint:recommended` +
  `@vue/eslint-config-typescript` + `@vue/eslint-config-prettier/skip-formatting`
  （格式问题交给 Prettier，ESLint 不重复管）。
- `lint:check` 以 `--max-warnings 0` 运行：warning 也算失败，防止"暂时没空修"堆积。
- `dist/` 通过 `--ignore-pattern dist/` 排除：它是**有意提交**的 GitHub Pages 部署
  产物，但压缩 bundle 不应参与 lint。
- 新增规则应先让存量代码通过，或以独立提交批量修复，不要留半开状态。

## Git 提交规范（Conventional Commits）

格式：`type(scope): subject`，subject 用中文简述"做了什么"。

常用 type：

| type                     | 用途                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `feat`                   | 新功能                                                        |
| `fix`                    | bug 修复（涉及用户可见行为变化的，同步更新 docs/BUGFIXES.md） |
| `test`                   | 测试新增/调整                                                 |
| `docs`                   | 文档                                                          |
| `chore` / `build` / `ci` | 构建、依赖、工程配置                                          |

示例（本项目分支上的真实提交）：

```text
docs: 添加项目现状报告（阶段0盘点）
chore(test): 搭建 Vitest+jsdom 测试基础设施
test(utils): 覆盖打字匹配/空白处理/词库加载的纯逻辑
fix(typing): 修复打字污染词库数据与选项字面量 &nbsp; 两处 bug
test(e2e): Playwright 冒烟测试覆盖 6 条关键用户路径
```

依赖变更必须在提交信息里写明**原因**（如"均为测试运行必需"）。

## 目录结构约定

```text
src/
├── __tests__/          # 测试（与源码同仓放置，命名 *.spec.ts）
├── components/         # 组件；纯展示图标在 components/icons/
├── data/               # 词库 JSON（动态 import.meta.glob 加载）
├── lang/               # i18n 文案（zh / en）
├── assets/             # 样式与静态资源
├── utils.ts            # 纯逻辑工具（重点测试对象）
├── types.ts            # 共享类型
└── main.ts             # 应用装配入口（i18n + antd 按需注册）
e2e/                    # Playwright 用例
docs/                   # 文档（含 ci/ 下的 workflow 模板）
dist/                   # 构建产物，随提交入库（Pages 部署方式）
```

约定：

- 可复用纯逻辑放 `utils.ts` 并配单测；组件里超过 100 行的独立逻辑应抽出。
- 组件内**禁止**按引用修改 props 传入的数组/对象元素（本项目曾因此产生数据污染
  bug，见 docs/BUGFIXES.md Bug 1）。
- 测试文件不参与生产构建：`tsconfig.app.json` 排除 `src/**/__tests__`，
  测试类型检查走 `tsconfig.vitest.json`。

## Pre-commit 流水线

```
git commit
  → lint-staged（暂存文件：eslint --fix + prettier --write）
  → pnpm test（Vitest 单元/组件全量）
  → pnpm build（vue-tsc 类型检查 + vite 构建）
  → git add dist/（保持原有 Pages 部署习惯）
```

## CI

`docs/ci/test.yml` 提供 GitHub Actions 模板（lint + typecheck + 单测 + E2E）。
复制到 `.github/workflows/` 即启用；不想在 CI 中提交 dist，可只跑检查类 job。
