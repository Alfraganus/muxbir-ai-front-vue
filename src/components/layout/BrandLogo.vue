<template>
  <button type="button" class="brand-logo" @click="goHome" title="Bosh sahifa">
    <img :src="logo" alt="Muxbir AI" style="height:34px;width:auto;display:block;"/>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import logoLockup from '@/assets/muxbir-logo.png'
import logoWhite from '@/assets/muxbir-wordmark-white.png'

// Login sahifasidagi original logo — yorug' mavzuda rangli lockup,
// qorong'i mavzuda oq wordmark.
const store = useAppStore()
const router = useRouter()
const logo = computed(() => (store.darkMode ? logoWhite : logoLockup))

// Logoga bosilganda workspace bosh sahifasiga o'tadi
function goHome() {
  router.push(store.workspace === 'super' ? '/admin/overview' : '/client/overview')
}
</script>

<style scoped>
.brand-logo {
  display: inline-flex; align-items: center; gap: 9px;
  background: none; border: none; padding: 0; margin: 0; cursor: pointer;
  transition: opacity 0.15s;
}
.brand-logo:hover { opacity: 0.8; }
</style>
