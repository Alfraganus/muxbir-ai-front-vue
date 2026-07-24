import { createRouter, createWebHashHistory } from 'vue-router'
import AdminOverview from '@/views/admin/AdminOverview.vue'
import AdminCompanies from '@/views/admin/AdminCompanies.vue'
import AdminTariffs from '@/views/admin/AdminTariffs.vue'
import AdminTariffBuilder from '@/views/admin/AdminTariffBuilder.vue'
import AdminUsers from '@/views/admin/AdminUsers.vue'
import AdminReferences from '@/views/admin/AdminReferences.vue'
import AdminWorkerSettings from '@/views/admin/AdminWorkerSettings.vue'
import AdminAiPrompt from '@/views/admin/AdminAiPrompt.vue'
import AdminTelegramSessions from '@/views/admin/AdminTelegramSessions.vue'
import AdminPrompts from '@/views/admin/AdminPrompts.vue'
import AdminGreetings from '@/views/admin/AdminGreetings.vue'
import ClientOverview from '@/views/client/ClientOverview.vue'
import ClientChannels from '@/views/client/ClientChannels.vue'
import ClientPosts from '@/views/client/ClientPosts.vue'
import PostEditor from '@/views/client/PostEditor.vue'
import ClientBilling from '@/views/client/ClientBilling.vue'
import ClientClickTest from '@/views/client/ClientClickTest.vue'
import TestMediaRelay from '@/views/client/TestMediaRelay.vue'
import ClientTeam from '@/views/client/ClientTeam.vue'
import ClientCategories from '@/views/client/ClientCategories.vue'
import ClientDiscover from '@/views/client/ClientDiscover.vue'
import ClientAnalytics from '@/views/client/ClientAnalytics.vue'
import ClientAiPrompt from '@/views/client/ClientAiPrompt.vue'
import ClientTelegramApi from '@/views/client/ClientTelegramApi.vue'
import ClientSettings from '@/views/client/ClientSettings.vue'
import ClientActivate from '@/views/client/ClientActivate.vue'
import PostsQueue from '@/views/client/PostsQueue.vue'
import Onboarding from '@/views/Onboarding.vue'
import SignIn from '@/views/SignIn.vue'
import MagicAuth from '@/views/MagicAuth.vue'
import MetaDataDeletion from '@/views/public/MetaDataDeletion.vue'
import Privacy from '@/views/public/Privacy.vue'
import Terms from '@/views/public/Terms.vue'
import SupportConsole from '@/views/SupportConsole.vue'
import axios from 'axios'
import { API_BASE } from '@/api/base.js'
import { isTokenValid, getUserRole, homePathForRole, isAdminRole, isCompanyRole } from '@/utils/authRole.js'
import { useQuotaStore } from '@/stores/quota.js'

const routes = [
  { path: '/', redirect: () => homePathForRole(getUserRole()) },
  { path: '/signin',           component: SignIn },
  { path: '/auth/magic',       component: MagicAuth },
  { path: '/meta/delete',      component: MetaDataDeletion },
  { path: '/privacy',          component: Privacy },
  { path: '/terms',            component: Terms },
  { path: '/admin/overview',   component: AdminOverview },
  { path: '/admin/companies',  component: AdminCompanies },
  { path: '/admin/tariffs',    component: AdminTariffs },
  { path: '/admin/tariffs/new', component: AdminTariffBuilder },
  { path: '/admin/users',      component: AdminUsers },
  { path: '/admin/references', component: AdminReferences },
  { path: '/admin/worker-settings', component: AdminWorkerSettings },
  { path: '/admin/ai-prompt',  component: AdminAiPrompt },
  { path: '/admin/telegram-sessions', component: AdminTelegramSessions },
  { path: '/admin/prompts',    component: AdminPrompts },
  { path: '/admin/greetings',  component: AdminGreetings },
  { path: '/client/overview',  component: ClientOverview },
  { path: '/client/channels',  component: ClientChannels },
  { path: '/client/posts',     component: ClientPosts },
  { path: '/client/discover',  component: ClientDiscover },
  { path: '/client/analytics', component: ClientAnalytics },
  { path: '/client/posts/new',         component: PostEditor },
  { path: '/client/posts/:id/edit',    component: PostEditor },
  { path: '/client/billing',   component: ClientBilling },
  { path: '/client/click-test', component: ClientClickTest },
  { path: '/client/test-media-relay', component: TestMediaRelay },
  { path: '/client/team',      component: ClientTeam },
  { path: '/client/categories', component: ClientCategories },
  { path: '/client/ai-prompt',  component: ClientAiPrompt },
  { path: '/client/telegram-api', component: ClientTelegramApi },
  { path: '/client/settings', component: ClientSettings },
  { path: '/client/activate', component: ClientActivate },
  { path: '/client/queue',   component: PostsQueue },
  { path: '/signup',           component: Onboarding },
  { path: '/support',          component: SupportConsole },
]

const ALWAYS_PUBLIC = ['/privacy', '/terms', '/meta/delete']
const PUBLIC_PATHS = ['/signin', '/signup', '/auth/magic', ...ALWAYS_PUBLIC]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

let refreshInFlight = null

async function tryRefresh() {
  if (refreshInFlight) return refreshInFlight
  const rt = localStorage.getItem('refresh_token')
  if (!rt) return false
  refreshInFlight = axios
    .post(`${API_BASE}/auth/refresh`, { refresh_token: rt })
    .then(({ data }) => {
      if (data?.access_token) localStorage.setItem('access_token', data.access_token)
      if (data?.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      return true
    })
    .catch(() => false)
    .finally(() => { refreshInFlight = null })
  return refreshInFlight
}

router.beforeEach(async (to, from) => {
  // Operator console (Mini App) — mustaqil, o'z login'i bor (asosiy auth'dan tashqari).
  if (to.path === '/support') return undefined

  const isPublic = PUBLIC_PATHS.includes(to.path)

  // Access token muddati o'tgan bo'lsa, darhol logout qilmaymiz —
  // avval refresh_token bilan yangilashga urinamiz
  let valid = isTokenValid()
  if (!valid && localStorage.getItem('refresh_token')) {
    valid = await tryRefresh()
    if (!valid) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  if (!valid) {
    return isPublic ? undefined : '/signin'
  }

  // Tizimga kirgan foydalanuvchi public sahifalarda turmasin —
  // ISTISNO: kompaniyasiz company_role user /client/ dan /signup ga redirect bo'lganida
  // onboardingni davom ettirishiga ruxsat beramiz (login→/client/overview→no-company→/signup).
  if (isPublic) {
    if (ALWAYS_PUBLIC.includes(to.path)) return undefined
    const role = getUserRole()
    if (
      to.path === '/signup' &&
      isCompanyRole(role) &&
      from?.path?.startsWith('/client/')
    ) {
      return undefined
    }
    return homePathForRole(getUserRole())
  }

  const role = getUserRole()
  if (isAdminRole(role) && !to.path.startsWith('/admin/')) {
    return '/admin/overview'
  }
  if (isCompanyRole(role)) {
    if (!to.path.startsWith('/client/')) {
      return '/client/overview'
    }
    // Obuna faol emas (to'lov muvaffaqiyatli kelmagan) — paywall'ga yo'naltiramiz.
    // subscriptionActive === false bo'lsagina bloklaymiz (null = hali noma'lum,
    // App.vue quota'ni yuklab, kerak bo'lsa redirect qiladi). Faollashsa, paywall'dan chiqaramiz.
    const quota = useQuotaStore()
    const pendingTrial = quota.tariffSlug === 'trial' && quota.subscriptionStatus === 'trial' && quota.daysLeft === null
    if (to.path !== '/client/activate' && quota.subscriptionActive === false && !pendingTrial) {
      return '/client/activate'
    }
    if (to.path === '/client/activate' && (quota.subscriptionActive === true || pendingTrial)) {
      return '/client/overview'
    }
  }
})

export default router
