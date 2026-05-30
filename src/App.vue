<template>
  <div :data-theme="store.darkMode ? 'dark' : 'light'" style="min-height:100vh;display:flex;flex-direction:column;position:relative;">
    <!-- Til almashinish veil — fade + blur effekti -->
    <Transition name="lang-veil">
      <div v-if="store.langSwitching" class="lang-veil" aria-hidden="true">
        <div class="lang-veil-inner">
          <span class="lang-veil-spinner"/>
          <span class="lang-veil-label">{{ langLabel }}</span>
        </div>
      </div>
    </Transition>

    <!-- Onboarding: full-screen, no shelll -->
    <template v-if="isOnboarding">
      <RouterView/>
    </template>

    <!-- Console shell: sidebar + topbar + content -->
    <template v-else>
      <div style="display:flex;height:100vh;overflow:hidden;">
        <AppSidebar :workspace="store.workspace"/>
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;">
          <AppTopbar/>
          <AiQuotaBanner v-if="store.workspace === 'client'"/>
          <StorageQuotaBanner v-if="store.workspace === 'client'"/>
          <main style="flex:1;overflow-y:auto;">
            <RouterView v-slot="{ Component, route: r }">
              <!-- Settings sahifasi uchun animatsiya yo'q (mode=out-in
                   nested unmount muammosi sababli). Boshqa sahifalarda fade. -->
              <Transition v-if="!isSettings(r.path)" name="page" mode="out-in">
                <component :is="Component" :key="r.path"/>
              </Transition>
              <component v-else :is="Component" :key="r.path"/>
            </RouterView>
          </main>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { companiesApi } from '@/api/companies.js'
import { getUserRole, isAdminRole } from '@/utils/authRole.js'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import AiQuotaBanner from '@/components/layout/AiQuotaBanner.vue'
import StorageQuotaBanner from '@/components/layout/StorageQuotaBanner.vue'

const store = useAppStore()
const authStore = useAuthStore()
const route = useRoute()

// Workspace'ni JWT role'iga qarab avtomatik o'rnatamiz
function syncWorkspaceFromRole() {
  const role = getUserRole()
  if (!role) return
  store.setWorkspace(isAdminRole(role) ? 'super' : 'client')
}

async function loadCompanyForClient() {
  if (store.workspace !== 'client') return
  if (store.companyName) return
  try {
    const res = await companiesApi.getMy()
    const list = Array.isArray(res) ? res : [res].filter(Boolean)
    if (list[0]) store.setCompany(list[0])
  } catch {}
}

onMounted(async () => {
  if (authStore.accessToken && !authStore.user) authStore.fetchMe()
  syncWorkspaceFromRole()
  await loadCompanyForClient()
})

// Login bo'lganda ham qayta sinxronlash
watch(() => authStore.accessToken, async (tok) => {
  if (!tok) {
    store.setCompany(null)
    return
  }
  if (!authStore.user) await authStore.fetchMe()
  syncWorkspaceFromRole()
  await loadCompanyForClient()
})

const isOnboarding = computed(() =>
  route.path === '/signup' || route.path === '/signin' || route.path === '/auth/magic'
)

/**
 * Sozlamalar sahifasida transition'siz navigatsiya qilamiz —
 * nested komponentlar (Telegram API, AI prompt, Mening manbalarim)
 * unmount paytida transition'ning `out-in` rejimi bilan to'qnashib,
 * keyingi sahifa renderini bloklab qo'yardi.
 */
function isSettings(p) {
  return p === '/client/settings'
}

const langLabel = computed(() => {
  const map = { uz: "O'zbek tiliga o'tilmoqda…", ru: 'Переключаем на русский…', en: 'Switching to English…' }
  return map[store.lang] || ''
})
</script>

<style>
/* Sahifa o'zgarishi: chiroyli fade + ozgina translate */
.page-enter-active,
.page-leave-active {
  transition: opacity 260ms cubic-bezier(0.4, 0, 0.2, 1),
              transform 260ms cubic-bezier(0.4, 0, 0.2, 1),
              filter 260ms cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
  filter: blur(2px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.997);
  filter: blur(1px);
}
.page-enter-to,
.page-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: opacity 120ms linear;
    transform: none !important;
    filter: none !important;
  }
}

/* ──── Til almashinish veil ──────────────────────────────── */
.lang-veil {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: color-mix(in oklab, var(--bg) 70%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
}
.lang-veil-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 22px 28px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 30px 80px -20px rgba(15,23,42,0.35);
  animation: langVeilPop 0.35s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes langVeilPop {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.lang-veil-spinner {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2.5px solid color-mix(in oklab, var(--accent) 25%, transparent);
  border-top-color: var(--accent);
  animation: langSpin 0.7s linear infinite;
}
@keyframes langSpin { to { transform: rotate(360deg); } }
.lang-veil-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  letter-spacing: -0.005em;
}

.lang-veil-enter-active,
.lang-veil-leave-active {
  transition: opacity 260ms cubic-bezier(0.4, 0, 0.2, 1),
              backdrop-filter 260ms cubic-bezier(0.4, 0, 0.2, 1);
}
.lang-veil-enter-from,
.lang-veil-leave-to {
  opacity: 0;
}
.lang-veil-enter-to,
.lang-veil-leave-from {
  opacity: 1;
}
</style>
