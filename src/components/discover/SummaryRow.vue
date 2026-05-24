<template>
  <div style="display:flex;flex-direction:column;gap:2px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);">
        <slot name="icon"/> {{ label }}
      </span>
      <span style="font-size:12.5px;font-weight:600;letter-spacing:-0.005em;">{{ value }}</span>
    </div>
    <span style="font-size:10.5px;color:var(--muted);padding-left:18px;line-height:1.45;">{{ detail }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  detail: String,
})
</script>
