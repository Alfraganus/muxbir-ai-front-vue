<template>
  <div class="pms">
    <div v-for="role in ROLES" :key="role.key" class="pms-card">
      <div class="pms-title">{{ tt(role.titleKey) }}</div>
      <div class="pms-hint">{{ tt(role.hintKey) }}</div>
      <div class="pms-grid">
        <label class="pms-field">
          <span>{{ tt('sp.provider') }}</span>
          <AppSelect :model-value="modelValue[`${role.key}_provider`]" :options="AI_PROVIDERS"
                     @update:model-value="set(`${role.key}_provider`, $event)"/>
        </label>
        <label class="pms-field">
          <span>{{ tt('sp.model') }}</span>
          <AppInput :model-value="modelValue[`${role.key}_model`] || ''" :placeholder="tt('sp.modelDefault')"
                    @update:model-value="set(`${role.key}_model`, $event)"/>
        </label>
      </div>
    </div>
    <label class="pms-field pms-temp">
      <span>{{ tt('sp.temperature') }}: <b>{{ modelValue.temperature }}</b></span>
      <input type="range" min="0" max="1" step="0.05" :value="modelValue.temperature"
             @input="set('temperature', Number($event.target.value))"/>
      <span class="pms-hint">{{ tt('sp.temperatureHint') }}</span>
    </label>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { AI_PROVIDERS } from '@/config/aiProviders.js'
import { useAppStore } from '@/stores/app.js'

const ROLES = [
  { key: 'writer', titleKey: 'sp.writerModel', hintKey: 'sp.writerModelHint' },
  { key: 'review', titleKey: 'sp.reviewModel', hintKey: 'sp.reviewModelHint' },
]

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

function set(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<style scoped>
.pms { display: flex; flex-direction: column; gap: 14px; max-width: 720px; }
.pms-card { padding: 14px; border: 1px solid var(--border); border-radius: var(--r-md); display: flex; flex-direction: column; gap: 6px; }
.pms-title { font-size: 13.5px; font-weight: 600; color: var(--text); }
.pms-hint { font-size: 12px; color: var(--muted); }
.pms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px; }
.pms-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text); }
.pms-temp input { accent-color: var(--accent); }
@media (max-width: 640px) { .pms-grid { grid-template-columns: 1fr; } }
</style>
