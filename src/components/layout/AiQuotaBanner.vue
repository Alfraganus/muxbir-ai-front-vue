<template>
  <Transition name="quota-slide">
    <div v-if="visible" :class="['quota-banner', state]">
      <div class="quota-banner-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="state === 'exceeded'" d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <circle v-else cx="12" cy="12" r="9"/>
          <path v-if="state !== 'exceeded'" d="M12 8v4M12 16h.01"/>
        </svg>
      </div>
      <div class="quota-banner-body">
        <div class="quota-banner-title">{{ title }}</div>
        <div class="quota-banner-sub">{{ subtitle }}</div>
      </div>
      <div class="quota-banner-meter">
        <div class="quota-banner-bar"><span :style="{ width: pct + '%' }"/></div>
        <div class="quota-banner-numbers">
          <span class="tabular">{{ fmt(usage.used_tokens) }}</span>
          <span style="opacity:.6">/ {{ fmt(usage.limit_tokens) }}</span>
        </div>
      </div>
      <router-link v-if="state === 'exceeded'" to="/client/billing" class="quota-banner-cta">
        Tarifni yangilash
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>
      </router-link>
      <button v-if="state !== 'exceeded'" class="quota-banner-close" @click="dismiss" title="Yashirish">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { aiApi } from '@/api/ai.js'

const usage = ref({ used_tokens: 0, limit_tokens: 0, is_quota_exceeded: false, is_quota_warning: false, used_ratio: 0 })
const dismissed = ref(false)
let timer = null

const state = computed(() =>
  usage.value.is_quota_exceeded ? 'exceeded' :
  usage.value.is_quota_warning ? 'warning' : 'ok'
)
const visible = computed(() => {
  if (state.value === 'ok') return false
  // Exceeded — har doim ko'rsatiladi, yashirib bo'lmaydi
  if (state.value === 'exceeded') return true
  // Warning — yashirib qo'yish mumkin
  return !dismissed.value
})
const pct = computed(() => Math.round((usage.value.used_ratio || 0) * 100))
const title = computed(() =>
  state.value === 'exceeded'
    ? 'AI tokenlar tugadi — avtomatik post ishlamayapti'
    : "AI tokenlar limiti tugashga yaqin"
)
const subtitle = computed(() =>
  state.value === 'exceeded'
    ? "Oylik tarif limitidan oshib ketdi. Yangi postlar AI tomonidan qayta yozilmaydi va kanalingizga yuborilmaydi. Tarifni yangilang yoki oy oxirini kuting."
    : `${pct.value}% ishlatildi. Limit tugasa avtomatik yuborish vaqtincha to'xtaydi.`
)

function fmt(n) {
  return Number(n || 0).toLocaleString('uz-UZ')
}

async function refresh() {
  try {
    usage.value = await aiApi.getUsage()
  } catch {}
}

function dismiss() {
  dismissed.value = true
  try { sessionStorage.setItem('ai_quota_warning_dismissed', '1') } catch {}
}

onMounted(() => {
  try { if (sessionStorage.getItem('ai_quota_warning_dismissed') === '1') dismissed.value = true } catch {}
  refresh()
  // Har 60 sekundda yangilab turamiz
  timer = setInterval(refresh, 60_000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.quota-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 12.5px;
  position: relative;
}
.quota-banner.exceeded {
  background: linear-gradient(90deg,
    color-mix(in oklab, var(--danger) 10%, var(--panel)) 0%,
    color-mix(in oklab, var(--danger) 6%, var(--panel)) 100%);
  border-bottom-color: color-mix(in oklab, var(--danger) 30%, var(--border));
  color: var(--text);
}
.quota-banner.warning {
  background: linear-gradient(90deg,
    color-mix(in oklab, #f59e0b 12%, var(--panel)) 0%,
    color-mix(in oklab, #f59e0b 6%, var(--panel)) 100%);
  border-bottom-color: color-mix(in oklab, #f59e0b 30%, var(--border));
  color: var(--text);
}
.quota-banner-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.quota-banner.exceeded .quota-banner-icon {
  background: color-mix(in oklab, var(--danger) 16%, transparent);
  color: var(--danger);
  animation: quotaPulse 1.6s ease-in-out infinite;
}
.quota-banner.warning .quota-banner-icon {
  background: color-mix(in oklab, #f59e0b 16%, transparent);
  color: #f59e0b;
}
@keyframes quotaPulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--danger) 30%, transparent); }
  50%      { box-shadow: 0 0 0 6px color-mix(in oklab, var(--danger) 0%, transparent); }
}
.quota-banner-body { flex: 1; min-width: 0; }
.quota-banner-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -.005em;
}
.quota-banner.exceeded .quota-banner-title { color: var(--danger); }
.quota-banner.warning .quota-banner-title { color: #c2740a; }
.quota-banner-sub {
  font-size: 11.5px;
  color: var(--text-2);
  margin-top: 2px;
  line-height: 1.4;
}

.quota-banner-meter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
  flex-shrink: 0;
}
.quota-banner-bar {
  width: 100%; height: 5px;
  background: var(--panel-2);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.quota-banner-bar span {
  display: block; height: 100%;
  background: currentColor;
  transition: width .5s ease;
}
.quota-banner.exceeded .quota-banner-bar span { background: var(--danger); }
.quota-banner.warning .quota-banner-bar span { background: #f59e0b; }
.quota-banner-numbers {
  font-size: 10.5px;
  color: var(--muted);
  text-align: right;
}

.quota-banner-cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  font-size: 11.5px;
  font-weight: 600;
  background: var(--danger);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  flex-shrink: 0;
  transition: filter .15s;
}
.quota-banner-cta:hover { filter: brightness(0.92); }

.quota-banner-close {
  width: 26px; height: 26px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.quota-banner-close:hover { color: var(--text); border-color: var(--text-2); }

.quota-slide-enter-active, .quota-slide-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}
.quota-slide-enter-from, .quota-slide-leave-to {
  opacity: 0; transform: translateY(-100%);
}
</style>
