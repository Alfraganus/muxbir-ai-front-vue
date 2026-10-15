<template>
  <div class="rtb">
    <div class="rtb-range">
      <button type="button" class="rtb-btn" :class="{ active: !date }" @click="$emit('update:date', '')">
        <AppIcon name="Bolt" :size="13"/> {{ tt('radar.last24h') }}
      </button>
      <label class="rtb-date" :class="{ active: !!date }">
        <AppIcon name="Calendar" :size="13"/>
        <input type="date" :value="date" :max="today" @change="$emit('update:date', $event.target.value)"/>
      </label>
    </div>
    <AppInput :model-value="q" :placeholder="tt('radar.search')" class="rtb-search"
              @update:model-value="$emit('update:q', $event)">
      <template #icon><AppIcon name="Search" :size="13" style="color:var(--muted)"/></template>
    </AppInput>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { useAppStore } from '@/stores/app.js'

defineProps({
  date: { type: String, default: '' },
  q: { type: String, default: '' },
  today: { type: String, required: true },
})
defineEmits(['update:date', 'update:q'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
</script>

<style scoped>
.rtb { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rtb-range { display: flex; gap: 6px; }
.rtb-btn, .rtb-date {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel);
  color: var(--text-2); font-size: 12.5px; font-family: inherit; cursor: pointer;
}
.rtb-btn.active, .rtb-date.active { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); font-weight: 600; }
.rtb-date input { border: none; outline: none; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.rtb-search { flex: 1 1 240px; }
@media (max-width: 640px) {
  .rtb-range { width: 100%; }
  .rtb-btn, .rtb-date { flex: 1; justify-content: center; }
}
</style>
