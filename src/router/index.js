import { createRouter, createWebHashHistory } from 'vue-router'
import AdminOverview from '@/views/admin/AdminOverview.vue'
import AdminCompanies from '@/views/admin/AdminCompanies.vue'
import AdminTariffs from '@/views/admin/AdminTariffs.vue'
import AdminUsers from '@/views/admin/AdminUsers.vue'
import AdminReferences from '@/views/admin/AdminReferences.vue'
import AdminWorkerSettings from '@/views/admin/AdminWorkerSettings.vue'
import ClientOverview from '@/views/client/ClientOverview.vue'
import ClientChannels from '@/views/client/ClientChannels.vue'
import ClientPosts from '@/views/client/ClientPosts.vue'
import PostEditor from '@/views/client/PostEditor.vue'
import ClientBilling from '@/views/client/ClientBilling.vue'
import ClientTeam from '@/views/client/ClientTeam.vue'
import ClientCategories from '@/views/client/ClientCategories.vue'
import Onboarding from '@/views/Onboarding.vue'
import SignIn from '@/views/SignIn.vue'
import MagicAuth from '@/views/MagicAuth.vue'
import axios from 'axios'
import { isTokenValid, getUserRole, homePathForRole, isAdminRole, isCompanyRole } from '@/utils/authRole.js'

const routes = [
  { path: '/', redirect: () => homePathForRole(getUserRole()) },
  { path: '/signin',           component: SignIn },
  { path: '/auth/magic',       component: MagicAuth },
  { path: '/admin/overview',   component: AdminOverview },
  { path: '/admin/companies',  component: AdminCompanies },
  { path: '/admin/tariffs',    component: AdminTariffs },
  { path: '/admin/users',      component: AdminUsers },
  { path: '/admin/references', component: AdminReferences },
  { path: '/admin/worker-settings', component: AdminWorkerSettings },
  { path: '/client/overview',  component: ClientOverview },
  { path: '/client/channels',  component: ClientChannels },
  { path: '/client/posts',     component: ClientPosts },
  { path: '/client/posts/new',         component: PostEditor },
  { path: '/client/posts/:id/edit',    component: PostEditor },
  { path: '/client/billing',   component: ClientBilling },
  { path: '/client/team',      component: ClientTeam },
  { path: '/client/categories', component: ClientCategories },
  { path: '/signup',           component: Onboarding },
]

const PUBLIC_PATHS = ['/signin', '/signup', '/auth/magic']

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
    .post('http://localhost:4001/auth/refresh', { refresh_token: rt })
    .then(({ data }) => {
      if (data?.access_token) localStorage.setItem('access_token', data.access_token)
      if (data?.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      return true
    })
    .catch(() => false)
    .finally(() => { refreshInFlight = null })
  return refreshInFlight
}

router.beforeEach(async (to) => {
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

  // Tizimga kirgan foydalanuvchi public sahifalarda turmasin
  if (isPublic) {
    return homePathForRole(getUserRole())
  }

  const role = getUserRole()
  if (isAdminRole(role) && !to.path.startsWith('/admin/')) {
    return '/admin/overview'
  }
  if (isCompanyRole(role) && !to.path.startsWith('/client/')) {
    return '/client/overview'
  }
})

export default router
