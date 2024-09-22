<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TypingArea from './components/TypingArea.vue'
import GraphicsArea from './components/GraphicsArea.vue'
import { onMounted, ref, watch } from 'vue'
import { loadWordsData } from './utils'

const { t, locale } = useI18n()
const showTrans = ref(true)
watch(showTrans, () => {
  locale.value = showTrans.value ? 'zh' : 'en'
})
const currentSelect = ref('junior-high-school')
const cates = ref([
  {
    label: t('cates.junior-high-school'),
    value: 'junior-high-school',
    length: ''
  },
  {
    label: t('cates.senior-high-school'),
    value: 'senior-high-school',
    length: ''
  },
  {
    label: t('cates.cet-4'),
    value: 'cet-4',
    length: ''
  },
  {
    label: t('cates.cet-6'),
    value: 'cet-6',
    length: ''
  },
  {
    label: t('cates.graduate-record-exam'),
    value: 'graduate-record-exam',
    length: ''
  },
  {
    label: t('cates.toefl'),
    value: 'toefl',
    length: ''
  },
  {
    label: t('cates.sat'),
    value: 'sat',
    length: ''
  }
])
watch(locale, () => {
  cates.value.forEach((item) => {
    item.label = t('cates.' + item.value)
  })
})

const wordsData = ref<[string, string][]>([])

const isDisable = ref(false)
const disableSelection = (payload: boolean) => {
  isDisable.value = payload
}
const shuffleData = () => {
  injectData()
}
const injectData = async () => {
  const words = await loadWordsData(currentSelect.value)
  for (let item of cates.value) {
    if (item.value === currentSelect.value) {
      item.length = words.default.length
      break
    }
  }
  const random = Math.round(Math.random() * (words.default.length - 180))
  // console.log(words)
  // console.log(random)
  wordsData.value.splice(0, wordsData.value.length) // 响应式丢失
  wordsData.value = words.default.slice(random, random + 180)
  // console.log(wordsData.value)
}
onMounted(injectData)
watch(currentSelect, injectData)
</script>

<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#ffd000'
      }
    }"
  >
    <div class="background">
      <div class="load-data">
        <div class="chinese">
          <a-switch
            v-model:checked="showTrans"
            checked-children="中"
            un-checked-children="En"
          ></a-switch>
        </div>
        &nbsp;
        <a-select v-model:value="currentSelect" style="width: 200px" :disabled="isDisable">
          <a-select-option v-for="item in cates" :value="item.value" :key="item.value">
            {{ item.label + (item.length ? `&nbsp;(${item.length})` : '') }}
          </a-select-option>
        </a-select>
      </div>
      <div>
        <h6>{{ $t('subtile') }}</h6>
        <h1>{{ $t('title') }}</h1>
      </div>

      <div class="container">
        <TypingArea :data="wordsData" @is-typing="disableSelection" @change-data="shuffleData" />
        <GraphicsArea />
      </div>
    </div>
  </a-config-provider>
</template>

<style scoped lang="less">
.background {
  background-image: url('./assets/test-bg-left.webp'), url('./assets/test-bg-right.webp');
  background-size: 393px auto;
  background-position:
    calc(50% - 650px) 0,
    calc(50% + 650px) 0;
  background-repeat: repeat-y;
  background-color: #f6f6f7;

  padding-top: 3rem;
  position: relative;

  .load-data {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 1rem;
    right: 1rem;

    :deep(.ant-select-selection-item):hover {
      text-overflow: inherit;
    }

    .chinese {
      display: flex;
      align-items: center;
      justify-content: center;

      :deep(.ant-switch-inner-checked) {
        color: #333;
      }
    }
  }
  @media screen and (max-width: 768px) {
    .load-data {
      top: 0.3rem;
    }
  }
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
  color: #4a4a56;
  text-transform: uppercase;

  margin-top: 0;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2.26277684rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;

  margin-top: 0;
  margin-bottom: 0.5em;
}
</style>
