<template>
  <div class="pv">
    <div v-for="v in versions" :key="v.id" class="pv-row" :class="{ active: v.id === activeId }">
      <div class="pv-no">v{{ v.version_no }}</div>
      <div class="pv-body">
        <div class="pv-note">{{ v.note || tt('sp.noNote') }}</div>
        <div class="pv-meta">
          {{ formatDateTime(v.created_at, store.companyOffsetMin) }} · {{ v.writer_provider }}{{ v.writer_model ? ` / ${v.writer_model}` : '' }}
        </div>
      </div>
      <AppBadge v-if="v.id === activeId" tone="success">{{ tt('sp.active') }}</AppBadge>
      <div class="pv-actions">
        <AppButton variant="ghost" size="sm" @click="$emit('view', v.id)">
          <template #icon><AppIcon name="Eye" :size="13"/></template>{{ tt('sp.view') }}
        </AppButton>
        <AppButton v-if="v.id !== activeId" variant="secondary" size="sm" @click="$emit('activate', v.id)">
          {{ tt('sp.activate') }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { formatDateTime } from '@/utils/date.js'
import { useAppStore } from '@/stores/app.js'

defineProps({
  versions: { type: Array, required: true },
  activeId: { type: String, default: null },
})
defineEmits(['view', 'activate'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
</script>

<style scoped>
.pv { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; }
.pv-row { display: grid; grid-template-columns: 48px 1fr auto auto; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--border-2); }
.pv-row:last-child { border-bottom: none; }
.pv-row.active { background: color-mix(in oklab, var(--success) 6%, transparent); }
.pv-no { font-family: var(--font-mono); font-weight: 700; color: var(--text); }
.pv-note { font-size: 13px; color: var(--text); }
.pv-meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
.pv-actions { display: flex; gap: 6px; }
@media (max-width: 640px) {
  .pv-row { grid-template-columns: 40px 1fr; }
  .pv-actions { grid-column: 2; }
}
</style>
