<template>
  <Teleport to="body">
    <Transition name="ts-fade">
      <div v-if="modelValue" class="ts-overlay" @click.self="close">
        <div class="ts-modal">
          <div class="ts-header">
            <div>
              <div class="ts-title">{{ tt('tsm.title') }}</div>
              <div class="ts-sub">{{ tt('tsm.subtitle') }}</div>
            </div>
            <button class="ts-close" @click="close" :aria-label="tt('tsm.close')">
              <AppIcon name="Close" :size="16"/>
            </button>
          </div>

          <div class="ts-body">
            <div v-if="loading" class="ts-state"><span class="ts-spin"/> {{ tt('tsm.loading') }}</div>
            <div v-else-if="!tariffs.length" class="ts-state">{{ tt('tsm.noTariffs') }}</div>

            <div v-else class="ts-list">
              <button
                v-for="tr in tariffs" :key="tr.id"
                class="ts-card" :class="{ active: selectedId === tr.id, current: tr.id === currentTariffId }"
                @click="selectedId = tr.id"
              >
                <div class="ts-card-head">
                  <span class="ts-card-name">{{ name(tr) }}</span>
                  <span v-if="tr.id === currentTariffId" class="ts-badge">{{ tt('tsm.current') }}</span>
                </div>
                <div class="ts-card-price">{{ formatSom(tr.price_monthly) }} <span>{{ tt('billing.som') }}</span></div>
                <ul class="ts-card-feats">
                  <li><AppIcon name="Check" :size="12"/> {{ tt('tsm.duration', { days: tr.duration_days }) }}</li>
                  <li><AppIcon name="Check" :size="12"/> {{ tt('tsm.postDaily', { n: tr.posts_daily_limit || '∞' }) }}</li>
                  <li><AppIcon name="Check" :size="12"/> {{ tt('tsm.credits', { n: tr.free_credits_monthly }) }}</li>
                </ul>
              </button>
            </div>

            <div v-if="error" class="ts-error">{{ error }}</div>
          </div>

          <div class="ts-footer">
            <button class="ts-btn-ghost" @click="close" :disabled="paying">{{ tt('tsm.cancel') }}</button>
            <button class="ts-btn-pay" :disabled="paying || !selectedId" @click="proceed">
              <span v-if="paying" class="ts-spin ts-spin-sm"/>
              <template v-else>
                <AppIcon name="Coin" :size="14"/>
                {{ selectedId === currentTariffId ? tt('tsm.extend') : tt('tsm.select') }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { tariffsApi } from '@/api/tariffs.js'
import { paymentsApi } from '@/api/payments.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  currentTariffId: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])

const tariffs = ref([])
const loading = ref(false)
const error = ref('')
const selectedId = ref(null)
const paying = ref(false)

function name(tr) {
  // Backend i18n interceptor `name_i18n` ni `name` stringga aylantiradi.
  if (typeof tr?.name === 'string' && tr.name) return tr.name
  const n = tr?.name_i18n
  return (typeof n === 'string' ? n : n?.uz || n?.ru || n?.en) || 'Tarif'
}
function formatSom(n) { return (Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ') }
function close() { if (!paying.value) emit('update:modelValue', false) }

async function load() {
  loading.value = true
  error.value = ''
  try {
    const list = await tariffsApi.list()
    const filtered = Array.isArray(list) ? list.filter(tr => tr.slug !== 'trial') : []
    tariffs.value = [...filtered].sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0))
    selectedId.value = props.currentTariffId || tariffs.value[0]?.id || null
  } catch (e) {
    error.value = e?.response?.data?.message || tt('tsm.err.load')
  } finally {
    loading.value = false
  }
}

async function proceed() {
  if (!selectedId.value) return
  error.value = ''
  paying.value = true
  try {
    // Tarif almashtirish to'lovi — backend tarifni FAQAT to'lov muvaffaqiyatli
    // bo'lganda o'zgartiradi (initiate paytida emas). To'lov bekor qilinsa,
    // tarif eski holicha qoladi.
    const { payment_url } = await paymentsApi.initiateTariff(selectedId.value)
    if (!payment_url) throw new Error(tt('tsm.err.noUrl'))
    window.location.href = payment_url
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || tt('tsm.err.generic')
    paying.value = false
  }
}

watch(() => props.modelValue, (v) => { if (v) { paying.value = false; load() } })
</script>

<style scoped>
.ts-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(10, 15, 30, 0.55);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.ts-modal {
  width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--r-xl); box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
}
.ts-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 18px 18px 14px; }
.ts-title { font-size: 17px; font-weight: 700; color: var(--text); }
.ts-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.ts-close { width: 30px; height: 30px; border-radius: var(--r-sm); flex-shrink: 0;
  border: 1px solid var(--border); background: var(--panel); color: var(--muted);
  display: flex; align-items: center; justify-content: center; cursor: pointer; }
.ts-close:hover { background: var(--panel-2); color: var(--text); }

.ts-body { padding: 0 18px 4px; }
.ts-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px 0; color: var(--muted); font-size: 13px; }
.ts-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ts-card { text-align: left; display: flex; flex-direction: column; gap: 8px;
  padding: 14px; border-radius: var(--r-lg); cursor: pointer;
  border: 1.5px solid var(--border); background: var(--panel);
  transition: border-color .15s, background .15s, transform .1s; }
.ts-card:hover { border-color: var(--accent); transform: translateY(-1px); }
.ts-card.active { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 8%, transparent); box-shadow: var(--ring); }
.ts-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ts-card-name { font-size: 13.5px; font-weight: 700; color: var(--text); }
.ts-badge { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
  padding: 2px 7px; border-radius: 999px; color: var(--accent); background: var(--accent-bg); }
.ts-card-price { font-size: 18px; font-weight: 800; color: var(--text); }
.ts-card-price span { font-size: 11px; font-weight: 500; color: var(--muted); }
.ts-card-feats { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.ts-card-feats li { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-2); }
.ts-card-feats svg { color: var(--success); flex-shrink: 0; }

.ts-error { margin-top: 12px; padding: 9px 12px; border-radius: var(--r-sm);
  background: var(--danger-bg); border: 1px solid color-mix(in oklab, var(--danger) 30%, transparent); color: var(--danger); font-size: 12.5px; }

.ts-footer { display: flex; gap: 10px; padding: 14px 18px 18px; }
.ts-btn-ghost { flex: 0 0 auto; padding: 11px 18px; border-radius: var(--r-md); cursor: pointer;
  border: 1px solid var(--border); background: transparent; color: var(--muted); font-size: 13px; }
.ts-btn-ghost:hover:not(:disabled) { background: var(--panel); color: var(--text); }
.ts-btn-pay { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 11px 18px; border-radius: var(--r-md); cursor: pointer; border: none;
  background: var(--accent-grad); color: #fff; font-size: 13.5px; font-weight: 700;
  box-shadow: 0 8px 20px -6px color-mix(in oklab, var(--accent) 60%, transparent); transition: filter .15s, transform .1s; }
.ts-btn-pay:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.ts-btn-pay:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }

.ts-spin { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: tsspin .7s linear infinite; }
.ts-spin-sm { width: 15px; height: 15px; border-color: rgba(255,255,255,.4); border-top-color: #fff; }
@keyframes tsspin { to { transform: rotate(360deg); } }

.ts-fade-enter-active, .ts-fade-leave-active { transition: opacity .2s ease; }
.ts-fade-enter-from, .ts-fade-leave-to { opacity: 0; }
</style>
