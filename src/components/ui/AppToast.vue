<template>
  <Teleport to="body">
    <div style="position:fixed;bottom:24px;right:24px;z-index:2000;display:flex;flex-direction:column;gap:8px;pointer-events:none;">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id"
          :style="{
            pointerEvents:'all',
            display:'flex',alignItems:'center',gap:'10px',
            padding:'10px 14px',
            background: t.tone==='success' ? 'color-mix(in oklab,var(--success) 12%,var(--panel))' :
                        t.tone==='error'   ? 'color-mix(in oklab,var(--danger)  12%,var(--panel))' : 'var(--panel)',
            border: `1px solid ${t.tone==='success' ? 'color-mix(in oklab,var(--success) 30%,transparent)' :
                                  t.tone==='error'   ? 'color-mix(in oklab,var(--danger)  30%,transparent)' : 'var(--border)'}`,
            borderRadius:'10px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
            minWidth:'240px',maxWidth:'360px',
            fontSize:'13px',
          }">
          <span :style="{ color: t.tone==='success' ? 'var(--success)' : t.tone==='error' ? 'var(--danger)' : 'var(--text)', flexShrink:0 }">
            <svg v-if="t.tone==='success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else-if="t.tone==='error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
          </span>
          <span style="flex:1;color:var(--text);">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast.js'

// Yagona (shared) toast holatidan o'qiymiz — barcha sahifalardagi
// useToast() chaqiruvlari shu komponentda ko'rinadi.
const { toasts } = useToast()
</script>

<style>
.toast-enter-active { animation: toastIn .2s ease; }
.toast-leave-active { animation: toastIn .15s ease reverse; }
@keyframes toastIn {
  from { opacity:0; transform:translateX(20px); }
  to   { opacity:1; transform:translateX(0); }
}
</style>
