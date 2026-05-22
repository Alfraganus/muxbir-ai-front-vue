<template>
  <span :style="avatarStyle">{{ initials }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 24 },
  color: String,
})

const initials = computed(() =>
  props.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
)

const hue = computed(() =>
  [...props.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
)

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: '999px',
  background: props.color || `oklch(0.94 0.04 ${hue.value})`,
  color: props.color ? 'white' : `oklch(0.40 0.10 ${hue.value})`,
  fontSize: `${props.size * 0.42}px`,
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: '0',
}))
</script>
