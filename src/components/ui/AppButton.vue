<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :style="[sizeStyle, variantStyle, { opacity: (disabled || loading) ? 0.65 : 1, cursor: (disabled || loading) ? 'not-allowed' : 'pointer' }, style]"
    style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;border-radius:var(--r-sm);font-weight:500;font-family:inherit;"
    @click="$emit('click', $event)"
  >
    <svg v-if="loading" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
      style="animation:spin .7s linear infinite;flex-shrink:0;">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    <slot v-if="!loading" name="icon" />
    <span v-if="$slots.default"><slot /></span>
    <slot v-if="!loading" name="icon-right" />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'ghost' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  style: { type: [Object, Array], default: () => ({}) },
})

defineEmits(['click'])

const sizes = { sm: { h: '26px', px: '8px', fs: '12px' }, md: { h: '30px', px: '10px', fs: '12.5px' }, lg: { h: '36px', px: '14px', fs: '13px' } }
const sizeStyle = computed(() => {
  const s = sizes[props.size] || sizes.md
  return { height: s.h, padding: `0 ${s.px}`, fontSize: s.fs }
})

const variants = computed(() => ({
  primary:   { background: 'var(--accent)', color: 'white', border: '1px solid color-mix(in oklab, var(--accent) 60%, black)', boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 1px 2px rgba(15,23,42,0.15)' },
  secondary: { background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  ghost:     { background: props.active ? 'var(--accent-bg)' : 'transparent', color: props.active ? 'var(--accent)' : 'var(--text-2)', border: '1px solid transparent' },
  soft:      { background: 'var(--panel-2)', color: 'var(--text)', border: '1px solid var(--border)' },
  danger:    { background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)' },
  success:   { background: '#198754', color: 'white', border: '1px solid #146c43', boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 1px 2px rgba(15,23,42,0.15)' },
}))

const variantStyle = computed(() => variants.value[props.variant] || variants.value.ghost)
</script>
