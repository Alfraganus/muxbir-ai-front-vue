<template>
  <Teleport to="body">
    <div v-if="modelValue" @click.self="$emit('update:modelValue', false)"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;">
      <div :style="{
        background:'var(--panel)',
        border:'1px solid var(--border)',
        borderRadius:'14px',
        width: width || '520px',
        maxWidth:'100%',
        maxHeight:'90vh',
        display:'flex',
        flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,0.25)',
        animation:'modalIn .18s ease',
      }">
        <!-- Header -->
        <div style="display:flex;align-items:center;padding:18px 20px 0;">
          <div style="flex:1;">
            <div v-if="title" style="font-size:15px;font-weight:600;color:var(--text);">{{ title }}</div>
            <div v-if="subtitle" style="font-size:12px;color:var(--muted);margin-top:2px;">{{ subtitle }}</div>
          </div>
          <button @click="$emit('update:modelValue', false)"
            style="width:28px;height:28px;border-radius:7px;border:1px solid var(--border);background:var(--panel-2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:var(--muted);flex-shrink:0;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <!-- Body -->
        <div style="flex:1;overflow-y:auto;padding:16px 20px;">
          <slot />
        </div>
        <!-- Footer -->
        <div v-if="$slots.footer" style="padding:12px 20px;border-top:1px solid var(--border-2);display:flex;align-items:center;justify-content:flex-end;gap:8px;">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ modelValue: Boolean, title: String, subtitle: String, width: String })
defineEmits(['update:modelValue'])
</script>

<style>
@keyframes modalIn {
  from { opacity:0; transform:scale(0.96) translateY(6px); }
  to   { opacity:1; transform:scale(1)    translateY(0); }
}
</style>
