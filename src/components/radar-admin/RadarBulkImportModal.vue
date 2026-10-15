<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
            :title="tt('adminRadar.bulkTitle')" :subtitle="tt('adminRadar.bulkSubtitle')" width="640px">
    <RadarBulkResults v-if="result" :results="result.results" :summary="result.summary"/>
    <div v-else class="rbi">
      <div class="rbi-seg">
        <button v-for="p in RADAR_PLATFORMS" :key="p.slug" type="button"
                class="rbi-seg-btn" :class="{ active: form.platform === p.slug }" @click="form.platform = p.slug">
          <AppIcon :name="p.icon" :size="13"/> {{ tt(p.labelKey) }}
        </button>
      </div>

      <label class="rbi-field">
        <span class="rbi-label">{{ tt('adminRadar.bulkListLabel') }}</span>
        <textarea v-model="form.text" rows="9" class="rbi-textarea" :placeholder="placeholder"/>
        <span class="rbi-hint">{{ tt('adminRadar.bulkCount', { n: values.length }) }} · {{ tt('adminRadar.bulkHint') }}</span>
      </label>

      <div class="rbi-grid">
        <label class="rbi-field">
          <span class="rbi-label">{{ tt('adminRadar.category') }}</span>
          <AppSelect v-model="form.category_id" :options="categoryOptions"/>
        </label>
        <div class="rbi-toggle"><AppToggle v-model="form.is_mixed_topic"/><span>{{ tt('adminRadar.mixedTopic') }}</span></div>
      </div>

      <div class="rbi-field">
        <span class="rbi-label">{{ tt('adminRadar.assignCompanies') }}</span>
        <CompanyPicker v-model="form.company_ids" :companies="companies"/>
      </div>

      <div v-if="error" class="rbi-error">{{ error }}</div>
    </div>

    <template #footer>
      <template v-if="result">
        <AppButton variant="secondary" size="md" @click="reset">{{ tt('adminRadar.bulkMore') }}</AppButton>
        <AppButton variant="primary" size="md" @click="$emit('update:modelValue', false)">{{ tt('adminRadar.done') }}</AppButton>
      </template>
      <template v-else>
        <AppButton variant="secondary" size="md" :disabled="busy" @click="$emit('update:modelValue', false)">{{ tt('adminRadar.cancel') }}</AppButton>
        <AppButton variant="primary" size="md" :loading="busy" :disabled="!values.length" @click="submit">
          <template #icon><AppIcon name="Plus" :size="12"/></template>
          {{ tt('adminRadar.bulkSubmit', { n: values.length }) }}
        </AppButton>
      </template>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import CompanyPicker from '@/components/admin/CompanyPicker.vue'
import RadarBulkResults from './RadarBulkResults.vue'
import { RADAR_PLATFORMS } from '@/config/radarPlatforms.js'
import { radarAdminApi } from '@/api/radar.js'
import { parseSourceList } from '@/utils/parseSourceList.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: Boolean,
  categories: { type: Array, required: true },
  companies: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'imported'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const BULK_PLACEHOLDERS = {
  telegram: 'https://t.me/Mintrans_uz\nhttps://t.me/napp_uz\n@statistika_rasmiy',
  website: 'https://kun.uz\nhttps://gazeta.uz\nspot.uz',
  twitter: 'https://x.com/WorldBank\n@IMFNews',
}

const form = reactive({ platform: 'telegram', text: '', category_id: '', is_mixed_topic: false, company_ids: [] })
const busy = ref(false)
const error = ref('')
const result = ref(null)

const values = computed(() => parseSourceList(form.text))
const placeholder = computed(() => BULK_PLACEHOLDERS[form.platform])
const categoryOptions = computed(() => [
  { value: '', label: tt('adminRadar.noCategory') },
  ...props.categories.map((c) => ({ value: c.id, label: c.name })),
])

function reset() {
  Object.assign(form, { text: '', company_ids: [] })
  result.value = null
  error.value = ''
}

watch(() => props.modelValue, (open) => { if (open) reset() })

async function submit() {
  busy.value = true
  error.value = ''
  try {
    result.value = await radarAdminApi.bulkCreate({
      platform: form.platform,
      values: values.value,
      category_id: form.category_id || undefined,
      is_mixed_topic: form.is_mixed_topic,
      company_ids: form.company_ids,
    })
    emit('imported', result.value.summary)
  } catch (e) {
    error.value = apiErrorMessage(e, tt('adminRadar.saveError'))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.rbi { display: flex; flex-direction: column; gap: 14px; }
.rbi-field { display: flex; flex-direction: column; gap: 6px; }
.rbi-label { font-size: 12px; font-weight: 600; color: var(--text); }
.rbi-hint { font-size: 11.5px; color: var(--muted); }
.rbi-seg { display: flex; gap: 6px; flex-wrap: wrap; }
.rbi-seg-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel);
  color: var(--text-2); font-size: 12.5px; font-family: inherit; cursor: pointer;
}
.rbi-seg-btn.active { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); font-weight: 600; }
.rbi-textarea {
  width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--panel); color: var(--text); font-family: var(--font-mono); font-size: 12.5px; line-height: 1.6; resize: vertical; outline: none;
}
.rbi-textarea:focus { border-color: var(--accent); box-shadow: var(--ring); }
.rbi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
.rbi-toggle { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text); height: 32px; }
.rbi-error { padding: 10px 12px; border-radius: 7px; background: var(--danger-bg); color: var(--danger); font-size: 12.5px; }
@media (max-width: 640px) {
  .rbi-grid { grid-template-columns: 1fr; }
}
</style>
