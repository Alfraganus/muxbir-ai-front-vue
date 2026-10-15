<template>
  <div ref="root" class="rsf">
    <button type="button" class="rsf-btn" :class="{ active: modelValue.length }" @click="open = !open">
      <AppIcon name="Filter" :size="13"/>
      {{ modelValue.length ? tt('radar.sourcesSelected', { n: modelValue.length }) : tt('radar.sourcesFilter') }}
      <AppIcon name="Chevron" :size="12"/>
    </button>
    <div v-if="open" class="rsf-pop">
      <div class="rsf-head">
        <AppInput v-model="query" :placeholder="tt('radar.sourcesSearch')" style="flex:1;">
          <template #icon><AppIcon name="Search" :size="12" style="color:var(--muted)"/></template>
        </AppInput>
      </div>
      <div class="rsf-actions">
        <button type="button" class="rsf-action" :disabled="allFilteredSelected" @click="selectAll">
          <AppIcon name="Check" :size="12"/> {{ tt('radar.sourcesSelectAll') }}
        </button>
        <button type="button" class="rsf-action" :disabled="!modelValue.length" @click="$emit('update:modelValue', [])">
          <AppIcon name="Close" :size="12"/> {{ tt('radar.sourcesClearAll') }}
        </button>
      </div>
      <div class="rsf-list">
        <label v-for="s in filtered" :key="s.id" class="rsf-row">
          <input type="checkbox" :checked="selected.has(s.id)" @change="toggle(s.id)"/>
          <RadarPlatformIcon :slug="s.platform" :size="11"/>
          <span class="rsf-name">{{ s.name }}</span>
          <span class="rsf-n">{{ s.count }}</span>
        </label>
        <div v-if="!filtered.length" class="rsf-empty">{{ tt('radar.sourcesEmpty') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppInput from '@/components/ui/AppInput.vue'
import RadarPlatformIcon from './RadarPlatformIcon.vue'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: { type: Array, required: true },
  /** Davrdagi xabarlarda uchragan manbalar: [{ id, name, platform, count }] */
  sources: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const open = ref(false)
const query = ref('')
const root = ref(null)
const selected = computed(() => new Set(props.modelValue))
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.sources.filter((s) => s.name.toLowerCase().includes(q)) : props.sources
})

// Qidiruv bo'lsa — faqat ko'rinib turgan manbalar qo'shiladi (oldin tanlanganlar saqlanadi)
const allFilteredSelected = computed(() => filtered.value.length > 0 && filtered.value.every((s) => selected.value.has(s.id)))

function selectAll() {
  emit('update:modelValue', [...new Set([...props.modelValue, ...filtered.value.map((s) => s.id)])])
}

function toggle(id) {
  const next = new Set(props.modelValue)
  next.has(id) ? next.delete(id) : next.add(id)
  emit('update:modelValue', [...next])
}

// Tashqariga bosilganda yopiladi
function onDocClick(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<style scoped>
.rsf { position: relative; }
.rsf-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; white-space: nowrap;
  border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel);
  color: var(--text-2); font-size: 12.5px; font-family: inherit; cursor: pointer;
}
.rsf-btn.active { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); font-weight: 600; }
.rsf-pop {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 50; width: 360px; max-width: calc(100vw - 24px);
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-md); box-shadow: var(--shadow-lg);
  padding: 10px; display: flex; flex-direction: column; gap: 8px;
}
.rsf-head { display: flex; align-items: center; gap: 8px; }
.rsf-actions { display: flex; gap: 6px; padding-bottom: 6px; border-bottom: 1px solid var(--border-2); }
.rsf-action {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 28px;
  border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel); color: var(--text-2);
  font-size: 12px; font-family: inherit; cursor: pointer; white-space: nowrap;
}
.rsf-action:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.rsf-action:disabled { opacity: .45; cursor: not-allowed; }
.rsf-list { max-height: 320px; overflow-y: auto; }
.rsf-row { display: grid; grid-template-columns: 16px 22px 1fr auto; align-items: center; gap: 8px; padding: 7px 6px; border-radius: 6px; cursor: pointer; font-size: 13px; }
.rsf-row:hover { background: var(--panel-2); }
.rsf-name { color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rsf-n { font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.rsf-empty { padding: 16px; text-align: center; font-size: 12.5px; color: var(--muted); }
@media (max-width: 640px) {
  .rsf { width: 100%; }
  .rsf-btn { width: 100%; justify-content: center; }
  .rsf-pop { left: 0; right: 0; width: auto; }
}
</style>
