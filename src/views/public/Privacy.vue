<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import LegalDoc from './LegalDoc.vue'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

// Bo'limlar i18n kalitlari orqali (Open/Closed: matn faqat DICT da o'zgaradi)
const sections = computed(() => [
  { h: tt('privacy.s1_h'), b: tt('privacy.s1_b') },
  { h: tt('privacy.s2_h'), b: tt('privacy.s2_b') },
  { h: tt('privacy.s3_h'), b: tt('privacy.s3_b') },
  { h: tt('privacy.s4_h'), b: tt('privacy.s4_b') },
  { h: tt('privacy.s5_h'), b: tt('privacy.s5_b') },
  { h: tt('privacy.s6_h'), b: tt('privacy.s6_b') },
  { h: tt('privacy.s7_h'), b: tt('privacy.s7_b') },
])
</script>

<template>
  <LegalDoc
    :title="tt('privacy.title')"
    :subtitle="tt('privacy.subtitle')"
    :updated="tt('privacy.updated')"
    :sections="sections"
  />
</template>
