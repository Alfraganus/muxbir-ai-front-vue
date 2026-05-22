<template>
  <button type="button" :style="trackStyle" @click="$emit('update:modelValue', !modelValue)">
    <span :style="thumbStyle" />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  size: { type: String, default: 'md' },
})
defineEmits(['update:modelValue'])

const w = computed(() => props.size === 'sm' ? 28 : 34)
const h = computed(() => props.size === 'sm' ? 16 : 20)
const d = computed(() => h.value - 4)

const trackStyle = computed(() => ({
  width: `${w.value}px`, height: `${h.value}px`,
  background: props.modelValue ? 'var(--accent)' : 'var(--border)',
  border: 'none', borderRadius: '999px',
  position: 'relative', padding: '2px',
  cursor: 'pointer', transition: 'background .15s',
}))

const thumbStyle = computed(() => ({
  width: `${d.value}px`, height: `${d.value}px`,
  background: 'white', borderRadius: '999px',
  position: 'absolute', top: '2px',
  left: props.modelValue ? `${w.value - d.value - 2}px` : '2px',
  transition: 'left .15s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
}))
</script>
