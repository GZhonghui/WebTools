import { createApp } from 'vue'
import { router } from './views/router.js'
import App from './App.vue'

// 导入全局CSS
import './assets/css/global.css'

createApp(App).use(router).mount('#app')
