<template>
  <div class="rct">
    <button type="button" class="rct-tab" :class="{ active: !modelValue }" @click="$emit('update:modelValue', '')">
      {{ tt('radar.allCategories') }} <span class="rct-n">{{ totalCount }}</span>
    </button>
    <button v-for="c in withIds" :key="c.id" type="button" class="rct-tab"
            :class="{ active: modelValue === c.id }" @click="$emit('update:modelValue', c.id)">
      {{ c.name }} <span class="rct-n">{{ c.count }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  categories: { type: Array, required: true },
})
defineEmits(['update:modelValue'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

// Kategoriyasiz materiallar faqat "Hammasi" ichida ko'rinadi
const withIds = computed(() => props.categories.filter((c) => c.id))
const totalCount = computed(() => props.categories.reduce((s, c) => s + c.count, 0))
</script>

<style scoped>
.rct { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: thin; }
.rct-tab {
  display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--r-full); background: var(--panel);
  color: var(--text-2); font-size: 12.5px; font-family: inherit; cursor: pointer; white-space: nowrap;
}
.rct-tab.active { border-color: var(--accent); background: var(--accent); color: #fff; }
.rct-n { font-size: 11px; opacity: .75; font-variant-numeric: tabular-nums; }
</style>
