<template>
  <a-modal
    v-model:open="open"
    :title="t('custom.modal-title')"
    :footer="null"
    :width="520"
    destroy-on-close
    centered
  >
    <div class="custom-word-form">
      <div class="form-item">
        <label for="custom-cate-title">{{ t('custom.title-label') }}</label>
        <a-input
          id="custom-cate-title"
          v-model:value="title"
          :placeholder="t('custom.title-placeholder')"
          :maxlength="20"
          allow-clear
        />
        <span v-if="titleError" class="form-error">{{ titleError }}</span>
      </div>

      <div class="form-item">
        <label for="custom-cate-text">{{ t('custom.text-label') }}</label>
        <a-textarea
          id="custom-cate-text"
          v-model:value="text"
          :rows="6"
          :placeholder="t('custom.text-placeholder')"
        />
        <span v-if="wordsError" class="form-error">{{ wordsError }}</span>
        <span v-else-if="words.length" class="form-hint">
          {{ t('custom.extracted', { count: words.length }) }}
        </span>
      </div>

      <div class="form-footer">
        <a-button @click="open = false">{{ t('custom.btn-cancel') }}</a-button>
        <a-button class="confirm-btn" :disabled="status === 'invalid'" @click="handleConfirm">
          <template #icon>
            <CloseCircleOutlined v-if="status === 'invalid'" class="icon-invalid" />
            <CheckCircleOutlined v-else-if="status === 'valid'" class="icon-valid" />
            <PlusCircleOutlined v-else />
          </template>
          {{ t('custom.btn-add') }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusCircleOutlined
} from '@ant-design/icons-vue';

import { extractWordsFromText, saveCustomCate, type CustomCate } from '@/utils';

const { t } = useI18n();

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ saved: [cate: CustomCate] }>();

const title = ref('');
const text = ref('');

// 提取结果与确认按钮的状态判断共用一份单词数据
const words = computed(() => extractWordsFromText(text.value));

type ConfirmStatus = 'pristine' | 'invalid' | 'valid';
const status = computed<ConfirmStatus>(() => {
  if (!title.value && !text.value) {
    return 'pristine';
  }
  if (title.value.trim() && words.value.length) {
    return 'valid';
  }
  return 'invalid';
});

const titleError = computed(() =>
  status.value === 'invalid' && !title.value.trim() ? t('custom.err-title') : ''
);
const wordsError = computed(() =>
  status.value === 'invalid' && title.value.trim() && !words.value.length
    ? t('custom.err-words')
    : ''
);

watch(open, (val) => {
  if (!val) {
    reset();
  }
});

const reset = () => {
  title.value = '';
  text.value = '';
};

const handleConfirm = () => {
  if (status.value !== 'valid') {
    return;
  }
  const cate = saveCustomCate(title.value, text.value);
  if (!cate) {
    return;
  }
  emit('saved', cate);
  open.value = false;
};
</script>

<style scoped lang="less">
.custom-word-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-weight: 600;
    color: var(--color-heading);
  }
}

.form-error {
  font-size: 0.85rem;
  color: var(--color-error);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--color-success);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;

  .icon-invalid {
    color: var(--color-error);
  }

  .icon-valid {
    color: var(--color-success);
  }
}
</style>
