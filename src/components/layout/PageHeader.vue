<template>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:4px;">
    <div style="display:flex;flex-direction:column;gap:3px;">
      <h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.015em;">{{ title }}</h1>
      <p v-if="subtitle" style="margin:0;font-size:12.5px;color:var(--muted);">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.right" style="display:flex;align-items:center;gap:8px;">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
defineProps({ title: String, subtitle: String })
</script>
