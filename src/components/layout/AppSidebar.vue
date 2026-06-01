<template>
  <aside style="width:240px;flex-shrink:0;background:var(--bg-2);border-right:1px solid var(--border);display:flex;flex-direction:column;height:100vh;position:sticky;top:0;">
    <div style="height:56px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--border-2);">
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
        <NavSection label="Operatsiyalar">
          <NavItem v-for="n in adminNav.slice(4)" :key="n.id" v-bind="n" :active="currentPath===n.path" @click="navigate(n.path)" />
        </NavSection>
      </template>
      <template v-else-if="workspace === 'client'">
        <NavSection>
          <NavItem v-for="n in clientMain" :key="n.id" v-bind="n"
                   :active="isActive(n.path)" @click="navigate(n.path)" />
        </NavSection>
        <NavSection label="Insights">
          <NavItem v-for="n in clientInsights" :key="n.id" v-bind="n"
                   :active="isActive(n.path)" @click="navigate(n.path)" />
        </NavSection>
        <NavSection label="Hisob">
          <NavItem v-for="n in clientAccount" :key="n.id" v-bind="n"
                   :active="isActive(n.path)" @click="navigate(n.path)" />
        </NavSection>
      </template>
    </div>

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
        Chiqish
      </button>
    </div>

    <!-- Usage card for client -->
    <div v-if="workspace === 'client'" style="padding:0 12px 12px;">
      <div style="padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--panel);display:flex;flex-direction:column;gap:10px;">
        <!-- 1) Oylik post limiti -->
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--muted);">Oylik post limiti</span>
          <span v-if="postsUsage.hasTariff === false" style="font-size:9.5px;color:var(--muted-2);padding:1px 6px;border:1px solid var(--border-2);border-radius:999px;letter-spacing:0.04em;">FREE</span>
        </div>
        <div class="tabular" style="font-size:14px;font-weight:600;">
          {{ formatNumber(postsUsage.used) }}
          <span style="color:var(--muted);font-weight:400;">/ {{ formatNumber(postsUsage.limit) }}</span>
        </div>
        <AppProgress :value="postsUsage.used" :max="postsUsage.limit || 1" :tone="postsTone" />

        <!-- 2) AI tokens -->
        <div style="height:1px;background:var(--border-2);margin:2px 0;"/>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--muted);">Foydalanilgan tokenlar</span>
          <span v-if="ai.hasTariff === false" style="font-size:9.5px;color:var(--muted-2);padding:1px 6px;border:1px solid var(--border-2);border-radius:999px;letter-spacing:0.04em;">FREE</span>
          <span v-else-if="ai.calls > 0" style="font-size:9.5px;color:var(--muted);padding:1px 6px;background:var(--panel-2);border-radius:999px;">{{ ai.calls }}× call</span>
        </div>
        <div class="tabular" style="font-size:14px;font-weight:600;">
          {{ formatNumber(ai.used) }}
          <span style="color:var(--muted);font-weight:400;">/ {{ formatNumber(ai.limit) }}</span>
        </div>
        <AppProgress :value="ai.used" :max="ai.limit || 1" :tone="aiTone" />

        <!-- 3) Xotira (eng pastda) -->
        <div style="height:1px;background:var(--border-2);margin:2px 0;"/>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--muted);">Foydalanilayotgan xotira</span>
          <span v-if="storage.hasTariff === false" style="font-size:9.5px;color:var(--muted-2);padding:1px 6px;border:1px solid var(--border-2);border-radius:999px;letter-spacing:0.04em;">FREE</span>
        </div>
        <div class="tabular" style="font-size:14px;font-weight:600;">
          {{ formatBytes(storage.used) }}
          <span style="color:var(--muted);font-weight:400;">/ {{ formatBytes(storage.limit) }}</span>
        </div>
        <AppProgress :value="storage.used" :max="storage.limit || 1" :tone="storageTone" />

        <button style="font-size:11.5px;color:var(--accent);background:transparent;border:none;padding:0;text-align:left;cursor:pointer;font-weight:500;">
          Tarifni yangilash →
        </button>
      </div>
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
import { useAuthStore } from '@/stores/auth.js'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'
import NavItem from './NavItem.vue'
import NavSection from './NavSection.vue'
import { useAppStore } from '@/stores/app.js'
import { useStorageStore } from '@/stores/storage.js'
import { useAiUsageStore } from '@/stores/aiUsage.js'
import { usePostsUsageStore } from '@/stores/postsUsage.js'
import { COMPANIES } from '@/data/index.js'

const props = defineProps({ workspace: String })
defineEmits(['workspace-change'])

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const t = computed(() => store.t)
const currentPath = computed(() => route.path)

const adminName = computed(() => {
  const u = authStore.user
  return u?.full_name || u?.fullName || u?.name || u?.email || 'Admin'
})
const adminEmail = computed(() => authStore.user?.email || '')

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
  loadChannelsCount()
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
  { id: 'overview',  icon: 'Home',     label: t.value('nav.admin.overview'),   path: '/admin/overview' },
  { id: 'companies', icon: 'Building', label: t.value('nav.admin.companies'),  path: '/admin/companies', count: COMPANIES.length },
  { id: 'tariffs',   icon: 'Tag',      label: t.value('nav.admin.tariffs'),    path: '/admin/tariffs' },
  { id: 'revenue',   icon: 'Coin',     label: t.value('nav.admin.revenue'),    path: null },
  { id: 'users',     icon: 'Users',    label: t.value('nav.admin.users'),      path: '/admin/users', count: 184 },
  { id: 'audit',     icon: 'Layers',   label: t.value('nav.admin.audit'),      path: null },
  { id: 'support',   icon: 'Life',     label: t.value('nav.admin.support'),    path: null, count: 7 },
  { id: 'references', icon: 'List',    label: 'Spravochniklar',                path: '/admin/references' },
  { id: 'worker',    icon: 'Server',   label: 'Bot worker',                    path: '/admin/worker-settings' },
  { id: 'ai-prompt', icon: 'Sparkle',  label: 'AI base prompt',                path: '/admin/ai-prompt' },
  { id: 'prompts',   icon: 'Edit',     label: 'Promptlar kutubxonasi',         path: '/admin/prompts' },
  { id: 'tg-sessions', icon: 'Telegram', label: 'Telegram sessionlari',        path: '/admin/telegram-sessions' },
  { id: 'system',    icon: 'Server',   label: t.value('nav.admin.system'),     path: null },
])

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
  { id: 'overview',   icon: 'Home',     label: t.value('nav.client.overview'),  path: '/client/overview' },
  { id: 'channels',   icon: 'Telegram', label: t.value('nav.client.channels'),  path: '/client/channels', count: channelsCount.value ?? undefined },
  { id: 'posts',      icon: 'Send',     label: t.value('nav.client.posts'),     path: '/client/posts', count: postsUsage.used || undefined },
  { id: 'discover',   icon: 'Sparkle',  label: 'Post ovlash',                   path: '/client/discover' },
  { id: 'categories', icon: 'Tag',      label: 'Kategoriyalar',                 path: '/client/categories' },
  { id: 'settings',   icon: 'Settings', label: 'Sozlamalar',                    path: '/client/settings' },
])

const clientInsights = computed(() => [
  { id: 'schedule',   icon: 'Calendar', label: t.value('nav.client.schedule'),  path: null },
  { id: 'sources',    icon: 'Globe2',   label: t.value('nav.client.sources'),   path: null },
  { id: 'analytics',  icon: 'Chart',    label: t.value('nav.client.analytics'), path: null },
])

const clientAccount = computed(() => [
  { id: 'team',       icon: 'Users',    label: t.value('nav.client.team'),      path: '/client/team' },
  { id: 'billing',    icon: 'Coin',     label: t.value('nav.client.billing'),   path: '/client/billing' },
])

// Sozlamalar nav item — tab parametri bilan keladigan barcha sub-route'lar uchun ham faol
function isActive(path) {
  if (!path) return false
  if (path === '/client/settings') {
    return currentPath.value === '/client/settings'
      || ['/client/telegram-api', '/client/ai-prompt', '/client/owned-sources'].includes(currentPath.value)
  }
  return currentPath.value === path
}
</script>
