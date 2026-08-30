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
- **现象**：插值 `{{ item.label + (item.length ? \`&nbsp;(${item.length})\` : '') }}`中的`&nbsp;`位于 **JS 表达式字符串内**，Vue 不会对表达式内容做 HTML 实体解码，
导致选择框显示`初中词汇&nbsp;(3224)`这样的字面文本（组件测试中`textContent`直接包含`&nbsp;` 证实）。
- **修复**：改用 JS 转义 `\u00A0`（真实的不断行空格字符）：
  `` ` item.length ? `\u00A0(${item.length})` : '' `` `
- **理由**：保留作者"不换行空格"的排版意图，仅把"错误的实体写法"改为等价的真实字符。
  回归测试：`App.spec.ts > 挂载后自动加载词库…`（断言含 `\u00A0(3224)` 且不含 `&nbsp;`）。

## 类型层面调整（非运行时 bug）

- `src/components/TypingArea.vue`：`let intervalId: number` → `ReturnType<typeof setInterval>`。
  测试环境（node 类型参与解析）下 `setInterval` 返回 `NodeJS.Timeout`，原写法在
  `vue-tsc --build` 中报错；运行时行为无任何变化。

## 第二轮修复（2026-08-31，产品确认后）

4. **`replaceBlankWord` 只替换第一个空格**
   - **位置**：`src/utils.ts`
   - **背景**：界面用空格键"切下一个词"，词内无法用空格分隔，因此词库加载时把
     词内空格替换为下划线呈现（SAT 词库 26 个、高中词库 3 个含空格词条，如
     "parallel lines"）。原实现 `replace(' ', '_')` 只处理第一个空格。
   - **修复**：`str.trim().replace(/[\s\u00A0]+/g, '_')`——首尾空格去除、连续任意
     多个空格合并为单个下划线。连词呈现为 `parallel_lines`，用户输入下划线字符
     即可正常匹配，与空格换词的交互不冲突。
5. **`loadWordsData` 未知分类返回 `undefined`**
   - **位置**：`src/utils.ts`
   - **修复**：未匹配到词库文件时抛出 `Error("loadWordsData: 未知的词库分类 …")`，
     把静默的下游 `TypeError` 变成带语义的显式失败；缓存写入发生在成功路径，
     失败时不污染 localStorage。
6. **计时结束延迟 1 秒弹窗 / 计时中卸载组件不清理 interval**
   - **位置**：`src/components/TypingArea.vue` `startCountDown`
   - **修复**：
     - 原实现倒计时减到 0 后还要再等一个 tick（成绩在第 61 秒弹出，界面显示 0
       约 1 秒无响应）。改为 `time > 1` 递减、否则立即归零并 `info()` 弹窗——
       打字窗口仍为完整 60 秒，弹窗在显示 0 的同一时刻出现。
     - 补充 `onUnmounted` 清理 `intervalId`，避免计时中途卸载组件后 interval
       空转泄漏。
   - 顺带移除计时结束分支里遗留的 `console.log(input.value)` 调试语句。

## 已记录、未修复的遗留问题

（截至 2026-08-31 暂无。）
