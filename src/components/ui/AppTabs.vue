<template>
  <div style="display:inline-flex;gap:2px;padding:3px;background:var(--panel-2);border:1px solid var(--border);border-radius:var(--r-md);">
    <button
      v-for="item in normalizedItems"
      :key="item.value"
      :style="tabStyle(item.value)"
      @click="$emit('update:modelValue', item.value)"
    >
      {{ item.label }}
      <span v-if="item.count != null" :style="countStyle(item.value)">{{ item.count }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  modelValue: [String, Number],
  size: { type: String, default: 'md' },
})
defineEmits(['update:modelValue'])

const normalizedItems = computed(() =>
  props.items.map(it => typeof it === 'string' ? { value: it, label: it } : it)
)

const isMd = computed(() => props.size === 'md')

const tabStyle = (v) => ({
  height: isMd.value ? '26px' : '22px',
  padding: '0 10px',
  fontSize: isMd.value ? '12px' : '11.5px',
  fontWeight: '500',
  borderRadius: 'var(--r-xs)',
  border: 'none',
  background: v === props.modelValue ? 'var(--panel)' : 'transparent',
  color: v === props.modelValue ? 'var(--text)' : 'var(--muted)',
  boxShadow: v === props.modelValue ? 'var(--shadow-sm)' : 'none',
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  cursor: 'pointer',
})

const countStyle = (v) => ({
  fontSize: '10px', padding: '1px 5px', borderRadius: '999px',
  background: v === props.modelValue ? 'var(--accent-bg)' : 'var(--panel)',
  color: v === props.modelValue ? 'var(--accent)' : 'var(--muted)',
  fontFamily: 'var(--font-mono)',
  border: v === props.modelValue ? 'none' : '1px solid var(--border)',
})
</script>
