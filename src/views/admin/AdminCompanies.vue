<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader
      :title="tt('adminCompanies.title')"
      :subtitle="subtitleText"
    >
      <template #right>
        <AppButton variant="secondary" size="md" @click="load">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          {{ tt('adminCompanies.refresh') }}
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <AppTabs v-model="filter" :items="filterTabs" />
      <div style="flex:1;" />
      <AppInput v-model="query" :placeholder="tt('adminCompanies.searchPlaceholder')" :style="{ width:'240px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
      </AppInput>
    </div>

    <AppPanel :padding="0">
      <div v-if="loading" style="padding:40px;text-align:center;color:var(--muted);font-size:13px;">{{ tt('adminCompanies.loading') }}</div>
      <div v-else-if="error" style="padding:40px;text-align:center;color:var(--danger);font-size:13px;">{{ error }}</div>
      <div v-else-if="!filtered.length" style="padding:40px;text-align:center;color:var(--muted);font-size:13px;">{{ tt('adminCompanies.notFound') }}</div>
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
              <span v-else style="font-size:11px;color:var(--muted);">{{ tt('adminCompanies.noTariff') }}</span>
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
            <td style="padding:10px 12px;vertical-align:middle;text-align:right;white-space:nowrap;">
              <AppButton v-if="hasPendingTrial(c)" variant="primary" size="sm" @click="approveTrial(c)" style="background:var(--success,#10b981);border-color:var(--success,#10b981)">
                <template #icon><AppIcon name="Check" :size="11"/></template>
                {{ tt('adminCompanies.approveTrial') }}
              </AppButton>
              <AppButton variant="secondary" size="sm" :loading="loginAsBusyId === c.id" :disabled="loginAsBusyId !== null" @click="loginAs(c)" :title="tt('adminCompanies.loginAsTitle', { name: c.name })">
                <template #icon><AppIcon name="Arrow" :size="11"/></template>
                {{ tt('adminCompanies.loginAs', { name: c.name }) }}
              </AppButton>
              <AppButton variant="ghost" size="sm" @click="openEditModal(c)">
                <template #icon><AppIcon name="Edit" :size="11"/></template>
                {{ tt('adminCompanies.edit') }}
              </AppButton>
              <AppButton variant="secondary" size="sm" @click="openTariffModal(c)">
                {{ tt('adminCompanies.tariff') }}
              </AppButton>
              <AppButton variant="ghost" size="sm" @click="onDelete(c)" :title="tt('adminCompanies.deleteCompany')">
                <template #icon><AppIcon name="Trash" :size="11"/></template>
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
        <span>{{ tt('adminCompanies.shownCount', { shown: filtered.length, total: companies.length }) }}</span>
      </div>
    </AppPanel>

    <AppModal
      v-model="modalOpen"
      :title="tt('adminCompanies.changeTariffTitle')"
      :subtitle="selected ? selected.name : ''"
      width="480px"
    >
      <div v-if="selected" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="font-size:11.5px;color:var(--muted);display:block;margin-bottom:6px;font-weight:500;">{{ tt('adminCompanies.tariff') }}</label>
          <select v-model="form.tariff_id" :style="selectStyle">
            <option v-for="t in tariffs" :key="t.id" :value="t.id">
              {{ planLabel(t) }} — {{ formatNum(t.price_monthly) }} {{ tt('adminCompanies.somPerMonth') }}
            </option>
          </select>
        </div>
        <div>
          <label style="font-size:11.5px;color:var(--muted);display:block;margin-bottom:6px;font-weight:500;">{{ tt('adminCompanies.billingPeriod') }}</label>
          <select v-model="form.billing_cycle" :style="selectStyle">
            <option value="monthly">{{ tt('adminCompanies.monthly') }}</option>
            <option value="yearly">{{ tt('adminCompanies.yearly') }}</option>
          </select>
        </div>
        <div>
          <label style="font-size:11.5px;color:var(--muted);display:block;margin-bottom:6px;font-weight:500;">{{ tt('adminCompanies.statusLabel') }}</label>
          <select v-model="form.status" :style="selectStyle">
            <option value="trial">{{ tt('adminCompanies.subStatusTrial') }}</option>
            <option value="active">{{ tt('adminCompanies.subStatusActive') }}</option>
            <option value="past_due">{{ tt('adminCompanies.subStatusPastDue') }}</option>
            <option value="canceled">{{ tt('adminCompanies.subStatusCanceled') }}</option>
            <option value="expired">{{ tt('adminCompanies.subStatusExpired') }}</option>
          </select>
        </div>
        <div v-if="submitError" style="color:var(--danger);font-size:12px;">{{ submitError }}</div>
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="modalOpen = false">{{ tt('adminCompanies.cancel') }}</AppButton>
        <AppButton variant="primary" size="md" :disabled="submitting || !form.tariff_id" @click="submit">
          {{ submitting ? tt('adminCompanies.saving') : tt('adminCompanies.save') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- ─── Edit company + owner + reset password ─── -->
    <AppModal
      v-model="editOpen"
      :title="tt('adminCompanies.editCompanyTitle')"
      :subtitle="editSelected ? editSelected.name : ''"
      width="560px"
    >
      <div v-if="editSelected" style="display:flex;flex-direction:column;gap:18px;">
        <!-- Company section -->
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;
                      text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">
            <AppIcon name="Settings" :size="12"/>
            {{ tt('adminCompanies.companyInfo') }}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">{{ tt('adminCompanies.fieldName') }}</label>
              <input v-model="editForm.name" :style="inputStyle"/>
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">{{ tt('adminCompanies.fieldSlug') }}</label>
              <input v-model="editForm.slug" :style="inputStyle" class="mono"/>
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">{{ tt('adminCompanies.fieldCountry') }}</label>
              <input v-model="editForm.country" :style="inputStyle" placeholder="UZ"/>
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">{{ tt('adminCompanies.fieldLocation') }}</label>
              <input v-model="editForm.location" :style="inputStyle" :placeholder="tt('adminCompanies.locationPlaceholder')"/>
            </div>
            <div style="grid-column:1/-1;">
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">{{ tt('adminCompanies.fieldStatus') }}</label>
              <select v-model="editForm.status" :style="selectStyle">
                <option value="active">{{ tt('adminCompanies.companyStatusActive') }}</option>
                <option value="trial">{{ tt('adminCompanies.companyStatusTrial') }}</option>
                <option value="suspended">{{ tt('adminCompanies.companyStatusSuspended') }}</option>
                <option value="inactive">{{ tt('adminCompanies.companyStatusInactive') }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Phone section -->
        <div style="display:flex;flex-direction:column;gap:10px;
                    padding-top:14px;border-top:1px dashed var(--border-2);">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">
              <AppIcon name="Phone" :size="12"/>
              {{ tt('adminCompanies.fieldPhones') }}
            </div>
            <button type="button" @click="editForm.phones.push('')"
                    style="font-size:11.5px;color:var(--accent);background:none;border:none;cursor:pointer;padding:0;">
              {{ tt('adminCompanies.addPhone') }}
            </button>
          </div>
          <div v-if="editForm.phones.length" style="display:flex;flex-direction:column;gap:6px;">
            <div v-for="(_, i) in editForm.phones" :key="i"
                 style="display:flex;gap:6px;align-items:center;">
              <input v-model="editForm.phones[i]" :style="{ ...inputStyle, flex: 1 }"
                     :placeholder="tt('adminCompanies.phonePlaceholder')"/>
              <button type="button" @click="editForm.phones.splice(i, 1)"
                      style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);
                             background:var(--panel-2);cursor:pointer;color:var(--danger);font-size:14px;
                             display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ×
              </button>
            </div>
          </div>
          <div v-else style="font-size:12px;color:var(--muted);">—</div>
        </div>

        <!-- Owner section -->
        <div style="display:flex;flex-direction:column;gap:10px;
                    padding-top:14px;border-top:1px dashed var(--border-2);">
          <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;
                      text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">
            <AppIcon name="Users" :size="12"/>
            {{ tt('adminCompanies.companyOwner') }}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">{{ tt('adminCompanies.fieldFullName') }}</label>
              <input v-model="editForm.owner_full_name" :style="inputStyle"/>
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">{{ tt('adminCompanies.fieldEmail') }}</label>
              <input v-model="editForm.owner_email" :style="inputStyle" class="mono"/>
            </div>
          </div>
        </div>

        <!-- Password reset section -->
        <div style="display:flex;flex-direction:column;gap:10px;
                    padding:14px;border-radius:10px;
                    background:color-mix(in oklab, var(--danger) 5%, transparent);
                    border:1px dashed color-mix(in oklab, var(--danger) 30%, transparent);">
          <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;
                      text-transform:uppercase;letter-spacing:0.05em;color:var(--danger);">
            <AppIcon name="Bolt" :size="12"/>
            {{ tt('adminCompanies.passwordReset') }}
          </div>
          <div style="font-size:11.5px;color:var(--text-2);line-height:1.5;">
            {{ tt('adminCompanies.passwordResetHint') }}
          </div>
          <div style="display:flex;gap:8px;align-items:stretch;">
            <input v-model="editForm.new_password" type="text"
                   :placeholder="tt('adminCompanies.newPasswordPlaceholder')"
                   :style="{ ...inputStyle, flex: 1 }"/>
            <button type="button" @click="generatePassword"
                    style="padding:0 12px;background:var(--panel-2);border:1px solid var(--border);
                           border-radius:7px;cursor:pointer;font-size:11.5px;color:var(--text-2);
                           white-space:nowrap;">
              ✨ {{ tt('adminCompanies.random') }}
            </button>
          </div>
          <div v-if="editForm.new_password" style="display:flex;align-items:center;gap:6px;
                      font-size:11px;color:var(--text-2);">
            <AppIcon name="Check" :size="10" :style="{color:'var(--success, #10b981)'}"/>
            {{ tt('adminCompanies.passwordWillChangePrefix') }} <span class="mono" style="background:var(--panel-2);padding:1px 6px;border-radius:4px;">{{ editForm.new_password }}</span> {{ tt('adminCompanies.passwordWillChangeSuffix') }}
          </div>
        </div>

        <div v-if="editError" style="color:var(--danger);font-size:12px;">{{ editError }}</div>
        <div v-if="editSuccess" style="color:var(--success, #10b981);font-size:12px;display:flex;align-items:center;gap:6px;">
          <AppIcon name="Check" :size="11"/>
          {{ editSuccess }}
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="editOpen = false">{{ tt('adminCompanies.cancel') }}</AppButton>
        <AppButton variant="primary" size="md" :disabled="editSubmitting" @click="submitEdit">
          {{ editSubmitting ? tt('adminCompanies.saving') : tt('adminCompanies.save') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
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
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

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

// ── Edit modal state ──────────────────────────────────────
const editOpen = ref(false)
const editSelected = ref(null)
const editSubmitting = ref(false)
const editError = ref(null)
const editSuccess = ref(null)
const editForm = reactive({
  name: '', slug: '', country: '', location: '', status: 'active',
  phones: [],
  owner_full_name: '', owner_email: '',
  new_password: '',
})

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: '7px',
  background: 'var(--panel-2)',
  color: 'var(--text)',
  fontSize: '13px',
  outline: 'none',
}

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
  return tt('adminCompanies.subtitle', { total, active })
})

const filterTabs = computed(() => [
  { value: 'all',       label: tt('adminCompanies.tabAll'),       count: companies.value.length },
  { value: 'active',    label: tt('adminCompanies.tabActive'),    count: companies.value.filter(c => c.status === 'active').length },
  { value: 'trial',     label: tt('adminCompanies.tabTrial'),     count: companies.value.filter(c => c.status === 'trial').length },
  { value: 'suspended', label: tt('adminCompanies.tabSuspended'), count: companies.value.filter(c => c.status === 'suspended').length },
  { value: 'inactive',  label: tt('adminCompanies.tabInactive'),  count: companies.value.filter(c => c.status === 'inactive').length },
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

const colHeaders = computed(() => [
  { label: tt('adminCompanies.colCompany') },
  { label: tt('adminCompanies.colTariff') },
  { label: tt('adminCompanies.colBilling') },
  { label: tt('adminCompanies.colChannelLimit'), right: true },
  { label: tt('adminCompanies.colPostsPerMonth'), right: true },
  { label: tt('adminCompanies.colPrice'), right: true },
  { label: tt('adminCompanies.colStatus') },
  { label: tt('adminCompanies.colCreated') },
  { label: '' },
])

function planLabel(t) {
  if (!t) return ''
  const lang = localStorage.getItem('lang') || 'uz'
  return t.name_i18n?.[lang] || t.name_i18n?.uz || t.slug || tt('adminCompanies.tariff')
}

function billingLabel(c) {
  return c === 'yearly' ? tt('adminCompanies.yearly') : tt('adminCompanies.monthly')
}

function priceLabel(sub) {
  if (!sub?.tariff) return '—'
  const price = sub.billing_cycle === 'yearly' ? sub.tariff.price_yearly : sub.tariff.price_monthly
  if (!price) return tt('adminCompanies.free')
  return formatNum(price) + ' ' + tt('adminCompanies.som')
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
    error.value = e.response?.data?.message || tt('adminCompanies.loadError')
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
    submitError.value = e.response?.data?.message || tt('adminCompanies.saveError')
  } finally {
    submitting.value = false
  }
}

// ── Edit modal logic ──────────────────────────────────────
function openEditModal(c) {
  editSelected.value = c
  editError.value = null
  editSuccess.value = null
  editForm.name = c.name || ''
  editForm.slug = c.slug || ''
  editForm.country = c.country || 'UZ'
  editForm.location = c.location || ''
  editForm.status = c.status || 'active'
  editForm.phones = (c.phones || []).map(p => p.phone)
  editForm.owner_full_name = c.owner?.full_name || ''
  editForm.owner_email = c.owner?.email || ''
  editForm.new_password = ''
  editOpen.value = true
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let pw = ''
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  editForm.new_password = pw
}

async function submitEdit() {
  if (!editSelected.value) return
  editSubmitting.value = true
  editError.value = null
  editSuccess.value = null
  try {
    const updated = await adminApi.updateCompany(editSelected.value.id, {
      name: editForm.name.trim(),
      slug: editForm.slug.trim(),
      country: editForm.country.trim() || 'UZ',
      location: editForm.location.trim() || null,
      status: editForm.status,
      phones: editForm.phones.map(p => p.trim()).filter(Boolean),
      owner_full_name: editForm.owner_full_name.trim(),
      owner_email: editForm.owner_email.trim(),
    })
    if (editForm.new_password) {
      await adminApi.resetCompanyPassword(editSelected.value.id, editForm.new_password)
    }
    const idx = companies.value.findIndex(x => x.id === updated.id)
    if (idx !== -1) companies.value.splice(idx, 1, updated)
    editSuccess.value = editForm.new_password
      ? tt('adminCompanies.savedWithPassword')
      : tt('adminCompanies.saved')
    setTimeout(() => { editOpen.value = false }, 800)
  } catch (e) {
    editError.value = e.response?.data?.message || tt('adminCompanies.saveError')
  } finally {
    editSubmitting.value = false
  }
}

function hasPendingTrial(c) {
  const sub = c.subscription
  return sub?.status === 'trial' && !sub?.trial_ends_at
}

async function approveTrial(c) {
  if (!confirm(tt('adminCompanies.approveTrialConfirm', { name: c.name }))) return
  try {
    const updated = await adminApi.approveTrial(c.id)
    const idx = companies.value.findIndex(x => x.id === updated.id)
    if (idx !== -1) companies.value.splice(idx, 1, updated)
  } catch (e) {
    alert(e.response?.data?.message || tt('adminCompanies.approveTrialError'))
  }
}

const loginAsBusyId = ref(null)

async function loginAs(c) {
  if (!c || loginAsBusyId.value) return
  if (!confirm(tt('adminCompanies.loginAsConfirm', { name: c.name }))) return
  loginAsBusyId.value = c.id
  try {
    const data = await adminApi.loginAsCompany(c.id)
    // Joriy admin sessiyasini zaxiraga olib, kompaniya tokenlariga o'tamiz.
    // App.vue accessToken kuzatuvchisi workspace/kompaniya/kvotani qayta yuklaydi.
    authStore.startImpersonation(data, c.name)
    await router.push('/client/overview')
  } catch (e) {
    alert(e.response?.data?.message || tt('adminCompanies.loginAsError'))
  } finally {
    loginAsBusyId.value = null
  }
}

async function onDelete(c) {
  if (!c) return
  if (!confirm(tt('adminCompanies.deleteConfirm', { name: c.name }))) return
  try {
    await adminApi.deleteCompany(c.id)
    companies.value = companies.value.filter(x => x.id !== c.id)
  } catch (e) {
    alert(e.response?.data?.message || tt('adminCompanies.deleteError'))
  }
}

onMounted(load)
</script>
