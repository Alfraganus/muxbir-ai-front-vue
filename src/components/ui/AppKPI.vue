<template>
  <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow-sm);min-width:0;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">{{ label }}</span>
      <slot name="icon" />
    </div>
    <div style="display:flex;align-items:baseline;gap:8px;">
      <span class="tabular" style="font-size:24px;font-weight:600;letter-spacing:-0.02em;" :style="{ color: accent || 'var(--text)' }">
        <slot name="value">{{ value }}</slot>
      </span>
      <span v-if="delta" :style="deltaStyle" style="font-size:11.5px;font-weight:500;">{{ delta }}</span>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <span style="font-size:11.5px;color:var(--muted);">{{ sub }}</span>
      <slot name="spark" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: [String, Number],
  delta: String,
  deltaTone: { type: String, default: 'success' },
  sub: String,
  accent: String,
})

const deltaStyle = computed(() => ({
  color: props.deltaTone === 'success' ? 'var(--success)' : props.deltaTone === 'danger' ? 'var(--danger)' : 'var(--muted)',
}))
</script>
