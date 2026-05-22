<template>
  <button
    :style="btnStyle"
    @click="$emit('click')"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <span v-if="icon" :style="{ display: 'inline-flex', color: active ? 'var(--accent)' : 'var(--muted)' }">
      <AppIcon :name="icon" :size="14" />
    </span>
    <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ label }}</span>
    <span v-if="count != null" :style="countStyle" class="mono tabular">{{ count }}</span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  icon: String,
  label: String,
  count: [Number, String],
  active: Boolean,
  nested: Boolean,
})
defineEmits(['click'])

const hovered = ref(false)

const btnStyle = computed(() => ({
  width: '100%',
  height: '28px',
  padding: props.nested ? '0 8px 0 28px' : '0 8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '6px',
  border: '1px solid transparent',
  background: props.active ? 'var(--accent-bg)' : hovered.value ? 'var(--panel-2)' : 'transparent',
  color: props.active ? 'var(--accent)' : 'var(--text-2)',
  fontSize: '12.5px',
  fontWeight: '500',
  cursor: 'pointer',
  textAlign: 'left',
}))

const countStyle = computed(() => ({
  fontSize: '10.5px',
  padding: '1px 6px',
  borderRadius: '999px',
  background: props.active ? 'color-mix(in oklab, var(--accent) 22%, white)' : 'var(--panel-2)',
  color: props.active ? 'var(--accent)' : 'var(--muted)',
  border: props.active ? 'none' : '1px solid var(--border)',
}))
</script>
