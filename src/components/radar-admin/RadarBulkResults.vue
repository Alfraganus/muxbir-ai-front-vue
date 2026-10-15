<template>
  <div class="rbr">
    <div class="rbr-summary">
      <span v-for="k in STATUSES" :key="k" class="rbr-chip" :class="`rbr-${k}`">
        {{ tt(`adminRadar.bulkStatus.${k}`) }}: {{ summary[k] || 0 }}
      </span>
    </div>
    <div class="rbr-list">
      <div v-for="(r, i) in results" :key="i" class="rbr-row">
        <span class="rbr-dot" :class="`rbr-${r.status}`"/>
        <span class="rbr-value">{{ r.value }}</span>
        <span class="rbr-msg">{{ r.message || tt(`adminRadar.bulkStatus.${r.status}`) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'

defineProps({
  results: { type: Array, required: true },
  summary: { type: Object, required: true },
})

const STATUSES = ['created', 'exists', 'duplicate', 'invalid']

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
</script>

<style scoped>
.rbr { display: flex; flex-direction: column; gap: 10px; }
.rbr-summary { display: flex; gap: 6px; flex-wrap: wrap; }
.rbr-chip { padding: 3px 10px; border-radius: var(--r-full); font-size: 12px; font-weight: 600; }
.rbr-list { max-height: 320px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--r-sm); }
.rbr-row { display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 10px; padding: 7px 12px; border-bottom: 1px solid var(--border-2); font-size: 12.5px; }
.rbr-row:last-child { border-bottom: none; }
.rbr-dot { width: 8px; height: 8px; border-radius: 50%; }
.rbr-value { color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono); font-size: 12px; }
.rbr-msg { color: var(--muted); font-size: 11.5px; text-align: right; }
.rbr-chip.rbr-created { background: var(--success-bg); color: var(--success); }
.rbr-chip.rbr-exists { background: var(--accent-bg); color: var(--accent); }
.rbr-chip.rbr-duplicate { background: var(--warn-bg); color: var(--warn); }
.rbr-chip.rbr-invalid { background: var(--danger-bg); color: var(--danger); }
.rbr-dot.rbr-created { background: var(--success); }
.rbr-dot.rbr-exists { background: var(--accent); }
.rbr-dot.rbr-duplicate { background: var(--warn); }
.rbr-dot.rbr-invalid { background: var(--danger); }
@media (max-width: 640px) {
  .rbr-row { grid-template-columns: 8px 1fr; }
  .rbr-msg { grid-column: 2; text-align: left; }
}
</style>
