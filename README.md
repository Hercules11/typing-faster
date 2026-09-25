# typing-faster

打字速度练习 Web 应用（类 monkeytype）：60 秒限时打单词，实时匹配校验，结束时统计
WPM / 字符数 / 正确率。支持 7 个内置词库、自定义词库（粘贴纯英文文本自动提取单词）、
中英文切换与亮/暗主题，附全球打字速度分布图表。

![alt text](demo.gif)
![alt text](image.png)

## 快速开始

环境要求：Node.js ≥ 20，pnpm ≥ 9。

```sh
pnpm install          # 安装依赖，pre-commit 钩子经 prepare 脚本自动生效
pnpm dev              # 启动开发服务器（Vite HMR）
pnpm check:all        # 提交前完整门禁：lint + 类型检查 + 单测 + 构建 + e2e
```

IDE 建议 [VSCode](https://code.visualstudio.com/) +
[Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（禁用 Vetur），
TypeScript 才能正确理解 `.vue` 文件的类型。

## 常用命令

| 命令                            | 说明                                                     |
| ------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                      | 启动开发服务器（Vite HMR）                               |
| `pnpm build`                    | 类型检查 + 生产构建（产物输出到 `dist/`）                |
| `pnpm preview`                  | 预览生产构建                                             |
| `pnpm test`                     | 运行全部单元/组件测试（Vitest + jsdom，一次性）          |
| `pnpm test:watch`               | 监听模式运行测试                                         |
| `pnpm test:coverage`            | 运行测试并生成覆盖率报告（`coverage/` 目录）             |
| `pnpm test:e2e`                 | 运行 Playwright 端到端冒烟测试（自动构建并启动 preview） |
| `pnpm lint:check` / `pnpm lint` | ESLint 校验（前者 0 warning 才通过；后者自动修复）       |
| `pnpm check`                    | lint + 类型检查 + 单测 + 构建                            |
| `pnpm check:all`                | `check` + e2e，提交前的完整门禁                          |
| `pnpm format`                   | Prettier 格式化 `src/`                                   |

## 提交

pre-commit 钩子依次执行：`lint-staged`（暂存文件 ESLint --fix + Prettier）→
`pnpm test` → `pnpm build` → 自动 `git add dist/`（GitHub Pages 部署方式，
dist 随提交入库）。提交信息遵循 Conventional Commits（`type(scope): 中文简述`），
详见 [docs/贡献指南.md](docs/贡献指南.md)。

## 文档

| 文档                                 | 内容                                     |
| ------------------------------------ | ---------------------------------------- |
| [docs/开发指南.md](docs/开发指南.md) | 架构总览、核心数据流、关键决策记录       |
| [docs/贡献指南.md](docs/贡献指南.md) | 测试规范、Lint/TS 规则要点、提交与 CI    |
| [docs/现状.md](docs/现状.md)         | 项目现状盘点、历史问题修复记录、遗留待办 |
| [docs/ci/test.yml](docs/ci/test.yml) | GitHub Actions 模板（未启用，按需复制）  |
