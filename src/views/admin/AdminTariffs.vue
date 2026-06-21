<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:18px;">
    <PageHeader :title="tt('adminTariffs.title')" :subtitle="subtitleText">
      <template #right>
        <AppButton variant="secondary" size="md" @click="load">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          {{ tt('adminTariffs.refresh') }}
        </AppButton>
        <AppButton variant="primary" size="md" @click="goCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('adminTariffs.newTariff') }}
        </AppButton>
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="display:flex;padding:2px;background:var(--panel-2);border:1px solid var(--border);border-radius:8px;height:34px;">
        <button v-for="v in viewOptions" :key="v.id" @click="view = v.id" :style="viewBtnStyle(v.id)">
          <AppIcon :name="v.icon" :size="13" />
          {{ v.label }}
        </button>
      </div>
      <div style="display:flex;padding:2px;background:var(--panel-2);border:1px solid var(--border);border-radius:8px;height:34px;">
        <button v-for="b in billingOptions" :key="b.id" @click="billingPreview = b.id" :style="billingBtnStyle(b.id)">
          {{ b.label }}
        </button>
      </div>
      <div style="flex:1;"/>
      <AppInput v-model="query" :placeholder="tt('adminTariffs.searchPlaceholder')" :style="{ width:'220px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
      </AppInput>
    </div>

    <!-- States -->
    <div v-if="loading" style="padding:60px;text-align:center;color:var(--muted);font-size:13px;">{{ tt('adminTariffs.loading') }}</div>
    <div v-else-if="error" style="padding:60px;text-align:center;color:var(--danger);font-size:13px;">{{ error }}</div>

    <!-- Empty -->
    <AppPanel v-else-if="!filtered.length" :padding="0">
      <div style="padding:60px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;">
        <div style="width:56px;height:56px;border-radius:14px;background:var(--accent-bg);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;">
          <AppIcon name="Sparkle" :size="22"/>
        </div>
        <div style="font-size:15px;font-weight:600;">{{ tt('adminTariffs.emptyTitle') }}</div>
        <div style="font-size:12.5px;color:var(--muted);max-width:360px;">
          {{ tt('adminTariffs.emptyHint') }}
        </div>
        <AppButton variant="primary" size="md" @click="goCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('adminTariffs.createFirst') }}
        </AppButton>
      </div>
    </AppPanel>

    <!-- Card grid -->
    <div v-else-if="view === 'cards'"
      style="display:grid;grid-template-columns:repeat(auto-fill, minmax(290px, 1fr));gap:14px;">
      <template v-for="(t, i) in orderedTariffs" :key="t.id">
        <!-- Faol/nofaol bo'limlari orasidagi ajratuvchi sarlavha -->
        <div v-if="i === activeCount && inactiveTariffs.length" class="quc-section-divider"
          style="grid-column:1 / -1;display:flex;align-items:center;gap:10px;margin-top:8px;">
          <span style="font-size:12px;font-weight:600;color:var(--danger);text-transform:uppercase;letter-spacing:0.05em;">
            {{ tt('adminTariffs.inactiveSection', { n: inactiveTariffs.length }) }}
          </span>
          <span style="flex:1;height:1px;background:color-mix(in oklab, var(--danger) 25%, var(--border));"/>
        </div>
      <div :style="cardStyle(t)">
        <!-- Top: gradient header -->
        <div :style="{
          padding:'16px 18px 14px',
          background: `linear-gradient(135deg, ${tariffColor(i)}1a 0%, transparent 70%)`,
          borderBottom:'1px solid var(--border-2)',
        }">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span :style="{
                width:'34px',height:'34px',borderRadius:'9px',
                background: tariffColor(i),
                color:'white',
                display:'inline-flex',alignItems:'center',justifyContent:'center',
                boxShadow: `0 4px 12px ${tariffColor(i)}55`,
              }">
                <AppIcon :name="tariffIcon(i)" :size="16"/>
              </span>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:14px;font-weight:600;line-height:1.1;">{{ tariffName(t) }}</span>
                <span class="mono" style="font-size:10.5px;color:var(--muted);">{{ categoryName(t) || t.slug }}</span>
              </div>
            </div>
            <AppBadge :tone="t.is_active ? 'success' : 'muted'" :dot="true">
              {{ t.is_active ? tt('adminTariffs.active') : tt('adminTariffs.inactive') }}
            </AppBadge>
          </div>
          <!-- Price -->
          <div style="display:flex;align-items:baseline;gap:6px;margin-top:14px;">
            <span class="tabular" :style="{
              fontSize:'28px',fontWeight:700,letterSpacing:'-0.02em',
              color: priceFor(t) === 0 ? 'var(--muted)' : 'var(--text)',
            }">
              {{ priceFor(t) === 0 ? tt('adminTariffs.free') : fmtSom(priceFor(t)) }}
            </span>
            <span v-if="priceFor(t) !== 0" style="font-size:11.5px;color:var(--muted);">
              {{ tt('adminTariffs.som') }} / {{ billingPreview === 'monthly' ? tt('adminTariffs.perMonthShort') : tt('adminTariffs.perYearShort') }}
            </span>
          </div>
          <div v-if="billingPreview === 'yearly' && t.price_monthly > 0" style="font-size:11px;color:var(--muted);margin-top:2px;">
            ≈ {{ fmtSom(Math.round(t.price_yearly / 12)) }} {{ tt('adminTariffs.somPerMonth') }}
          </div>
        </div>

        <!-- Limits -->
        <div style="padding:14px 18px;display:flex;flex-direction:column;gap:10px;">
          <LimitLine icon="Bolt" :label="tt('adminTariffs.dailyPosts')" :value="t.posts_daily_limit > 0 ? fmtNum(t.posts_daily_limit) : tt('adminTariffs.unlimited')" />
          <LimitLine icon="Pen" :label="tt('adminTariffs.monthlyPosts')" :value="fmtNum(t.posts_monthly_limit)" />
          <LimitLine icon="Sparkle" :label="tt('adminTariffs.freeCreditsMonthly')" :value="fmtNum(t.free_credits_monthly)" />
          <LimitLine icon="Hash" :label="tt('adminTariffs.extraCredit')" :value="t.credit_price_per_message > 0 ? fmtSom(t.credit_price_per_message) + ' ' + tt('adminTariffs.som') : '—'" />
        </div>

        <!-- Features -->
        <div v-if="t.features?.length"
          style="padding:12px 18px;border-top:1px solid var(--border-2);display:flex;flex-direction:column;gap:7px;">
          <div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">{{ tt('adminTariffs.modules') }}</div>
          <div v-for="f in t.features.slice(0, 5)" :key="f.id || f.key"
            style="display:flex;align-items:center;gap:8px;font-size:12px;">
            <span :style="{
              width:'16px',height:'16px',borderRadius:'4px',
              background: f.value === 'true' ? 'var(--success)' : 'var(--border-2)',
              color:'white',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,
            }">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 8l3 3 7-7"/>
              </svg>
            </span>
            <span style="color:var(--text-2);">{{ featureLabel(f) }}</span>
          </div>
          <span v-if="t.features.length > 5" style="font-size:11px;color:var(--muted);padding-left:24px;">
            {{ tt('adminTariffs.moreModules', { n: t.features.length - 5 }) }}
          </span>
        </div>

        <!-- Footer / actions -->
        <div style="padding:12px 14px;border-top:1px solid var(--border-2);display:flex;align-items:center;gap:8px;background:var(--panel-2);">
          <AppButton variant="ghost" size="sm" @click="confirmRemove(t)">
            <template #icon><AppIcon name="Trash" :size="12"/></template>
            {{ tt('adminTariffs.delete') }}
          </AppButton>
          <div style="flex:1;"/>
          <AppButton variant="secondary" size="sm" @click="goEdit(t)">
            <template #icon><AppIcon name="Pen" :size="12"/></template>
            {{ tt('adminTariffs.edit') }}
          </AppButton>
          <AppButton variant="secondary" size="sm" @click="toggleActive(t)">
            {{ t.is_active ? tt('adminTariffs.hide') : tt('adminTariffs.activate') }}
          </AppButton>
        </div>
      </div>
      </template>
    </div>

    <!-- Table -->
    <AppPanel v-else :padding="0">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th v-for="h in colHeaders" :key="h.label"
              :style="{textAlign:h.right?'right':'left',padding:'10px 12px',fontWeight:500,fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--muted)'}">
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(t, i) in orderedTariffs" :key="t.id">
          <!-- Nofaol bo'lim sarlavhasi -->
          <tr v-if="i === activeCount && inactiveTariffs.length">
            <td :colspan="colHeaders.length" style="padding:10px 12px;background:color-mix(in oklab, var(--danger) 6%, transparent);font-size:11px;font-weight:600;color:var(--danger);text-transform:uppercase;letter-spacing:0.05em;border-top:1px solid color-mix(in oklab, var(--danger) 25%, var(--border));">
              {{ tt('adminTariffs.inactiveSection', { n: inactiveTariffs.length }) }}
            </td>
          </tr>
          <tr :style="{
            borderTop: i===0 ? 'none' : '1px solid var(--border-2)',
            background: t.is_active ? 'transparent' : 'color-mix(in oklab, var(--danger) 6%, transparent)',
          }">
            <td style="padding:12px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span :style="{width:'26px',height:'26px',borderRadius:'7px',background:tariffColor(i),color:'white',display:'inline-flex',alignItems:'center',justifyContent:'center'}">
                  <AppIcon :name="tariffIcon(i)" :size="13"/>
                </span>
                <div style="display:flex;flex-direction:column;">
                  <span style="font-weight:500;">{{ tariffName(t) }}</span>
                  <span class="mono" style="font-size:11px;color:var(--muted);">{{ t.slug }}</span>
                </div>
              </div>
            </td>
            <td style="padding:12px;vertical-align:middle;">{{ categoryName(t) || '—' }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ t.posts_daily_limit > 0 ? fmtNum(t.posts_daily_limit) : '∞' }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ fmtNum(t.posts_monthly_limit) }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ fmtNum(t.free_credits_monthly) }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ t.credit_price_per_message > 0 ? fmtSom(t.credit_price_per_message) : '—' }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;font-weight:500;" class="tabular">
              {{ priceFor(t) === 0 ? tt('adminTariffs.free') : fmtSom(priceFor(t)) + ' ' + tt('adminTariffs.som') }}
            </td>
            <td style="padding:12px;vertical-align:middle;">
              <AppBadge :tone="t.is_active ? 'success' : 'muted'" :dot="true">{{ t.is_active ? tt('adminTariffs.active') : tt('adminTariffs.inactive') }}</AppBadge>
            </td>
            <td style="padding:12px;vertical-align:middle;text-align:right;">
              <div style="display:inline-flex;gap:6px;">
                <AppButton variant="secondary" size="sm" @click="goEdit(t)">
                  <template #icon><AppIcon name="Pen" :size="12"/></template>
                </AppButton>
                <AppButton variant="secondary" size="sm" @click="toggleActive(t)">
                  {{ t.is_active ? tt('adminTariffs.hide') : tt('adminTariffs.enable') }}
                </AppButton>
                <AppButton variant="ghost" size="sm" @click="confirmRemove(t)">
                  <template #icon><AppIcon name="Trash" :size="12"/></template>
                </AppButton>
              </div>
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </AppPanel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { tariffsApi } from '@/api/tariffs.js'
import { fmtSom } from '@/i18n/index.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const router = useRouter()

const tariffs = ref([])
const loading = ref(false)
const error = ref(null)
const view = ref('cards')
const billingPreview = ref('monthly')
const query = ref('')

const viewOptions = computed(() => [
  { id: 'cards', label: tt('adminTariffs.viewCards'), icon: 'Hash' },
  { id: 'table', label: tt('adminTariffs.viewTable'), icon: 'Sort' },
])
const billingOptions = computed(() => [
  { id: 'monthly', label: tt('adminTariffs.monthly') },
  { id: 'yearly',  label: tt('adminTariffs.yearly') },
])

const COLORS = ['#5b8def', '#7b61ff', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444']
const ICONS  = ['Hash', 'Sparkle', 'Bolt', 'Pen', 'Cloud', 'UserPlus']

const tariffColor = (i) => COLORS[i % COLORS.length]
const tariffIcon  = (i) => ICONS[i % ICONS.length]

const subtitleText = computed(() => {
  const total = tariffs.value.length
  const active = tariffs.value.filter(t => t.is_active).length
  return tt('adminTariffs.subtitle', { total, active })
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return tariffs.value
  return tariffs.value.filter(t =>
    (t.slug || '').toLowerCase().includes(q) ||
    tariffName(t).toLowerCase().includes(q)
  )
})

// Faol tariflar yuqorida, nofaollar pastda alohida bo'limda ko'rsatiladi.
const activeTariffs = computed(() => filtered.value.filter(t => t.is_active))
const inactiveTariffs = computed(() => filtered.value.filter(t => !t.is_active))
// Bitta grid/jadvalda ketma-ket chiqarish uchun (faol → nofaol).
const orderedTariffs = computed(() => [...activeTariffs.value, ...inactiveTariffs.value])
const activeCount = computed(() => activeTariffs.value.length)

const colHeaders = computed(() => [
  { label: tt('adminTariffs.colTariff') },
  { label: tt('adminTariffs.colCategory') },
  { label: tt('adminTariffs.colDaily'),       right: true },
  { label: tt('adminTariffs.colMonthly'),     right: true },
  { label: tt('adminTariffs.colFreeCredit'),  right: true },
  { label: tt('adminTariffs.colCreditPrice'), right: true },
  { label: tt('adminTariffs.colPrice'),       right: true },
  { label: tt('adminTariffs.colStatus') },
  { label: '' },
])

function tariffName(t) {
  const lang = localStorage.getItem('lang') || 'uz'
  return t.name_i18n?.[lang] || t.name_i18n?.uz || t.slug || '—'
}
function categoryName(t) {
  const c = t.category
  if (!c) return ''
  const lang = localStorage.getItem('lang') || 'uz'
  return c.name_i18n?.[lang] || c.name_i18n?.uz || c.slug || ''
}
function featureLabel(f) {
  const lang = localStorage.getItem('lang') || 'uz'
  return f.label_i18n?.[lang] || f.label_i18n?.uz || f.key
}
function priceFor(t) {
  const p = billingPreview.value === 'yearly' ? t.price_yearly : t.price_monthly
  return Number(p) || 0
}
function fmtNum(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('uz-UZ').replace(/,/g, ' ')
}

const cardStyle = (t) => {
  const inactive = !t.is_active
  return {
    // Nofaol tarif — qizil-pushti fon va chegara
    background: inactive ? 'color-mix(in oklab, var(--danger) 7%, var(--panel))' : 'var(--panel)',
    border: inactive ? '1px solid color-mix(in oklab, var(--danger) 30%, var(--border))' : '1px solid var(--border)',
    borderRadius: 'var(--r-lg, 12px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform .15s ease, box-shadow .15s ease',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.04))',
    opacity: inactive ? '0.92' : '1',
  }
}

const viewBtnStyle = (id) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '30px', padding: '0 12px',
  background: view.value === id ? 'var(--panel)' : 'transparent',
  border: 'none', borderRadius: '6px',
  fontSize: '12px', fontWeight: '500',
  color: view.value === id ? 'var(--text)' : 'var(--muted)',
  boxShadow: view.value === id ? 'var(--shadow-sm)' : 'none',
  cursor: 'pointer',
})
const billingBtnStyle = (id) => ({
  height: '30px', padding: '0 14px',
  background: billingPreview.value === id ? 'var(--panel)' : 'transparent',
  border: 'none', borderRadius: '6px',
  fontSize: '12px', fontWeight: '500',
  color: billingPreview.value === id ? 'var(--text)' : 'var(--muted)',
  boxShadow: billingPreview.value === id ? 'var(--shadow-sm)' : 'none',
  cursor: 'pointer',
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await tariffsApi.listAll()
    tariffs.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e.response?.data?.message || tt('adminTariffs.loadError')
  } finally {
    loading.value = false
  }
}

function goCreate() {
  router.push('/admin/tariffs/new')
}

function goEdit(t) {
  router.push({ path: '/admin/tariffs/new', query: { id: t.id } })
}

async function toggleActive(t) {
  try {
    const updated = await tariffsApi.update(t.id, { is_active: !t.is_active })
    const idx = tariffs.value.findIndex(x => x.id === t.id)
    if (idx !== -1) tariffs.value.splice(idx, 1, { ...t, ...updated })
  } catch (e) {
    alert(e.response?.data?.message || tt('adminTariffs.toggleError'))
  }
}

async function confirmRemove(t) {
  if (!confirm(tt('adminTariffs.confirmRemove', { name: tariffName(t) }))) return
  try {
    await tariffsApi.remove(t.id)
    tariffs.value = tariffs.value.filter(x => x.id !== t.id)
  } catch (e) {
    alert(e.response?.data?.message || tt('adminTariffs.removeError'))
  }
}

const LimitLine = defineComponent({
  name: 'LimitLine',
  props: { icon: String, label: String, value: [String, Number] },
  render() {
    return h('div', { style: 'display:flex;align-items:center;gap:10px;font-size:12.5px;' }, [
      h('span', { style: 'width:22px;height:22px;border-radius:6px;background:var(--panel-2);color:var(--muted);display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border-2);flex-shrink:0;' }, [
        h(AppIcon, { name: this.icon, size: 12 }),
      ]),
      h('span', { style: 'color:var(--muted);flex:1;' }, this.label),
      h('span', { class: 'tabular', style: 'font-weight:500;color:var(--text);' }, this.value),
    ])
  },
})

onMounted(load)
</script>
