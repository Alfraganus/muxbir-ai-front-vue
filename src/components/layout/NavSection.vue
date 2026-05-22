<template>
  <div style="display:flex;flex-direction:column;gap:1px;margin-bottom:16px;">
    <div v-if="label" style="font-size:10.5px;font-weight:500;color:var(--muted-2);text-transform:uppercase;letter-spacing:0.08em;padding:0 8px;margin-bottom:6px;">{{ label }}</div>
    <slot />
  </div>
</template>

<script setup>
defineProps({ label: String })
</script>
