<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:640px;">
    <PageHeader :title="tt('tz.title')" :subtitle="tt('tz.subtitle')"/>

    <div v-if="loading" style="color:var(--muted);font-size:13px;">{{ tt('tz.loading') }}</div>

    <template v-else>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <label style="font-size:12px;font-weight:600;color:var(--muted);">
          {{ tt('tz.label') }}
        </label>
        <AppSelect v-model="selected" :options="options" />
        <span style="font-size:12px;color:var(--muted);">
          {{ tt('tz.selected') }} <strong style="color:var(--text);">{{ currentLabel }}</strong>
          {{ tt('tz.now') }} <strong style="color:var(--text);">{{ previewTime }}</strong>
        </span>
      </div>

      <div style="display:flex;align-items:center;gap:12px;">
        <AppButton variant="primary" :disabled="saving || !dirty" @click="save">
          {{ saving ? tt('tz.saving') : tt('tz.save') }}
        </AppButton>
        <span v-if="savedAt" style="font-size:12px;color:#16a34a;">{{ tt('tz.saved') }}</span>
        <span v-if="error" style="font-size:12px;color:var(--danger);">{{ error }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { companiesApi } from '@/api/companies.js'
import { useAppStore } from '@/stores/app.js'
import {
  TIMEZONE_OPTIONS,
  DEFAULT_UTC_OFFSET_MIN,
  resolveOffsetMin,
  offsetLabel,
  utcToWall,
} from '@/utils/timezone.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
const options = TIMEZONE_OPTIONS

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const savedAt = ref(false)

const company = ref(null)
const savedOffset = ref(DEFAULT_UTC_OFFSET_MIN)
// AppSelect string emit qiladi — string saqlaymiz, ishlatishda Number.
const selected = ref(String(DEFAULT_UTC_OFFSET_MIN))

const selectedMin = computed(() => resolveOffsetMin(Number(selected.value)))
const dirty = computed(() => selectedMin.value !== savedOffset.value)
const currentLabel = computed(() => offsetLabel(selectedMin.value))

// Har soniyada yangilanadigan "hozirgi vaqt" preview (tanlangan offset'da).
const nowTick = ref(Date.now())
let timer = null
const previewTime = computed(() => {
  void nowTick.value // reaktiv bog'liqlik
  // wall: 'YYYY-MM-DDTHH:MM' → 'DD-MM-YYYY HH:MM'
  const w = utcToWall(new Date(), selectedMin.value)
  const m = w.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/)
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}` : w
})

async function load() {
  loading.value = true
  try {
    const res = await companiesApi.getMy().catch(() => [])
    const list = Array.isArray(res) ? res : [res].filter(Boolean)
    company.value = list[0] || null
    const off = resolveOffsetMin(company.value?.utc_offset_minutes)
    savedOffset.value = off
    selected.value = String(off)
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!company.value || !dirty.value) return
  saving.value = true
  error.value = ''
  savedAt.value = false
  try {
    await companiesApi.update(company.value.id, { utc_offset_minutes: selectedMin.value })
    savedOffset.value = selectedMin.value
    company.value.utc_offset_minutes = selectedMin.value
    store.setCompanyOffset(selectedMin.value) // global holatni darhol yangilash
    savedAt.value = true
    setTimeout(() => { savedAt.value = false }, 3000)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  load()
  timer = setInterval(() => { nowTick.value = Date.now() }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
