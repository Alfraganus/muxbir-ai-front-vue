<template>
  <div class="quc">
    <!-- Tarif sarlavhasi -->
    <div class="quc-head">
      <div class="quc-head-l">
        <span class="quc-head-ic"><AppIcon name="Shield" :size="14"/></span>
        <div>
          <div class="quc-head-cap">{{ tt('quc.currentTariff') }}</div>
          <div v-if="quota.loaded" class="quc-head-name">{{ quota.tariffName || 'Free' }}</div>
          <div v-else class="quc-skel quc-skel-name" />
          <div v-if="daysLeft !== null" class="quc-head-days" :class="daysColorClass">
            <AppIcon name="Calendar" :size="10"/>
            {{ daysLeft <= 0 ? tt('quc.expired') : tt('quc.daysLeft', { n: daysLeft }) }}
          </div>
        </div>
      </div>
      <button class="quc-change" @click="openSwitch">
        <AppIcon name="ChevronR" :size="13"/>
      </button>
    </div>

    <!-- Oylik post limiti -->
    <div class="quc-metric">
      <div class="quc-metric-top">
        <span class="quc-metric-label"><AppIcon name="Send" :size="12"/> {{ tt('quc.monthlyPost') }}</span>
        <span v-if="quota.loaded" class="quc-metric-val tabular">
          {{ formatNumber(quota.monthly.used) }}<span class="quc-metric-lim">/ {{ limitLabel(quota.monthly.limit) }}</span>
        </span>
        <span v-else class="quc-skel quc-skel-val" />
      </div>
      <AppProgress :value="quota.monthly.used" :max="quota.monthly.limit || 1" :tone="toneFor(quota.monthly.used, quota.monthly.limit)" />
    </div>

    <!-- Kunlik post limiti -->
    <div class="quc-metric">
      <div class="quc-metric-top">
        <span class="quc-metric-label"><AppIcon name="Calendar" :size="12"/> {{ tt('quc.dailyPost') }}</span>
        <span v-if="quota.loaded" class="quc-metric-val tabular">
          {{ formatNumber(quota.daily.used) }}<span class="quc-metric-lim">/ {{ limitLabel(quota.daily.limit) }}</span>
        </span>
        <span v-else class="quc-skel quc-skel-val" />
      </div>
      <AppProgress v-if="quota.daily.limit > 0" :value="quota.daily.used" :max="quota.daily.limit || 1" :tone="toneFor(quota.daily.used, quota.daily.limit)" />
      <div v-else class="quc-unlimited">{{ tt('quc.unlimited') }}</div>
    </div>

    <!-- Kredit -->
    <div class="quc-metric">
      <div class="quc-metric-top">
        <span class="quc-metric-label"><AppIcon name="Coin" :size="12"/> {{ tt('quc.credit') }}</span>
        <span v-if="quota.loaded" class="quc-metric-val tabular">
          {{ formatCredit(quota.credits.balance) }}<span class="quc-metric-lim">{{ tt('quc.creditUnit') }}</span>
        </span>
        <span v-else class="quc-skel quc-skel-val" />
      </div>
      <AppProgress :value="quota.credits.used" :max="quota.credits.total || 1" tone="accent" />
      <button class="quc-credit-btn" @click="buyCreditsOpen = true">
        <AppIcon name="Plus" :size="12"/> {{ tt('quc.addCredit') }}
      </button>
    </div>

    <!-- Tarifni o'zgartirish -->
    <button class="quc-tariff-btn" @click="openSwitch">
      <AppIcon name="Tag" :size="13"/>
      {{ tt('quc.changeTariff') }}
    </button>

    <BuyCreditsModal v-model="buyCreditsOpen" :balance="quota.credits.balance" />
    <TariffSwitchModal v-model="switchOpen" :current-tariff-id="currentTariffId" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BuyCreditsModal from '@/components/credits/BuyCreditsModal.vue'
import TariffSwitchModal from '@/components/billing/TariffSwitchModal.vue'
import { useQuotaStore } from '@/stores/quota.js'
import { useAppStore } from '@/stores/app.js'
import { subscriptionsApi } from '@/api/subscriptions.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const quota = useQuotaStore()
const buyCreditsOpen = ref(false)
const switchOpen = ref(false)
const currentTariffId = ref(null)
const daysLeft = ref(null)
let timer = null

const daysColorClass = computed(() => {
  const n = daysLeft.value
  if (n === null) return ''
  if (n <= 0) return 'quc-days-danger'
  if (n <= 3) return 'quc-days-danger'
  if (n <= 7) return 'quc-days-warn'
  return 'quc-days-ok'
})

function openSwitch() { switchOpen.value = true }

/** Limit 0 = cheksiz (∞). Aks holda formatlangan son. */
function limitLabel(limit) {
  return Number(limit) > 0 ? formatNumber(limit) : '∞'
}

/** Kredit kasrli bo'lishi mumkin (0.5) — keraksiz nollarsiz ko'rsatamiz. */
function formatCredit(n) {
  const v = Number(n) || 0
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

function formatNumber(n) {
  const v = Number(n) || 0
  return v.toLocaleString('uz-UZ').replace(/,/g, ' ')
}

function toneFor(used, limit) {
  if (!limit) return 'accent'
  const pct = used / limit
  if (pct >= 0.9) return 'danger'
  if (pct >= 0.7) return 'warn'
  return 'accent'
}

async function loadTariffId() {
  try {
    const sub = await subscriptionsApi.getMine()
    currentTariffId.value = sub?.tariff_id || null
    daysLeft.value = sub?.days_left ?? null
  } catch { /* obuna yo'q bo'lishi mumkin */ }
}

onMounted(() => {
  quota.refresh()
  loadTariffId()
  timer = setInterval(() => quota.refresh(), 60_000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.quc {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--panel);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Tarif sarlavhasi */
.quc-head { display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding-bottom: 14px; border-bottom: 1px solid var(--border-2); }
.quc-head-l { display: flex; align-items: center; gap: 10px; min-width: 0; }
.quc-head-ic {
  width: 32px; height: 32px; border-radius: var(--r-sm); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--accent-bg); color: var(--accent);
}
.quc-head-cap { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.quc-head-name { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.2; margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
.quc-head-days {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 600; margin-top: 3px;
}
.quc-days-ok    { color: var(--success); }
.quc-days-warn  { color: var(--warn, #f59e0b); }
.quc-days-danger { color: var(--danger); }
.quc-change {
  width: 26px; height: 26px; border-radius: var(--r-xs); flex-shrink: 0;
  border: 1px solid var(--border); background: var(--panel-2); color: var(--muted);
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.quc-change:hover { background: var(--accent-bg); color: var(--accent); border-color: var(--accent); }

/* Metrik bloklar */
.quc-metric { display: flex; flex-direction: column; gap: 7px; }
.quc-metric-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.quc-metric-label { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--muted); }
.quc-metric-label svg { color: var(--muted-2); }
.quc-metric-val { font-size: 13.5px; font-weight: 700; color: var(--text); }

/* Yuklanish skeleti — "Free" / 0 miltillashining oldini oladi */
.quc-skel {
  display: inline-block; border-radius: 999px;
  background: linear-gradient(90deg, var(--border-2) 25%, var(--border) 50%, var(--border-2) 75%);
  background-size: 200% 100%;
  animation: quc-shimmer 1.2s ease-in-out infinite;
}
.quc-skel-name { width: 96px; height: 15px; margin-top: 3px; }
.quc-skel-val { width: 52px; height: 14px; }
@keyframes quc-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.quc-metric-lim { font-size: 11px; font-weight: 500; color: var(--muted); margin-left: 4px; }
.quc-unlimited { font-size: 11px; color: var(--success); font-weight: 600; }

.quc-credit-btn {
  margin-top: 3px;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; padding: 7px 10px; border-radius: var(--r-sm);
  border: 1px dashed color-mix(in oklab, var(--accent) 45%, var(--border));
  background: var(--accent-bg); color: var(--accent);
  font-size: 11.5px; font-weight: 600; cursor: pointer;
  transition: background .15s;
}
.quc-credit-btn:hover { background: color-mix(in oklab, var(--accent) 18%, transparent); }

.quc-tariff-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; padding: 10px; border-radius: var(--r-sm);
  border: none; background: var(--accent-grad); color: #fff;
  font-size: 12.5px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 16px -8px color-mix(in oklab, var(--accent) 60%, transparent);
  transition: filter .15s, transform .1s;
}
.quc-tariff-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
</style>
