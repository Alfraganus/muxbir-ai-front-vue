<template>
  <div class="pte">
    <textarea
      class="pte-area" :value="modelValue" :readonly="readonly" spellcheck="false"
      :style="{ minHeight: height }"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <div class="pte-meta">
      <span>{{ tt('sp.chars', { n: stats.chars }) }}</span>
      <span>{{ tt('sp.words', { n: stats.words }) }}</span>
      <span :title="tt('sp.tokensHint')">≈ {{ tt('sp.tokens', { n: stats.tokens }) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  height: { type: String, default: '60vh' },
})
defineEmits(['update:modelValue'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

// Kirill matnda 1 token ≈ 2.5 belgi — taxminiy (narx/sig'imni baholash uchun)
const stats = computed(() => {
  const text = props.modelValue || ''
  return {
    chars: text.length,
    words: (text.match(/\S+/g) || []).length,
    tokens: Math.round(text.length / 2.5),
  }
})
</script>

<style scoped>
.pte { display: flex; flex-direction: column; gap: 6px; }
.pte-area {
  width: 100%; box-sizing: border-box; padding: 12px 14px; resize: vertical; outline: none;
  border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel); color: var(--text);
  font-family: var(--font-mono); font-size: 12.5px; line-height: 1.65; tab-size: 2;
}
.pte-area:focus { border-color: var(--accent); box-shadow: var(--ring); }
.pte-area[readonly] { background: var(--panel-2); }
.pte-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
</style>
