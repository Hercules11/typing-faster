import { computed, ref, watch, type Ref } from 'vue';
import type { Word } from '@/types';
import { matchSourceAndTarget, omitBlankLetter, regexp } from '@/utils';

export interface UseTypingInputOptions {
  /** 当前词库数据（getter 形式，父组件换词库时重建待输入队列） */
  data: () => [string, string][];
  /** 倒计时状态：本轮是否已启动、启动与重置 */
  countdown: {
    counting: Ref<boolean>;
    start: () => void;
    reset: () => void;
  };
  /** 首次输入触发一次（宿主用于启动倒计时、隐藏开始提示） */
  onFirstInput: () => void;
}

/**
 * 打字输入状态机（纯逻辑，不触碰 DOM）：
 * - onComing 待输入队列（props.data 的副本，防引用污染）
 * - updateContent 处理输入事件：换行/空格换词，否则前缀拟合匹配
 * - hasFinished 已提交词与对错，派生 words/chars/accuracy 统计
 */
export function useTypingInput(options: UseTypingInputOptions) {
  const hasFinished = ref<Word[]>([]);
  const onComing = ref<[string, string][]>([]);
  // 存储当前要输入的单词
  const currentTarget = ref({
    data: '',
    trans: '',
    valid: true
  });

  const words = computed(() =>
    hasFinished.value.reduce((acc, cur) => acc + (cur.valid ? 1 : 0), 0)
  );
  const chars = computed(() =>
    hasFinished.value.reduce((acc, cur) => acc + (cur.valid ? cur.data.length : 0), 0)
  );
  const accuracy = computed(() =>
    hasFinished.value.length ? Math.round((words.value / hasFinished.value.length) * 100) : 0
  );

  const initCurrentTargetData = (hasDataAndUpdate: boolean) => {
    const first = onComing.value[0];
    if (!first || (!hasDataAndUpdate && currentTarget.value.data)) {
      return;
    }
    currentTarget.value.data = first[0];
    currentTarget.value.trans = first[1];
    currentTarget.value.valid = true;
  };

  const changeCurrentWord = (event: Event) => {
    const target = event.target as HTMLElement;
    const finished = matchSourceAndTarget(
      omitBlankLetter(target.textContent ?? ''),
      currentTarget.value.data
    );
    hasFinished.value.push({
      data: omitBlankLetter(target.textContent ?? ''),
      trans: currentTarget.value.trans,
      valid: currentTarget.value.valid ? finished.full : false
    });
    onComing.value.shift();
    const next = onComing.value[0];
    if (!next) {
      // 词库取空：保留当前词，等 watch(props.data) 重置
      return;
    }
    currentTarget.value.data = next[0];
    currentTarget.value.trans = next[1];
    currentTarget.value.valid = true;
    target.textContent = '';
  };

  const updateContent = (event: Event) => {
    if (!options.countdown.counting.value) {
      options.onFirstInput();
      options.countdown.start();
    }
    initCurrentTargetData(false);
    const { inputType, data } = event as InputEvent;
    const target = event.target as HTMLElement;
    if (inputType === 'insertParagraph') {
      if (target.textContent === '') {
        // 涉及到 br
        target.innerHTML = '';
        return;
      } else {
        // 换词
        changeCurrentWord(event);
      }
    }
    // 空格匹配不一定成功，会出问题,采用正则匹配
    if (data !== null && regexp.test(data)) {
      if (target.textContent?.length === 1) {
        target.textContent = '';
        return;
      } else {
        // 换词
        // 检查是否完成
        changeCurrentWord(event);
      }
    } else {
      // 用拟合的逻辑去做匹配
      const finished = matchSourceAndTarget(
        target.textContent?.trim() ?? '',
        currentTarget.value.data
      );
      currentTarget.value.valid = finished.match;
      if (finished.match) {
        currentTarget.value.valid = true;
        const first = onComing.value[0];
        if (first) {
          // 待打区"吃掉"已正确输入的前缀，实现光标推进效果
          first[0] = currentTarget.value.data.slice(finished.pos);
        }
      } else {
        currentTarget.value.valid = false;
      }
    }
  };

  /** 结算后重置：停止计时、清空统计与当前词（输入框 DOM 由宿主组件清理） */
  const resetRound = () => {
    options.countdown.reset();
    hasFinished.value = [];
    currentTarget.value.data = '';
    currentTarget.value.trans = '';
    currentTarget.value.valid = true;
  };

  watch(
    options.data,
    // 默认情况下，Vue 只会在引用发生变化时触发回调
    () => {
      onComing.value.splice(0, onComing.value.length);
      // NOTE: 数据引用bug, 因为改了数组内部数组数据,导致 props 修改, 进而引发当前组件数据 bug
      // 修复：拷贝词条。打字时会把当前词裁剪成剩余后缀（onComing[0][0] = ...），
      // 若按引用共享，会把父组件/缓存模块里的原始词库数据一并截断
      onComing.value.push(...options.data().map((word) => [...word] as [string, string]));
      initCurrentTargetData(true);
    }
  );

  return {
    hasFinished,
    onComing,
    currentTarget,
    words,
    chars,
    accuracy,
    updateContent,
    resetRound
  };
}
