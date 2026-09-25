import { onUnmounted, ref } from 'vue';

export interface UseCountdownOptions {
  /** 倒计时总秒数，默认 60 */
  totalTime?: number;
  /** 计时走完时的回调（与 time 归 0 同一 tick，不多等一秒） */
  onFinish?: () => void;
}

/**
 * 60s 倒计时：首次输入启动、结束触发 onFinish、组件卸载时清理定时器，
 * 避免计时中途卸载后定时器空转泄漏
 */
export function useCountdown(options: UseCountdownOptions = {}) {
  const totalTime = options.totalTime ?? 60;
  const time = ref(totalTime);
  const counting = ref(false);
  let intervalId: ReturnType<typeof setInterval> | undefined = undefined;

  const stop = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    counting.value = false;
  };

  const start = () => {
    // 加个锁，避免一轮测试之后，未进行初始化就开启新一轮
    stop();
    counting.value = true;
    intervalId = setInterval(() => {
      time.value--;
      if (time.value <= 0) {
        // 计时走完：显示 0 的同时立即结算，不再多等一个 tick
        stop();
        time.value = 0;
        options.onFinish?.();
      }
    }, 1000);
  };

  /** 重置回满秒数并停止计时（结算弹窗确认/取消后开启新一轮） */
  const reset = () => {
    stop();
    time.value = totalTime;
  };

  onUnmounted(stop);

  return { time, counting, totalTime, start, stop, reset };
}
