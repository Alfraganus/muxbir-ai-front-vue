<template>
  <aside style="width:240px;flex-shrink:0;background:var(--bg-2);border-right:1px solid var(--border);display:flex;flex-direction:column;height:100vh;position:sticky;top:0;">
    <div style="height:60px;display:flex;align-items:center;justify-content:center;padding:0 16px;border-bottom:1px solid var(--border-2);">
      <BrandLogo />
    </div>

    <div style="padding:12px 0 8px;">
      <WorkspaceSwitcher :workspace="workspace" @change="$emit('workspace-change', $event)" />
    </div>

    <div style="flex:1;overflow-y:auto;padding:8px 8px 16px;">
      <template v-if="workspace === 'super'">
        <NavSection>
          <NavItem v-for="n in adminNav.slice(0,4)" :key="n.id" v-bind="n" :active="currentPath===n.path" @click="navigate(n.path)" />
        </NavSection>
        <NavSection :label="tt('nav.admin.operations')">
          <NavItem v-for="n in adminNav.slice(4)" :key="n.id" v-bind="n" :active="currentPath===n.path" @click="navigate(n.path)" />
        </NavSection>
      </template>
      <template v-else-if="workspace === 'client'">
        <NavSection>
          <NavItem v-for="n in clientMain" :key="n.id" v-bind="n"
                   :active="isActive(n.path)" @click="navigate(n.path)" />
        </NavSection>
        <NavSection>
          <NavItem v-for="n in clientInsights" :key="n.id" v-bind="n"
                   :active="isActive(n.path)" @click="navigate(n.path)" />
        </NavSection>
      </template>
    </div>

    <!-- Tarif / kvota / kredit kartasi — client sidebar pastida (fixed) -->
    <div v-if="workspace === 'client'" style="flex-shrink:0;border-top:1px solid var(--border-2);padding:10px 8px;max-height:46vh;overflow-y:auto;">
      <QuotaUsageCard />
    </div>

    <!-- Client foydalanuvchi info + parol -->
    <div v-if="workspace === 'client'" style="flex-shrink:0;border-top:1px solid var(--border-2);padding:10px 12px 12px;">
      <div style="display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--panel);margin-bottom:7px;">
        <AppAvatar :name="adminName" :size="28" />
        <div style="display:flex;flex-direction:column;min-width:0;flex:1;">
          <span style="font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ adminName }}</span>
          <span style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ adminEmail }}</span>
        </div>
      </div>
      <button @click="showPassModal = true"
              style="width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-2);cursor:pointer;font-size:12.5px;font-weight:500;transition:background 0.15s;"
              onmouseover="this.style.background='var(--panel-2)'"
              onmouseout="this.style.background='transparent'">
        <AppIcon name="Shield" :size="13" />
        {{ tt('ov.profile.changePass') }}
      </button>
    </div>

    <!-- Parol o'zgartirish modal -->
    <AppModal v-if="workspace === 'client'" v-model="showPassModal" :title="tt('ov.profile.changePass')" width="380px">
      <div style="display:flex;flex-direction:column;gap:13px;">
        <div v-if="passError" style="padding:9px 12px;border-radius:8px;background:rgba(239,68,68,.1);color:var(--danger,#EF4444);font-size:13px;">{{ passError }}</div>
        <div>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:5px;">{{ tt('ov.profile.currentPass') }}</div>
          <AppInput v-model="passForm.current" type="password" :placeholder="tt('ov.profile.currentPass')"/>
        </div>
        <div>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:5px;">{{ tt('ov.profile.newPass') }}</div>
          <AppInput v-model="passForm.newPass" type="password" :placeholder="tt('ov.profile.newPass')"/>
        </div>
        <div>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:5px;">{{ tt('ov.profile.confirmPass') }}</div>
          <AppInput v-model="passForm.confirm" type="password" :placeholder="tt('ov.profile.confirmPass')"/>
        </div>
      </div>
      <template #footer>
        <button @click="showPassModal = false" style="padding:7px 14px;border-radius:6px;border:1px solid var(--border);background:var(--panel);color:var(--text);cursor:pointer;font-size:13px;">{{ tt('ov.profile.cancel') }}</button>
        <button @click="submitPassword" :disabled="passSaving" style="padding:7px 14px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:500;opacity:1;" :style="passSaving ? 'opacity:0.7' : ''">
          {{ passSaving ? '...' : tt('ov.profile.save') }}
        </button>
      </template>
    </AppModal>

    <!-- Logout for admin -->
    <div v-if="workspace === 'super'" style="padding:0 12px 12px;border-top:1px solid var(--border-2);padding-top:12px;">
      <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:8px;border:1px solid var(--border);border-radius:8px;background:var(--panel);">
        <AppAvatar :name="adminName" :size="28" />
        <div style="display:flex;flex-direction:column;min-width:0;flex:1;">
          <span style="font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ adminName }}</span>
          <span style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ adminEmail }}</span>
        </div>
      </div>
      <button @click="onAdminLogout"
              style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:#ef4444;cursor:pointer;font-size:12.5px;font-weight:500;transition:background 0.15s;"
              onmouseover="this.style.background='rgba(239,68,68,0.08)'"
              onmouseout="this.style.background='transparent'">
        <AppIcon name="Close" :size="13" />
        {{ tt('nav.logout') }}
      </button>
    </div>

  </aside>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { API_BASE } from '@/api/base.js'
import BrandLogo from './BrandLogo.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { useAuthStore } from '@/stores/auth.js'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'
import NavItem from './NavItem.vue'
import NavSection from './NavSection.vue'
import QuotaUsageCard from './QuotaUsageCard.vue'
import { useAppStore } from '@/stores/app.js'
import { queueApi } from '@/api/queue.js'
import { useStorageStore } from '@/stores/storage.js'
import { authApi } from '@/api/auth.js'
import { useAiUsageStore } from '@/stores/aiUsage.js'
import { usePostsUsageStore } from '@/stores/postsUsage.js'
import { useQuotaStore } from '@/stores/quota.js'
import { COMPANIES } from '@/data/index.js'

const props = defineProps({ workspace: String })
defineEmits(['workspace-change'])

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
const currentPath = computed(() => route.path)

const adminName = computed(() => {
  const u = authStore.user
  return u?.full_name || u?.fullName || u?.name || u?.email || 'Admin'
})
const adminEmail = computed(() => authStore.user?.email || '')

// Client parol o'zgartirish
const showPassModal = ref(false)
const passSaving = ref(false)
const passError = ref('')
const passForm = ref({ current: '', newPass: '', confirm: '' })
watch(showPassModal, (v) => { if (!v) { passForm.value = { current: '', newPass: '', confirm: '' }; passError.value = '' } })
async function submitPassword() {
  passError.value = ''
  if (!passForm.value.current) { passError.value = tt('ov.profile.errCurrent'); return }
  if (passForm.value.newPass.length < 6) { passError.value = tt('ov.profile.errMin'); return }
  if (passForm.value.newPass !== passForm.value.confirm) { passError.value = tt('ov.profile.errMatch'); return }
  passSaving.value = true
  try {
    await authApi.changePassword(passForm.value.current, passForm.value.newPass)
    showPassModal.value = false
  } catch (e) {
    passError.value = e?.response?.data?.message || 'Xato yuz berdi'
  } finally {
    passSaving.value = false
  }
}

async function onAdminLogout() {
  try { await authStore.logout() } catch {}
  router.push('/signin')
}

function navigate(path) {
  if (path) router.push(path)
}

// ── Storage, AI, Posts usage (pinia store) ───────────────────
const storage = useStorageStore()
const ai = useAiUsageStore()
const postsUsage = usePostsUsageStore()
const quota = useQuotaStore()
let usageTimer = null

function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return v + ' B'
  if (v < 1024 * 1024) return (v / 1024).toFixed(0) + ' KB'
  if (v < 1024 * 1024 * 1024) return (v / (1024 * 1024)).toFixed(1).replace(/\.0$/, '') + ' MB'
  return (v / (1024 * 1024 * 1024)).toFixed(2).replace(/\.00$/, '') + ' GB'
}

function formatNumber(n) {
  const v = Number(n) || 0
  return v.toLocaleString('uz-UZ').replace(/,/g, ' ')
}

function toneFor(used, limit) {
  if (!limit) return 'accent'
  const pct = used / limit
  if (pct >= 0.9) return 'danger'
  if (pct >= 0.7) return 'warn'
  return 'accent'
}

const storageTone = computed(() => toneFor(storage.used, storage.limit))
const aiTone = computed(() => toneFor(ai.used, ai.limit))
const postsTone = computed(() => toneFor(postsUsage.used, postsUsage.limit))

function refreshAll() {
  if (props.workspace !== 'client') return
  storage.refresh()
  ai.refresh()
  postsUsage.refresh()
  quota.refresh()
  loadChannelsCount()
  loadQueueCounts()
}

onMounted(() => {
  refreshAll()
  // Har 60 soniyada yangilab boramiz (xavfsizlik chizig'i)
  usageTimer = setInterval(refreshAll, 60_000)
})
onBeforeUnmount(() => {
  if (usageTimer) clearInterval(usageTimer)
})
// Route o'zgarganda ham yangilash
watch(currentPath, refreshAll)

const adminNav = computed(() => [
  { id: 'overview',  icon: 'Home',     label: tt('nav.admin.overview'),        path: '/admin/overview' },
  { id: 'companies', icon: 'Building', label: tt('nav.admin.companies'),       path: '/admin/companies', count: COMPANIES.length },
  { id: 'tariffs',   icon: 'Tag',      label: tt('nav.admin.tariffs'),         path: '/admin/tariffs' },
  { id: 'revenue',   icon: 'Coin',     label: tt('nav.admin.revenue'),         path: null },
  { id: 'users',     icon: 'Users',    label: tt('nav.admin.users'),           path: '/admin/users', count: 184 },
  { id: 'audit',     icon: 'Layers',   label: tt('nav.admin.audit'),           path: null },
  { id: 'support',   icon: 'Life',     label: tt('nav.admin.support'),         path: null, count: 7 },
  { id: 'references', icon: 'List',    label: tt('nav.admin.references'),      path: '/admin/references' },
  { id: 'worker',    icon: 'Server',   label: tt('nav.admin.worker'),          path: '/admin/worker-settings' },
  { id: 'ai-prompt', icon: 'Sparkle',  label: tt('nav.admin.aiPrompt'),        path: '/admin/ai-prompt' },
  { id: 'prompts',   icon: 'Edit',     label: tt('nav.admin.prompts'),         path: '/admin/prompts' },
  { id: 'tg-sessions', icon: 'Telegram', label: tt('nav.admin.tgSessions'),    path: '/admin/telegram-sessions' },
  { id: 'system',    icon: 'Server',   label: tt('nav.admin.system'),          path: null },
])

// Navbat soni (pending)
const counts = ref({ pending: 0, approved: 0 })

async function loadQueueCounts() {
  try {
    const cid = store.companyId
    if (!cid) return
    const c = await queueApi.counts(cid)
    counts.value = c ?? counts.value
  } catch {}
}

// Real kanal soni — backend'dan onMounted'da yuklanadi
const channelsCount = ref(null)

async function loadChannelsCount() {
  try {
    const list = await axios.get(`${API_BASE}/companies/my`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    }).then(r => r.data).catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    const companyId = arr[0]?.id
    if (!companyId) { channelsCount.value = 0; return }
    const channels = await axios.get(`${API_BASE}/companies/${companyId}/channels`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    }).then(r => r.data).catch(() => [])
    channelsCount.value = Array.isArray(channels) ? channels.length : 0
  } catch { channelsCount.value = 0 }
}

const clientMain = computed(() => [
  { id: 'overview',   icon: 'Home',     label: tt('nav.client.overview'),       path: '/client/overview' },
  { id: 'channels',   icon: 'Telegram', label: tt('nav.client.channels'),       path: '/client/channels', count: channelsCount.value ?? undefined },
  { id: 'posts',      icon: 'Send',     label: tt('nav.client.posts'),          path: '/client/posts', count: postsUsage.used || undefined },
  { id: 'queue',      icon: 'Check',    label: tt('nav.client.queue'),          path: '/client/queue', count: counts.value?.pending || undefined },
  { id: 'tg-chats',   icon: 'Telegram', label: tt('nav.client.tgChats'),        path: '/client/telegram-chats' },
  { id: 'discover',   icon: 'Sparkle',  label: tt('nav.client.discover'),       path: '/client/discover' },
  { id: 'categories', icon: 'Tag',      label: tt('nav.client.categories'),     path: '/client/categories' },
  { id: 'settings',   icon: 'Settings', label: tt('nav.client.settings'),       path: '/client/settings' },
  // Manbalar — sozlamalar ostida (har kanalning manbalari Kanallar > Manbalar orqali boshqariladi)
  { id: 'sources',    icon: 'Globe2',   label: tt('nav.client.sources'),        path: null },
])

// Jadval (schedule), Komanda (team), Tarif va to'lov (billing) — dummy sahifalar,
// menyudan olib tashlandi. Manbalar yuqorida, sozlamalar ostiga ko'chirildi.
const clientInsights = computed(() => [
  { id: 'analytics',  icon: 'Chart',    label: tt('nav.client.analytics'),      path: '/client/analytics' },
])

// Sozlamalar nav item — tab parametri bilan keladigan barcha sub-route'lar uchun ham faol
function isActive(path) {
  if (!path) return false
  if (path === '/client/settings') {
    return currentPath.value === '/client/settings'
      || ['/client/telegram-api', '/client/ai-prompt'].includes(currentPath.value)
  }
  return currentPath.value === path
}
</script>
