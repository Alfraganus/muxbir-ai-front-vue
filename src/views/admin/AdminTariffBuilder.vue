<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader title="Tarif konstruktori" subtitle="Dynamic tariff — kanal, post, AI token, joy va boshqa parametrlar bo'yicha narx avtomatik hisoblanadi">
      <template #right>
        <AppButton variant="secondary" size="md" @click="goBack">
          <template #icon><AppIcon name="ChevronL" :size="13"/></template>
          Orqaga
        </AppButton>
        <AppButton variant="secondary" size="md" @click="goBack">Bekor qilish</AppButton>
        <AppButton variant="primary" size="md" :disabled="saving" @click="save">
          <template #icon><AppIcon name="Check" :size="13"/></template>
          {{ saving ? 'Saqlanmoqda...' : 'Tarifni saqlash' }}
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="saveError" style="padding:10px 14px;border-radius:8px;background:color-mix(in oklab, var(--danger) 12%, transparent);border:1px solid color-mix(in oklab, var(--danger) 30%, transparent);color:var(--danger);font-size:12.5px;">
      {{ saveError }}
    </div>

    <!-- Preset chips -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Tayyor shablon:</span>
      <button v-for="p in PLAN_PRESETS" :key="p.id" @click="applyPreset(p.id)" :style="presetBtnStyle(p.id)">
        <span :style="{ width:'8px',height:'8px',borderRadius:'999px',background:p.color }" />
        {{ p.name }}
      </button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 360px;gap:16px;align-items:start;">
      <!-- Left column -->
      <div style="display:flex;flex-direction:column;gap:16px;">

        <!-- Plan basics -->
        <AppPanel title="Asosiy ma'lumotlar" :dense="true">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:11px;color:var(--muted);font-weight:500;">Tarif nomi</label>
              <AppInput v-model="name"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:11px;color:var(--muted);font-weight:500;">Slug</label>
              <AppInput v-model="slug" :mono="true"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:11px;color:var(--muted);font-weight:500;">Hisob-kitob davri</label>
              <div style="display:flex;padding:2px;background:var(--panel-2);border:1px solid var(--border);border-radius:6px;height:32px;">
                <button v-for="o in billingOptions" :key="o.id" @click="billingCycle = o.id" :style="cycleBtnStyle(o.id)">{{ o.label }}</button>
              </div>
            </div>
          </div>
        </AppPanel>

        <!-- Quantities -->
        <AppPanel title="Resurslar" subtitle="Har bir parametr bo'yicha narx avtomatik hisoblanadi" :dense="true">
          <div style="display:flex;flex-direction:column;gap:14px;">
            <DimensionRow v-for="d in TARIFF_DIMS" :key="d.key" :dim="d" :value="qty[d.key]" @change="v => { qty[d.key] = v; activePreset = null; }"/>
          </div>
        </AppPanel>

        <!-- Addons -->
        <AppPanel title="Qo'shimcha modullar" subtitle="Yoqilgan modullar oylik narxga qo'shiladi" :dense="true">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <AddonRow v-for="a in TARIFF_ADDONS" :key="a.key" :addon="a" :value="addons[a.key]" @change="v => { addons[a.key] = v; activePreset = null; }"/>
          </div>
        </AppPanel>

        <!-- Limits -->
        <AppPanel title="Cheklov va kirish" :dense="true">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:11px;color:var(--muted);font-weight:500;">Chegirma (%)</label>
              <AppInput v-model.number="discount" type="number" suffix="%"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="font-size:11px;color:var(--muted);font-weight:500;">Tarif holati</label>
              <div style="display:flex;gap:8px;align-items:center;height:32px;">
                <label style="display:inline-flex;align-items:center;gap:8px;font-size:12.5px;cursor:pointer;">
                  <input type="checkbox" v-model="isActive" style="accent-color:var(--accent);"/>
                  Faol — barchaga ko'rinadi
                </label>
              </div>
            </div>
          </div>
        </AppPanel>
      </div>

      <!-- Right: price summary sticky -->
      <div style="position:sticky;top:72px;">
        <PriceSummary
          :name="name" :code="slug" :billing-cycle="billingCycle"
          :breakdown="breakdown" :addons="addons"
          :dimensions-total="dimensionsTotal" :addon-total="addonTotal"
          :subtotal="subtotal" :discount="discount" :discount-amt="discountAmt"
          :total="total" :yearly="yearly" :final-amt="finalAmt"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppInput from '@/components/ui/AppInput.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { TARIFF_DIMS, TARIFF_ADDONS, PLAN_PRESETS } from '@/data/index.js'
import { tariffsApi } from '@/api/tariffs.js'

const store = useAppStore()
const router = useRouter()

const name = ref('Core')
const slug = ref('core_2026')
const billingCycle = ref('monthly')
const discount = ref(0)
const isActive = ref(true)
const activePreset = ref('core')
const saving = ref(false)
const saveError = ref(null)

const qty = ref({ channels: 1, posts: 500, tokens: 150, seats: 2, storage: 10 })
const addons = ref({ fb: false, ig: false, priority: false, branding: false })

const billingOptions = [
  { id: 'monthly', label: 'Oylik' },
  { id: 'yearly',  label: 'Yillik (-15%)' },
]

function applyPreset(id) {
  const p = PLAN_PRESETS.find(x => x.id === id)
  if (!p) return
  activePreset.value = id
  name.value = p.name
  slug.value = p.name.toLowerCase() + '_2026'
  qty.value = { ...p.qty }
  const a = { fb: false, ig: false, priority: false, branding: false }
  p.addons.forEach(k => { a[k] = true })
  addons.value = a
}

const breakdown = computed(() => TARIFF_DIMS.map(d => {
  const q = qty.value[d.key]
  const extra = Math.max(0, q - d.baseQty)
  const baseLine = d.pricePerUnit * d.baseQty
  const extraLine = d.pricePerUnit * extra
  return { key: d.key, label: d.label[store.lang], unit: d.unit[store.lang], qty: q, base: baseLine, extra: extraLine, perUnit: d.pricePerUnit }
}))

const dimensionsTotal = computed(() => breakdown.value.reduce((s, b) => s + b.base + b.extra, 0))
const addonTotal = computed(() => TARIFF_ADDONS.filter(a => addons.value[a.key]).reduce((s, a) => s + a.price, 0))
const subtotal = computed(() => dimensionsTotal.value + addonTotal.value)
const discountAmt = computed(() => Math.round(subtotal.value * (discount.value / 100)))
const total = computed(() => subtotal.value - discountAmt.value)
const yearly = computed(() => billingCycle.value === 'yearly' ? total.value * 12 * 0.85 : total.value)
const finalAmt = computed(() => billingCycle.value === 'yearly' ? yearly.value : total.value)

const priceMonthly = computed(() => billingCycle.value === 'monthly' ? Math.round(total.value) : Math.round(total.value))
const priceYearly = computed(() => Math.round(total.value * 12 * 0.85))

function goBack() {
  router.push('/admin/tariffs')
}

async function save() {
  saving.value = true
  saveError.value = null
  try {
    const enabledAddons = TARIFF_ADDONS.filter(a => addons.value[a.key])
    await tariffsApi.createBuilder({
      slug: slug.value.trim().toLowerCase(),
      name_i18n: { uz: name.value, ru: name.value, en: name.value },
      description_i18n: { uz: '', ru: '', en: '' },
      is_active: isActive.value,
      price_monthly: priceMonthly.value,
      price_yearly: priceYearly.value,
      channels_limit: qty.value.channels,
      posts_monthly_limit: qty.value.posts,
      ai_tokens_monthly: qty.value.tokens * 1000,
      seats_limit: qty.value.seats,
      storage_gb: qty.value.storage,
      features: enabledAddons.map((a, i) => ({
        key: a.key,
        data_type: 'boolean',
        value: 'true',
        label_i18n: a.label,
        sort_order: i,
      })),
    })
    router.push('/admin/tariffs')
  } catch (e) {
    saveError.value = e.response?.data?.message || 'Tarifni saqlab boʻlmadi'
  } finally {
    saving.value = false
  }
}

const presetBtnStyle = (id) => ({
  height: '28px', padding: '0 12px',
  fontSize: '12px', fontWeight: '500',
  background: activePreset.value === id ? 'var(--accent-bg)' : 'var(--panel)',
  border: `1px solid ${activePreset.value === id ? 'color-mix(in oklab, var(--accent) 30%, transparent)' : 'var(--border)'}`,
  color: activePreset.value === id ? 'var(--accent)' : 'var(--text-2)',
  borderRadius: '999px', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: '6px',
})
const cycleBtnStyle = (id) => ({
  flex: '1',
  background: billingCycle.value === id ? 'var(--panel)' : 'transparent',
  border: 'none', borderRadius: '4px',
  fontSize: '12px', fontWeight: '500',
  color: billingCycle.value === id ? 'var(--text)' : 'var(--muted)',
  boxShadow: billingCycle.value === id ? 'var(--shadow-sm)' : 'none',
  cursor: 'pointer',
})
</script>

<script>
import { defineComponent, h, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { fmtSom } from '@/i18n/index.js'
import { useAppStore } from '@/stores/app.js'
import { TARIFF_ADDONS } from '@/data/index.js'

const DimensionRow = defineComponent({
  name: 'DimensionRow',
  props: { dim: Object, value: Number },
  emits: ['change'],
  setup(props, { emit }) {
    const store = useAppStore()
    const lang = computed(() => store.lang)
    return { lang, fmtSom, emit }
  },
  template: `
    <div style="display:grid;grid-template-columns:180px 1fr 130px 110px;align-items:center;gap:14px;">
      <div style="display:flex;flex-direction:column;gap:2px;">
        <span style="font-size:12.5px;font-weight:500;">{{ dim.label[lang] }}</span>
        <span style="font-size:11px;color:var(--muted);">{{ fmtSom(dim.pricePerUnit) }} so'm / {{ dim.unit[lang] }}</span>
      </div>
      <div style="position:relative;">
        <input type="range" :min="dim.min" :max="dim.max" :step="dim.step" :value="value"
          @input="emit('change', +$event.target.value)"
          style="width:100%;accent-color:var(--accent);height:4px;cursor:pointer;"/>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted-2);font-family:var(--font-mono);margin-top:2px;">
          <span>{{ dim.min }}</span><span>{{ dim.max }}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;background:var(--panel-2);border:1px solid var(--border);border-radius:6px;height:32px;padding:0 4px;">
        <button @click="emit('change', Math.max(dim.min, value - dim.step))"
          style="width:24px;height:24px;border:none;background:transparent;color:var(--muted);border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
          <svg width="12" height="12" viewBox="0 0 16 16"><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/></svg>
        </button>
        <input type="number" :value="value" @input="emit('change', +$event.target.value)"
          style="flex:1;min-width:0;height:24px;border:none;outline:none;background:transparent;text-align:center;font-size:12.5px;font-family:var(--font-mono);font-weight:500;"/>
        <button @click="emit('change', Math.min(dim.max, value + dim.step))"
          style="width:24px;height:24px;border:none;background:transparent;color:var(--muted);border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
          <svg width="12" height="12" viewBox="0 0 16 16"><rect x="7" y="2" width="2" height="12" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/></svg>
        </button>
      </div>
      <div class="tabular" style="font-size:12.5px;font-weight:500;text-align:right;color:var(--text);">
        {{ fmtSom(dim.pricePerUnit * value) }} <span style="font-size:10px;color:var(--muted);">so'm</span>
      </div>
    </div>
  `
})

const AddonRow = defineComponent({
  name: 'AddonRow',
  props: { addon: Object, value: Boolean },
  emits: ['change'],
  setup(props, { emit }) {
    const store = useAppStore()
    const lang = computed(() => store.lang)
    return { lang, fmtSom, emit }
  },
  template: `
    <button @click="!addon.soon && emit('change', !value)" :disabled="addon.soon"
      :style="{
        textAlign:'left',
        background: value ? 'var(--accent-bg)' : 'var(--panel-2)',
        border: \`1px solid \${value ? 'color-mix(in oklab, var(--accent) 30%, transparent)' : 'var(--border)'}\`,
        borderRadius: '8px', padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: '10px',
        cursor: addon.soon ? 'not-allowed' : 'pointer',
        opacity: addon.soon ? 0.6 : 1,
        width: '100%',
      }">
      <span :style="{
        width:'28px',height:'28px',borderRadius:'6px',
        background: value ? 'var(--accent)' : 'var(--panel)',
        color: value ? 'white' : 'var(--text-2)',
        border: value ? 'none' : '1px solid var(--border)',
        display:'inline-flex',alignItems:'center',justifyContent:'center',
      }">
        <svg v-if="addon.key==='fb'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        <svg v-else-if="addon.key==='ig'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
        <svg v-else-if="addon.key==='priority'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z"/><path d="M17.796 9.204a7.5 7.5 0 0 0-9 9"/></svg>
      </span>
      <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
        <span style="font-size:12.5px;font-weight:500;">{{ addon.label[lang] }}</span>
        <span style="font-size:11px;color:var(--muted);">+{{ fmtSom(addon.price) }} so'm/oy</span>
      </div>
      <div :style="{
        width:'36px',height:'20px',borderRadius:'999px',background: value ? 'var(--accent)' : 'var(--border-2)',
        display:'inline-flex',alignItems:'center',padding:'0 2px',
        transition:'background .15s',
      }">
        <div :style="{
          width:'16px',height:'16px',borderRadius:'999px',background:'white',
          transform: value ? 'translateX(16px)' : 'translateX(0)',
          transition:'transform .15s',
          boxShadow:'0 1px 3px rgba(0,0,0,.25)',
        }"/>
      </div>
    </button>
  `
})

const PriceSummary = defineComponent({
  name: 'PriceSummary',
  props: {
    name: String, code: String, billingCycle: String,
    breakdown: Array, addons: Object,
    dimensionsTotal: Number, addonTotal: Number,
    subtotal: Number, discount: Number, discountAmt: Number,
    total: Number, yearly: Number, finalAmt: Number,
  },
  setup(props) {
    const store = useAppStore()
    const lang = computed(() => store.lang)
    const hasAddons = computed(() => props.addons && Object.values(props.addons).some(Boolean))
    return { lang, fmtSom, hasAddons, TARIFF_ADDONS }
  },
  template: `
    <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;">
      <div style="padding:16px 18px;border-bottom:1px solid var(--border-2);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;">Hisob-kitob</span>
          <span class="mono" style="font-size:10.5px;color:var(--muted);">{{ code }}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-top:8px;">
          <span style="font-size:20px;font-weight:600;">{{ name }}</span>
          <span style="font-size:11px;padding:2px 6px;border-radius:4px;background:var(--accent-bg);color:var(--accent);font-weight:500;">{{ billingCycle === 'monthly' ? 'oylik' : 'yillik' }}</span>
        </div>
      </div>
      <div style="padding:12px 18px;">
        <div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;margin-bottom:8px;">Resurslar</div>
        <div v-for="b in breakdown" :key="b.key" style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:12.5px;">
          <span style="color:var(--text-2);"><span class="tabular">{{ b.qty }}</span> {{ b.unit }} <span style="color:var(--muted);margin-left:4px;">· {{ b.label }}</span></span>
          <span class="tabular" style="font-weight:500;">{{ fmtSom(b.base + b.extra) }}</span>
        </div>
        <template v-if="hasAddons">
          <div style="height:1px;background:var(--border-2);margin:10px 0;"/>
          <div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;margin-bottom:8px;">Modullar</div>
          <div v-for="a in TARIFF_ADDONS.filter(a => addons[a.key])" :key="a.key" style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:12.5px;">
            <span style="color:var(--text-2);">+ {{ a.label[lang] }}</span>
            <span class="tabular" style="font-weight:500;">{{ fmtSom(a.price) }}</span>
          </div>
        </template>
        <div style="height:1px;background:var(--border-2);margin:12px 0;"/>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
          <span style="color:var(--muted);">Resurslar</span>
          <span class="tabular" style="color:var(--muted);">{{ fmtSom(dimensionsTotal) }}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
          <span style="color:var(--muted);">Modullar</span>
          <span class="tabular" style="color:var(--muted);">{{ fmtSom(addonTotal) }}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
          <span style="color:var(--text-2);">Subtotal</span>
          <span class="tabular" style="font-weight:500;">{{ fmtSom(subtotal) }}</span>
        </div>
        <div v-if="discount > 0" style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
          <span style="color:var(--text-2);">Chegirma ({{ discount }}%)</span>
          <span class="tabular" style="font-weight:500;color:var(--success);">−{{ fmtSom(discountAmt) }}</span>
        </div>
        <div v-if="billingCycle === 'yearly'" style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
          <span style="color:var(--text-2);">Yillik -15%</span>
          <span class="tabular" style="font-weight:500;color:var(--success);">qo'llanildi</span>
        </div>
      </div>
      <div style="padding:14px 18px;background:var(--accent-bg);border-top:1px solid color-mix(in oklab, var(--accent) 20%, transparent);display:flex;flex-direction:column;gap:4px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;">
          <span style="font-size:12px;color:var(--text-2);">Jami {{ billingCycle === 'monthly' ? 'oyiga' : 'yiliga' }}</span>
          <span style="display:flex;align-items:baseline;gap:4px;">
            <span class="tabular" style="font-size:22px;font-weight:600;color:var(--accent-ink);letter-spacing:-0.015em;">{{ fmtSom(Math.round(finalAmt)) }}</span>
            <span style="font-size:12px;color:var(--accent-ink);">so'm</span>
          </span>
        </div>
        <span v-if="billingCycle === 'monthly'" style="font-size:11px;color:var(--muted);">≈ {{ fmtSom(Math.round(total * 12 * 0.85)) }} so'm/yil (yillik ko'chsa)</span>
        <span v-else style="font-size:11px;color:var(--muted);">≈ {{ fmtSom(Math.round(total)) }} so'm/oy</span>
      </div>
    </div>
  `
})

export { DimensionRow, AddonRow, PriceSummary }
</script>
