<template>
  <div class="rsr" :class="{ inactive: !source.is_active }">
    <div class="rsr-main">
      <RadarPlatformIcon :slug="source.platform"/>
      <div class="rsr-id">
        <div class="rsr-name">{{ source.name }}</div>
        <a v-if="source.url" :href="source.url" target="_blank" rel="noopener" class="rsr-url">{{ source.url }}</a>
      </div>
    </div>
    <div class="rsr-cell">
      <AppBadge v-if="source.category" tone="accent">{{ source.category.name }}</AppBadge>
      <span v-else class="rsr-muted">{{ tt('adminRadar.noCategory') }}</span>
      <AppBadge v-if="source.is_mixed_topic" tone="violet" style="margin-left:4px;">AI</AppBadge>
    </div>
    <div class="rsr-cell rsr-num" :title="tt('adminRadar.colCompanies')">
      <AppIcon name="Building" :size="12"/> {{ source.companies_count }}
    </div>
    <div class="rsr-cell rsr-num" :title="tt('adminRadar.colPosts24h')">
      <AppIcon name="List" :size="12"/> {{ source.posts_24h }}
    </div>
    <div class="rsr-cell rsr-scan">
      <span v-if="source.last_error" class="rsr-err" :title="source.last_error">
        <AppIcon name="Close" :size="11"/> {{ tt('adminRadar.scanError') }}
      </span>
      <span v-else-if="source.last_scanned_at" class="rsr-muted">{{ formatDateTime(source.last_scanned_at, store.companyOffsetMin) }}</span>
      <span v-else class="rsr-muted">{{ tt('adminRadar.notScanned') }}</span>
    </div>
    <div class="rsr-cell"><AppToggle :model-value="source.is_active" size="sm" @update:model-value="$emit('toggle', $event)"/></div>
    <div class="rsr-actions">
      <AppButton variant="ghost" size="sm" :title="tt('adminRadar.scanNow')" @click="$emit('scan')">
        <template #icon><AppIcon name="Bolt" :size="13"/></template>
      </AppButton>
      <AppButton variant="ghost" size="sm" :title="tt('adminRadar.assign')" @click="$emit('assign')">
        <template #icon><AppIcon name="Users" :size="13"/></template>
      </AppButton>
      <AppButton variant="ghost" size="sm" :title="tt('adminRadar.edit')" @click="$emit('edit')">
        <template #icon><AppIcon name="Edit" :size="13"/></template>
      </AppButton>
      <AppButton variant="ghost" size="sm" :title="tt('adminRadar.delete')" @click="$emit('remove')">
        <template #icon><AppIcon name="Trash" :size="13"/></template>
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import RadarPlatformIcon from '@/components/radar/RadarPlatformIcon.vue'
import { formatDateTime } from '@/utils/date.js'
import { useAppStore } from '@/stores/app.js'

defineProps({ source: { type: Object, required: true } })
defineEmits(['toggle', 'edit', 'assign', 'remove', 'scan'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
</script>

<style scoped>
.rsr {
  display: grid; grid-template-columns: minmax(220px, 2.2fr) 1.2fr 70px 70px 1fr 50px 140px;
  align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--border-2); font-size: 13px;
}
.rsr:last-child { border-bottom: none; }
.rsr.inactive { opacity: .55; }
.rsr-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.rsr-id { min-width: 0; }
.rsr-name { font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rsr-url { font-size: 11.5px; color: var(--muted); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rsr-url:hover { color: var(--accent); }
.rsr-cell { display: flex; align-items: center; min-width: 0; }
.rsr-num { gap: 5px; color: var(--text-2); font-variant-numeric: tabular-nums; }
.rsr-muted { color: var(--muted); font-size: 12px; }
.rsr-err { display: inline-flex; align-items: center; gap: 4px; color: var(--danger); font-size: 12px; cursor: help; }
.rsr-actions { display: flex; justify-content: flex-end; gap: 2px; }
@media (max-width: 1024px) {
  .rsr { grid-template-columns: 1fr auto auto; grid-auto-flow: row; row-gap: 6px; }
  .rsr-main { grid-column: 1 / -1; }
  .rsr-scan { grid-column: 1 / 2; }
  .rsr-actions { grid-column: 1 / -1; justify-content: flex-start; }
}
</style>
