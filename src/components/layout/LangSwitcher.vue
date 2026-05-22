<template>
  <div style="display:inline-flex;height:28px;padding:2px;background:var(--panel-2);border:1px solid var(--border);border-radius:6px;gap:2px;">
    <button v-for="l in langs" :key="l.id" :style="btnStyle(l.id)" @click="store.setLang(l.id)">{{ l.label }}</button>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const langs = [{ id: 'uz', label: 'UZ' }, { id: 'ru', label: 'RU' }, { id: 'en', label: 'EN' }]

const btnStyle = (id) => ({
  height: '22px', padding: '0 8px',
  fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em',
  border: 'none', borderRadius: '4px',
  background: store.lang === id ? 'var(--panel)' : 'transparent',
  color: store.lang === id ? 'var(--text)' : 'var(--muted)',
  boxShadow: store.lang === id ? 'var(--shadow-sm)' : 'none',
  fontFamily: 'var(--font-mono)', cursor: 'pointer',
})
</script>
