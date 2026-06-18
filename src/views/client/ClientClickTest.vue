<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:900px;">
    <PageHeader title="Click to'lov sinovi" subtitle="Har bir tur 1000 so'mlik haqiqiy to'lov yaratadi" />

    <AppPanel :padding="14">
      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--muted);line-height:1.55;">
        <AppIcon name="Bolt" :size="14" style="margin-top:1px;flex-shrink:0;"/>
        <span>
          Har bir tugma bosilganda <strong style="color:var(--text);">yangi 1000 so'mlik</strong> PENDING to'lov yaratiladi va Click to'lov sahifasiga o'tiladi.
          To'lov tugagach Click <code>prepare</code> → <code>complete</code> chaqiradi va to'lov holati <code>completed</code> bo'ladi.
          Sinov uchun Click Up ilovasi kerak.
        </span>
      </div>
    </AppPanel>

    <!-- To'lov turlari -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      <AppPanel v-for="t in types" :key="t.id" :padding="16">
        <div style="display:flex;flex-direction:column;gap:10px;height:100%;">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--accent-bg);display:inline-flex;align-items:center;justify-content:center;">
            <AppIcon :name="t.icon" :size="17" style="color:var(--accent);"/>
          </div>
          <div style="font-size:13.5px;font-weight:600;">{{ t.name }}</div>
          <div style="font-size:11.5px;color:var(--muted);line-height:1.5;flex:1;">{{ t.desc }}</div>
          <AppButton variant="primary" size="md" :loading="loading===t.id" @click="runType(t.id)">
            <template #icon><AppIcon name="Coin" :size="13"/></template>1000 so'm to'lash
          </AppButton>
        </div>
      </AppPanel>
    </div>

    <span v-if="err" style="font-size:12.5px;color:var(--danger);">{{ err }}</span>

    <!-- Havola turi natijasi -->
    <AppPanel v-if="last && lastType==='link'" title="To'lov havolasi" :padding="16">
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="font-size:11px;color:var(--muted);">Payment ID: <span class="mono">{{ last.payment_id }}</span></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input :value="last.pay_url" readonly
            style="flex:1;font-size:11.5px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--panel-2);font-family:var(--font-mono);"/>
          <AppButton variant="secondary" size="md" @click="copyLink(last.pay_url)">
            {{ copied ? 'Nusxalandi' : 'Nusxalash' }}
          </AppButton>
          <AppButton variant="primary" size="md" @click="openLink(last.pay_url)">Ochish</AppButton>
        </div>
        <div style="font-size:11px;color:var(--muted);">Bu havolani telefonда ochib Click Up orqali to'lashingiz mumkin.</div>
      </div>
    </AppPanel>

    <!-- Holatni tekshirish -->
    <AppPanel title="To'lov holatini tekshirish" :padding="16">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input v-model="checkId" placeholder="Payment ID (bo'sh — oxirgisi)"
          style="flex:1;min-width:240px;font-size:12px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--panel-2);font-family:var(--font-mono);"/>
        <AppButton variant="secondary" size="md" :loading="checking" @click="checkStatus">Tekshirish</AppButton>
      </div>
      <div v-if="checkResult" style="margin-top:12px;display:flex;flex-direction:column;gap:6px;font-size:12.5px;">
        <template v-if="checkResult.error">
          <span style="color:var(--danger);">{{ checkResult.error }}</span>
        </template>
        <template v-else>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">ID</span><span class="mono">{{ checkResult.id }}</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--muted);">Holat</span>
            <AppBadge :tone="statusTone(checkResult.status)">{{ checkResult.status }}</AppBadge>
          </div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Summa</span><span class="tabular">{{ checkResult.amount }} so'm</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Usul</span><span>{{ checkResult.method }}</span></div>
          <div v-if="checkResult.transaction_id" style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Click trans</span><span class="mono">{{ checkResult.transaction_id }}</span></div>
        </template>
      </div>
    </AppPanel>

    <!-- Kabinet sozlamalari -->
    <AppPanel title="merchant.click.uz uchun sozlamalar" :padding="16">
      <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
        <div style="color:var(--muted);">Сервисы → qalam ikonkasi → quyidagi URL'larni yozing:</div>
        <div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:var(--muted);">Prepare URL</span><span class="mono" style="word-break:break-all;text-align:right;">{{ prepareUrl }}</span></div>
        <div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:var(--muted);">Complete URL</span><span class="mono" style="word-break:break-all;text-align:right;">{{ completeUrl }}</span></div>
        <div v-if="last?.params" style="display:flex;justify-content:space-between;gap:8px;margin-top:4px;"><span style="color:var(--muted);">service_id</span><span class="mono">{{ last.params.service_id }}</span></div>
        <div v-if="last?.params" style="display:flex;justify-content:space-between;gap:8px;"><span style="color:var(--muted);">merchant_id</span><span class="mono">{{ last.params.merchant_id }}</span></div>
      </div>
    </AppPanel>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { paymentsApi } from '@/api/payments.js'
import { API_BASE } from '@/api/base.js'

const types = [
  { id: 'redirect', name: 'Yo\'naltirish', icon: 'Arrow', desc: 'JS orqali Click to\'lov sahifasiga o\'tadi (window.location).' },
  { id: 'form', name: 'Click tugma (form)', icon: 'Bolt', desc: 'HTML GET-form orqali Click sahifasiga yuboriladi — saytga o\'rnatiladigan tugma usuli.' },
  { id: 'link', name: 'Havola / QR', icon: 'Send', desc: 'To\'lov havolasini ko\'rsatadi — telefonda ochib yoki ulashib to\'lash uchun.' },
]

const loading = ref(null)
const err = ref('')
const last = ref(null)
const lastType = ref(null)
const copied = ref(false)

const prepareUrl = `${API_BASE}/payments/click/prepare`
const completeUrl = `${API_BASE}/payments/click/complete`

async function runType(type) {
  loading.value = type
  err.value = ''
  try {
    const res = await paymentsApi.clickTest()
    last.value = res
    lastType.value = type
    if (type === 'redirect') {
      window.location.href = res.pay_url
    } else if (type === 'form') {
      submitGetForm(res.pay_base, res.params)
    }
    // 'link' — natija pastda ko'rsatiladi
  } catch (e) {
    err.value = e?.response?.data?.message || e.message || 'Xatolik yuz berdi'
  } finally {
    loading.value = null
  }
}

function submitGetForm(base, params) {
  const form = document.createElement('form')
  form.method = 'GET'
  form.action = base
  Object.entries(params).forEach(([k, v]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = k
    input.value = v
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch { /* ignore */ }
}

function openLink(url) {
  window.open(url, '_blank')
}

// ── Holat tekshirish ──
const checkId = ref('')
const checking = ref(false)
const checkResult = ref(null)

async function checkStatus() {
  const id = checkId.value.trim() || last.value?.payment_id
  if (!id) { checkResult.value = { error: 'Payment ID kiriting yoki avval to\'lov yarating' }; return }
  checking.value = true
  try {
    checkResult.value = await paymentsApi.getOne(id)
  } catch (e) {
    checkResult.value = { error: e?.response?.data?.message || 'To\'lov topilmadi' }
  } finally {
    checking.value = false
  }
}

function statusTone(status) {
  if (status === 'completed') return 'accent'
  if (status === 'failed' || status === 'refunded') return 'danger'
  return 'muted'
}
</script>
