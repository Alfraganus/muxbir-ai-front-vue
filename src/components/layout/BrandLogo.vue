<template>
  <div style="display:inline-flex;align-items:center;gap:9px;">
    <img :src="logo" alt="Muxbir AI" style="height:26px;width:auto;display:block;"/>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import logoLockup from '@/assets/muxbir-logo.png'
import logoWhite from '@/assets/muxbir-wordmark-white.png'

// Login sahifasidagi original logo — yorug' mavzuda rangli lockup,
// qorong'i mavzuda oq wordmark.
const store = useAppStore()
const logo = computed(() => (store.darkMode ? logoWhite : logoLockup))
</script>
