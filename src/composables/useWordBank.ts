import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { getCustomCates, loadWordsData, removeCustomCate, replaceBlankWord } from '@/utils';
import type { CustomCate } from '@/types';

/**
 * 词库领域逻辑：
 * - 内置词库选项（i18n 标签）与自定义词库索引
 * - 切换词库 / 重开一轮时从 localStorage 或 JSON 模块加载，随机截取 180 词
 * - 自定义词库的新增（保存后自动选中）与删除（删除当前项时回退默认词库）
 */
export function useWordBank() {
  const { t, locale } = useI18n();

  const currentSelect = ref('junior-high-school');
  const cates = ref([
    {
      label: t('cates.junior-high-school'),
      value: 'junior-high-school',
      length: 0
    },
    {
      label: t('cates.senior-high-school'),
      value: 'senior-high-school',
      length: 0
    },
    {
      label: t('cates.cet-4'),
      value: 'cet-4',
      length: 0
    },
    {
      label: t('cates.cet-6'),
      value: 'cet-6',
      length: 0
    },
    {
      label: t('cates.graduate-record-exam'),
      value: 'graduate-record-exam',
      length: 0
    },
    {
      label: t('cates.toefl'),
      value: 'toefl',
      length: 0
    },
    {
      label: t('cates.sat'),
      value: 'sat',
      length: 0
    }
  ]);
  watch(locale, () => {
    cates.value.forEach((item) => {
      item.label = t('cates.' + item.value);
    });
  });

  const customCates = ref<CustomCate[]>([]);
  const wordsData = ref<[string, string][]>([]);

  const injectData = async () => {
    const words = await loadWordsData(currentSelect.value);
    for (const item of cates.value) {
      if (item.value === currentSelect.value) {
        item.length = words.default.length;
        break;
      }
    }
    // 词库不足 180 词时（自定义词库常见）全量使用，不做随机偏移
    const list: [string, string][] = words.default;
    const start = list.length > 180 ? Math.round(Math.random() * (list.length - 180)) : 0;
    wordsData.value = list.slice(start, start + 180);
    // 去除可能的空格
    wordsData.value.forEach((item) => {
      item[0] = replaceBlankWord(item[0]);
    });
  };

  onMounted(() => {
    customCates.value = getCustomCates();
  });
  onMounted(injectData);
  watch(currentSelect, injectData);

  /** 切换词库（下拉选中内置或自定义项） */
  const selectCate = (value: string) => {
    currentSelect.value = value;
  };

  /** 重开一轮：对当前词库重新随机取词 */
  const shuffleWords = injectData;

  /** 新增自定义词库后登记索引并自动选中开始 */
  const addCustomCate = (cate: CustomCate) => {
    customCates.value.push(cate);
    currentSelect.value = cate.value;
  };

  /** 删除自定义词库；删的是当前选中项时回退到默认词库 */
  const removeCate = (value: string) => {
    removeCustomCate(value);
    customCates.value = customCates.value.filter((item) => item.value !== value);
    if (currentSelect.value === value) {
      currentSelect.value = 'junior-high-school';
    }
  };

  return {
    currentSelect,
    cates,
    customCates,
    wordsData,
    selectCate,
    shuffleWords,
    addCustomCate,
    removeCate
  };
}
