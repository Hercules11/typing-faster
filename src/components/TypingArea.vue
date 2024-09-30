<script setup lang="ts">
import { computed, h, onMounted, ref, watch, type Ref } from 'vue'
import { type Word } from '@/types'
import { matchSourceAndTarget, omitBlankLetter, regexp } from '@/utils'
import CountDownIcon from './icons/CountDownIcon.vue'
import Modal from 'ant-design-vue/es/modal/Modal'
import { useI18n } from 'vue-i18n'
const props = defineProps(['data'])

const { t, locale } = useI18n()
const emit = defineEmits(['isTyping', 'changeData'])
const hasFinished: Ref<Word[]> = ref([
  // {
  //   data: 'equivalence',
  //   trans: '"n. 等值，相等"',
  //   valid: true
  // },
  // {
  //   data: 'negotiate',
  //   trans: 'n. 等值，相等',
  //   valid: true
  // }
])

const onComing = ref<[string, string][]>([
  // ['access', 'v. 获取 n. 接近，入口'],
  // ['project', 'n. 工程；课题、作业'],
  // ['intention', 'n. 打算，意图']
])

const time = ref(60)
const counting = ref(false)
const startingIndicator = ref()
let intervalId: number | undefined = undefined
const hideStartIndicator = () => {
  setTimeout(() => {
    startingIndicator.value.style.opacity = 0
    startingIndicator.value.style.transition = 'all 1s ease-out'
  }, 1000)
}

// 加个锁，避免一轮测试之后，未进行初始化就开启新一轮
const startCountDown = () => {
  counting.value = true
  hideStartIndicator()
  intervalId = setInterval(() => {
    if (time.value > 0) {
      time.value--
    } else {
      console.log(input.value)
      // html 不区分大小写，所以看到的是contenteditable， 实际上要赋值给 contentEditable 才会生效
      // html 标签内的属性，应该会自动解析为对应的属性
      input.value.contentEditable = false // 禁用输入
      counting.value = false
      info()
      clearInterval(intervalId)
    }
  }, 1000)
}

const words = computed(() => hasFinished.value.reduce((acc, cur) => acc + (cur.valid ? 1 : 0), 0))
const chars = computed(() =>
  hasFinished.value.reduce((acc, cur) => acc + (cur.valid ? cur.data.length : 0), 0)
)
const accuracy = computed(() =>
  hasFinished.value.length ? Math.round((words.value / hasFinished.value.length) * 100) : 0
)

const resetAllData = () => {
  hasFinished.value = []
  currentTarget.value.data = ''
  currentTarget.value.trans = ''
  currentTarget.value.valid = true
  input.value.innerHTML = ''
  emit('changeData')
  time.value = 60
  input.value.contentEditable = true
}
const input = ref()
const focusInput = () => {
  input.value.focus()
}

const changeCurrentWord = (event: any) => {
  let isFinished = matchSourceAndTarget(
    omitBlankLetter(event.target.textContent),
    currentTarget.value.data
  )
  hasFinished.value.push({
    data: omitBlankLetter(event.target.textContent),
    trans: currentTarget.value.trans,
    valid: currentTarget.value.valid ? isFinished.full : false
  })
  onComing.value.shift()
  currentTarget.value.data = onComing.value[0][0]
  currentTarget.value.trans = onComing.value[0][1]
  currentTarget.value.valid = true
  event.target.textContent = ''
}
const currentTarget = ref({
  data: '',
  trans: '',
  valid: true
}) // 存储当前要输入的单词
const initCurrentTargetData = (hasDataAndUpdate: boolean) => {
  if (hasDataAndUpdate || !currentTarget.value.data) {
    currentTarget.value.data = onComing.value[0][0]
    currentTarget.value.trans = onComing.value[0][1]
    currentTarget.value.valid = true
  }
}
const updateContent = (event: any) => {
  // console.log(event)
  if (!counting.value) startCountDown()
  initCurrentTargetData(false)
  if (event.inputType === 'insertParagraph') {
    if (event.target.textContent === '') {
      // 涉及到 br
      event.target.innerHTML = ''
      return
    } else {
      // 换词
      changeCurrentWord(event)
    }
  }
  // 空格匹配不一定成功，会出问题,采用正则匹配
  if (regexp.test(event.data)) {
    if (event.target.textContent.length === 1) {
      event.target.textContent = ''
      return
    } else {
      // 换词
      // 检查是否完成
      changeCurrentWord(event)
    }
  } else {
    //用拟合的逻辑去做匹配，
    let isFinished = matchSourceAndTarget(event.target.textContent.trim(), currentTarget.value.data)
    currentTarget.value.valid = isFinished.match
    if (isFinished.match) {
      currentTarget.value.valid = true
      onComing.value[0][0] = currentTarget.value.data.slice(isFinished.pos)
    } else {
      currentTarget.value.valid = false
    }
  }

  // console.log(currentTarget.value)
}

const info = () => {
  Modal.success({
    title: t('modal-title'),
    content: h('div', {}, [
      h('p', t('prompts1', { words: words.value, chars: chars.value })),
      h(
        'p',
        accuracy.value === 100
          ? t('prompts3', { accuracy: accuracy.value })
          : t('prompts2', { accuracy: accuracy.value })
      )
    ]),
    centered: true,
    wrapClassName: 'custom-dialogue',
    autoFocusButton: null, // 禁止弹窗后，输入空格就重新启动测试
    // maskClosable: true,
    onOk() {
      resetAllData()
      // console.log('ok')
    },
    onCancel() {
      resetAllData()
    }
  })
}

watch(
  () => props.data,
  // 默认情况下，Vue 只会在引用发生变化时触发回调
  () => {
    // console.log(props.data)
    onComing.value.splice(0, onComing.value.length)
    // NOTE: 数据引用bug, 因为改了数组内部数组数据,导致 props 修改, 进而引发当前组件数据 bug
    onComing.value.push(...props.data)
    initCurrentTargetData(true)
  }
)
watch(
  () => counting.value,
  () => {
    // console.log('start typing')
    emit('isTyping', counting.value)
  }
)
</script>

<template>
  <div>
    <div class="scores">
      <div class="count-down">
        <CountDownIcon :enable-animation="counting" />
        <div>{{ time }}</div>
        <div>{{ $t('unit.seconds') }}</div>
      </div>
      <div class="indicator">
        <div class="words-count">
          <div>{{ words }}</div>
          <div>{{ $t('unit.words') }}/{{ $t('unit.min') }}</div>
        </div>
        <div class="chars-count">
          <div>{{ chars }}</div>
          <div>{{ $t('unit.chars') }}/{{ $t('unit.min') }}</div>
        </div>
        <div class="accuracy">
          <div>{{ accuracy }}</div>
          <div>%{{ $t('unit.accuracy') }}</div>
        </div>
      </div>
    </div>
    <div class="input-area" @click="focusInput">
      <div class="indicator" ref="startingIndicator">{{ $t('tips') }}</div>
      <div class="wrapper">
        <div class="input-wrapper">
          <div class="no-wrap">
            <span
              v-for="(word, index) in hasFinished"
              :key="word.data + index"
              :class="word.valid ? '' : 'error'"
              >{{ word.data }}</span
            >
            <div
              ref="input"
              contenteditable="true"
              tabindex="1"
              autocomplete="off"
              autocorrect="off"
              :class="currentTarget.valid ? '' : 'error'"
              @input="updateContent"
            ></div>
          </div>
        </div>
        <div class="input-wrapper">
          <span v-for="(word, index) in onComing" :key="word[0] + index">{{ word[0] }}</span>
        </div>
      </div>
      <div class="translation">{{ locale === 'zh' ? currentTarget.trans : '' }}</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.error {
  text-decoration: line-through;
}
.scores {
  display: flex;
  flex-direction: column-reverse;
  justify-content: center;
  align-items: center;
  text-align: center;
  .indicator {
    display: flex;
    justify-content: center;
    > div {
      text-align: center;
      margin-left: 0.75rem;
      margin-right: 0.75rem;
      div:nth-child(1) {
        font-size: 1.71098437rem;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.03em;

        width: 6rem;
        height: 6rem;
        border-radius: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0.5rem;

        background-color: #fff;
      }
      @media (max-width: 768px) {
        div:nth-child(1) {
          width: 4rem;
          height: 4rem;
          border-radius: 0.5rem;
        }
      }
      @media (min-width: 75rem) {
        div:nth-child(1) {
          font-size: 2.587464rem;
        }
      }
      div:nth-child(2) {
        font-weight: 400;
        font-size: 0.875rem;
      }
    }
  }
  .count-down {
    width: 6.875rem;
    height: 6.875rem;
    display: flex;
    margin-top: 2rem;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    border-radius: 50%;
    background-color: #fff;

    div:nth-last-child(2) {
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.03em;
      font-size: 2.587464rem;
    }
    div:nth-last-child(1) {
      margin-top: -0.5rem;
      font-weight: 400;
      font-size: 0.875rem;
    }
    :deep(svg) {
      position: absolute;
      width: auto;
    }
  }
}

@media (min-width: 48rem) {
  .scores {
    flex-direction: row;
    margin-top: 2rem;
    .indicator {
      > div {
        div:nth-child(1) {
          width: 6rem;
          height: 6rem;
          border-radius: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 0.5rem;

          background-color: #fff;
          font-size: 2.587464rem;
        }
        div:nth-child(2) {
          font-weight: 400;
          font-size: 0.875rem;
        }
      }
    }
    .count-down {
      width: 6.875rem;
      height: 6.875rem;
      margin-right: 4rem;
      margin-top: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      border-radius: 50%;
      background-color: #fff;

      div:nth-last-child(2) {
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.03em;
        font-size: 2.587464rem;
      }
      div:nth-last-child(1) {
        margin-top: -0.5rem;
        font-weight: 400;
        font-size: 0.875rem;
      }
      :deep(svg) {
        position: absolute;
        width: auto;
      }
    }
  }
}
.input-area {
  margin: 4rem;
  margin-bottom: 4rem;
  position: relative;
  margin-right: auto;
  margin-left: auto;
  border-radius: 0.5rem;
  background-color: #fff;
  max-width: 68rem;
  box-shadow:
    0 9px 24px rgba(0, 0, 0, 0.12),
    0 9px 24px rgba(0, 0, 0, 0.12);

  .translation {
    position: absolute;
    left: 50%;
    top: 6rem;
    transform: translateX(-50%);
  }

  .indicator {
    position: absolute;
    left: 50%;
    top: -0.5rem;
    transform: translateX(-50%);
    animation: pulse 1.2s infinite ease-out;
    padding-right: 0.75rem;
    padding-left: 0.75rem;
    padding-top: 0.25rem;
    padding-bottom: 0.125rem;
    border-radius: 0.25rem;
    background-color: #ffd000;
  }
  .indicator::after {
    content: '';
    border-style: solid;
    border-width: 7px 5px 0 5px;
    border-color: #ffd000 transparent transparent transparent;
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
  .wrapper {
    font-family: Merriweather, serif;
    text-rendering: optimizeLegibility;
    font-weight: 100;
    font-size: 2rem;
    position: relative;
    line-height: 4.375;
    display: flex;
    .input-wrapper {
      width: 50%;
      overflow: hidden;
      white-space: nowrap;
      .no-wrap {
        float: right;
        white-space: nowrap;
        text-align: right;
        display: flex;
        color: #ababb0;
        div {
          // Controls the color of the text insertion indicator.
          caret-color: black;
          display: inline-block;
          padding-left: 0.25rem;
          color: #06f;
          outline: none;
        }
      }
      span {
        padding-right: 0.25rem;
        padding-left: 0.25rem;
      }
      > span:first-child {
        padding-left: 0;
      }
    }
  }
}

@media (min-width: 48rem) {
  .input-area {
    margin-top: 6rem;
    margin-bottom: 6rem;
  }
}

@keyframes pulse {
  0% {
    transform: translateY(0) translateX(-50%);
  }
  50% {
    transform: translateY(-1rem) translateX(-50%);
  }
  100% {
    transform: translateY(0) translateX(-50%);
  }
}
</style>
