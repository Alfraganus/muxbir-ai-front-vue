<template>
  <div :style="[wrapStyle, style]">
    <slot name="icon" />
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :style="inputStyle"
      @input="$emit('update:modelValue', type === 'number' ? +$event.target.value : $event.target.value)"
    />
    <slot name="suffix" />
    <span v-if="suffix" style="color:var(--muted);font-size:12px;">{{ suffix }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  placeholder: String,
  type: { type: String, default: 'text' },
  suffix: String,
  mono: Boolean,
  style: [Object, Array],
})

defineEmits(['update:modelValue'])

const wrapStyle = {
  display: 'flex',
  alignItems: 'center',
  height: '32px',
  padding: '0 10px',
  gap: '6px',
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
}

const inputStyle = computed(() => ({
  flex: '1',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '13px',
  color: 'var(--text)',
  fontFamily: props.mono ? 'var(--font-mono)' : 'inherit',
  minWidth: '0',
}))
</script>
