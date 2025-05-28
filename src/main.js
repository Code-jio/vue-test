import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 全局样式
import './style/global.css'

createApp(App)
  .use(router)
  .mount('#app')
