import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'

// ── Telegram Mini App: launch parametrlari (#tgWebAppData=...) hash-router yo'lini
// buzadi. Chat bot Mini App'i DOIM operator konsoliga (/support) ochiladi — shuning
// uchun Telegram ichida ochilgani aniqlansa, router'ga ulanishdan OLDIN hash'ni
// to'g'rilaymiz (createWebHashHistory birinchi navigatsiyada shu hash'ni o'qiydi).
;(function normalizeTelegramHash() {
  try {
    const h = window.location.hash || ''
    const inTelegram = h.includes('tgWebApp') || !!window.Telegram?.WebApp?.initData
    // Chat bot Mini App'i faqat operator konsoliga ochiladi — Telegram ichida
    // bo'lsa, hash qanday buzilgan bo'lishidan qat'i nazar, /support ga majburlaymiz.
    if (inTelegram && !h.startsWith('#/support')) {
      const base = window.location.pathname + window.location.search
      window.history.replaceState(null, '', base + '#/support')
    }
  } catch { /* ignore */ }
})()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
