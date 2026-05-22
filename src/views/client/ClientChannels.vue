<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="tt('cc.title')" :subtitle="headerSubtitle">
      <template #right>
        <AppButton variant="secondary" size="md" @click="loadAll" :loading="loading">
          {{ tt('cc.refresh') }}
        </AppButton>
        <AppButton variant="primary" size="md" @click="openAddModal()">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('cc.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <AppTabs v-model="statusFilter" :items="statusTabs"/>
      <div style="width:1px;height:18px;background:var(--border);"/>
      <AppTabs v-model="platformFilter" :items="platformTabs"/>
      <div style="flex:1;"/>
      <AppTabs v-model="view" :items="[{value:'cards',label:tt('cc.view.cards')},{value:'table',label:tt('cc.view.table')}]"/>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;padding:60px 0;color:var(--muted);font-size:13px;gap:10px;">
      <span class="cc-spinner"/>
      {{ tt('cc.loading') }}
    </div>

    <!-- Hech narsa yo'q -->
    <AppPanel v-else-if="!channels.length" :padding="40">
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;">
        <div class="cc-empty-icons">
          <span v-for="p in platforms" :key="p.slug" :style="platformIconStyle(p.slug, 'lg')" :class="{ dim: !p.is_available }">
            <AppIcon :name="platformIconName(p.slug)" :size="20"/>
          </span>
        </div>
        <div>
          <div style="font-size:15px;font-weight:600;margin-bottom:4px;">{{ tt('cc.empty.title') }}</div>
          <div style="font-size:12.5px;color:var(--muted);max-width:380px;">
            {{ tt('cc.empty.sub') }}
          </div>
        </div>
        <AppButton variant="primary" size="md" @click="openAddModal('telegram')">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('cc.firstAdd') }}
        </AppButton>
      </div>
    </AppPanel>

    <AppPanel v-else-if="!filteredList.length" :padding="32">
      <div style="text-align:center;color:var(--muted);font-size:13px;">
        {{ tt('cc.empty.filtered') }}
      </div>
    </AppPanel>

    <!-- Cards view -->
    <div v-else-if="view === 'cards'" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">
      <AppPanel v-for="c in filteredList" :key="c.id" :padding="0">
        <!-- Yuqori chiziq — platforma rangi -->
        <div class="cc-card-accent" :style="{ background: platformColor(c) }"/>

        <div style="padding:14px 16px;display:flex;align-items:flex-start;gap:10px;">
          <span class="cc-platform-icon" :style="platformIconStyle(platformSlug(c))">
            <AppIcon :name="platformIconName(platformSlug(c))" :size="18"/>
          </span>
          <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ displayName(c) }}</span>
              <AppBadge :tone="isActive(c) ? 'success' : 'muted'" dot>{{ statusLabel(c) }}</AppBadge>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
              <span class="mono" style="font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ identifier(c) }}</span>
              <span class="cc-platform-pill" :style="{ color: platformColor(c), background: platformColor(c) + '14' }">
                {{ platformName(c.platform) }}
              </span>
            </div>
          </div>
          <span class="cc-mode-pill" :class="c.posting_mode || 'auto'">
            {{ (c.posting_mode || 'auto') === 'auto' ? tt('cc.mode.auto') : tt('cc.mode.manual') }}
          </span>
        </div>

        <div style="padding:0 16px 14px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
            <span class="cc-stat-label">{{ tt('cc.col.botStatus') }}</span>
            <span class="cc-stat-value">{{ botStatusLabel(c.bot_status) }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
            <span class="cc-stat-label">{{ tt('cc.col.type') }}</span>
            <span class="cc-stat-value">{{ chatTypeLabel(c.chat_type) }}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
            <span class="cc-stat-label">{{ tt('cc.col.connectedAt') }}</span>
            <span class="cc-stat-value" :title="connectedDateFull(c)">{{ connectedDate(c) }}</span>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--panel-2);border-top:1px solid var(--border-2);border-radius:0 0 var(--r-lg) var(--r-lg);">
          <span style="font-size:11px;color:var(--muted);">
            ID: <span class="mono" style="color:var(--text-2);">{{ c.telegram_chat_id || '—' }}</span>
          </span>
          <div style="display:flex;gap:6px;">
            <AppButton variant="ghost" size="sm" @click="togglePostingMode(c)">
              <template #icon><AppIcon :name="(c.posting_mode||'auto')==='auto' ? 'Edit' : 'Sparkle'" :size="12"/></template>
              {{ (c.posting_mode||'auto') === 'auto' ? tt('cc.action.setManual') : tt('cc.action.setAuto') }}
            </AppButton>
            <AppButton variant="ghost" size="sm" @click="removeChannel(c)">
              <template #icon><AppIcon name="Trash" :size="12"/></template>
              {{ tt('cc.action.remove') }}
            </AppButton>
          </div>
        </div>
      </AppPanel>
    </div>

    <!-- Table view -->
    <AppPanel v-else :padding="0">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left;padding:8px 14px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ tt('cc.col.channel') }}</th>
            <th v-for="h in tableHeaders" :key="h"
              style="text-align:left;padding:8px 10px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in filteredList" :key="c.id" :style="{ borderTop: i===0?'none':'1px solid var(--border-2)' }">
            <td style="padding:10px 14px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="cc-platform-icon" :style="platformIconStyle(platformSlug(c), 'sm')">
                  <AppIcon :name="platformIconName(platformSlug(c))" :size="13"/>
                </span>
                <div style="display:flex;flex-direction:column;">
                  <span style="font-weight:500;">{{ displayName(c) }}</span>
                  <span class="mono" style="font-size:11px;color:var(--muted);">{{ identifier(c) }}</span>
                </div>
              </div>
            </td>
            <td style="padding:10px;vertical-align:middle;">
              <span class="cc-platform-pill" :style="{ color: platformColor(c), background: platformColor(c) + '14' }">
                {{ platformName(c.platform) }}
              </span>
            </td>
            <td style="padding:10px;vertical-align:middle;color:var(--muted);">{{ chatTypeLabel(c.chat_type) }}</td>
            <td style="padding:10px;vertical-align:middle;color:var(--muted);">{{ botStatusLabel(c.bot_status) }}</td>
            <td style="padding:10px;vertical-align:middle;">
              <span class="cc-mode-pill" :class="c.posting_mode || 'auto'">
                {{ (c.posting_mode || 'auto') === 'auto' ? tt('cc.mode.auto') : tt('cc.mode.manual') }}
              </span>
            </td>
            <td style="padding:10px;vertical-align:middle;color:var(--muted);">{{ connectedDate(c) }}</td>
            <td style="padding:10px;vertical-align:middle;"><AppBadge :tone="isActive(c) ? 'success' : 'muted'" dot>{{ statusLabel(c) }}</AppBadge></td>
            <td style="padding:10px;vertical-align:middle;text-align:right;white-space:nowrap;">
              <AppButton variant="ghost" size="sm" @click="togglePostingMode(c)">
                {{ (c.posting_mode||'auto') === 'auto' ? tt('cc.action.setManual') : tt('cc.action.setAuto') }}
              </AppButton>
              <AppButton variant="ghost" size="sm" @click="removeChannel(c)">
                <template #icon><AppIcon name="Trash" :size="12"/></template>
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
    </AppPanel>

    <!-- ────── Add Channel Modal ────── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="addModalOpen" class="cc-modal-backdrop" @click.self="closeAddModal">
          <div class="cc-modal" role="dialog" aria-modal="true">
            <button class="cc-modal-close" @click="closeAddModal" aria-label="Yopish">
              <AppIcon name="Close" :size="14"/>
            </button>

            <div class="cc-modal-hero" :style="{ background: heroGradient(addPlatformSlug) }">
              <div aria-hidden class="cc-modal-hero-dots"/>
              <div class="cc-modal-hero-inner">
                <span class="cc-modal-hero-icon">
                  <AppIcon :name="platformIconName(addPlatformSlug)" :size="22"/>
                </span>
                <div>
                  <div class="cc-modal-hero-title">{{ tt('cc.modal.title') }}</div>
                  <div class="cc-modal-hero-sub">{{ heroSubtitle }}</div>
                </div>
              </div>
            </div>

            <div v-if="platforms.length > 1" class="cc-modal-platforms">
              <button v-for="p in platforms" :key="p.slug"
                class="cc-pf-btn"
                :class="{ active: addPlatformSlug === p.slug, disabled: !p.is_available }"
                :disabled="!p.is_available"
                @click="switchPlatform(p)">
                <span class="cc-pf-btn-icon" :style="platformIconStyle(p.slug, 'sm')">
                  <AppIcon :name="platformIconName(p.slug)" :size="13"/>
                </span>
                <span class="cc-pf-btn-name">{{ platformName(p) }}</span>
                <span v-if="!p.is_available" class="cc-pf-btn-soon">{{ tt('cc.platform.soon') }}</span>
              </button>
            </div>

            <div class="cc-modal-body">
              <template v-if="addStage === 'input'">
                <div class="cc-field">
                  <label class="cc-field-label">{{ tt('cc.modal.urlLabel') }}</label>
                  <div class="cc-url-input" :class="{ error: !!addError }">
                    <AppIcon :name="platformIconName(addPlatformSlug)" :size="14" :style="{ color: platformColor(addPlatformSlug), flexShrink: 0 }"/>
                    <input v-model="addUrl" @keyup.enter="submitAdd"
                      :placeholder="urlPlaceholder"
                      class="cc-url-input-field"/>
                  </div>
                  <span class="cc-field-hint" v-html="urlHintHtml"/>
                </div>

                <div class="cc-field">
                  <label class="cc-field-label">{{ tt('cc.modal.modeLabel') }}</label>
                  <div class="cc-mode-grid">
                    <button type="button" class="cc-mode-card" :class="{ active: addMode === 'auto' }" @click="addMode = 'auto'">
                      <span class="cc-mode-card-icon"><AppIcon name="Sparkle" :size="14"/></span>
                      <div style="flex:1;min-width:0">
                        <div class="cc-mode-card-title">{{ tt('cc.modal.mode.auto.title') }}</div>
                        <div class="cc-mode-card-sub">{{ tt('cc.modal.mode.auto.sub') }}</div>
                      </div>
                      <span v-if="addMode === 'auto'" class="cc-mode-card-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </button>
                    <button type="button" class="cc-mode-card" :class="{ active: addMode === 'manual' }" @click="addMode = 'manual'">
                      <span class="cc-mode-card-icon"><AppIcon name="Edit" :size="14"/></span>
                      <div style="flex:1;min-width:0">
                        <div class="cc-mode-card-title">{{ tt('cc.modal.mode.manual.title') }}</div>
                        <div class="cc-mode-card-sub">{{ tt('cc.modal.mode.manual.sub') }}</div>
                      </div>
                      <span v-if="addMode === 'manual'" class="cc-mode-card-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </button>
                  </div>
                </div>

                <div v-if="addError" class="cc-modal-error">
                  <AppIcon name="Close" :size="12"/>
                  {{ addError }}
                </div>

                <div class="cc-modal-actions">
                  <AppButton variant="secondary" size="md" @click="closeAddModal">{{ tt('cc.modal.cancel') }}</AppButton>
                  <AppButton variant="primary" size="md" :loading="addSubmitting" @click="submitAdd">
                    {{ tt('cc.modal.continue') }}
                    <template #icon-right><AppIcon name="Arrow" :size="13"/></template>
                  </AppButton>
                </div>
              </template>

              <template v-else-if="addStage === 'pending'">
                <div class="cc-pending">
                  <div class="cc-pending-pulse">
                    <span class="cc-pending-pulse-ring r1"/>
                    <span class="cc-pending-pulse-ring r2"/>
                    <span class="cc-pending-pulse-icon" :style="platformIconStyle(addPlatformSlug)">
                      <AppIcon :name="platformIconName(addPlatformSlug)" :size="18"/>
                    </span>
                  </div>
                  <div style="text-align:center;">
                    <div class="cc-pending-title">{{ tt('cc.pending.title') }}</div>
                    <div class="cc-pending-sub">
                      <span class="mono" style="color:var(--text-2)">{{ addedChannel?.username || addedChannel?.display_name }}</span>
                      {{ tt('cc.pending.sub') }}
                    </div>
                  </div>

                  <a v-if="addDeepLink" :href="addDeepLink" target="_blank" rel="noopener" class="cc-pending-cta">
                    <AppIcon name="Telegram" :size="14"/>
                    {{ tt('cc.pending.cta') }}
                    <AppIcon name="Arrow" :size="13"/>
                  </a>

                  <div class="cc-pending-steps">
                    <div class="cc-step"><span class="cc-step-num">1</span> {{ tt('cc.pending.step1') }}</div>
                    <div class="cc-step"><span class="cc-step-num">2</span> {{ tt('cc.pending.step2') }}</div>
                    <div class="cc-step"><span class="cc-step-num">3</span> {{ tt('cc.pending.step3') }}</div>
                  </div>

                  <div class="cc-pending-status">
                    <span class="cc-spinner"/>
                    {{ tt('cc.pending.waiting') }}
                  </div>

                  <button class="cc-modal-link" @click="resetStage">{{ tt('cc.pending.another') }}</button>
                </div>
              </template>

              <template v-else-if="addStage === 'success'">
                <div class="cc-success">
                  <div class="cc-success-icon">
                    <AppIcon name="Check" :size="28"/>
                  </div>
                  <div style="text-align:center">
                    <div class="cc-success-title">{{ tt('cc.success.title') }}</div>
                    <div class="cc-success-sub">
                      <b>{{ addedChannel?.display_name || addedChannel?.username }}</b>
                      —
                      {{ tt('cc.success.sub', { mode: (addedChannel?.posting_mode || 'auto') === 'auto' ? tt('cc.mode.auto').toLowerCase() : tt('cc.mode.manual').toLowerCase() }) }}
                    </div>
                  </div>
                  <div class="cc-modal-actions">
                    <AppButton variant="secondary" size="md" @click="resetStage">{{ tt('cc.success.again') }}</AppButton>
                    <AppButton variant="primary" size="md" @click="closeAddModal">{{ tt('cc.modal.close') }}</AppButton>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { companiesApi } from '@/api/companies.js'
import { channelsApi } from '@/api/channels.js'
import { referencesApi } from '@/api/references.js'
import { useAppStore } from '@/stores/app.js'

const router = useRouter()
const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const view = ref('cards')
const statusFilter = ref('all')        // all | active | inactive
const platformFilter = ref('all')      // all | telegram | instagram | website
const channels = ref([])
const platforms = ref([])
const loading = ref(true)
const company = ref(null)

// ── Add channel modal state ────────────────────────────────────
const addModalOpen = ref(false)
const addPlatformSlug = ref('telegram')
const addUrl = ref('')
const addMode = ref('auto')          // 'auto' | 'manual'
const addSubmitting = ref(false)
const addError = ref('')
const addStage = ref('input')         // input | pending | success
const addedChannel = ref(null)
const addDeepLink = ref('')
let addPollTimer = null

// ── Status helperlari ─────────────────────────────────────────────
function isActive(c) {
  return c.status === 'connected' && (c.bot_status === 'administrator' || c.bot_status === 'creator')
}
function statusLabel(c) { return isActive(c) ? tt('cc.status.active') : tt('cc.status.inactive') }

function displayName(c) {
  return c.display_name || c.username || `${tt('cc.col.channel')} #${(c.id || '').slice(0, 6)}`
}

function identifier(c) {
  // Telegram — @username. Boshqa platforma — URL yoki handle.
  return c.username || c.telegram_chat_id || '—'
}

function botStatusLabel(s) {
  if (!s) return '—'
  return tt(`cc.botStatus.${s}`) || s
}

function chatTypeLabel(ct) {
  if (!ct) return '—'
  return tt(`cc.chatType.${ct}`) || '—'
}

const UZ_MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  // Postgres "YYYY-MM-DD HH:mm:ss.sss" format — Safari parsa olmasligi mumkin,
  // shuning uchun bo'shliqni T ga almashtiramiz
  let s = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T')
  const dt = new Date(s)
  return isNaN(dt.getTime()) ? null : dt
}

function connectedDate(c) {
  // Faol bo'lsa connected_at, aks holda added_at (qo'shilgan sana)
  const dt = parseDate(c.connected_at) || parseDate(c.added_at)
  if (!dt) return '—'
  const d = dt.getDate().toString().padStart(2, '0')
  const m = UZ_MONTHS[dt.getMonth()] || ''
  const y = dt.getFullYear()
  return `${d} ${m} ${y}`
}

function connectedDateFull(c) {
  const dt = parseDate(c.connected_at) || parseDate(c.added_at)
  if (!dt) return ''
  const d = dt.getDate().toString().padStart(2, '0')
  const m = UZ_MONTHS[dt.getMonth()] || ''
  const y = dt.getFullYear()
  const hh = dt.getHours().toString().padStart(2, '0')
  const mm = dt.getMinutes().toString().padStart(2, '0')
  return `${d} ${m} ${y}, ${hh}:${mm}`
}

// ── Platforma helperlari ──────────────────────────────────────────
function platformSlug(c) {
  return c.platform?.slug || 'telegram' // fallback
}

function platformName(p) {
  if (!p) return 'Telegram'
  return p.name_i18n?.uz || p.name_i18n?.en || p.slug
}

function platformIconName(slug) {
  return slug === 'instagram' ? 'Instagram'
    : slug === 'website' ? 'Globe'
    : 'Telegram'
}

function platformColor(c) {
  const slug = typeof c === 'string' ? c : platformSlug(c)
  if (slug === 'instagram') return '#E1306C'
  if (slug === 'website') return '#64748B'
  return '#2AABEE' // telegram
}

function platformIconStyle(slug, size = 'md') {
  const dim = size === 'sm' ? '26px' : size === 'lg' ? '44px' : '36px'
  const radius = size === 'sm' ? '6px' : size === 'lg' ? '12px' : '10px'
  let bg, fg
  if (slug === 'instagram') {
    bg = 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)'
    fg = '#fff'
  } else if (slug === 'website') {
    bg = 'var(--panel-2)'
    fg = 'var(--text-2)'
  } else {
    bg = '#2AABEE'
    fg = '#fff'
  }
  return {
    width: dim,
    height: dim,
    borderRadius: radius,
    background: bg,
    color: fg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
}

// ── Tab'lar ───────────────────────────────────────────────────────
const headerSubtitle = computed(() => {
  if (loading.value) return ''
  const total = channels.value.length
  if (!total) return tt('cc.subtitleEmpty')
  const active = channels.value.filter(isActive).length
  return tt('cc.subtitle', { total, active })
})

const statusTabs = computed(() => [
  { value: 'all',      label: tt('cc.filter.all'),      count: channels.value.length },
  { value: 'active',   label: tt('cc.filter.active'),   count: channels.value.filter(isActive).length },
  { value: 'inactive', label: tt('cc.filter.inactive'), count: channels.value.filter(c => !isActive(c)).length },
])

const platformTabs = computed(() => {
  const counts = {}
  for (const c of channels.value) {
    const s = platformSlug(c)
    counts[s] = (counts[s] || 0) + 1
  }
  const tabs = [{ value: 'all', label: tt('cc.filter.allPlatforms') }]
  for (const p of platforms.value) {
    // Telegram'ni doim ko'rsatamiz, qolganlarni faqat is_available bo'lsa yoki kanali bo'lsa
    if (!p.is_available && !counts[p.slug]) continue
    tabs.push({ value: p.slug, label: platformName(p), count: counts[p.slug] || 0 })
  }
  return tabs
})

const tableHeaders = computed(() => [
  tt('cc.col.platform'),
  tt('cc.col.type'),
  tt('cc.col.botStatus'),
  tt('cc.col.mode'),
  tt('cc.col.connectedAt'),
  tt('cc.col.status'),
  '',
])

const filteredList = computed(() => {
  return channels.value.filter(c => {
    // status filter
    if (statusFilter.value === 'active' && !isActive(c)) return false
    if (statusFilter.value === 'inactive' && isActive(c)) return false
    // platform filter
    if (platformFilter.value !== 'all' && platformSlug(c) !== platformFilter.value) return false
    return true
  })
})

// ── Data loading ──────────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  try {
    const [companies, plats] = await Promise.all([
      companiesApi.getMy().catch(() => []),
      referencesApi.getPlatforms().catch(() => []),
    ])
    platforms.value = Array.isArray(plats) ? plats : []
    const list = Array.isArray(companies) ? companies : [companies].filter(Boolean)
    company.value = list[0] || null
    if (!company.value) {
      channels.value = []
      return
    }
    const data = await channelsApi.list(company.value.id)
    channels.value = data || []
  } catch {
    channels.value = []
  } finally {
    loading.value = false
  }
}

async function togglePostingMode(c) {
  const next = (c.posting_mode || 'auto') === 'auto' ? 'manual' : 'auto'
  try {
    const updated = await channelsApi.setPostingMode(company.value.id, c.id, next)
    const idx = channels.value.findIndex(x => x.id === c.id)
    if (idx >= 0) channels.value.splice(idx, 1, updated)
  } catch {}
}

async function removeChannel(c) {
  if (!confirm(tt('cc.confirmRemove', { name: displayName(c) }))) return
  try {
    await channelsApi.remove(company.value.id, c.id)
    channels.value = channels.value.filter(x => x.id !== c.id)
  } catch {}
}

// ── Add channel modal logikasi ─────────────────────────────────
const heroSubtitle = computed(() => {
  if (addPlatformSlug.value === 'telegram') return tt('cc.modal.subtitle.telegram')
  if (addPlatformSlug.value === 'instagram') return tt('cc.modal.subtitle.instagram')
  if (addPlatformSlug.value === 'website') return tt('cc.modal.subtitle.website')
  return tt('cc.add')
})

const urlHintHtml = computed(() => {
  const ex1 = '<span class="mono">https://t.me/my_channel</span>'
  const ex2 = '<span class="mono">@my_channel</span>'
  return tt('cc.modal.urlHint', { ex1, ex2 })
})

const urlPlaceholder = computed(() => {
  if (addPlatformSlug.value === 'telegram') return 'https://t.me/my_channel'
  if (addPlatformSlug.value === 'instagram') return 'https://instagram.com/profile'
  if (addPlatformSlug.value === 'website') return 'https://example.uz'
  return 'URL'
})

function heroGradient(slug) {
  if (slug === 'instagram') {
    return 'linear-gradient(135deg, #FFB840 0%, #ee2a7b 50%, #6228d7 100%)'
  }
  if (slug === 'website') {
    return 'linear-gradient(135deg, #475569 0%, #1E293B 100%)'
  }
  // telegram default
  return 'linear-gradient(135deg, #4FC0E8 0%, #2AABEE 55%, #1E97D6 100%)'
}

function openAddModal(slug = 'telegram') {
  addPlatformSlug.value = slug
  addUrl.value = ''
  addMode.value = 'auto'
  addError.value = ''
  addStage.value = 'input'
  addedChannel.value = null
  addDeepLink.value = ''
  addModalOpen.value = true
}

function closeAddModal() {
  addModalOpen.value = false
  stopAddPolling()
  // Agar foydalanuvchi yopgan bo'lsa, ro'yxatni yangilab qo'yamiz
  loadAll()
}

function resetStage() {
  stopAddPolling()
  addStage.value = 'input'
  addUrl.value = ''
  addError.value = ''
  addedChannel.value = null
}

function switchPlatform(p) {
  if (!p.is_available) return
  addPlatformSlug.value = p.slug
  resetStage()
}

async function submitAdd() {
  addError.value = ''
  const url = addUrl.value.trim()
  if (!url) { addError.value = tt('cc.modal.err.noUrl'); return }
  if (!company.value) { addError.value = tt('cc.modal.err.noCompany'); return }
  if (addPlatformSlug.value !== 'telegram') {
    addError.value = tt('cc.modal.err.unsupported')
    return
  }

  addSubmitting.value = true
  try {
    const res = await channelsApi.initTelegram(company.value.id, url, addMode.value)
    addedChannel.value = res.channel
    addDeepLink.value = res.deep_link
    // ro'yxatga ham qo'shamiz (yoki yangilaymiz)
    const idx = channels.value.findIndex(c => c.id === res.channel.id)
    if (idx >= 0) channels.value.splice(idx, 1, res.channel)
    else channels.value.unshift(res.channel)

    if (res.channel.status === 'connected') {
      addStage.value = 'success'
    } else {
      addStage.value = 'pending'
      startAddPolling()
    }
  } catch (err) {
    const msg = err.response?.data?.message
    addError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('cc.modal.err.generic'))
  } finally {
    addSubmitting.value = false
  }
}

function startAddPolling() {
  stopAddPolling()
  addPollTimer = setInterval(async () => {
    if (!addedChannel.value) { stopAddPolling(); return }
    try {
      const fresh = await channelsApi.getStatus(company.value.id, addedChannel.value.id)
      addedChannel.value = fresh
      const idx = channels.value.findIndex(c => c.id === fresh.id)
      if (idx >= 0) channels.value.splice(idx, 1, fresh)
      if (fresh.status === 'connected') {
        stopAddPolling()
        addStage.value = 'success'
      }
    } catch {}
  }, 2500)
}

function stopAddPolling() {
  if (addPollTimer) { clearInterval(addPollTimer); addPollTimer = null }
}

// ESC bilan yopish
function handleKey(e) {
  if (e.key === 'Escape' && addModalOpen.value) closeAddModal()
}

onMounted(() => {
  loadAll()
  document.addEventListener('keydown', handleKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKey)
  stopAddPolling()
})
</script>

<style scoped>
.cc-card-accent {
  height: 3px;
  border-radius: var(--r-lg) var(--r-lg) 0 0;
}
.cc-platform-icon {
  /* inline style'da set qilinadi */
}
.cc-platform-pill {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 4px;
  text-transform: uppercase;
}
.cc-stat-label {
  font-size: 10.5px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}
.cc-stat-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cc-mode-pill {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 4px;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}
.cc-mode-pill.auto {
  background: color-mix(in oklab, var(--accent) 14%, transparent);
  color: var(--accent);
}
.cc-mode-pill.manual {
  background: color-mix(in oklab, var(--muted) 16%, transparent);
  color: var(--text-2);
}
.cc-spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: cc-spin 0.8s linear infinite;
}
@keyframes cc-spin { to { transform: rotate(360deg); } }

/* Empty state platform ikonlari */
.cc-empty-icons {
  display: flex;
  gap: 10px;
}
.cc-empty-icons > span.dim { opacity: 0.4; }

/* ──────────────────── Add Channel Modal ──────────────────── */
.cc-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.cc-modal {
  position: relative;
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 40px 100px -20px rgba(15,23,42,0.45),
              0 0 0 1px rgba(255,255,255,0.5) inset;
}
.cc-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 30px; height: 30px;
  border-radius: 999px;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.24);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  backdrop-filter: blur(6px);
}
.cc-modal-close:hover { background: rgba(255,255,255,0.28); }

/* Hero */
.cc-modal-hero {
  position: relative;
  padding: 28px 28px 22px;
  color: white;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
}
.cc-modal-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%);
}
.cc-modal-hero-inner {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.cc-modal-hero-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}
.cc-modal-hero-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.cc-modal-hero-sub {
  font-size: 12.5px;
  color: rgba(255,255,255,0.8);
  margin-top: 4px;
  line-height: 1.45;
  max-width: 380px;
}

/* Platform pickerlar (chip qator) */
.cc-modal-platforms {
  display: flex;
  gap: 6px;
  padding: 12px 20px 0;
  border-bottom: 1px solid var(--border-2);
  margin-bottom: -1px;
  overflow-x: auto;
}
.cc-pf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px 0 6px;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--muted);
  position: relative;
  bottom: -1px;
  white-space: nowrap;
}
.cc-pf-btn:hover:not(:disabled) { color: var(--text); }
.cc-pf-btn.active {
  background: var(--panel);
  border-color: var(--border-2);
  color: var(--text);
  font-weight: 600;
}
.cc-pf-btn.disabled { opacity: 0.55; cursor: not-allowed; }
.cc-pf-btn-icon { width: 22px; height: 22px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cc-pf-btn-soon {
  font-size: 9.5px;
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--panel-2);
  color: var(--muted);
  margin-left: 2px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Body */
.cc-modal-body {
  padding: 22px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cc-field { display: flex; flex-direction: column; gap: 6px; }
.cc-field-label {
  font-size: 11.5px;
  color: var(--text-2);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cc-field-hint {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.cc-url-input {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 14px;
  background: var(--panel);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cc-url-input:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.cc-url-input.error { border-color: var(--danger); }
.cc-url-input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  color: var(--text);
  font-family: var(--font-mono);
}
.cc-url-input-field::placeholder { color: var(--muted); }

/* Mode kartalari */
.cc-mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.cc-mode-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  text-align: left;
  background: var(--panel);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.cc-mode-card:hover { border-color: var(--accent); }
.cc-mode-card.active {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 7%, var(--panel));
}
.cc-mode-card-icon {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: var(--accent-bg);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cc-mode-card-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.cc-mode-card-sub { font-size: 11px; color: var(--muted); line-height: 1.4; }
.cc-mode-card-check {
  width: 18px; height: 18px;
  border-radius: 999px;
  background: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cc-modal-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: var(--danger-bg);
  border: 1px solid color-mix(in oklab, var(--danger) 25%, transparent);
  border-radius: 8px;
  font-size: 12px;
  color: var(--danger);
}

.cc-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.cc-modal-link {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  margin: 0 auto;
}
.cc-modal-link:hover { text-decoration: underline; }

/* Pending sahnasi */
.cc-pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0 4px;
}
.cc-pending-pulse {
  position: relative;
  width: 80px;
  height: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cc-pending-pulse-icon {
  position: relative;
  z-index: 2;
}
.cc-pending-pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 2px solid #2AABEE;
  opacity: 0.4;
  animation: ccPulse 1.8s ease-out infinite;
}
.cc-pending-pulse-ring.r1 { animation-delay: 0s; }
.cc-pending-pulse-ring.r2 { animation-delay: 0.6s; }
@keyframes ccPulse {
  0%   { transform: scale(0.6); opacity: 0.7; }
  100% { transform: scale(1.4); opacity: 0; }
}
.cc-pending-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.cc-pending-sub { font-size: 12.5px; color: var(--muted); line-height: 1.5; max-width: 380px; }

.cc-pending-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  background: linear-gradient(135deg, #4FC0E8, #2AABEE);
  color: white;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 13px;
  box-shadow: 0 8px 24px -8px rgba(42,171,238,0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}
.cc-pending-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -8px rgba(42,171,238,0.5);
}

.cc-pending-steps {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cc-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-2);
}
.cc-step-num {
  width: 20px; height: 20px;
  border-radius: 999px;
  background: var(--accent-bg);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cc-pending-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--muted);
  padding: 8px 14px;
  background: var(--panel-2);
  border-radius: 999px;
}

/* Success */
.cc-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}
.cc-success-icon {
  width: 64px; height: 64px;
  border-radius: 999px;
  background: var(--success-bg);
  color: var(--success);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ccPop 0.6s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes ccPop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.cc-success-title { font-size: 17px; font-weight: 600; }
.cc-success-sub { font-size: 12.5px; color: var(--muted); line-height: 1.5; }

/* Modal transition */
.cc-modal-enter-active { transition: opacity 0.25s ease, backdrop-filter 0.25s ease; }
.cc-modal-leave-active { transition: opacity 0.2s ease, backdrop-filter 0.2s ease; }
.cc-modal-enter-from, .cc-modal-leave-to { opacity: 0; }
.cc-modal-enter-active .cc-modal { animation: ccModalIn 0.32s cubic-bezier(.22,.68,0,1.2); }
@keyframes ccModalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
