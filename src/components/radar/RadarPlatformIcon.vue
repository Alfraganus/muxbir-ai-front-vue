<template>
  <span class="rpi" :class="`rpi-${slug}`" :title="tt(platform.labelKey)">
    <AppIcon :name="platform.icon" :size="size"/>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { radarPlatform } from '@/config/radarPlatforms.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  slug: { type: String, required: true },
  size: { type: Number, default: 12 },
})

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const platform = computed(() => radarPlatform(props.slug))
</script>

<style scoped>
.rpi { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0; }
.rpi-telegram { background: color-mix(in oklab, #229ED9 14%, transparent); color: #229ED9; }
.rpi-website { background: var(--accent-bg); color: var(--accent); }
.rpi-twitter { background: color-mix(in oklab, var(--text) 10%, transparent); color: var(--text); }
</style>
