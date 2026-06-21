<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="isEdit ? tt('adminTariffBuilder.editTitle') : tt('adminTariffBuilder.newTitle')" :subtitle="tt('adminTariffBuilder.subtitle')">
      <template #right>
        <AppButton variant="secondary" size="md" @click="goBack">
          <template #icon><AppIcon name="ChevronL" :size="13"/></template>
          {{ tt('adminTariffBuilder.back') }}
        </AppButton>
        <AppButton variant="primary" size="md" :disabled="saving" @click="save">
          <template #icon><AppIcon name="Check" :size="13"/></template>
          {{ saving ? tt('adminTariffBuilder.saving') : tt('adminTariffBuilder.saveTariff') }}
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="saveError" style="padding:10px 14px;border-radius:8px;background:color-mix(in oklab, var(--danger) 12%, transparent);border:1px solid color-mix(in oklab, var(--danger) 30%, transparent);color:var(--danger);font-size:12.5px;">
      {{ saveError }}
    </div>

    <div style="display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start;">
      <!-- Left column -->
      <div style="display:flex;flex-direction:column;gap:16px;">

        <!-- Basics -->
        <AppPanel :title="tt('adminTariffBuilder.basicsTitle')" :dense="true">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label :style="labelStyle">{{ tt('adminTariffBuilder.tariffName') }}</label>
            <AppInput v-model="form.name" :placeholder="tt('adminTariffBuilder.tariffNamePlaceholder')"/>
          </div>
        </AppPanel>

        <!-- Limits -->
        <AppPanel :title="tt('adminTariffBuilder.limitsTitle')" :subtitle="tt('adminTariffBuilder.limitsSubtitle')" :dense="true">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label :style="labelStyle">{{ tt('adminTariffBuilder.postsDaily') }}</label>
              <AppInput v-model.number="form.posts_daily_limit" type="number" suffix="ta"/>
              <span :style="hintStyle">{{ tt('adminTariffBuilder.dailyHint') }}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label :style="labelStyle">{{ tt('adminTariffBuilder.postsMonthly') }}</label>
              <AppInput v-model.number="form.posts_monthly_limit" type="number" suffix="ta"/>
            </div>
          </div>
        </AppPanel>

        <!-- Credits -->
        <AppPanel :title="tt('adminTariffBuilder.creditsTitle')" :subtitle="tt('adminTariffBuilder.creditsSubtitle')" :dense="true">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label :style="labelStyle">{{ tt('adminTariffBuilder.freeCreditsMonthly') }}</label>
              <AppInput v-model.number="form.free_credits_monthly" type="number" suffix="ta"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label :style="labelStyle">{{ tt('adminTariffBuilder.creditPrice') }}</label>
              <AppInput v-model.number="form.credit_price_per_message" type="number" suffix="so'm"/>
            </div>
          </div>
        </AppPanel>

        <!-- Price + status -->
        <AppPanel :title="tt('adminTariffBuilder.priceTitle')" :dense="true">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label :style="labelStyle">{{ tt('adminTariffBuilder.priceMonthly') }}</label>
              <AppInput v-model.number="form.price_monthly" type="number" suffix="so'm"/>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label :style="labelStyle">{{ tt('adminTariffBuilder.statusLabel') }}</label>
              <label style="display:inline-flex;align-items:center;gap:8px;font-size:12.5px;cursor:pointer;height:32px;">
                <input type="checkbox" v-model="form.is_active" style="accent-color:var(--accent);"/>
                {{ tt('adminTariffBuilder.activeHint') }}
              </label>
            </div>
          </div>
        </AppPanel>
      </div>

      <!-- Right: preview -->
      <div style="position:sticky;top:72px;">
        <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;">
          <div style="padding:16px 18px;border-bottom:1px solid var(--border-2);">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;">{{ tt('adminTariffBuilder.preview') }}</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-top:8px;">
              <span style="font-size:19px;font-weight:600;text-transform:capitalize;">{{ form.name || tt('adminTariffBuilder.tariffName') }}</span>
            </div>
          </div>
          <div style="padding:14px 18px;display:flex;flex-direction:column;gap:10px;">
            <PreviewLine :label="tt('adminTariffBuilder.previewDaily')" :value="form.posts_daily_limit > 0 ? tt('adminTariffBuilder.nMessages', { n: form.posts_daily_limit }) : tt('adminTariffBuilder.unlimited')" />
            <PreviewLine :label="tt('adminTariffBuilder.previewMonthly')" :value="tt('adminTariffBuilder.nMessages', { n: form.posts_monthly_limit || 0 })" />
            <PreviewLine :label="tt('adminTariffBuilder.previewFreeCredits')" :value="tt('adminTariffBuilder.nUnits', { n: form.free_credits_monthly || 0 })" />
            <PreviewLine :label="tt('adminTariffBuilder.previewExtraCredit')" :value="creditPreview" />
          </div>
          <div style="padding:14px 18px;background:var(--accent-bg);border-top:1px solid color-mix(in oklab, var(--accent) 20%, transparent);">
            <div style="display:flex;align-items:baseline;justify-content:space-between;">
              <span style="font-size:12px;color:var(--text-2);">{{ tt('adminTariffBuilder.priceMonthly') }}</span>
              <span style="display:flex;align-items:baseline;gap:4px;">
                <span class="tabular" style="font-size:22px;font-weight:600;color:var(--accent-ink);letter-spacing:-0.015em;">{{ fmtSom(form.price_monthly || 0) }}</span>
                <span style="font-size:12px;color:var(--accent-ink);">so'm</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h, defineComponent, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppInput from '@/components/ui/AppInput.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { tariffsApi } from '@/api/tariffs.js'
import { fmtSom } from '@/i18n/index.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const router = useRouter()
const route = useRoute()

const editId = ref(route.query.id || null)
const isEdit = computed(() => !!editId.value)

const labelStyle = 'font-size:11px;color:var(--muted);font-weight:500;'
const hintStyle = 'font-size:10.5px;color:var(--muted-2);'

const form = ref({
  name: '',
  posts_daily_limit: 0,
  posts_monthly_limit: 0,
  free_credits_monthly: 0,
  credit_price_per_message: 0,
  price_monthly: 0,
  is_active: true,
})

const saving = ref(false)
const saveError = ref(null)

const creditPreview = computed(() =>
  form.value.credit_price_per_message > 0
    ? tt('adminTariffBuilder.creditPreview', { price: fmtSom(form.value.credit_price_per_message) })
    : '—'
)

function goBack() {
  router.push('/admin/tariffs')
}

async function loadTariff() {
  if (!editId.value) return
  try {
    const t = await tariffsApi.getOne(editId.value)
    form.value = {
      // Backend i18n interceptor `name_i18n` ni `name` stringga aylantiradi —
      // shuning uchun avval `t.name` ni o'qiymiz (slug fallback emas).
      name: t.name || t.name_i18n?.uz || '',
      posts_daily_limit: Number(t.posts_daily_limit) || 0,
      posts_monthly_limit: Number(t.posts_monthly_limit) || 0,
      free_credits_monthly: Number(t.free_credits_monthly) || 0,
      credit_price_per_message: Number(t.credit_price_per_message) || 0,
      price_monthly: Number(t.price_monthly) || 0,
      is_active: t.is_active !== false,
    }
  } catch (e) {
    saveError.value = e.response?.data?.message || tt('adminTariffBuilder.loadError')
  }
}

/**
 * Payload — slug yo'q (yangi tarifda server avtomatik yasaydi, tahrirda
 * mavjud slug o'zgarmaydi), kategoriya yo'q.
 */
function buildPayload() {
  const name = form.value.name.trim()
  return {
    name_i18n: { uz: name, ru: name, en: name },
    description_i18n: { uz: '', ru: '', en: '' },
    is_active: form.value.is_active,
    price_monthly: Math.round(form.value.price_monthly || 0),
    price_yearly: Math.round((form.value.price_monthly || 0) * 12),
    posts_daily_limit: Math.round(form.value.posts_daily_limit || 0),
    posts_monthly_limit: Math.round(form.value.posts_monthly_limit || 0),
    free_credits_monthly: Math.round(form.value.free_credits_monthly || 0),
    credit_price_per_message: Math.round(form.value.credit_price_per_message || 0),
  }
}

async function save() {
  if (!form.value.name.trim()) {
    saveError.value = tt('adminTariffBuilder.requiredError')
    return
  }
  saving.value = true
  saveError.value = null
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await tariffsApi.update(editId.value, payload)
    } else {
      await tariffsApi.createBuilder(payload)
    }
    router.push('/admin/tariffs')
  } catch (e) {
    saveError.value = e.response?.data?.message || tt('adminTariffBuilder.saveError')
  } finally {
    saving.value = false
  }
}

const PreviewLine = defineComponent({
  name: 'PreviewLine',
  props: { label: String, value: [String, Number] },
  render() {
    return h('div', { style: 'display:flex;align-items:center;justify-content:space-between;font-size:12.5px;' }, [
      h('span', { style: 'color:var(--muted);' }, this.label),
      h('span', { class: 'tabular', style: 'font-weight:500;color:var(--text);' }, this.value),
    ])
  },
})

onMounted(() => {
  loadTariff()
})
</script>
