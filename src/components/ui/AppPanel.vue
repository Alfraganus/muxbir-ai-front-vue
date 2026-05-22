<template>
  <section :style="panelStyle">
    <header v-if="title || $slots.action" :style="headerStyle">
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div v-if="title" style="font-size:13px;font-weight:600;color:var(--text)">{{ title }}</div>
        <div v-if="subtitle" style="font-size:11.5px;color:var(--muted)">{{ subtitle }}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <slot name="action" />
      </div>
    </header>
    <div :style="bodyStyle"><slot /></div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  subtitle: String,
  padding: { type: Number, default: 18 },
  dense: { type: Boolean, default: false },
  noBg: { type: Boolean, default: false },
})

const panelStyle = computed(() => ({
  background: props.noBg ? 'transparent' : 'var(--panel)',
  border: props.noBg ? 'none' : '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  boxShadow: props.noBg ? 'none' : 'var(--shadow-sm)',
}))

const headerStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: props.dense ? '10px 14px' : '14px 18px',
  borderBottom: '1px solid var(--border-2)',
}))

const bodyStyle = computed(() => ({
  padding: props.title ? (props.dense ? '14px' : '18px') : `${props.padding}px`,
}))
</script>
