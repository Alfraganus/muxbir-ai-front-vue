<template>
  <div class="rcp">
    <div class="rcp-head">
      <AppInput v-model="query" :placeholder="tt('companyPicker.search')" style="flex:1;">
        <template #icon><AppIcon name="Search" :size="13" style="color:var(--muted)"/></template>
      </AppInput>
      <span class="rcp-count">{{ tt('companyPicker.selected', { n: modelValue.length }) }}</span>
    </div>
    <div class="rcp-list">
      <label v-for="c in filtered" :key="c.id" class="rcp-row">
        <input type="checkbox" :checked="selected.has(c.id)" @change="toggle(c.id)"/>
        <span class="rcp-name">{{ c.name }}</span>
        <span v-if="c.email" class="rcp-sub">{{ c.email }}</span>
      </label>
      <div v-if="!filtered.length" class="rcp-empty">{{ tt('companyPicker.empty') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: { type: Array, required: true },
  companies: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const query = ref('')
const selected = computed(() => new Set(props.modelValue))
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.companies
  return props.companies.filter((c) => `${c.name} ${c.email || ''}`.toLowerCase().includes(q))
})

function toggle(id) {
  const next = new Set(props.modelValue)
  next.has(id) ? next.delete(id) : next.add(id)
  emit('update:modelValue', [...next])
}
</script>

<style scoped>
.rcp { display: flex; flex-direction: column; gap: 8px; }
.rcp-head { display: flex; align-items: center; gap: 10px; }
.rcp-count { font-size: 12px; color: var(--muted); white-space: nowrap; }
.rcp-list { max-height: 260px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--r-sm); }
.rcp-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--border-2); cursor: pointer; font-size: 13px; }
.rcp-row:last-child { border-bottom: none; }
.rcp-row:hover { background: var(--panel-2); }
.rcp-name { font-weight: 500; color: var(--text); }
.rcp-sub { font-size: 11.5px; color: var(--muted); margin-left: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rcp-empty { padding: 16px; text-align: center; font-size: 12.5px; color: var(--muted); }
</style>
