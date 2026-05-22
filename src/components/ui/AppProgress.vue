<template>
  <div :style="trackStyle">
    <div :style="fillStyle" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  height: { type: Number, default: 6 },
  tone: { type: String, default: 'accent' },
})

const pct = computed(() => Math.min(100, (props.value / props.max) * 100))
const color = computed(() => ({
  accent: 'var(--accent)', success: 'var(--success)', warn: 'var(--warn)', danger: 'var(--danger)',
}[props.tone]))

const trackStyle = computed(() => ({ height: `${props.height}px`, background: 'var(--border-2)', borderRadius: '999px', overflow: 'hidden' }))
const fillStyle = computed(() => ({ width: pct.value + '%', height: '100%', background: color.value, borderRadius: '999px' }))
</script>
