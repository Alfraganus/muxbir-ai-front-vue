<template>
  <div style="position:relative;display:inline-block;">
    <button @click="open = !open" :style="btnStyle">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="3" r="1.4" fill="currentColor"/>
        <circle cx="8" cy="8" r="1.4" fill="currentColor"/>
        <circle cx="8" cy="13" r="1.4" fill="currentColor"/>
      </svg>
    </button>
    <template v-if="open">
      <div style="position:fixed;inset:0;z-index:40;" @click="open = false"/>
      <div style="position:absolute;right:0;top:30px;z-index:41;width:160px;background:var(--panel);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow-lg);padding:4px;">
        <button v-for="item in items" :key="item.label" @click="open=false" :style="menuItemStyle(item.danger)">
          {{ item.label }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  items: {
    type: Array,
    default: null,
  }
})

// defineProps default tt()'ga murojaat qila olmaydi (hoisting) — shuning uchun
// standart ro'yxat computed orqali tarjima qilinadi.
const items = computed(() => props.items ?? [
  { label: tt('moreMenu.view') },
  { label: tt('moreMenu.edit') },
  { label: tt('moreMenu.copy') },
  { label: tt('moreMenu.delete'), danger: true },
])

const open = ref(false)

const btnStyle = {
  width: '26px', height: '26px',
  border: '1px solid var(--border)', borderRadius: '6px',
  background: 'var(--panel)', color: 'var(--muted)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

const menuItemStyle = (danger) => ({
  width: '100%', padding: '7px 10px',
  background: 'transparent', border: 'none', borderRadius: '5px',
  textAlign: 'left', fontSize: '12.5px',
  color: danger ? 'var(--danger)' : 'var(--text)',
  cursor: 'pointer', display: 'block',
})
</script>
