<template>
  <span :style="badgeStyle">
    <span v-if="dot" :style="{ width: '6px', height: '6px', borderRadius: '999px', background: toneColors.fg }" />
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tone: { type: String, default: 'muted' },
  dot: { type: Boolean, default: false },
  size: { type: String, default: 'sm' },
})

const tones = {
  muted:   { bg: 'var(--panel-2)',   fg: 'var(--text-2)', bd: 'var(--border)' },
  accent:  { bg: 'var(--accent-bg)', fg: 'var(--accent)', bd: 'color-mix(in oklab, var(--accent) 25%, transparent)' },
  success: { bg: 'var(--success-bg)',fg: 'var(--success)',bd: 'color-mix(in oklab, var(--success) 30%, transparent)' },
  warn:    { bg: 'var(--warn-bg)',   fg: 'var(--warn)',   bd: 'color-mix(in oklab, var(--warn) 30%, transparent)' },
  danger:  { bg: 'var(--danger-bg)', fg: 'var(--danger)', bd: 'color-mix(in oklab, var(--danger) 30%, transparent)' },
  violet:  { bg: 'var(--violet-bg)', fg: 'var(--violet)', bd: 'color-mix(in oklab, var(--violet) 30%, transparent)' },
}

const toneColors = computed(() => tones[props.tone] || tones.muted)

const badgeStyle = computed(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  height: props.size === 'md' ? '22px' : '18px',
  padding: '0 7px',
  borderRadius: 'var(--r-sm)',
  background: toneColors.value.bg,
  color: toneColors.value.fg,
  border: `1px solid ${toneColors.value.bd}`,
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.005em',
}))
</script>
