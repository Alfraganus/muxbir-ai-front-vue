<template>
  <div class="ca-wrap">
    <div class="ca-card">
      <div class="ca-bg"/>

      <div class="ca-icon"><AppIcon name="Tag" :size="26"/></div>
      <h1 class="ca-title">Tarifni faollashtiring</h1>
      <p class="ca-sub">
        Ilovadan foydalanish uchun obunangizni to'lov orqali faollashtiring.
        To'lov muvaffaqiyatli bo'lgach, hisobingiz avtomatik ochiladi.
      </p>

      <!-- Tanlangan tarif -->
      <div v-if="loadingPlan" class="ca-plan ca-plan-loading">
        <span class="ca-spinner"/> Yuklanmoqda...
      </div>
      <div v-else-if="plan" class="ca-plan">
        <div class="ca-plan-head">
          <span class="ca-plan-name">{{ planName }}</span>
          <span class="ca-plan-status">{{ statusLabel }}</span>
        </div>
        <div class="ca-plan-price">
          {{ formatSom(planPrice) }} <span>so'm / oy</span>
        </div>
        <div class="ca-plan-limits">
          <div><AppIcon name="Send" :size="13"/> Oylik: <b>{{ limitLabel(plan.tariff?.posts_monthly_limit) }}</b> post</div>
          <div><AppIcon name="Bolt" :size="13"/> Kunlik: <b>{{ limitLabel(plan.tariff?.posts_daily_limit) }}</b> post</div>
        </div>
      </div>
      <div v-else class="ca-plan ca-plan-empty">
        Tarif tanlanmagan. Iltimos, qo'llab-quvvatlash bilan bog'laning.
      </div>

      <div v-if="error" class="ca-error">{{ error }}</div>

      <!-- To'lov -->
      <button class="ca-pay" :disabled="paying || !plan" @click="pay">
        <span v-if="paying" class="ca-spinner ca-spinner-light"/>
        <template v-else>
          <span class="ca-click-logo">Click</span> bilan to'lash
        </template>
      </button>

      <button class="ca-logout" @click="logout">Chiqish</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { subscriptionsApi } from '@/api/subscriptions.js'
import { useClickPayment } from '@/composables/useClickPayment.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const { payWithClick } = useClickPayment()

const plan = ref(null)
const loadingPlan = ref(true)
const paying = ref(false)
const error = ref('')

const planName = computed(() => {
  const n = plan.value?.tariff?.name_i18n
  return (typeof n === 'string' ? n : (n?.uz || n?.ru || n?.en)) || plan.value?.tariff?.slug || 'Tarif'
})
const planPrice = computed(() => Number(plan.value?.tariff?.price_monthly || 0))
const statusLabel = computed(() => {
  const s = plan.value?.status
  return s === 'past_due' ? "To'lov kutilmoqda" : s === 'expired' ? 'Muddati tugagan' : 'Faollashtirilmagan'
})

function limitLabel(v) { return Number(v) > 0 ? Number(v).toLocaleString('uz-UZ').replace(/,/g, ' ') : '∞' }
function formatSom(n) { return (Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ') }

async function load() {
  loadingPlan.value = true
  try {
    plan.value = await subscriptionsApi.getMine()
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Obuna ma\'lumotini olishda xatolik'
  } finally {
    loadingPlan.value = false
  }
}

async function pay() {
  error.value = ''
  paying.value = true
  try {
    await payWithClick(plan.value?.id || null) // Click sahifasiga yo'naltiradi
  } catch (e) {
    error.value = e?.response?.data?.message ?? e?.message ?? 'To\'lovni boshlashda xatolik'
    paying.value = false
  }
}

async function logout() {
  try { await authStore.logout() } catch {}
  router.push('/signin')
}

onMounted(load)
</script>

<style scoped>
.ca-wrap {
  min-height: 100vh; width: 100%;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; background: var(--bg-2);
}
.ca-card {
  position: relative; overflow: hidden;
  width: 100%; max-width: 440px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 20px; padding: 30px 26px 22px;
  box-shadow: 0 30px 90px -24px rgba(15,23,42,.4);
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.ca-bg {
  position: absolute; top: 0; left: 0; right: 0; height: 120px;
  background: linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 55%, #7c3aed));
  opacity: .12;
}
.ca-icon {
  position: relative; width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-bg); color: var(--accent); margin-bottom: 16px;
}
.ca-title { position: relative; font-size: 20px; font-weight: 800; color: var(--text); margin: 0 0 8px; }
.ca-sub { position: relative; font-size: 13px; color: var(--muted); line-height: 1.55; margin: 0 0 20px; max-width: 360px; }

.ca-plan {
  position: relative; width: 100%; box-sizing: border-box;
  border: 1.5px solid var(--accent); border-radius: 14px; padding: 16px;
  background: color-mix(in oklab, var(--accent) 6%, transparent); margin-bottom: 16px;
}
.ca-plan-loading, .ca-plan-empty {
  border-color: var(--border); background: var(--panel);
  color: var(--muted); font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.ca-plan-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.ca-plan-name { font-size: 15px; font-weight: 700; color: var(--text); }
.ca-plan-status { font-size: 10.5px; font-weight: 600; color: #b45309; background: rgba(234,179,8,.14); padding: 2px 8px; border-radius: 999px; }
.ca-plan-price { font-size: 22px; font-weight: 800; color: var(--text); }
.ca-plan-price span { font-size: 12px; font-weight: 500; color: var(--muted); }
.ca-plan-limits { display: flex; gap: 16px; justify-content: center; margin-top: 12px; font-size: 12px; color: var(--text-2); }
.ca-plan-limits > div { display: inline-flex; align-items: center; gap: 5px; }

.ca-error { position: relative; width: 100%; box-sizing: border-box; margin-bottom: 12px; padding: 9px 12px; border-radius: 8px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); color: #ef4444; font-size: 12.5px; }

.ca-pay {
  position: relative; width: 100%; padding: 13px; border: none; border-radius: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  background: linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #7c3aed));
  color: #fff; font-size: 14px; font-weight: 700;
  box-shadow: 0 10px 24px -8px color-mix(in oklab, var(--accent) 60%, transparent);
  transition: filter .15s, transform .1s;
}
.ca-pay:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.ca-pay:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; }
.ca-click-logo { font-weight: 800; }

.ca-logout {
  position: relative; margin-top: 14px; background: none; border: none;
  color: var(--muted); font-size: 12.5px; cursor: pointer; text-decoration: underline;
}
.ca-logout:hover { color: var(--text); }

.ca-spinner { width: 15px; height: 15px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: ca-spin .7s linear infinite; display: inline-block; }
.ca-spinner-light { border-color: rgba(255,255,255,.4); border-top-color: #fff; }
@keyframes ca-spin { to { transform: rotate(360deg); } }
</style>
