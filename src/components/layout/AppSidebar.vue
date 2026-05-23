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
          <NavItem v-for="n in clientNav.slice(0,6)" :key="n.id" v-bind="n" :active="currentPath===n.path" @click="navigate(n.path)" />
        </NavSection>
        <NavSection label="Insights">
          <NavItem v-for="n in clientNav.slice(6,8)" :key="n.id" v-bind="n" :active="currentPath===n.path" @click="navigate(n.path)" />
        </NavSection>
        <NavSection label="Hisob">
          <NavItem v-for="n in clientNav.slice(8)" :key="n.id" v-bind="n" :active="currentPath===n.path" @click="navigate(n.path)" />
        </NavSection>
      </template>
    </div>

    <!-- Usage card for client -->
    <div v-if="workspace === 'client'" style="padding:0 12px 12px;">
      <div style="padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--panel);display:flex;flex-direction:column;gap:10px;">
        <!-- Oylik post limiti -->
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--muted);">Oylik post limiti</span>
          <AppBadge tone="accent">Scale</AppBadge>
        </div>
        <div class="tabular" style="font-size:14px;font-weight:600;">
          1 280 <span style="color:var(--muted);font-weight:400;">/ 2 000</span>
        </div>
        <AppProgress :value="1280" :max="2000" tone="accent" />

        <!-- Foydalanilayotgan xotira -->
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
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BrandLogo from './BrandLogo.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'
import NavItem from './NavItem.vue'
import NavSection from './NavSection.vue'
import { useAppStore } from '@/stores/app.js'
import { useStorageStore } from '@/stores/storage.js'
import { COMPANIES } from '@/data/index.js'

const props = defineProps({ workspace: String })
defineEmits(['workspace-change'])

const store = useAppStore()
const router = useRouter()
const route = useRoute()
const t = computed(() => store.t)
const currentPath = computed(() => route.path)

function navigate(path) {
  if (path) router.push(path)
}

// ── Storage usage (pinia store orqali) ───────────────────────
const storage = useStorageStore()
let usageTimer = null

function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return v + ' B'
  if (v < 1024 * 1024) return (v / 1024).toFixed(0) + ' KB'
  if (v < 1024 * 1024 * 1024) return (v / (1024 * 1024)).toFixed(1).replace(/\.0$/, '') + ' MB'
  return (v / (1024 * 1024 * 1024)).toFixed(2).replace(/\.00$/, '') + ' GB'
}

const storageTone = computed(() => {
  if (!storage.limit) return 'accent'
  const pct = storage.used / storage.limit
  if (pct >= 0.9) return 'danger'
  if (pct >= 0.7) return 'warn'
  return 'accent'
})

onMounted(() => {
  if (props.workspace === 'client') storage.refresh()
  // Har 60 soniyada yangilab boramiz (xavfsizlik chizig'i)
  usageTimer = setInterval(() => {
    if (props.workspace === 'client') storage.refresh()
  }, 60_000)
})
onBeforeUnmount(() => {
  if (usageTimer) clearInterval(usageTimer)
})
// Route o'zgarganda ham yangilash
watch(currentPath, () => {
  if (props.workspace === 'client') storage.refresh()
})

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
  { id: 'system',    icon: 'Server',   label: t.value('nav.admin.system'),     path: null },
])

const clientNav = computed(() => [
  { id: 'overview',   icon: 'Home',     label: t.value('nav.client.overview'),  path: '/client/overview' },
  { id: 'channels',   icon: 'Telegram', label: t.value('nav.client.channels'),  path: '/client/channels', count: 6 },
  { id: 'posts',      icon: 'Send',     label: t.value('nav.client.posts'),     path: '/client/posts', count: 124 },
  { id: 'categories', icon: 'Tag',      label: 'Kategoriyalar',                 path: '/client/categories' },
  { id: 'schedule',   icon: 'Calendar', label: t.value('nav.client.schedule'),  path: null },
  { id: 'sources',    icon: 'Globe2',   label: t.value('nav.client.sources'),   path: null },
  { id: 'analytics',  icon: 'Chart',    label: t.value('nav.client.analytics'), path: null },
  { id: 'team',       icon: 'Users',    label: t.value('nav.client.team'),      path: '/client/team', count: 4 },
  { id: 'billing',    icon: 'Coin',     label: t.value('nav.client.billing'),   path: '/client/billing' },
  { id: 'settings',   icon: 'Settings', label: t.value('nav.client.settings'),  path: null },
])
</script>
