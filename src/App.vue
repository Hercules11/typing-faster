<template>
  <a-config-provider :theme="appTheme">
    <div class="background">
      <div class="load-data">
        <button
          class="theme-toggle"
          type="button"
          :aria-label="isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'"
          :title="isDarkTheme ? 'Light theme' : 'Dark theme'"
          @click="toggleTheme"
        >
          <BulbFilled v-if="isDarkTheme" />
          <BulbOutlined v-else />
        </button>
        <div class="chinese">
          <a-switch
            v-model:checked="showTrans"
            checked-children="En"
            un-checked-children="中"
          ></a-switch>
        </div>
        &nbsp;
        <a-select
          :value="currentSelect"
          style="width: 200px"
          :disabled="isDisable"
          @change="onSelectChange"
        >
          <a-select-option v-for="item in cates" :value="item.value" :key="item.value">
            {{ item.label + (item.length ? `\u00A0(${item.length})` : '') }}
          </a-select-option>
          <a-select-option v-for="item in customCates" :value="item.value" :key="item.value">
            <span class="custom-option-label">
              {{ item.title + `\u00A0(${item.length})` }}
              <CloseCircleFilled
                class="custom-delete"
                :title="t('custom.delete')"
                @click.stop="confirmRemoveCustom(item)"
              />
            </span>
          </a-select-option>
          <a-select-option :value="CUSTOM_ADD_VALUE" :key="CUSTOM_ADD_VALUE">
            <span class="custom-add-label">
              <PlusCircleOutlined class="custom-add-icon" />
              {{ t('custom.add-option') }}
            </span>
          </a-select-option>
        </a-select>
      </div>
      <div>
        <h6>{{ $t('subtile') }}</h6>
        <h1>{{ $t('title') }}</h1>
      </div>

      <div class="container">
        <TypingArea :data="wordsData" @is-typing="disableSelection" @change-data="shuffleWords" />
        <GraphicsArea />
      </div>
      <div class="feedback" @click="handleLinkClick">
        <GithubFilled />
      </div>
    </div>
    <CustomWordModal v-model:open="customModalOpen" @saved="addCustomCate" />
  </a-config-provider>
</template>

<script setup lang="ts">
import { createVNode, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  BulbFilled,
  BulbOutlined,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  GithubFilled,
  PlusCircleOutlined
} from '@ant-design/icons-vue';
import TypingArea from './components/TypingArea.vue';
import GraphicsArea from './components/GraphicsArea.vue';
import CustomWordModal from './components/CustomWordModal.vue';
import Modal from 'ant-design-vue/es/modal/Modal';
import { CUSTOM_ADD_VALUE } from './utils';
import type { CustomCate } from './types';
import { useTheme } from './composables/useTheme';
import { useLocale } from './composables/useLocale';
import { useWordBank } from './composables/useWordBank';

const { t } = useI18n();

// 主题 / 语言 / 词库三大领域的状态与逻辑分别收在各自 composable 中
const { isDarkTheme, appTheme, toggleTheme } = useTheme();
const { showTrans } = useLocale();
const {
  currentSelect,
  cates,
  customCates,
  wordsData,
  selectCate,
  shuffleWords,
  addCustomCate,
  removeCate
} = useWordBank();

// ---------- 自定义词库 UI ----------
const customModalOpen = ref(false);

/**
 * 下拉受控：选中「新增自定义词库」入口时只弹窗，不切换词库
 */
const onSelectChange = (value: string) => {
  if (value === CUSTOM_ADD_VALUE) {
    customModalOpen.value = true;
    return;
  }
  selectCate(value);
};

const confirmRemoveCustom = (cate: CustomCate) => {
  Modal.confirm({
    title: t('custom.delete-confirm', { title: cate.title }),
    icon: createVNode(ExclamationCircleOutlined),
    okText: t('ensure'),
    cancelText: t('cancel'),
    okButtonProps: { danger: true },
    centered: true,
    maskClosable: true,
    onOk() {
      removeCate(cate.value);
    }
  });
};

// ---------- 打字状态（是否禁用词库下拉） ----------
const isDisable = ref(false);
const disableSelection = (payload: boolean) => {
  isDisable.value = payload;
};

const handleLinkClick = () => {
  Modal.confirm({
    title: t('confirm'),
    icon: createVNode(ExclamationCircleOutlined),
    content: t('jump-tip'),
    okText: t('ensure'),
    cancelText: t('cancel'),
    centered: true,
    maskClosable: true,
    wrapClassName: 'custom-dialogue',
    onOk() {
      // console.log('跳转')
      window.open('https://github.com/Hercules11/typing-faster', '_blank', 'noopener,noreferrer');
    }
  });
};
</script>

<style scoped lang="less">
.feedback {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  font-size: 4rem;
  color: var(--color-heading);
  transition: color 0.3s;
  text-align: right;
}
@media (max-width: 72rem) {
  .feedback {
    font-size: 3rem;
  }
}
@media (max-width: 768px) {
  .feedback {
    font-size: 2rem;
  }
}
.background {
  background-color: var(--color-page-background);
  color: var(--color-text);

  padding-top: 3rem;
  position: relative;
  overflow: hidden;
  transition:
    background-color 0.3s,
    color 0.3s;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url('./assets/test-bg-left.webp'), url('./assets/test-bg-right.webp');
    background-size: 393px auto;
    background-position:
      calc(50% - 650px) 0,
      calc(50% + 650px) 0;
    background-repeat: repeat-y;
    opacity: var(--background-art-opacity);
    filter: var(--background-art-filter);
  }

  > * {
    position: relative;
    z-index: 1;
  }

  .load-data {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 1rem;
    right: 1rem;

    .theme-toggle {
      width: 32px;
      height: 32px;
      margin-right: 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 50%;
      color: var(--color-text);
      background-color: var(--color-surface);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition:
        background-color 0.3s,
        border-color 0.3s,
        color 0.3s;
    }

    .theme-toggle:hover {
      border-color: var(--color-border-strong);
      color: var(--color-heading);
    }

    :deep(.ant-select-selection-item):hover {
      text-overflow: inherit;
    }

    .chinese {
      display: flex;
      align-items: center;
      justify-content: center;

      :deep(.ant-switch-inner-checked) {
        color: var(--color-accent-text);
      }
    }
  }
  @media screen and (max-width: 768px) {
    .load-data {
      top: 0.3rem;
    }
  }
}

// 下拉面板默认挂载在 body 下，作用域样式无法命中，这几个类名仅本项目使用，走全局样式
:global(.custom-option-label) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

:global(.custom-delete) {
  flex-shrink: 0;
  margin-left: 0.5rem;
  color: var(--color-text-secondary);
  transition: color 0.3s;
}

:global(.custom-delete:hover) {
  color: #ff4d4f;
}

:global(.custom-add-label) {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
}
.container {
  margin: 0 auto;
  padding: 0 20px;
}
h6,
h1 {
  text-align: center;
}
h6 {
  font-size: 1rem;
  letter-spacing: 0.1rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  text-transform: uppercase;

  margin-top: 0;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2.26277684rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--color-heading);

  margin-top: 0;
  margin-bottom: 0.5em;
}
</style>
