import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'
import './assets/responsive.css'

// Eslatma: Telegram Mini App hash'ini /support ga to'g'rilash index.html dagi inline
// script'da — u vue-router yuklanishidan OLDIN ishlashi shart (shu sabab bu yerda emas).

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
