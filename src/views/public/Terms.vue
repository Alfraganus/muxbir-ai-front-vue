<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import LegalDoc from './LegalDoc.vue'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const sections = computed(() => [
  { h: tt('terms.s1_h'),  b: tt('terms.s1_b') },
  { h: tt('terms.s2_h'),  b: tt('terms.s2_b') },
  { h: tt('terms.s3_h'),  b: tt('terms.s3_b') },
  { h: tt('terms.s4_h'),  b: tt('terms.s4_b') },
  { h: tt('terms.s5_h'),  b: tt('terms.s5_b') },
  { h: tt('terms.s6_h'),  b: tt('terms.s6_b') },
  { h: tt('terms.s7_h'),  b: tt('terms.s7_b') },
  { h: tt('terms.s8_h'),  b: tt('terms.s8_b') },
  { h: tt('terms.s9_h'),  b: tt('terms.s9_b') },
  { h: tt('terms.s10_h'), b: tt('terms.s10_b') },
])
</script>

<template>
  <LegalDoc
    :title="tt('terms.title')"
    :subtitle="tt('terms.subtitle')"
    :updated="tt('terms.updated')"
    :sections="sections"
  />
</template>
