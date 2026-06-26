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

    <!-- Onboarding / paywall: full-screen, no shell -->
    <template v-if="isFullScreen">
      <RouterView/>
    </template>

    <!-- Console shell: sidebar + topbar + content -->
    <template v-else>
      <div class="app-shell" :class="{ 'nav-open': store.sidebarOpen }" style="display:flex;height:100vh;overflow:hidden;">
        <!-- Mobil/planshet drawer foni -->
        <div class="app-backdrop" @click="store.closeSidebar()" aria-hidden="true"/>
        <div class="app-sidebar-wrap" style="flex-shrink:0;">
          <AppSidebar :workspace="store.workspace"/>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;">
          <AppTopbar/>
          <TariffExpiryBanner v-if="store.workspace === 'client'"/>
          <StorageQuotaBanner v-if="store.workspace === 'client'"/>
          <div style="flex:1;display:flex;min-height:0;overflow:hidden;">
            <main style="flex:1;overflow-y:auto;min-width:0;">
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
      </div>
    </template>

    <!-- Global toast bildirishnomalari (har sahifadan useToast() chaqiruvlari) -->
    <AppToast/>

    <!-- Sayt jonli-chat (customer support) — operator console'да ko'rsatilmaydi -->
    <LiveChatWidget v-if="route.path !== '/support'"/>

    <!-- Pending trial: ilovaning istalgan sahifasida modal ko'rsatiladi -->
    <Teleport to="body">
      <Transition name="pt-fade">
        <div v-if="isPendingTrial" class="pt-overlay">
          <div class="pt-box">
            <div class="pt-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h2 class="pt-title">{{ tt('app.pendingTrialTitle') }}</h2>
            <p class="pt-body">{{ tt('app.pendingTrialBody') }}</p>
            <div class="pt-note">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
              <span>{{ tt('app.pendingTrialNote') }}</span>
            </div>
            <button class="pt-logout" @click="handleLogout">{{ tt('app.pendingTrialLogout') }}</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useQuotaStore } from '@/stores/quota.js'
import { companiesApi } from '@/api/companies.js'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import StorageQuotaBanner from '@/components/layout/StorageQuotaBanner.vue'
import TariffExpiryBanner from '@/components/billing/TariffExpiryBanner.vue'
import AppToast from '@/components/ui/AppToast.vue'
import LiveChatWidget from '@/components/support/LiveChatWidget.vue'

const store = useAppStore()
const authStore = useAuthStore()
const quota = useQuotaStore()
const route = useRoute()
const router = useRouter()
const tt = (key, params) => store.t(key, params)

/**
 * Obuna faol bo'lmasa (to'lov muvaffaqiyatsiz) — client foydalanuvchini
 * /client/activate paywall'ga yo'naltiramiz. Faqat aniq `false` bo'lganda
 * bloklaymiz (null = hali yuklanmagan).
 */
function enforceSubscription() {
  if (store.workspace !== 'client') return
  if (quota.subscriptionActive !== false) return
  const p = route.path
  // Pending trial userni /client/activate'ga redirect qilmaymiz — modal o'zi ko'rsatadi.
  // Agar activate sahifasida bo'lsa, overview'ga qaytaramiz (modal u yerda ishlaydi).
  const pendingTrial = quota.tariffSlug === 'trial' && quota.subscriptionStatus === 'trial' && quota.daysLeft === null
  if (pendingTrial) {
    if (p === '/client/activate') router.replace('/client/overview')
    return
  }
  if (p.startsWith('/client/') && p !== '/client/activate') {
    router.replace('/client/activate')
  }
}

async function refreshSubscriptionGate() {
  if (store.workspace !== 'client' || !store.companyId) return
  await quota.refresh()
  enforceSubscription()
}

// workspace endi store.workspace ichidagi computed orqali JWT role'dan
// avtomatik kelib chiqadi — manual sync kerak emas. Lekin login/logout'da
// computed'ni qayta hisoblash uchun refreshAuthDerivedState chaqiriladi.

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
  store.refreshAuthDerivedState()
  await loadCompanyForClient()
  await refreshSubscriptionGate()
})

// Login/logout — derived workspace'ni refresh qilamiz va eski company'ni tozalaymiz
watch(() => authStore.accessToken, async (tok) => {
  store.setCompany(null)
  quota.subscriptionActive = null
  store.refreshAuthDerivedState()
  if (!tok) return
  if (!authStore.user) await authStore.fetchMe()
  await loadCompanyForClient()
  await refreshSubscriptionGate()
})

// Sahifa o'zgarganda obuna holatini qayta tekshiramiz (paywall'da ushlab turish)
// va mobil navigatsiya draweri'ni yopamiz.
watch(() => route.path, () => {
  enforceSubscription()
  store.closeSidebar()
})

const isOnboarding = computed(() =>
  route.path === '/signup' || route.path === '/signin' || route.path === '/auth/magic'
)
// Paywall va operator console ham to'liq ekran (sidebar/topbar'siz)
const isFullScreen = computed(() =>
  isOnboarding.value || route.path === '/client/activate' || route.path === '/support'
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

// Pending trial: faqat 'trial' slug'li tarif, status='trial', trial_ends_at=null (admin hali tasdiqlamagan)
// To'lovli tarif tanlagan foydalanuvchilar uchun ko'rsatilmaydi (ular ham default status='trial' bo'ladi)
const isPendingTrial = computed(() =>
  store.workspace === 'client' &&
  quota.tariffSlug === 'trial' &&
  quota.subscriptionStatus === 'trial' &&
  quota.daysLeft === null &&
  quota.loaded &&
  !isFullScreen.value
)

async function handleLogout() {
  try { await authStore.logout() } catch {}
  router.push('/signin')
}
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

/* ──── Pending trial global modal ────────────────────────── */
.pt-overlay {
  position: fixed; inset: 0; z-index: 8000;
  background: rgba(10, 15, 30, 0.65);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.pt-box {
  width: 100%; max-width: 400px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 20px; padding: 32px 28px 26px;
  box-shadow: 0 30px 90px -20px rgba(15,23,42,.5);
  display: flex; flex-direction: column; align-items: center; text-align: center;
  animation: ptPop .3s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes ptPop {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.pt-icon {
  width: 64px; height: 64px; border-radius: 18px; margin-bottom: 20px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in oklab, #f59e0b 12%, transparent);
  color: #f59e0b;
}
.pt-title { font-size: 19px; font-weight: 800; color: var(--text); margin: 0 0 10px; }
.pt-body  { font-size: 13.5px; color: var(--muted); line-height: 1.65; margin: 0 0 18px; }
.pt-note {
  width: 100%; box-sizing: border-box;
  display: flex; align-items: flex-start; gap: 10px; text-align: left;
  padding: 12px 14px; border-radius: 10px; margin-bottom: 22px;
  background: color-mix(in oklab, #f59e0b 8%, transparent);
  border: 1px solid color-mix(in oklab, #f59e0b 28%, transparent);
  font-size: 12.5px; color: color-mix(in oklab, #f59e0b 85%, var(--text)); line-height: 1.55;
}
.pt-logout {
  background: none; border: none; color: var(--muted);
  font-size: 13px; cursor: pointer; text-decoration: underline; padding: 0;
}
.pt-logout:hover { color: var(--text); }
.pt-fade-enter-active, .pt-fade-leave-active { transition: opacity .22s ease; }
.pt-fade-enter-from, .pt-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .pt-box { padding: 24px 18px 20px; }
}
</style>
