<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:18px;">
    <PageHeader title="Tariflar" :subtitle="subtitleText">
      <template #right>
        <AppButton variant="secondary" size="md" @click="load">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          Yangilash
        </AppButton>
        <AppButton variant="primary" size="md" @click="goCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          Yangi tarif
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
      <AppInput v-model="query" placeholder="Tarif nomi..." :style="{ width:'220px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
      </AppInput>
    </div>

    <!-- States -->
    <div v-if="loading" style="padding:60px;text-align:center;color:var(--muted);font-size:13px;">Yuklanmoqda...</div>
    <div v-else-if="error" style="padding:60px;text-align:center;color:var(--danger);font-size:13px;">{{ error }}</div>

    <!-- Empty -->
    <AppPanel v-else-if="!filtered.length" :padding="0">
      <div style="padding:60px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;">
        <div style="width:56px;height:56px;border-radius:14px;background:var(--accent-bg);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;">
          <AppIcon name="Sparkle" :size="22"/>
        </div>
        <div style="font-size:15px;font-weight:600;">Hozircha tarif yo'q</div>
        <div style="font-size:12.5px;color:var(--muted);max-width:360px;">
          Tarif konstruktori orqali birinchi tarifingizni yarating — resurslar, modullar va narx avtomatik hisoblanadi.
        </div>
        <AppButton variant="primary" size="md" @click="goCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          Birinchi tarifni yaratish
        </AppButton>
      </div>
    </AppPanel>

    <!-- Card grid -->
    <div v-else-if="view === 'cards'"
      style="display:grid;grid-template-columns:repeat(auto-fill, minmax(290px, 1fr));gap:14px;">
      <div v-for="(t, i) in filtered" :key="t.id" :style="cardStyle(i)">
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
                <span class="mono" style="font-size:10.5px;color:var(--muted);">{{ t.slug }}</span>
              </div>
            </div>
            <AppBadge :tone="t.is_active ? 'success' : 'muted'" :dot="true">
              {{ t.is_active ? 'Faol' : 'Nofaol' }}
            </AppBadge>
          </div>
          <!-- Price -->
          <div style="display:flex;align-items:baseline;gap:6px;margin-top:14px;">
            <span class="tabular" :style="{
              fontSize:'28px',fontWeight:700,letterSpacing:'-0.02em',
              color: priceFor(t) === 0 ? 'var(--muted)' : 'var(--text)',
            }">
              {{ priceFor(t) === 0 ? 'Bepul' : fmtSom(priceFor(t)) }}
            </span>
            <span v-if="priceFor(t) !== 0" style="font-size:11.5px;color:var(--muted);">
              so'm / {{ billingPreview === 'monthly' ? 'oy' : 'yil' }}
            </span>
          </div>
          <div v-if="billingPreview === 'yearly' && t.price_monthly > 0" style="font-size:11px;color:var(--muted);margin-top:2px;">
            ≈ {{ fmtSom(Math.round(t.price_yearly / 12)) }} so'm/oy
          </div>
        </div>

        <!-- Limits -->
        <div style="padding:14px 18px;display:flex;flex-direction:column;gap:10px;">
          <LimitLine icon="Hash" :label="'Telegram kanallar'" :value="fmtNum(t.channels_limit)" />
          <LimitLine icon="Pen" :label="'Postlar / oy'" :value="fmtNum(t.posts_monthly_limit)" />
          <LimitLine icon="Sparkle" :label="'AI token / oy'" :value="fmtCompact(t.ai_tokens_monthly)" />
          <LimitLine icon="UserPlus" :label="'Jamoa joylari'" :value="fmtNum(t.seats_limit)" />
          <LimitLine icon="Cloud" :label="'Saqlash'" :value="t.storage_gb + ' GB'" />
        </div>

        <!-- Features -->
        <div v-if="t.features?.length"
          style="padding:12px 18px;border-top:1px solid var(--border-2);display:flex;flex-direction:column;gap:7px;">
          <div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Modullar</div>
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
            +{{ t.features.length - 5 }} boshqa modul
          </span>
        </div>

        <!-- Footer / actions -->
        <div style="padding:12px 14px;border-top:1px solid var(--border-2);display:flex;align-items:center;gap:8px;background:var(--panel-2);">
          <AppButton variant="ghost" size="sm" @click="confirmRemove(t)">
            <template #icon><AppIcon name="Trash" :size="12"/></template>
            O'chirish
          </AppButton>
          <div style="flex:1;"/>
          <AppButton variant="secondary" size="sm" @click="toggleActive(t)">
            {{ t.is_active ? 'Yashirish' : 'Faollashtirish' }}
          </AppButton>
        </div>
      </div>
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
          <tr v-for="(t, i) in filtered" :key="t.id" :style="{borderTop:i===0?'none':'1px solid var(--border-2)'}">
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
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ fmtNum(t.channels_limit) }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ fmtNum(t.posts_monthly_limit) }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ fmtCompact(t.ai_tokens_monthly) }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;" class="tabular">{{ fmtNum(t.seats_limit) }}</td>
            <td style="padding:12px;vertical-align:middle;text-align:right;font-weight:500;" class="tabular">
              {{ priceFor(t) === 0 ? 'Bepul' : fmtSom(priceFor(t)) + " so'm" }}
            </td>
            <td style="padding:12px;vertical-align:middle;">
              <AppBadge :tone="t.is_active ? 'success' : 'muted'" :dot="true">{{ t.is_active ? 'Faol' : 'Nofaol' }}</AppBadge>
            </td>
            <td style="padding:12px;vertical-align:middle;text-align:right;">
              <div style="display:inline-flex;gap:6px;">
                <AppButton variant="secondary" size="sm" @click="toggleActive(t)">
                  {{ t.is_active ? 'Yashirish' : 'Yoqish' }}
                </AppButton>
                <AppButton variant="ghost" size="sm" @click="confirmRemove(t)">
                  <template #icon><AppIcon name="Trash" :size="12"/></template>
                </AppButton>
              </div>
            </td>
          </tr>
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
import { fmtSom, fmtCompact } from '@/i18n/index.js'

const router = useRouter()

const tariffs = ref([])
const loading = ref(false)
const error = ref(null)
const view = ref('cards')
const billingPreview = ref('monthly')
const query = ref('')

const viewOptions = [
  { id: 'cards', label: 'Kartalar', icon: 'Hash' },
  { id: 'table', label: 'Jadval',   icon: 'Sort' },
]
const billingOptions = [
  { id: 'monthly', label: 'Oylik' },
  { id: 'yearly',  label: 'Yillik' },
]

const COLORS = ['#5b8def', '#7b61ff', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444']
const ICONS  = ['Hash', 'Sparkle', 'Bolt', 'Pen', 'Cloud', 'UserPlus']

const tariffColor = (i) => COLORS[i % COLORS.length]
const tariffIcon  = (i) => ICONS[i % ICONS.length]

const subtitleText = computed(() => {
  const total = tariffs.value.length
  const active = tariffs.value.filter(t => t.is_active).length
  return `${total} ta tarif · ${active} ta faol`
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return tariffs.value
  return tariffs.value.filter(t =>
    (t.slug || '').toLowerCase().includes(q) ||
    tariffName(t).toLowerCase().includes(q)
  )
})

const colHeaders = [
  { label: 'Tarif' },
  { label: 'Kanal',     right: true },
  { label: 'Postlar/oy',right: true },
  { label: 'AI tokens', right: true },
  { label: "Joy",       right: true },
  { label: 'Narx',      right: true },
  { label: 'Holat' },
  { label: '' },
]

function tariffName(t) {
  const lang = localStorage.getItem('lang') || 'uz'
  return t.name_i18n?.[lang] || t.name_i18n?.uz || t.slug || '—'
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

const cardStyle = (i) => ({
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg, 12px)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform .15s ease, box-shadow .15s ease',
  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.04))',
})

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
    const data = await tariffsApi.list()
    tariffs.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e.response?.data?.message || 'Tariflarni yuklab boʻlmadi'
  } finally {
    loading.value = false
  }
}

function goCreate() {
  router.push('/admin/tariffs/new')
}

async function toggleActive(t) {
  try {
    const updated = await tariffsApi.update(t.id, { is_active: !t.is_active })
    const idx = tariffs.value.findIndex(x => x.id === t.id)
    if (idx !== -1) tariffs.value.splice(idx, 1, { ...t, ...updated })
  } catch (e) {
    alert(e.response?.data?.message || 'Holatni o\'zgartirib bo\'lmadi')
  }
}

async function confirmRemove(t) {
  if (!confirm(`"${tariffName(t)}" tarifini o'chirilsinmi?`)) return
  try {
    await tariffsApi.remove(t.id)
    tariffs.value = tariffs.value.filter(x => x.id !== t.id)
  } catch (e) {
    alert(e.response?.data?.message || "Tarifni o'chirib bo'lmadi")
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
