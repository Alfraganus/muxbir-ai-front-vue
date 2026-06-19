<template>
  <div v-if="show" class="te-banner" :class="expired ? 'te-danger' : 'te-warn'">
    <span class="te-ic">
      <AppIcon :name="expired ? 'Bell' : 'Calendar'" :size="15"/>
    </span>
    <div class="te-text">
      <span class="te-title">{{ title }}</span>
      <span class="te-sub">{{ subtitle }}</span>
    </div>
    <div class="te-actions">
      <button class="te-btn te-btn-primary" :disabled="paying" @click="extend">
        <span v-if="paying" class="te-spin"/>
        <template v-else><AppIcon name="Coin" :size="13"/> Uzaytirish</template>
      </button>
      <button class="te-btn te-btn-ghost" :disabled="paying" @click="switchOpen = true">
        Tarifni o'zgartirish
      </button>
      <button v-if="!expired" class="te-x" @click="dismissed = true" aria-label="Yopish">
        <AppIcon name="Close" :size="14"/>
      </button>
    </div>

    <TariffSwitchModal v-model="switchOpen" :current-tariff-id="sub?.tariff_id || null" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import TariffSwitchModal from './TariffSwitchModal.vue'
import { subscriptionsApi } from '@/api/subscriptions.js'
import { useClickPayment } from '@/composables/useClickPayment.js'

const WARN_DAYS = 3 // shu kun qolganda ogohlantirish boshlanadi

const sub = ref(null)
const dismissed = ref(false)
const switchOpen = ref(false)
const { payWithClick, loading: paying } = useClickPayment()
let timer = null

const expired = computed(() => !!sub.value?.is_expired)
const daysLeft = computed(() => sub.value?.days_left ?? null)

// Faqat muddat tugagan yoki yaqinlashganda ko'rsatamiz
const show = computed(() => {
  if (!sub.value) return false
  if (expired.value) return true // tugagan — har doim (yopib bo'lmaydi)
  if (dismissed.value) return false
  return daysLeft.value != null && daysLeft.value > 0 && daysLeft.value <= WARN_DAYS
})

const tariffName = computed(() => {
  const n = sub.value?.tariff?.name_i18n
  return (typeof n === 'string' ? n : n?.uz || n?.ru || n?.en) || ''
})

const title = computed(() =>
  expired.value
    ? `"${tariffName.value}" tarif muddati tugadi`
    : `Tarif muddati ${daysLeft.value} kundan keyin tugaydi`,
)
const subtitle = computed(() =>
  expired.value
    ? 'Avto-post va AI to\'xtatildi. Davom etish uchun tarifni uzaytiring yoki almashtiring.'
    : 'Uzilishlarsiz davom etish uchun oldindan uzaytiring.',
)

async function extend() {
  // Banner allaqachon obunani olgan — id'ni to'g'ridan uzatamiz (getMine'ga tayanmaymiz)
  try { await payWithClick(sub.value?.id || null) } catch { /* xato useClickPayment ichida */ }
}

async function refresh() {
  try {
    sub.value = await subscriptionsApi.getMine()
  } catch { /* jim — obuna yo'q bo'lishi mumkin */ }
}

onMounted(() => {
  refresh()
  timer = setInterval(refresh, 60_000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.te-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px; border-bottom: 1px solid var(--border);
}
.te-warn { background: color-mix(in oklab, var(--warn) 10%, var(--bg)); }
.te-danger { background: color-mix(in oklab, var(--danger) 11%, var(--bg)); }

.te-ic { width: 30px; height: 30px; border-radius: var(--r-sm); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center; }
.te-warn .te-ic { background: color-mix(in oklab, var(--warn) 20%, transparent); color: var(--warn); }
.te-danger .te-ic { background: color-mix(in oklab, var(--danger) 18%, transparent); color: var(--danger); }

.te-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.te-title { font-size: 13px; font-weight: 600; color: var(--text); }
.te-sub { font-size: 11.5px; color: var(--muted); }

.te-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.te-btn { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px;
  border-radius: var(--r-sm); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: filter .15s, background .15s, border-color .15s; }
.te-btn:disabled { opacity: .6; cursor: not-allowed; }
.te-btn-primary { border: none; color: #fff; background: var(--accent-grad);
  box-shadow: 0 6px 16px -6px color-mix(in oklab, var(--accent) 60%, transparent); }
.te-btn-primary:hover:not(:disabled) { filter: brightness(1.07); }
.te-btn-ghost { background: var(--panel); border: 1px solid var(--border); color: var(--text-2); }
.te-btn-ghost:hover:not(:disabled) { border-color: var(--muted-2); color: var(--text); }
.te-x { width: 28px; height: 30px; border: none; background: transparent; color: var(--muted);
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: var(--r-sm); }
.te-x:hover { background: color-mix(in oklab, var(--text) 8%, transparent); color: var(--text); }

.te-spin { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; border-radius: 50%; animation: tespin .7s linear infinite; }
@keyframes tespin { to { transform: rotate(360deg); } }
</style>
