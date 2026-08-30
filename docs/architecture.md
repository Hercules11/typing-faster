# typing-faster 架构文档

> 一个打字速度练习 Web 应用（类 monkeytype）：60 秒限时打单词，实时匹配校验，结束时统计 WPM / 字符数 / 正确率；附带 Chart.js 绘制的"各年龄段打字人数/速度分布"静态图表。支持中英文切换与亮/暗主题。

## 1. 技术栈（以 package.json 为准）

| 类别 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | Vue ^3.4.29 + TypeScript ~5.4 | `<script setup lang="ts">` |
| UI 组件 | ant-design-vue 4.x + @ant-design/icons-vue | 仅用 Select / Switch / ConfigProvider / Modal |
| 国际化 | vue-i18n 10 | `zh.json` / `en.json` |
| 图表 | chart.js ^4.4.4（按需手动 register） | GraphicsArea.vue |
| 样式 | less + CSS 变量主题（`--color-*`） | 主题由 `data-theme` 属性驱动 |
| 构建 | Vite ^5.3.1，`build = run-p type-check build-only` | pre-commit 钩子构建并提交 dist（GitHub Pages 式部署） |
| 工程化 | simple-git-hooks + npm-run-all2 + eslint/prettier | 见 package.json `simple-git-hooks` 字段 |

**关于 pnpm workspace**：仓库存在 `pnpm-workspace.yaml`，但内容只有 `allowBuilds`（esbuild/core-js/simple-git-hooks 构建许可），并没有声明任何 `packages/*`，src 下也无子包。这是一个**单包项目**，workspace 文件仅用于 pnpm v10+ 的构建脚本白名单配置。

## 2. 目录结构（有效源码）

```
typing-faster/
|-- index.html
|-- vite.config.ts
|-- package.json / pnpm-workspace.yaml / tsconfig*.json / env.d.ts
|-- public/favicon.ico
`-- src/
    |-- main.ts                  # 入口：注册 i18n + 按需注册 ant-design-vue 组件
    |-- App.vue                  # 顶层布局：词库选择 / 语言切换 / 主题切换
    |-- types.ts                 # Word、isMatch 接口
    |-- index.d.ts               # 全局 Element 接口声明
    |-- utils.ts                 # 匹配算法 / 数据加载 / 空白字符处理
    |-- components/
    |   |-- TypingArea.vue       # 核心：打字区 + 60s 倒计时 + 统计
    |   |-- GraphicsArea.vue     # Chart.js 静态统计图（随主题变色）
    |   `-- icons/               # ArrowIcon / CountDownIcon
    |-- data/
    |   |-- cet-4.json 等 7 个   # 词库：[["word","释义"], ...] 二元组数组
    |   `-- graphics.json        # 年龄 -> 打字人数映射（柱状图数据）
    `-- lang/ zh.json / en.json  # i18n 文案
```

## 3. 架构图

```
+---------------------------------------------------------------+
|                        index.html (#app)                      |
+-------------------------------+-------------------------------+
                                |
                             main.ts
        createI18n(zh/en) + 按需注册 Select/Switch/ConfigProvider/Modal
                                |
                    +-----------v------------+
                    |         App.vue        |
                    |  currentSelect(词库key) |
                    |  wordsData: [string,string][]  x180 |
                    |  themeMode / showTrans / cates       |
                    +----+---------------+---------+--------+
                         |               |         |
        props: data      |    emit:      |         |  localStorage('typing-faster-theme')
        +----------------v---+  isTyping |         |  document.documentElement
        |   TypingArea.vue   |  changeData         |    .dataset.theme
        |  contenteditable div                     |
        |  time/counting/currentTarget/            |
        |  hasFinished/onComing                    |
        +-----+-------------------+----------------+
              |                   |
              | onMounted 创建     | MutationObserver( data-theme )
              v                   v
        +-----------+      +--------------------+
        | Chart.js  |      |  GraphicsArea.vue  |
        | (bar)     |<-----|  graphics.json     |
        +-----------+      +--------------------+

  数据来源（utils.ts loadWordsData）:
  +---------------------------+      +---------------------+
  | import.meta.glob(data/)   | ---> | localStorage(cate)  |
  | 动态 import *.json        |      | 首次加载后整库缓存    |
  +---------------------------+      +---------------------+
```

## 4. 模块职责与依赖

| 模块 | 职责 | 依赖 |
| --- | --- | --- |
| `App.vue` | 词库选择（7 类）、i18n 中英切换、主题持久化与 antd 主题算法切换、随机截取 180 词注入 TypingArea | `TypingArea.vue`、`GraphicsArea.vue`、`utils.ts` |
| `TypingArea.vue` | contenteditable 输入区、60s 倒计时、逐字符匹配、WPM/正确率计算、结束弹窗与重置 | `types.ts`、`utils.ts`、`CountDownIcon`、antd Modal |
| `GraphicsArea.vue` | 展示"打字速度分布"柱状图；监听 `data-theme` 属性变化同步图表配色 | `chart.js`、`data/graphics.json`、`ArrowIcon` |
| `utils.ts` | 纯函数工具：匹配算法、词库懒加载缓存、空白处理 | `types.ts` |
| `main.ts` | 组装 i18n（默认 zh，回退 en）与 antd 按需组件 | `lang/*.json` |

## 5. 数据结构

### 5.1 词库文件（data/cet-4.json 等 7 个）

```
[
  ["access",     "v. 获取 n. 接近，入口"],
  ["project",    "n. 工程；课题、作业"],
  ...
]
```

类型：`[string, string][]`（单词, 中文释义）。App.vue 随机取连续 180 条注入。

### 5.2 graphics.json（柱状图数据）

```
{ "20": 425337, "21": 453690, ... }   // key: 年龄，value: 该年龄打字人数
```

### 5.3 核心类型（src/types.ts）

```ts
export interface Word {
  data: string    // 用户输入/单词本体
  trans: string   // 中文释义
  valid: boolean  // 本次输入是否正确
}

export interface isMatch {
  match: boolean  // 前缀是否匹配
  full: boolean   // 是否完整匹配（整词打完）
  pos: number     // 已匹配长度；不匹配时为 -1
}
```

### 5.4 组件内关键状态

| 标识符 | 所在 | 类型 | 说明 |
| --- | --- | --- | --- |
| `time` / `counting` | TypingArea | `ref(60)` / `ref(false)` | 倒计时秒数、是否进行中 |
| `currentTarget` | TypingArea | `{ data, trans, valid }` | 当前待输入单词 |
| `hasFinished` | TypingArea | `ref<Word[]>` | 已提交单词及其对错 |
| `onComing` | TypingArea | `ref<[string,string][]>` | 待输入队列（props.data 的副本） |
| `words` / `chars` / `accuracy` | TypingArea | computed | 有效词数 / 有效字符数 / 正确率 % |
| `currentSelect` | App.vue | `ref('junior-high-school')` | 当前词库 key |
| `wordsData` | App.vue | `ref<[string,string][]>` | 随机 180 词切片 |
| `themeMode` | App.vue | `ref<'light'\|'dark'>` | localStorage 持久化 |
| `showTrans` | App.vue | `ref(true)` | 中/En 开关，驱动 `locale` |

## 6. 函数 / 工具清单（src/utils.ts）

| 函数 | 签名 | 说明 |
| --- | --- | --- |
| `matchSourceAndTarget` | `(source: string, target: string) => isMatch` | 前缀拟合匹配：超长→不匹配；逐字符比较，返回 match/full/pos |
| `loadWordsData` | `(cate: string) => Promise<[string,string][]>` | 先查 `localStorage[cate]`；未命中则用 `import.meta.glob('./data/*.json')` 动态 import 对应词库并写入缓存 |
| `omitBlankLetter` | `(str: string) => string` | 去除所有空白（含 `\u00A0` 等，规避跨平台表现差异） |
| `replaceBlankWord` | `(str: string) => string` | 将词中空格替换为 `_`（如 "give up" → "give_up"） |
| `setEndOfContenteditable` | `(elem: Node) => void` | 将光标折叠到 contenteditable 末尾 |
| `regexp` | 常量 | 各类空白字符正则，用于"空格=换词"判定 |

组件内部主要方法（TypingArea.vue）：`startCountDown`（启停计时 + 结束时禁输入并弹窗）、`updateContent`（input 事件分发：换行/空格换词、否则前缀匹配）、`changeCurrentWord`（提交当前词入 hasFinished、队列前移、清空输入框）、`resetAllData`、`info`（结果 Modal）。GraphicsArea.vue：`syncChartTheme`（MutationObserver 感知 `data-theme` 变更后刷新图表配色）。

## 7. 构建与部署

```
package.json scripts:
  dev    -> vite
  build  -> run-p type-check build-only     (vue-tsc 与 vite build 并行)
  format -> prettier --write src/

simple-git-hooks:
  pre-commit: pnpm build && git add dist/   # dist 直接入库用于静态托管
```
