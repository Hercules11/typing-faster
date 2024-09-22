import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { Select, Switch, ConfigProvider, Modal } from 'ant-design-vue'
import { createI18n } from 'vue-i18n'
import en from './lang/en.json'
import zh from './lang/zh.json'

const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    en: en,
    zh: zh
  }
})
createApp(App).use(i18n).use(Select).use(Switch).use(ConfigProvider).use(Modal).mount('#app')
