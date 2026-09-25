import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * 语言切换：开关文字显示"点击后进入的状态"（当前中文 -> 按钮显示 En），
 * 切换 i18n locale，同时控制打字区是否显示中文释义
 */
export function useLocale() {
  const { locale } = useI18n();

  const showTrans = ref(true);
  watch(showTrans, () => {
    locale.value = showTrans.value ? 'zh' : 'en';
  });

  return { showTrans };
}
