<template>
  <div v-if="items.length" class="bl">
    <div v-for="(it, i) in items" :key="i" class="bl-row">
      <span class="bl-label" :title="it.label">{{ it.label }}</span>
      <div class="bl-track">
        <div class="bl-fill" :style="{ width: pct(it.value) + '%', background: color }"/>
      </div>
      <span class="bl-val">{{ format(it.value) }}</span>
    </div>
  </div>
  <div v-else class="bl-empty">{{ empty }}</div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  items: { type: Array, default: () => [] }, // [{ label, value }]
  color: { type: String, default: 'var(--accent)' },
  format: { type: Function, default: v => String(v) },
  empty: { type: String, default: 'Ma\'lumot yo\'q' },
})
const max = computed(() => Math.max(1, ...props.items.map(i => Number(i.value) || 0)))
function pct(v) { return Math.max(2, Math.round((Number(v) || 0) / max.value * 100)) }
</script>

<style scoped>
.bl { display:flex;flex-direction:column;gap:9px; }
.bl-row { display:grid;grid-template-columns:96px 1fr auto;align-items:center;gap:10px; }
.bl-label { font-size:12px;color:var(--text-2,var(--text));overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-transform:capitalize; }
.bl-track { height:8px;border-radius:999px;background:var(--border-2,rgba(148,163,184,.15));overflow:hidden; }
.bl-fill { height:100%;border-radius:999px;transition:width .6s cubic-bezier(.22,.68,0,1); }
.bl-val { font-size:12px;font-weight:600;color:var(--text);font-variant-numeric:tabular-nums;min-width:38px;text-align:right; }
.bl-empty { color:var(--muted);font-size:12.5px;text-align:center;padding:28px 0; }
</style>
