<template>
  <AppBadge :tone="meta.tone" dot>{{ label }}</AppBadge>
</template>

<script setup>
import { computed } from 'vue'
import AppBadge from './AppBadge.vue'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({ kind: { type: String, required: true } })
const store = useAppStore()

const statusMap = {
  active:    { tone: 'success', label: 'Active' },
  paused:    { tone: 'muted',   label: 'Paused' },
  trial:     { tone: 'violet',  label: 'Trial' },
  overdue:   { tone: 'danger',  label: 'Overdue' },
  cancelled: { tone: 'muted',   label: 'Cancelled' },
  scanning:  { tone: 'accent',  label: 'Scanning' },
  draft:     { tone: 'muted',   label: 'Draft' },
  published: { tone: 'success', label: 'Published' },
  scheduled: { tone: 'accent',  label: 'Scheduled' },
  review:    { tone: 'warn',    label: 'Review' },
  failed:    { tone: 'danger',  label: 'Failed' },
}

const meta = computed(() => statusMap[props.kind] || { tone: 'muted', label: props.kind })

const label = computed(() => {
  const tk = 'common.' + props.kind
  const translated = store.t(tk)
  return translated === tk ? meta.value.label : translated
})
</script>
