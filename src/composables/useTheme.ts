import { computed, ref, watch } from 'vue';
import antTheme from 'ant-design-vue/es/theme';
import { readString, STORAGE_KEYS, writeString } from '@/utils/storage';

type ThemeMode = 'light' | 'dark';

/**
 * 主题状态：跟随系统偏好初始化、手动切换、持久化到 localStorage，
 * 并同步到 <html data-theme>（CSS 变量切换）与 antd 主题算法
 */
export function useTheme() {
  const getInitialTheme = (): ThemeMode => {
    const storedTheme = readString(STORAGE_KEYS.theme);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const themeMode = ref<ThemeMode>(getInitialTheme());
  const isDarkTheme = computed(() => themeMode.value === 'dark');
  const appTheme = computed(() => ({
    algorithm: isDarkTheme.value ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#ffd000',
      colorTextLightSolid: '#333333',
      borderRadius: 8
    }
  }));

  const toggleTheme = () => {
    themeMode.value = isDarkTheme.value ? 'light' : 'dark';
  };

  watch(
    themeMode,
    () => {
      document.documentElement.dataset.theme = themeMode.value;
      writeString(STORAGE_KEYS.theme, themeMode.value);
    },
    { immediate: true }
  );

  return { themeMode, isDarkTheme, appTheme, toggleTheme };
}
