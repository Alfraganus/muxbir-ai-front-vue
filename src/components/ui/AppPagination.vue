<template>
  <div v-if="total > 0" class="app-pag">
    <span class="app-pag-info">{{ rangeStart }}–{{ rangeEnd }} / {{ total }}</span>
    <div class="app-pag-btns">
      <button type="button" class="app-pag-btn" :disabled="page === 0" @click="$emit('change', page - 1)">
        <AppIcon name="ChevronL" :size="13"/> {{ tt('pagination.prev') }}
      </button>
      <button
        v-for="p in visiblePages" :key="p.key" type="button"
        class="app-pag-btn app-pag-num" :class="{ active: p.n === page }"
        :disabled="p.n === null" @click="p.n !== null && $emit('change', p.n)"
      >{{ p.n === null ? '…' : p.n + 1 }}</button>
      <button type="button" class="app-pag-btn" :disabled="page >= totalPages - 1" @click="$emit('change', page + 1)">
        {{ tt('pagination.next') }} <AppIcon name="ChevronR" :size="13"/>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, required: true },
  rangeStart: { type: Number, required: true },
  rangeEnd: { type: Number, required: true },
})
defineEmits(['change'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

// 1 … 4 5 6 … 20 — joriy sahifa atrofida 1 tadan, chetlari doim ko'rinadi
const visiblePages = computed(() => {
  const last = props.totalPages - 1
  const wanted = new Set([0, last, props.page - 1, props.page, props.page + 1])
  const nums = [...wanted].filter((n) => n >= 0 && n <= last).sort((a, b) => a - b)
  const out = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push({ key: `gap-${n}`, n: null })
    out.push({ key: n, n })
  })
  return out
})
</script>

<style scoped>
.app-pag { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
.app-pag-info { font-size: 12.5px; color: var(--muted); }
.app-pag-btns { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.app-pag-btn {
  display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 12px;
  border: 1px solid var(--border-2); border-radius: 8px; background: var(--panel); color: var(--text);
  font-size: 12.5px; font-weight: 500; cursor: pointer; font-family: inherit;
  transition: background .12s, border-color .12s, color .12s;
}
.app-pag-num { min-width: 32px; padding: 0 8px; justify-content: center; }
.app-pag-btn:hover:not(:disabled) { border-color: var(--accent); background: var(--panel-2); }
.app-pag-btn.active { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); }
.app-pag-btn:disabled { opacity: .45; cursor: not-allowed; }
@media (max-width: 640px) {
  .app-pag { justify-content: center; }
  .app-pag-info { width: 100%; text-align: center; }
}
</style>
