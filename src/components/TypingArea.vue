<template>
  <div>
    <div class="scores">
      <div class="count-down">
        <CountDownIcon :total-time="TOTAL_TIME" :current-time="time" :is-running="counting" />
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

<script setup lang="ts">
import { h, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from 'ant-design-vue/es/modal/Modal';
import CountDownIcon from './icons/CountDownIcon.vue';
import { useCountdown } from '@/composables/useCountdown';
import { useTypingInput } from '@/composables/useTypingInput';

const props = defineProps<{ data: [string, string][] }>();

const { t, locale } = useI18n();
const emit = defineEmits<{ isTyping: [counting: boolean]; changeData: [] }>();

const input = ref<HTMLElement>();
const startingIndicator = ref<HTMLElement>();

const hideStartIndicator = () => {
  setTimeout(() => {
    startingIndicator.value!.style.opacity = '0';
    startingIndicator.value!.style.transition = 'all 1s ease-out';
  }, 1000);
};

const countdown = useCountdown({
  totalTime: 60,
  onFinish() {
    input.value!.contentEditable = 'false'; // 禁用输入
    info();
  }
});

const { hasFinished, onComing, currentTarget, words, chars, accuracy, updateContent, resetRound } =
  useTypingInput({
    data: () => props.data,
    countdown,
    onFirstInput: hideStartIndicator
  });

const focusInput = () => {
  input.value!.focus();
};

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
      resetAllData();
    },
    onCancel() {
      resetAllData();
    }
  });
};

const resetAllData = () => {
  resetRound();
  input.value!.innerHTML = '';
  emit('changeData');
  input.value!.contentEditable = 'true';
};

watch(countdown.counting, (counting) => {
  emit('isTyping', counting);
});

// 模板需要的倒计时状态（与 countdown 内部同一份响应式引用）
const { time, counting, totalTime: TOTAL_TIME } = countdown;
</script>

<style scoped lang="less">
.error {
  text-decoration: line-through;
  color: var(--color-typing-error);
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

        background-color: var(--color-surface);
        box-shadow: 0 8px 20px var(--color-shadow-card);
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
    background-color: var(--color-surface);
    box-shadow: 0 8px 20px var(--color-shadow-card);

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

          background-color: var(--color-surface);
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
      background-color: var(--color-surface);

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
  background-color: var(--color-surface);
  max-width: 68rem;
  box-shadow:
    0 9px 24px var(--color-shadow-card),
    0 9px 24px var(--color-shadow-card);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  transition:
    background-color 0.3s,
    border-color 0.3s,
    color 0.3s,
    box-shadow 0.3s;

  .translation {
    position: absolute;
    left: 50%;
    top: 6rem;
    transform: translateX(-50%);
    color: var(--color-text-secondary);
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
    background-color: var(--color-accent);
    color: var(--color-accent-text);
  }
  .indicator::after {
    content: '';
    border-style: solid;
    border-width: 7px 5px 0 5px;
    border-color: var(--color-accent) transparent transparent transparent;
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
        color: var(--color-text-muted);
        div {
          // Controls the color of the text insertion indicator.
          caret-color: var(--color-caret);
          display: inline-block;
          padding-left: 0.25rem;
          color: var(--color-typing-active);
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
