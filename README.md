# typing-faster

![alt text](demo.gif)
![alt text](image.png)

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

## 开发

### 环境要求

- Node.js ≥ 20，pnpm ≥ 9
- 首次安装后钩子自动生效（`prepare` 脚本运行 `simple-git-hooks`）；
  若未生效可手动执行 `npx simple-git-hooks`

### 常用命令

| 命令                            | 说明                                                     |
| ------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                      | 启动开发服务器（Vite HMR）                               |
| `pnpm build`                    | 类型检查 + 生产构建（产物输出到 `dist/`）                |
| `pnpm preview`                  | 预览生产构建                                             |
| `pnpm test`                     | 运行全部单元/组件测试（Vitest + jsdom，一次性）          |
| `pnpm test:watch`               | 监听模式运行测试                                         |
| `pnpm test:coverage`            | 运行测试并生成覆盖率报告（`coverage/` 目录）             |
| `pnpm test:e2e`                 | 运行 Playwright 端到端冒烟测试（自动构建并启动 preview） |
| `pnpm lint` / `pnpm lint:check` | ESLint 检查（前者自动修复；后者 0 warning 才通过）       |
| `pnpm format`                   | Prettier 格式化 `src/`                                   |
| `pnpm typecheck`                | `vue-tsc` 类型检查                                       |

### 提交前会发生什么

pre-commit 钩子依次执行：`lint-staged`（对暂存文件跑 ESLint --fix + Prettier）→
`pnpm test`（单元/组件测试）→ `pnpm build`（类型检查 + 构建）→ 自动 `git add dist/`
（保留原有 GitHub Pages 部署方式）。跳过钩子：`git commit --no-verify` 或设置环境变量
`SKIP_SIMPLE_GIT_HOOKS=1`。

### 测试与工程规范

- 测试分层、覆盖率要求与 mock 规范见 [docs/TESTING.md](docs/TESTING.md)
- 代码规范、提交规范与目录约定见 [docs/ENGINEERING.md](docs/ENGINEERING.md)
- 测试过程中发现并修复的 bug 记录见 [docs/BUGFIXES.md](docs/BUGFIXES.md)
- CI workflow 模板（未启用，按需复制到 `.github/workflows/`）见 [docs/ci/test.yml](docs/ci/test.yml)
