# BUGFIXES —— 测试引入过程中发现并修复的 bug

> 原则：最小改动，不改变业务逻辑与交互表现。每条记录：位置、现象、修复、理由。

## Bug 1：打字过程改写父组件词库数据（数据污染，影响核心功能）

- **位置**：`src/components/TypingArea.vue`，`watch(() => props.data)` 回调与 `updateContent`
- **现象**：
  `onComing.value.push(...props.data)` 把父组件传入的词条**按引用**放入待输入队列；
  打字进行中组件会把当前词裁剪成剩余后缀（`onComing.value[0][0] = currentTarget.value.data.slice(pos)`）。
  由于 `App.vue` 中 `words.default.slice(random, random+180)` 与词库模块共享内部元组，
  这一写入会**截断词库源数据**——同一词库练习多轮、或反复切换词库后，词条变成残缺前缀
  （如 `apple` → `ple` → `e`），且污染本轮 180 词之外的显示。源码中作者的
  `NOTE: 数据引用bug` 注释也印证了这一问题。
- **修复**：push 时逐条浅拷贝元组：
  ```ts
  onComing.value.push(...props.data.map((word) => [...word] as [string, string]))
  ```
- **理由**：只改数据入口一处，打字逻辑、裁剪显示行为完全不变；深拷贝无必要（词条是
  二元字符串组）。回归测试：`TypingArea.spec.ts > 打字过程只裁剪组件内部的待输入队列，
  不改写父组件传入的词库数据`。

## Bug 2：词库下拉选项渲染出字面量 `&nbsp;` 文本

- **位置**：`src/App.vue` 模板，`a-select-option` 的插值
- **现象**：插值 `{{ item.label + (item.length ? \`&nbsp;(${item.length})\` : '') }}` 中的
  `&nbsp;` 位于 **JS 表达式字符串内**，Vue 不会对表达式内容做 HTML 实体解码，
  导致选择框显示 `初中词汇&nbsp;(3224)` 这样的字面文本（组件测试中
  `textContent` 直接包含 `&nbsp;` 证实）。
- **修复**：改用 JS 转义 `\u00A0`（真实的不断行空格字符）：
  `` ` item.length ? `\u00A0(${item.length})` : '' `` `
- **理由**：保留作者"不换行空格"的排版意图，仅把"错误的实体写法"改为等价的真实字符。
  回归测试：`App.spec.ts > 挂载后自动加载词库…`（断言含 `\u00A0(3224)` 且不含 `&nbsp;`）。

## 类型层面调整（非运行时 bug）

- `src/components/TypingArea.vue`：`let intervalId: number` → `ReturnType<typeof setInterval>`。
  测试环境（node 类型参与解析）下 `setInterval` 返回 `NodeJS.Timeout`，原写法在
  `vue-tsc --build` 中报错；运行时行为无任何变化。

## 已记录、未修复的遗留问题（不影响当前功能路径）

1. `utils.ts replaceBlankWord` 只替换**第一个**空格（`replace` 非 `replaceAll`）。
   SAT 词库有 26 个含空格词条、高中词库 3 个；若某词条含两个空格，第二个空格不会被
   替换为下划线，用户按空格会直接换词。未修：改动会改变现有交互行为，需产品确认。
2. `utils.ts loadWordsData` 对不存在的分类返回 `undefined`，调用方 `words.default` 会抛
   TypeError。当前 7 个分类都存在，路径不可达；建议后续补默认值或报错。
3. `TypingArea` 组件卸载时未清理 `startCountDown` 创建的 `setInterval`（正常流程由计时
   结束分支 `clearInterval`；若计时中途切走组件会短暂泄漏一个空转 interval）。
4. 计时到 0 后需再等 1 个 interval 才弹窗（倒计时显示 0 约 1 秒后成绩才出现），属轻微
   体验问题，不涉及逻辑错误。
