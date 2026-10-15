<template>
  <div class="pfr">
    <p class="pfr-hint">{{ tt('sp.rulesHint') }}</p>
    <div class="pfr-keys">
      <button v-for="k in keys" :key="k" type="button" class="pfr-key" :class="{ active: selected === k }" @click="selected = k">
        <span class="pfr-key-name">{{ k }}</span>
        <span class="pfr-key-use">{{ usedBy(k) }}</span>
      </button>
    </div>
    <PromptTextEditor v-if="selected" :model-value="modelValue[selected] || ''" :readonly="readonly" height="50vh"
                      @update:model-value="update(selected, $event)"/>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import PromptTextEditor from './PromptTextEditor.vue'
import { useAppStore } from '@/stores/app.js'

/** "common" har doim qo'shiladi; qolganlari janrning rules_key'i bo'yicha. */
const COMMON_KEY = 'common'

const props = defineProps({
  modelValue: { type: Object, required: true },
  genres: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const keys = computed(() => {
  const fromGenres = props.genres.map((g) => g.rules_key)
  return [...new Set([COMMON_KEY, ...Object.keys(props.modelValue), ...fromGenres])]
})
const selected = ref(COMMON_KEY)
watch(keys, (k) => { if (!k.includes(selected.value)) selected.value = k[0] })

function usedBy(key) {
  if (key === COMMON_KEY) return tt('sp.rulesAllGenres')
  const names = props.genres.filter((g) => g.rules_key === key).map((g) => g.name)
  return names.length ? names.join(', ') : tt('sp.rulesUnused')
}

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style scoped>
.pfr { display: flex; flex-direction: column; gap: 10px; }
.pfr-hint { margin: 0; font-size: 12.5px; color: var(--muted); }
.pfr-keys { display: flex; gap: 8px; flex-wrap: wrap; }
.pfr-key {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 7px 12px; min-width: 120px;
  border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel); cursor: pointer; font-family: inherit; text-align: left;
}
.pfr-key.active { border-color: var(--accent); background: var(--accent-bg); }
.pfr-key-name { font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; color: var(--text); }
.pfr-key-use { font-size: 11px; color: var(--muted); }
</style>
