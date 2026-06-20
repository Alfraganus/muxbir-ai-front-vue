<template>
  <div class="magic-wrap">
    <div class="magic-card">
      <div v-if="state === 'loading'" class="magic-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"
          style="animation:spin .7s linear infinite;">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span>{{ tt('magicAuth.checking') }}</span>
      </div>
      <div v-else-if="state === 'success'" class="magic-state">
        <div class="magic-icon success"><AppIcon name="Check" :size="22"/></div>
        <span style="font-weight:600;">{{ tt('magicAuth.success') }}</span>
        <span style="font-size:12px;color:var(--muted);">{{ tt('magicAuth.redirecting') }}</span>
      </div>
      <div v-else class="magic-state">
        <div class="magic-icon danger"><AppIcon name="Close" :size="22"/></div>
        <span style="font-weight:600;">{{ tt('magicAuth.invalidLink') }}</span>
        <span style="font-size:12px;color:var(--muted);">{{ errorMsg }}</span>
        <AppButton variant="secondary" size="md" @click="$router.push('/signin')">{{ tt('magicAuth.back') }}</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { authApi } from '@/api/auth.js'
import { useAuthStore } from '@/stores/auth.js'
import { useAppStore } from '@/stores/app.js'
import { resolveRole, homePathForRole } from '@/utils/authRole.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const state = ref('loading')
const errorMsg = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    state.value = 'error'
    errorMsg.value = tt('magicAuth.tokenNotFound')
    return
  }
  try {
    const data = await authApi.verifyMagicLink(token)
    authStore.setTokens(data)
    state.value = 'success'
    const target = homePathForRole(resolveRole(data.user))
    setTimeout(() => router.push(target), 1000)
  } catch (e) {
    state.value = 'error'
    errorMsg.value = e?.response?.data?.message || tt('magicAuth.linkExpired')
  }
})
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }

.magic-wrap {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg);
}
.magic-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 48px;
  box-shadow: var(--shadow-lg);
  min-width: 320px;
}
.magic-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  text-align: center; font-size: 14px; color: var(--text);
}
.magic-icon {
  width: 48px; height: 48px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
}
.magic-icon.success { background: var(--success-bg); color: var(--success); }
.magic-icon.danger  { background: var(--danger-bg);  color: var(--danger); }
</style>
