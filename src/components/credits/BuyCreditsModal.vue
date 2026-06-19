<template>
  <Teleport to="body">
    <Transition name="bc-fade">
      <div v-if="modelValue" class="bc-overlay" @click.self="close">
        <div class="bc-modal">
          <!-- Header -->
          <div class="bc-header">
            <div class="bc-header-bg"/>
            <div class="bc-header-inner">
              <div>
                <div class="bc-header-title">Kredit sotib olish</div>
                <div class="bc-header-sub">Kreditlar oylik post limiti tugaganda ishlatiladi</div>
              </div>
              <button class="bc-close" @click="close" aria-label="Yopish">
                <AppIcon name="Close" :size="16"/>
              </button>
            </div>
            <!-- Joriy balans -->
            <div class="bc-balance">
              <span class="bc-balance-icon"><AppIcon name="Coin" :size="16"/></span>
              <div>
                <div class="bc-balance-label">Joriy balans</div>
                <div class="bc-balance-value">{{ formatCredit(balance) }} kredit</div>
              </div>
            </div>
          </div>

          <div class="bc-body">
            <!-- Paketlar -->
            <div class="bc-section-label">Paketni tanlang</div>
            <div class="bc-packs">
              <button
                v-for="p in packs" :key="p.credits"
                class="bc-pack" :class="{ active: selected === p.credits && !custom }"
                @click="selectPack(p.credits)"
              >
                <span v-if="p.popular" class="bc-pack-badge">Ommabop</span>
                <span class="bc-pack-credits">{{ formatNum(p.credits) }}</span>
                <span class="bc-pack-credits-label">kredit</span>
                <span class="bc-pack-price">{{ formatSom(p.credits * price) }} so'm</span>
              </button>
            </div>

            <!-- Boshqa miqdor -->
            <div class="bc-custom">
              <label class="bc-custom-label">
                <input type="checkbox" :checked="custom" @change="toggleCustom($event.target.checked)"/>
                Boshqa miqdor
              </label>
              <div v-if="custom" class="bc-custom-input">
                <button class="bc-step" @click="bump(-50)">−</button>
                <input
                  type="number" min="1" v-model.number="customCredits"
                  class="bc-input" placeholder="kredit"
                />
                <button class="bc-step" @click="bump(50)">+</button>
                <span class="bc-custom-suffix">kredit</span>
              </div>
            </div>

            <!-- To'lov usuli -->
            <div class="bc-section-label" style="margin-top:18px;">To'lov usuli</div>
            <div class="bc-methods">
              <button class="bc-method active">
                <span class="bc-click-logo">Click</span>
                <span class="bc-method-check"><AppIcon name="Check" :size="12"/></span>
              </button>
              <!-- Payme va Uzcard/Humo hozircha yashirilgan (tez orada) -->
              <!--
              <div class="bc-method disabled">
                <span style="font-weight:700;color:var(--muted);">Payme</span>
                <span class="bc-soon">tez orada</span>
              </div>
              <div class="bc-method disabled">
                <span style="font-weight:700;color:var(--muted);">Uzcard / Humo</span>
                <span class="bc-soon">tez orada</span>
              </div>
              -->
            </div>

            <!-- Yakuniy summary -->
            <div class="bc-summary">
              <div class="bc-summary-row">
                <span>{{ formatNum(finalCredits) }} kredit × {{ price }} so'm</span>
                <span class="bc-summary-amount">{{ formatSom(totalSom) }} so'm</span>
              </div>
              <div class="bc-summary-note">1 kredit = {{ price }} so'm</div>
            </div>

            <div v-if="error" class="bc-error">{{ error }}</div>
          </div>

          <!-- Footer -->
          <div class="bc-footer">
            <button class="bc-btn-ghost" @click="close" :disabled="loading">Bekor qilish</button>
            <button class="bc-btn-pay" :disabled="loading || finalCredits < 1" @click="pay">
              <span v-if="loading" class="bc-spinner"/>
              <template v-else>
                <AppIcon name="Coin" :size="14"/>
                {{ formatSom(totalSom) }} so'm — To'lash
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { paymentsApi, CREDIT_PRICE_SOM } from '@/api/payments.js'
import { useToast } from '@/composables/useToast.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue'])
const toast = useToast()

const price = CREDIT_PRICE_SOM
const packs = [
  { credits: 2000 },
  { credits: 5000 },
  { credits: 10000, popular: true },
  { credits: 20000 },
]
const selected = ref(10000)
const custom = ref(false)
const customCredits = ref(100)
const loading = ref(false)
const error = ref('')

const finalCredits = computed(() => {
  const n = custom.value ? Math.floor(Number(customCredits.value) || 0) : selected.value
  return n > 0 ? n : 0
})
const totalSom = computed(() => finalCredits.value * price)

function selectPack(c) { custom.value = false; selected.value = c }
function toggleCustom(on) { custom.value = on; if (on && !customCredits.value) customCredits.value = 100 }
function bump(delta) { customCredits.value = Math.max(1, (Number(customCredits.value) || 0) + delta) }
function close() { if (!loading.value) emit('update:modelValue', false) }

async function pay() {
  if (finalCredits.value < 1) return
  error.value = ''
  loading.value = true
  try {
    const res = await paymentsApi.initiateCredits(finalCredits.value)
    if (res?.pay_url) {
      // Click to'lov sahifasiga yo'naltiramiz
      window.location.href = res.pay_url
    } else {
      error.value = 'To\'lov havolasi olinmadi'
      loading.value = false
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'To\'lovni boshlashda xatolik'
    loading.value = false
  }
}

// Modal yopilganda holatni tiklaymiz
watch(() => props.modelValue, (v) => {
  if (v) { error.value = ''; loading.value = false }
})

function formatNum(n) { return (Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ') }
function formatSom(n) { return (Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ') }
function formatCredit(n) {
  const v = Number(n) || 0
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}
</script>

<style scoped>
.bc-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(10, 15, 30, 0.55);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.bc-modal {
  width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 18px; box-shadow: 0 30px 90px -20px rgba(15,23,42,.5);
  display: flex; flex-direction: column;
}

/* Header */
.bc-header { position: relative; padding: 18px 18px 16px; overflow: hidden; }
.bc-header-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 55%, #7c3aed) 100%);
  opacity: 0.13;
}
.bc-header-inner { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.bc-header-title { font-size: 17px; font-weight: 700; color: var(--text); }
.bc-header-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.bc-close {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  border: 1px solid var(--border); background: var(--panel); color: var(--muted);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.bc-close:hover { background: var(--panel-2); color: var(--text); }
.bc-balance {
  position: relative; margin-top: 14px;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 12px;
  background: var(--panel); border: 1px solid var(--border);
}
.bc-balance-icon {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-bg); color: var(--accent);
}
.bc-balance-label { font-size: 11px; color: var(--muted); }
.bc-balance-value { font-size: 15px; font-weight: 700; color: var(--text); }

/* Body */
.bc-body { padding: 16px 18px 4px; }
.bc-section-label {
  font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px;
}
.bc-packs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.bc-pack {
  position: relative; display: flex; flex-direction: column; align-items: center;
  padding: 14px 10px 12px; border-radius: 13px; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--panel);
  transition: border-color .15s, background .15s, transform .1s;
}
.bc-pack:hover { border-color: var(--accent); transform: translateY(-1px); }
.bc-pack.active { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 9%, transparent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 16%, transparent); }
.bc-pack-badge {
  position: absolute; top: -8px; right: 8px;
  font-size: 9px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 999px; color: #fff;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
}
.bc-pack-credits { font-size: 22px; font-weight: 800; color: var(--text); line-height: 1; }
.bc-pack-credits-label { font-size: 10.5px; color: var(--muted); margin-top: 2px; }
.bc-pack-price { font-size: 12px; font-weight: 600; color: var(--accent); margin-top: 8px; }

/* Custom */
.bc-custom { margin-top: 12px; }
.bc-custom-label { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--text-2); cursor: pointer; }
.bc-custom-input { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
.bc-step {
  width: 32px; height: 36px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--border); background: var(--panel); color: var(--text); font-size: 18px;
}
.bc-step:hover { border-color: var(--accent); color: var(--accent); }
.bc-input {
  flex: 1; min-width: 0; height: 36px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: 8px; background: var(--panel);
  color: var(--text); font-size: 14px; font-weight: 600; outline: none; text-align: center;
}
.bc-input:focus { border-color: var(--accent); }
.bc-custom-suffix { font-size: 12px; color: var(--muted); }

/* Methods */
.bc-methods { display: flex; flex-direction: column; gap: 8px; }
.bc-method {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px; border-radius: 11px; border: 1.5px solid var(--border); background: var(--panel);
  width: 100%; text-align: left;
}
.bc-method.active { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 8%, transparent); cursor: pointer; }
.bc-method.disabled { opacity: .55; }
.bc-click-logo {
  font-weight: 800; font-size: 15px; letter-spacing: -.01em;
  background: linear-gradient(90deg, #1f8fff, #00c2ff); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.bc-method-check {
  width: 20px; height: 20px; border-radius: 999px; background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.bc-soon { font-size: 10px; color: var(--muted); padding: 2px 8px; border: 1px solid var(--border-2); border-radius: 999px; }

/* Summary */
.bc-summary { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: var(--panel-2, var(--panel)); border: 1px dashed var(--border); }
.bc-summary-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-2); }
.bc-summary-amount { font-size: 18px; font-weight: 800; color: var(--text); }
.bc-summary-note { font-size: 11px; color: var(--muted); margin-top: 4px; }
.bc-error { margin-top: 12px; padding: 9px 12px; border-radius: 8px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); color: #ef4444; font-size: 12.5px; }

/* Footer */
.bc-footer { display: flex; gap: 10px; padding: 14px 18px 18px; }
.bc-btn-ghost {
  flex: 0 0 auto; padding: 11px 18px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--border); background: transparent; color: var(--muted); font-size: 13px;
}
.bc-btn-ghost:hover:not(:disabled) { background: var(--panel); color: var(--text); }
.bc-btn-pay {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 11px 18px; border-radius: 10px; cursor: pointer; border: none;
  background: linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #7c3aed));
  color: #fff; font-size: 13.5px; font-weight: 700;
  box-shadow: 0 8px 20px -6px color-mix(in oklab, var(--accent) 60%, transparent);
  transition: filter .15s, transform .1s;
}
.bc-btn-pay:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
.bc-btn-pay:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }

.bc-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: bc-spin .7s linear infinite; }
@keyframes bc-spin { to { transform: rotate(360deg); } }

.bc-fade-enter-active, .bc-fade-leave-active { transition: opacity .2s ease; }
.bc-fade-enter-from, .bc-fade-leave-to { opacity: 0; }
</style>
