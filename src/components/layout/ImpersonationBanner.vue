<template>
  <div v-if="authStore.isImpersonating" class="imp-banner">
    <span class="imp-ic">
      <AppIcon name="Users" :size="15"/>
    </span>
    <div class="imp-text">
      <span class="imp-title">{{ tt('imp.title', { name: authStore.impersonatedName }) }}</span>
      <span class="imp-sub">{{ tt('imp.sub') }}</span>
    </div>
    <div class="imp-actions">
      <button class="imp-btn" @click="returnToAdmin">
        <AppIcon name="Arrow" :size="13"/>
        {{ tt('imp.return') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

async function returnToAdmin() {
  const ok = authStore.stopImpersonation()
  // Zaxira tokenlar yo'q bo'lsa (kutilmagan holat) — qaytadan kirishga yuboramiz.
  await router.push(ok ? '/admin/companies' : '/signin')
}
</script>

<style scoped>
.imp-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px; border-bottom: 1px solid var(--border);
  background: color-mix(in oklab, #8b5cf6 13%, var(--bg));
}
.imp-ic {
  width: 30px; height: 30px; border-radius: var(--r-sm); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: color-mix(in oklab, #8b5cf6 22%, transparent); color: #8b5cf6;
}
.imp-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.imp-title { font-size: 13px; font-weight: 600; color: var(--text); }
.imp-sub { font-size: 11.5px; color: var(--muted); }

.imp-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.imp-btn {
  display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px;
  border-radius: var(--r-sm); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
  border: none; color: #fff; background: #8b5cf6;
  box-shadow: 0 6px 16px -6px color-mix(in oklab, #8b5cf6 60%, transparent);
  transition: filter .15s;
}
.imp-btn:hover { filter: brightness(1.08); }

@media (max-width: 640px) {
  .imp-banner { padding: 9px 14px; gap: 10px; }
  .imp-sub { display: none; }
}
</style>
