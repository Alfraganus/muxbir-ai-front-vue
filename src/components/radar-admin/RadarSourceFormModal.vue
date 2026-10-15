<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
            :title="isEdit ? tt('adminRadar.editTitle') : tt('adminRadar.createTitle')"
            :subtitle="tt('adminRadar.formSubtitle')" width="600px">
    <div class="rsf">
      <div class="rsf-field">
        <span class="rsf-label">{{ tt('adminRadar.platform') }}</span>
        <div class="rsf-seg">
          <button v-for="p in RADAR_PLATFORMS" :key="p.slug" type="button"
                  class="rsf-seg-btn" :class="{ active: form.platform === p.slug }"
                  :disabled="isEdit" @click="form.platform = p.slug">
            <AppIcon :name="p.icon" :size="13"/> {{ tt(p.labelKey) }}
          </button>
        </div>
      </div>

      <label class="rsf-field">
        <span class="rsf-label">{{ tt('adminRadar.value') }}</span>
        <AppInput v-model="form.value" :placeholder="tt(platform.placeholderKey)" :style="isEdit ? { opacity: .6, pointerEvents: 'none' } : {}"/>
      </label>

      <div class="rsf-grid">
        <label class="rsf-field">
          <span class="rsf-label">{{ tt('adminRadar.name') }}</span>
          <AppInput v-model="form.name" :placeholder="tt('adminRadar.namePh')"/>
        </label>
        <label class="rsf-field">
          <span class="rsf-label">{{ tt('adminRadar.category') }}</span>
          <AppSelect v-model="form.category_id" :options="categoryOptions"/>
        </label>
      </div>

      <label v-if="form.platform === 'website'" class="rsf-field">
        <span class="rsf-label">{{ tt('adminRadar.feedUrl') }}</span>
        <AppInput v-model="form.feed_url" placeholder="https://kun.uz/news/rss"/>
        <span class="rsf-hint">{{ tt('adminRadar.feedUrlHint') }}</span>
      </label>

      <div class="rsf-toggle"><AppToggle v-model="form.is_mixed_topic"/>
        <div><div class="rsf-tl">{{ tt('adminRadar.mixedTopic') }}</div><div class="rsf-hint">{{ tt('adminRadar.mixedTopicHint') }}</div></div>
      </div>
      <div v-if="form.platform === 'website'" class="rsf-toggle"><AppToggle v-model="form.allow_undated"/>
        <div><div class="rsf-tl">{{ tt('adminRadar.allowUndated') }}</div><div class="rsf-hint">{{ tt('adminRadar.allowUndatedHint') }}</div></div>
      </div>
      <div class="rsf-toggle"><AppToggle v-model="form.is_active"/>
        <div class="rsf-tl">{{ tt('adminRadar.active') }}</div>
      </div>

      <div v-if="!isEdit" class="rsf-field">
        <span class="rsf-label">{{ tt('adminRadar.assignCompanies') }}</span>
        <CompanyPicker v-model="form.company_ids" :companies="companies"/>
      </div>

      <div v-if="error" class="rsf-error">{{ error }}</div>
    </div>

    <template #footer>
      <AppButton variant="secondary" size="md" :disabled="busy" @click="$emit('update:modelValue', false)">
        {{ tt('adminRadar.cancel') }}
      </AppButton>
      <AppButton variant="primary" size="md" :loading="busy" @click="submit">
        <template #icon><AppIcon name="Check" :size="12"/></template>
        {{ isEdit ? tt('adminRadar.save') : tt('adminRadar.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import CompanyPicker from '@/components/admin/CompanyPicker.vue'
import { RADAR_PLATFORMS, radarPlatform } from '@/config/radarPlatforms.js'
import { radarAdminApi } from '@/api/radar.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: Boolean,
  source: { type: Object, default: null },
  categories: { type: Array, required: true },
  companies: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const EMPTY = { platform: 'telegram', value: '', name: '', category_id: '', is_mixed_topic: false, allow_undated: false, is_active: true, feed_url: '', company_ids: [] }
const form = reactive({ ...EMPTY })
const busy = ref(false)
const error = ref('')

const isEdit = computed(() => !!props.source)
const platform = computed(() => radarPlatform(form.platform))
const categoryOptions = computed(() => [
  { value: '', label: tt('adminRadar.noCategory') },
  ...props.categories.map((c) => ({ value: c.id, label: c.name })),
])

watch(() => props.modelValue, (open) => {
  if (!open) return
  error.value = ''
  const s = props.source
  Object.assign(form, EMPTY, { company_ids: [] }, s ? {
    platform: s.platform, value: s.url || s.username, name: s.name, category_id: s.category?.id || '',
    is_mixed_topic: s.is_mixed_topic, allow_undated: s.allow_undated, is_active: s.is_active, feed_url: s.feed_url || '',
  } : {})
})

function payload() {
  const common = {
    name: form.name.trim() || undefined,
    is_mixed_topic: form.is_mixed_topic,
    is_active: form.is_active,
    allow_undated: form.allow_undated,
  }
  if (isEdit.value) {
    return { ...common, category_id: form.category_id || null, feed_url: form.feed_url.trim() || null }
  }
  return {
    ...common,
    platform: form.platform,
    value: form.value.trim(),
    category_id: form.category_id || undefined,
    feed_url: form.feed_url.trim() || undefined,
    company_ids: form.company_ids,
  }
}

async function submit() {
  if (!isEdit.value && !form.value.trim()) { error.value = tt('adminRadar.valueRequired'); return }
  busy.value = true
  error.value = ''
  try {
    const saved = isEdit.value
      ? await radarAdminApi.update(props.source.id, payload())
      : await radarAdminApi.create(payload())
    emit('saved', saved)
    emit('update:modelValue', false)
  } catch (e) {
    error.value = apiErrorMessage(e, tt('adminRadar.saveError'))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.rsf { display: flex; flex-direction: column; gap: 14px; }
.rsf-field { display: flex; flex-direction: column; gap: 6px; }
.rsf-label { font-size: 12px; font-weight: 600; color: var(--text); }
.rsf-hint { font-size: 11.5px; color: var(--muted); }
.rsf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.rsf-seg { display: flex; gap: 6px; flex-wrap: wrap; }
.rsf-seg-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel);
  color: var(--text-2); font-size: 12.5px; font-family: inherit; cursor: pointer;
}
.rsf-seg-btn.active { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); font-weight: 600; }
.rsf-seg-btn:disabled:not(.active) { opacity: .45; cursor: not-allowed; }
.rsf-toggle { display: flex; align-items: flex-start; gap: 10px; }
.rsf-tl { font-size: 13px; font-weight: 500; color: var(--text); }
.rsf-error { padding: 10px 12px; border-radius: 7px; background: var(--danger-bg); color: var(--danger); font-size: 12.5px; }
@media (max-width: 640px) {
  .rsf-grid { grid-template-columns: 1fr; }
}
</style>
