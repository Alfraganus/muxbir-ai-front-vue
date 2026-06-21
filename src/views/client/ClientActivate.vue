<template>
  <div class="ca-wrap">
    <div class="ca-card">
      <div class="ca-bg"/>

      <div class="ca-icon"><AppIcon name="Tag" :size="26"/></div>
      <h1 class="ca-title">{{ tt('clientActivate.title') }}</h1>
      <p class="ca-sub">
        {{ tt('clientActivate.subtitle') }}
      </p>

      <!-- Tarif tanlash -->
      <div v-if="loadingPlan" class="ca-plan ca-plan-loading">
        <span class="ca-spinner"/> {{ tt('clientActivate.loading') }}
      </div>
      <div v-else-if="!tariffs.length" class="ca-plan ca-plan-empty">
        {{ tt('clientActivate.noTariffs') }}
      </div>
      <div v-else class="ca-tariffs">
        <button
          v-for="tr in tariffs" :key="tr.id" type="button"
          class="ca-tariff" :class="{ active: selectedTariffId === tr.id }"
          @click="selectedTariffId = tr.id"
        >
          <span class="ca-tariff-radio"><span v-if="selectedTariffId === tr.id" class="ca-tariff-dot"/></span>
          <span class="ca-tariff-info">
            <span class="ca-tariff-name">{{ tName(tr) }}</span>
            <span class="ca-tariff-meta">
              {{ tt('clientActivate.tariffMeta', { limit: limitLabel(tr.posts_daily_limit), days: tr.duration_days, credits: tr.free_credits_monthly }) }}
            </span>
          </span>
          <span class="ca-tariff-price">{{ formatSom(tr.price_monthly) }} <small>{{ tt('clientActivate.som') }}</small></span>
        </button>
      </div>

      <div v-if="error" class="ca-error">{{ error }}</div>

      <!-- To'lov -->
      <button class="ca-pay" :disabled="paying || !selectedTariffId" @click="pay">
        <span v-if="paying" class="ca-spinner ca-spinner-light"/>
        <template v-else>
          <span class="ca-click-logo">Click</span> {{ tt('clientActivate.payWith') }}
        </template>
      </button>

      <button class="ca-logout" @click="logout">{{ tt('clientActivate.logout') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { subscriptionsApi } from '@/api/subscriptions.js'
import { tariffsApi } from '@/api/tariffs.js'
import { paymentsApi } from '@/api/payments.js'
import { useAuthStore } from '@/stores/auth.js'
import { useAppStore } from '@/stores/app.js'

const router = useRouter()
const authStore = useAuthStore()
const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const tariffs = ref([])
const selectedTariffId = ref(null)
const loadingPlan = ref(true)
const paying = ref(false)
const error = ref('')

function tName(tr) {
  const n = tr?.name_i18n
  return (typeof n === 'string' ? n : (n?.uz || n?.ru || n?.en)) || tr?.slug || tt('clientActivate.tariffFallback')
}
function limitLabel(v) { return Number(v) > 0 ? Number(v).toLocaleString('uz-UZ').replace(/,/g, ' ') : '∞' }
function formatSom(n) { return (Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ') }

async function load() {
  loadingPlan.value = true
  try {
    const [sub, list] = await Promise.all([
      subscriptionsApi.getMine().catch(() => null),
      tariffsApi.list().catch(() => []),
    ])
    tariffs.value = Array.isArray(list) ? [...list].sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0)) : []
    // Joriy tarif bo'lsa oldindan tanlanadi, bo'lmasa birinchisi
    selectedTariffId.value = sub?.tariff_id || tariffs.value[0]?.id || null
  } catch (e) {
    error.value = e?.response?.data?.message ?? tt('clientActivate.loadError')
  } finally {
    loadingPlan.value = false
  }
}

async function pay() {
  if (!selectedTariffId.value) return
  error.value = ''
  paying.value = true
  try {
    // Tarif FAQAT to'lov muvaffaqiyatli bo'lganda faollashadi (deferred)
    const { payment_url } = await paymentsApi.initiateTariff(selectedTariffId.value)
    if (!payment_url) throw new Error(tt('clientActivate.noPaymentUrl'))
    window.location.href = payment_url
  } catch (e) {
    error.value = e?.response?.data?.message ?? e?.message ?? tt('clientActivate.payError')
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
  border: 1.5px solid var(--border); border-radius: 14px; padding: 16px;
  background: var(--panel); color: var(--muted); font-size: 13px; margin-bottom: 16px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

/* Tarif ro'yxati */
.ca-tariffs {
  position: relative; width: 100%; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;
  max-height: 280px; overflow-y: auto;
}
.ca-tariff {
  display: flex; align-items: center; gap: 11px; text-align: left;
  padding: 12px 14px; border-radius: 12px; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--panel);
  transition: border-color .15s, background .15s;
}
.ca-tariff:hover { border-color: var(--accent); }
.ca-tariff.active { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 7%, transparent); box-shadow: var(--ring); }
.ca-tariff-radio {
  width: 18px; height: 18px; border-radius: 999px; flex-shrink: 0;
  border: 2px solid var(--border); display: inline-flex; align-items: center; justify-content: center;
}
.ca-tariff.active .ca-tariff-radio { border-color: var(--accent); }
.ca-tariff-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--accent); }
.ca-tariff-info { display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 2px; }
.ca-tariff-name { font-size: 13.5px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ca-tariff-meta { font-size: 10.5px; color: var(--muted); }
.ca-tariff-price { font-size: 14px; font-weight: 800; color: var(--text); white-space: nowrap; flex-shrink: 0; }
.ca-tariff-price small { font-size: 10px; font-weight: 500; color: var(--muted); }

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
