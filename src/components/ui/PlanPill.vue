<template>
  <AppBadge :tone="meta.tone">{{ plan }}</AppBadge>
</template>

<script setup>
import { computed } from 'vue'
import AppBadge from './AppBadge.vue'

const props = defineProps({ plan: String })
const planMap = { Starter: 'muted', Core: 'accent', Scale: 'violet', Enterprise: 'success' }
const meta = computed(() => ({ tone: planMap[props.plan] || 'muted' }))
</script>
