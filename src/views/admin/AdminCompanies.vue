<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader
      :title="`Kompaniyalar`"
      :subtitle="subtitleText"
    >
      <template #right>
        <AppButton variant="secondary" size="md" @click="load">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          Yangilash
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <AppTabs v-model="filter" :items="filterTabs" />
      <div style="flex:1;" />
      <AppInput v-model="query" placeholder="Nom yoki egasi..." :style="{ width:'240px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
      </AppInput>
    </div>

    <AppPanel :padding="0">
      <div v-if="loading" style="padding:40px;text-align:center;color:var(--muted);font-size:13px;">Yuklanmoqda...</div>
      <div v-else-if="error" style="padding:40px;text-align:center;color:var(--danger);font-size:13px;">{{ error }}</div>
      <div v-else-if="!filtered.length" style="padding:40px;text-align:center;color:var(--muted);font-size:13px;">Kompaniya topilmadi</div>
      <table v-else style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th v-for="h in colHeaders" :key="h.label"
              :style="{ textAlign: h.right ? 'right' : 'left', padding:'10px 12px', fontWeight:500, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--muted)' }">
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in filtered" :key="c.id"
            :style="{ borderTop: i===0?'none':'1px solid var(--border-2)' }">
            <td style="padding:10px 12px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                <AppAvatar :name="c.name" :size="28"/>
                <div style="display:flex;flex-direction:column;">
                  <span style="font-weight:500;">{{ c.name }}</span>
                  <span style="font-size:11px;color:var(--muted);">
                    <span class="mono">{{ c.owner?.email || '—' }}</span>
                    <span v-if="c.owner?.full_name"> · {{ c.owner.full_name }}</span>
                  </span>
                </div>
              </div>
            </td>
            <td style="padding:10px 12px;vertical-align:middle;">
              <PlanPill v-if="c.subscription?.tariff" :plan="planLabel(c.subscription.tariff)"/>
              <span v-else style="font-size:11px;color:var(--muted);">— tarif yo'q —</span>
            </td>
            <td style="padding:10px 12px;vertical-align:middle;font-size:11.5px;color:var(--muted);">
              <span v-if="c.subscription">{{ billingLabel(c.subscription.billing_cycle) }}</span>
              <span v-else>—</span>
            </td>
            <td style="padding:10px 12px;vertical-align:middle;text-align:right;" class="tabular">
              {{ c.subscription?.tariff?.channels_limit ?? '—' }}
            </td>
            <td style="padding:10px 12px;vertical-align:middle;text-align:right;" class="tabular">
              {{ formatNum(c.subscription?.tariff?.posts_monthly_limit) }}
            </td>
            <td style="padding:10px 12px;vertical-align:middle;text-align:right;font-weight:500;" class="tabular">
              {{ priceLabel(c.subscription) }}
            </td>
            <td style="padding:10px 12px;vertical-align:middle;">
              <AppStatus :kind="mapStatus(c.status)"/>
            </td>
            <td style="padding:10px 12px;vertical-align:middle;font-size:11.5px;color:var(--muted);" class="mono">
              {{ formatDate(c.created_at) }}
            </td>
            <td style="padding:10px 12px;vertical-align:middle;text-align:right;">
              <AppButton variant="secondary" size="sm" @click="openTariffModal(c)">
                Tarifni o'zgartirish
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
        <span>{{ filtered.length }} / {{ companies.length }} ko'rsatildi</span>
      </div>
    </AppPanel>

    <AppModal
      v-model="modalOpen"
      :title="`Tarifni o'zgartirish`"
      :subtitle="selected ? selected.name : ''"
      width="480px"
    >
      <div v-if="selected" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="font-size:11.5px;color:var(--muted);display:block;margin-bottom:6px;font-weight:500;">Tarif</label>
          <select v-model="form.tariff_id" :style="selectStyle">
            <option v-for="t in tariffs" :key="t.id" :value="t.id">
              {{ planLabel(t) }} — {{ formatNum(t.price_monthly) }} so'm/oy
            </option>
          </select>
        </div>
        <div>
          <label style="font-size:11.5px;color:var(--muted);display:block;margin-bottom:6px;font-weight:500;">To'lov davri</label>
          <select v-model="form.billing_cycle" :style="selectStyle">
            <option value="monthly">Oylik</option>
            <option value="yearly">Yillik</option>
          </select>
        </div>
        <div>
          <label style="font-size:11.5px;color:var(--muted);display:block;margin-bottom:6px;font-weight:500;">Holat</label>
          <select v-model="form.status" :style="selectStyle">
            <option value="trial">Sinov (trial)</option>
            <option value="active">Faol</option>
            <option value="past_due">Qarz</option>
            <option value="canceled">Bekor qilingan</option>
            <option value="expired">Muddati o'tgan</option>
          </select>
        </div>
        <div v-if="submitError" style="color:var(--danger);font-size:12px;">{{ submitError }}</div>
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="modalOpen = false">Bekor qilish</AppButton>
        <AppButton variant="primary" size="md" :disabled="submitting || !form.tariff_id" @click="submit">
          {{ submitting ? 'Saqlanmoqda...' : "Saqlash" }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppStatus from '@/components/ui/AppStatus.vue'
import AppModal from '@/components/ui/AppModal.vue'
import PlanPill from '@/components/ui/PlanPill.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { adminApi } from '@/api/admin.js'
import { tariffsApi } from '@/api/tariffs.js'

const companies = ref([])
const tariffs = ref([])
const loading = ref(false)
const error = ref(null)
const filter = ref('all')
const query = ref('')

const modalOpen = ref(false)
const selected = ref(null)
const submitting = ref(false)
const submitError = ref(null)
const form = reactive({ tariff_id: '', billing_cycle: 'monthly', status: 'active' })

const selectStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: '7px',
  background: 'var(--panel-2)',
  color: 'var(--text)',
  fontSize: '13px',
  outline: 'none',
}

const subtitleText = computed(() => {
  const total = companies.value.length
  const active = companies.value.filter(c => c.status === 'active').length
  return `${total} ta kompaniya · ${active} ta faol`
})

const filterTabs = computed(() => [
  { value: 'all',       label: 'Hammasi',  count: companies.value.length },
  { value: 'active',    label: 'Faol',     count: companies.value.filter(c => c.status === 'active').length },
  { value: 'trial',     label: 'Sinov',    count: companies.value.filter(c => c.status === 'trial').length },
  { value: 'suspended', label: "To'xtatilgan", count: companies.value.filter(c => c.status === 'suspended').length },
  { value: 'inactive',  label: 'Nofaol',   count: companies.value.filter(c => c.status === 'inactive').length },
])

const filtered = computed(() => companies.value.filter(c => {
  const fOk = filter.value === 'all' || c.status === filter.value
  const q = query.value.trim().toLowerCase()
  const qOk = !q
    || c.name?.toLowerCase().includes(q)
    || c.owner?.email?.toLowerCase().includes(q)
    || c.owner?.full_name?.toLowerCase().includes(q)
  return fOk && qOk
}))

const colHeaders = [
  { label: 'Kompaniya' },
  { label: 'Tarif' },
  { label: "To'lov" },
  { label: 'Kanal limit', right: true },
  { label: 'Postlar/oy', right: true },
  { label: 'Narx', right: true },
  { label: 'Status' },
  { label: "Qo'shilgan" },
  { label: '' },
]

function planLabel(t) {
  if (!t) return ''
  const lang = localStorage.getItem('lang') || 'uz'
  return t.name_i18n?.[lang] || t.name_i18n?.uz || t.slug || 'Tarif'
}

function billingLabel(c) {
  return c === 'yearly' ? 'Yillik' : 'Oylik'
}

function priceLabel(sub) {
  if (!sub?.tariff) return '—'
  const price = sub.billing_cycle === 'yearly' ? sub.tariff.price_yearly : sub.tariff.price_monthly
  if (!price) return 'Bepul'
  return formatNum(price) + " so'm"
}

function formatNum(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('uz-UZ').replace(/,/g, ' ')
}

function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function mapStatus(s) {
  // Map company.status (CompanyStatus) onto AppStatus kinds
  if (s === 'active') return 'active'
  if (s === 'trial') return 'trial'
  if (s === 'suspended') return 'paused'
  if (s === 'inactive') return 'cancelled'
  return s
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [cs, ts] = await Promise.all([adminApi.listCompanies(), tariffsApi.list()])
    companies.value = Array.isArray(cs) ? cs : []
    tariffs.value = Array.isArray(ts) ? ts : []
  } catch (e) {
    error.value = e.response?.data?.message || 'Maʼlumotlarni yuklab boʻlmadi'
  } finally {
    loading.value = false
  }
}

function openTariffModal(c) {
  selected.value = c
  submitError.value = null
  form.tariff_id = c.subscription?.tariff?.id || tariffs.value[0]?.id || ''
  form.billing_cycle = c.subscription?.billing_cycle || 'monthly'
  form.status = c.subscription?.status || 'active'
  modalOpen.value = true
}

async function submit() {
  if (!selected.value || !form.tariff_id) return
  submitting.value = true
  submitError.value = null
  try {
    const updated = await adminApi.setCompanyTariff(selected.value.id, {
      tariff_id: form.tariff_id,
      billing_cycle: form.billing_cycle,
      status: form.status,
    })
    const idx = companies.value.findIndex(x => x.id === updated.id)
    if (idx !== -1) companies.value.splice(idx, 1, updated)
    modalOpen.value = false
  } catch (e) {
    submitError.value = e.response?.data?.message || 'Saqlashda xatolik'
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>
