# typing-faster 数据流文档

本文描述 typing-faster 从词库加载到打字结算的完整数据流转。所有流程均基于 `src/App.vue`、`src/components/TypingArea.vue`、`src/utils.ts` 的实际代码。

## 1. 词库加载流（App.vue -> utils.ts -> localStorage）

```
用户选择词库 currentSelect
   |
   v  watch(currentSelect) / onMounted
injectData()
   |
   v
loadWordsData(cate)                     (src/utils.ts)
   |
   +-- localStorage.getItem(cate) 有缓存? --是--> 直接返回 JSON.parse 结果
   |                         |
   |                         否
   |                         v
   |      import.meta.glob('./data/*.json') 惰性模块表
   |                         |
   |                         v  path.includes(cate)
   |              await modules[path]()   动态 import 对应词库 JSON
   |                         |
   |                         v
   |      localStorage.setItem(cate, JSON.stringify(mod))  写缓存
   |                         |
   +----------<--------------+
   |
   v
words.default.length 记入 cates[i].length（下拉框显示词库总数）
   |
   v
random = Math.round(Math.random() * (length - 180))
wordsData = words.default.slice(random, random + 180)     // 连续 180 词
   |
   v
逐条 replaceBlankWord(item[0])      // "give up" -> "give_up"
   |
   v
props.data 传给 TypingArea
```

## 2. 数据注入流（App.vue -> TypingArea）

```
App.vue wordsData (ref)
   |
   v  watch(() => props.data)
TypingArea:
   onComing = []                     // 先清空（避免引用共享 bug，源码有 NOTE 注释）
   onComing.push(...props.data)      // 拷贝进本地队列
   initCurrentTargetData(true)
   currentTarget = { data: onComing[0][0], trans: onComing[0][1], valid: true }
```

```
词库 JSON  ----import.meta.glob--->  loadWordsData  ---localStorage 缓存--->  wordsData
                                                                            |
                                                              props.data    v
                                                              +--------> TypingArea
                                                                         onComing 队列
                                                                              |
                                                              shift() 消费    v
                                                                         currentTarget 当前词
```

## 3. 打字主循环（TypingArea.vue updateContent）

```
用户在 contenteditable div 输入
   |
   v  @input="updateContent"
[是否正在计时?] --否--> startCountDown()   // 首次输入触发 60s 倒计时
   |                       |  每秒 time--; time==0 时:
   |                       |    input.contentEditable = false
   |                       |    info()  --> 结算弹窗
   v
<event.inputType == 'insertParagraph'?>  --是--> 换词分支（Enter）
   |                                              changeCurrentWord(event)
   否
   v
<regexp.test(event.data)?>  (输入的是空白字符) --是--> 空格换词分支
   |                                              changeCurrentWord(event)
   否（普通字符）
   v
isFinished = matchSourceAndTarget(textContent.trim(), currentTarget.data)
   |
   +-- isFinished.match == true
   |      currentTarget.valid = true
   |      onComing[0][0] = currentTarget.data.slice(isFinished.pos)
   |      // 待打区"吃掉"已正确输入的前缀，实现光标推进效果
   |
   +-- isFinished.match == false
          currentTarget.valid = false    // 红色删除线样式 (.error)
```

## 4. 换词流（changeCurrentWord）

```
Enter / 空格
   |
   v
hasFinished.push({
   data: omitBlankLetter(textContent),   // 去掉全部空白
   trans: currentTarget.trans,
   valid: currentTarget.valid && isFinished.full
})                                        // valid 决定统计与划线显示
   |
   v
onComing.shift()                          // 弹出已完成词
currentTarget = { data: onComing[0][0], trans: onComing[0][1], valid: true }
event.target.textContent = ''             // 清空输入框
```

## 5. 统计与结算流

```
words  = hasFinished 中 valid==true 的个数              (computed)
chars  = hasFinished 中 valid==true 的 data.length 总和  (computed)
accuracy = round(words / hasFinished.length * 100)       (computed)
   |
   v  60s 倒计时结束（startCountDown 内）
info():  Modal.success
   "X words / Y chars" + "正确率 Z%"
   |
   +-- onOk / onCancel --> resetAllData()
          hasFinished = []
          currentTarget 清空
          input.innerHTML = ''
          emit('changeData')  --> App.vue shuffleData() --> injectData()
                                  （重新随机 180 词，回到流程 1）
          time = 60; contentEditable = true
```

```
hasFinished --compute--> words/chars/accuracy --render--> 计数卡片 (WPM/chars/accuracy)
                                     |
60s 到时                             v
                          Modal.success 结算弹窗 --确定/取消--> resetAllData --> 新一轮
```

## 6. 主题与语言流

```
主题:
  getInitialTheme():  localStorage('typing-faster-theme')
                      || prefers-color-scheme 媒体查询
  themeMode (ref) --watch(immediate)--> document.documentElement.dataset.theme
                                    `-> localStorage.setItem
  GraphicsArea: MutationObserver(['data-theme']) --> syncChartTheme()
                读取 CSS 变量 --color-accent 等 --> chart.update('none')

语言:
  showTrans 开关 --watch--> locale = 'zh' | 'en'
  locale 变化 --> cates[].label = t('cates.' + value)   // 词库下拉重新翻译
  i18n 文案来自 src/lang/zh.json / en.json
```

## 7. 图表数据流（GraphicsArea.vue，独立于打字流程）

```
data/graphics.json  { "20": 425337, ... }
   |
   v  onMounted
new Chart(canvas, {
   labels: Object.keys(data),        // 年龄
   data:   Object.values(data)       // 人数
})
   |
   v
按需 register: Colors/BarController/BarElement/CategoryScale/LinearScale/Legend/Tooltip
   |
   v
渲染柱状图（tooltip: "N people write" / "N words per minute"）
```

## 8. 注意点（代码中已注释的真实坑）

1. `onComing.push(...props.data)` 必须先 `splice` 清空——直接引用 props 数据会因数组内部数据被修改而引发联动 bug（源码 NOTE 注释）。
2. `wordsData.value.splice(...)` 处的注释"响应式丢失"：先清空再整体赋值新数组引用。
3. HTML 属性不区分大小写，禁用输入必须写 `contentEditable = false`（源码注释）。
4. 空格判定用自定义 `regexp` 而非 `=== ' '`，因为不同平台空格字符表现不一致（源码注释）。
