<template>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);">
    <span :style="{ width:'8px',height:'8px',borderRadius:'2px',background:color }" />
    {{ label }}
  </span>
</template>

<script setup>
defineProps({ color: String, label: String })
</script>
