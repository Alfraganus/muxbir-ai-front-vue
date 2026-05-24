<template>
  <Transition name="quota-slide">
    <div v-if="visible" :class="['storage-banner', state]">
      <div class="storage-banner-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
          <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/>
        </svg>
      </div>
      <div class="storage-banner-body">
        <div class="storage-banner-title">{{ title }}</div>
        <div class="storage-banner-sub">{{ subtitle }}</div>
      </div>
      <div class="storage-banner-meter">
        <div class="storage-banner-bar"><span :style="{ width: pct + '%' }"/></div>
        <div class="storage-banner-numbers">
          <span class="tabular">{{ fmtMB(usage.used_bytes) }}</span>
          <span style="opacity:.6">/ {{ fmtMB(usage.limit_bytes) }}</span>
        </div>
      </div>
      <router-link v-if="state === 'exceeded'" to="/client/billing" class="storage-banner-cta">
        Tarifni yangilash
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"/></svg>
      </router-link>
      <button v-if="state !== 'exceeded'" class="storage-banner-close" @click="dismiss" title="Yashirish">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { uploadsApi } from '@/api/uploads.js'

const usage = ref({ used_bytes: 0, limit_bytes: 0, is_storage_exceeded: false, is_storage_warning: false, used_ratio: 0 })
const dismissed = ref(false)
let timer = null

const state = computed(() =>
  usage.value.is_storage_exceeded ? 'exceeded' :
  usage.value.is_storage_warning ? 'warning' : 'ok'
)
const visible = computed(() => {
  if (state.value === 'ok') return false
  if (state.value === 'exceeded') return true // yashirib bo'lmaydi
  return !dismissed.value
})
const pct = computed(() => Math.round((usage.value.used_ratio || 0) * 100))
const title = computed(() =>
  state.value === 'exceeded'
    ? 'Xotira to\'ldi — yangi fayllar yuklanmaydi'
    : "Xotira chegarasi yaqinlashmoqda"
)
const subtitle = computed(() =>
  state.value === 'exceeded'
    ? "Bucket xotira limiti tugadi. Postlarga rasm yoki video qo'sha olmaysiz, yangi yuklashlar rad etiladi. Eski fayllarni media kutubxonangizdan o'chiring yoki tarifni yangilang."
    : `${pct.value}% to'lgan. Limit tugasa yangi yuklashlar to'xtatiladi.`
)

function fmtMB(bytes) {
  const mb = Number(bytes || 0) / 1024 / 1024
  if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB'
  return mb.toFixed(1) + ' MB'
}

async function refresh() {
  try {
    usage.value = await uploadsApi.getUsage()
  } catch {}
}

function dismiss() {
  dismissed.value = true
  try { sessionStorage.setItem('storage_quota_warning_dismissed', '1') } catch {}
}

onMounted(() => {
  try { if (sessionStorage.getItem('storage_quota_warning_dismissed') === '1') dismissed.value = true } catch {}
  refresh()
  timer = setInterval(refresh, 60_000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.storage-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 12.5px;
  position: relative;
}
.storage-banner.exceeded {
  background: linear-gradient(90deg,
    color-mix(in oklab, var(--danger) 10%, var(--panel)) 0%,
    color-mix(in oklab, var(--danger) 6%, var(--panel)) 100%);
  border-bottom-color: color-mix(in oklab, var(--danger) 30%, var(--border));
}
.storage-banner.warning {
  background: linear-gradient(90deg,
    color-mix(in oklab, #f59e0b 12%, var(--panel)) 0%,
    color-mix(in oklab, #f59e0b 6%, var(--panel)) 100%);
  border-bottom-color: color-mix(in oklab, #f59e0b 30%, var(--border));
}
.storage-banner-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.storage-banner.exceeded .storage-banner-icon {
  background: color-mix(in oklab, var(--danger) 16%, transparent);
  color: var(--danger);
  animation: storagePulse 1.6s ease-in-out infinite;
}
.storage-banner.warning .storage-banner-icon {
  background: color-mix(in oklab, #f59e0b 16%, transparent);
  color: #f59e0b;
}
@keyframes storagePulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--danger) 30%, transparent); }
  50%      { box-shadow: 0 0 0 6px color-mix(in oklab, var(--danger) 0%, transparent); }
}
.storage-banner-body { flex: 1; min-width: 0; }
.storage-banner-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -.005em;
}
.storage-banner.exceeded .storage-banner-title { color: var(--danger); }
.storage-banner.warning .storage-banner-title { color: #c2740a; }
.storage-banner-sub {
  font-size: 11.5px;
  color: var(--text-2);
  margin-top: 2px;
  line-height: 1.4;
}

.storage-banner-meter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
  flex-shrink: 0;
}
.storage-banner-bar {
  width: 100%; height: 5px;
  background: var(--panel-2);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.storage-banner-bar span {
  display: block; height: 100%;
  transition: width .5s ease;
}
.storage-banner.exceeded .storage-banner-bar span { background: var(--danger); }
.storage-banner.warning .storage-banner-bar span { background: #f59e0b; }
.storage-banner-numbers {
  font-size: 10.5px;
  color: var(--muted);
  text-align: right;
}

.storage-banner-cta {
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
.storage-banner-cta:hover { filter: brightness(0.92); }

.storage-banner-close {
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
.storage-banner-close:hover { color: var(--text); border-color: var(--text-2); }

.quota-slide-enter-active, .quota-slide-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}
.quota-slide-enter-from, .quota-slide-leave-to {
  opacity: 0; transform: translateY(-100%);
}
</style>
