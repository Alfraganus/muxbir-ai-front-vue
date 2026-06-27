<template>
  <div v-if="phase === 'setup'" class="cd-setup-wrap">
    <DiscoverSetup
      :config="config"
      :sources="availableSources"
      :channels="channels"
      :selected-channel-id="selectedChannelId"
      :categories="CATEGORIES"
      :time-ranges="TIME_RANGES"
      :loading="loadingSources"
      :loading-channels="loadingChannels"
      @select-channel="onSelectChannel"
      @run="startScan">
      <template #side-top>
        <!-- Internetdan qidirish (Google-ga o'xshash) — "AI qidiruvni boshlash"dan tepada -->
        <DiscoverWebSearch v-if="company" :company-id="company.id" :sources="availableSources"/>
      </template>
    </DiscoverSetup>

    <!-- ─── Oxirgi qidiruvlar (tarix) ─── -->
    <div v-if="history.length" class="cd-history">
      <div class="cd-history-head">
        <div class="cd-history-head-left">
          <span class="cd-history-ic"><AppIcon name="Calendar" :size="13"/></span>
          <div>
            <div class="cd-history-title">{{ tt('disc.history.title') }}</div>
            <div class="cd-history-sub">{{ tt('disc.history.sub') }}</div>
          </div>
        </div>
        <button v-if="loadingHistorySnapshot" class="cd-history-refresh" disabled>
          <span class="cd-history-spinner"/>
          {{ tt('disc.history.loading') }}
        </button>
      </div>
      <div class="cd-history-list">
        <button v-for="h in history" :key="h.id"
                class="cd-history-item"
                :disabled="loadingHistorySnapshot"
                @click="openHistoryItem(h)">
          <div class="cd-history-item-when">
            <span class="cd-history-item-time">{{ formatHistoryTime(h.created_at) }}</span>
            <span class="cd-history-item-ago">{{ formatRelative(h.created_at) }}</span>
          </div>
          <div class="cd-history-item-meta">
            <span class="cd-history-pill">
              <AppIcon name="Layers" :size="10"/>
              {{ tt('disc.history.posts', { n: h.total_posts }) }}
            </span>
            <span class="cd-history-pill cd-history-pill-muted">
              <AppIcon name="Telegram" :size="10"/>
              {{ tt('disc.history.channels', { n: h.source_count }) }}
            </span>
            <span v-if="h.request_payload?.sort_mode === 'latest'" class="cd-history-pill cd-history-pill-blue">
              🕒 {{ tt('disc.history.latest') }}
            </span>
            <span v-else class="cd-history-pill cd-history-pill-accent">
              ⭐ {{ tt('disc.history.best') }}
            </span>
            <span v-if="h.request_payload?.time_range" class="cd-history-pill cd-history-pill-muted">
              {{ rangeLabel(h.request_payload.time_range) }}
            </span>
          </div>
          <span class="cd-history-item-arrow">
            <AppIcon name="Arrow" :size="13"/>
          </span>
        </button>
      </div>
    </div>
  </div>

  <DiscoverScanning
    v-else-if="phase === 'scanning'"
    :config="{ sources: config.sources, perChannel: config.perChannel }"
    :sources="availableSources"
    :live-counts="liveCounts"
    @done="onScanAnimationDone"/>

  <div v-else class="cd-root">
    <PageHeader
      :title="tt('disc.results.title')">
      <template #right>
        <AppButton variant="secondary" size="md" @click="phase = 'setup'">
          <template #icon><AppIcon name="Settings" :size="13"/></template>
          {{ tt('disc.results.change') }}
        </AppButton>
        <AppButton variant="primary" size="md" @click="startScan">
          <template #icon><AppIcon name="Sparkle" :size="13"/></template>
          {{ tt('disc.results.rescan') }}
        </AppButton>
      </template>
    </PageHeader>

    <!-- AI scan banner -->
    <div class="cd-banner" v-if="totalPostsCount > 0">
      <div aria-hidden class="cd-banner-glow"/>
      <span class="cd-banner-ic"><AppIcon name="Sparkle" :size="18"/></span>
      <div class="cd-banner-body">
        <div class="cd-banner-line">
          <span class="cd-banner-title">{{ tt('disc.banner.title') }}</span>
          <span class="cd-pill cd-pill-accent">{{ tt('disc.avgScore', { score: averageScore }) }}</span>
        </div>
        <span class="cd-banner-sub">
          <b>{{ tt('disc.history.posts', { n: totalPostsCount }) }}</b> {{ tt('disc.banner.sub') }}
        </span>
      </div>
      <AppButton variant="primary" size="md" @click="autoSelectTop">
        <template #icon><AppIcon name="Bolt" :size="12"/></template>
        {{ tt('disc.banner.top5') }}
      </AppButton>
    </div>

    <!-- Filter bar -->
    <div class="cd-filterbar" v-if="totalPostsCount > 0">
      <div class="cd-chips">
        <button class="cd-chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">
          <span>{{ tt('disc.filter.all') }}</span>
          <span class="cd-chip-count mono tabular">{{ totalPostsCount }}</span>
        </button>
        <button v-for="s in discoveredSources" :key="s.id"
          class="cd-chip" :class="{ active: filter === s.id }"
          @click="filter = s.id">
          <span class="cd-chip-dot" :style="{ background: s.color }"/>
          <span>{{ s.name }}</span>
          <span class="cd-chip-count mono tabular">{{ countBySource(s.id) }}</span>
        </button>
      </div>
      <div style="flex:1"/>
      <div class="cd-search-wrap">
        <AppIcon name="Search" :size="12" :style="{ color:'var(--muted)' }"/>
        <input v-model="query" :placeholder="tt('disc.search.ph')" class="cd-search"/>
      </div>
    </div>

    <!-- Telegram session yo'q xato -->
    <div v-if="scanError && scanError.actionPath"
         style="padding:24px;border-radius:10px;border:1px solid rgba(239,68,68,.3);
                background:rgba(239,68,68,.06);display:flex;flex-direction:column;gap:12px;
                align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;">🔒</span>
        <strong style="font-size:14px;color:#ef4444;">{{ tt('disc.tgError.title') }}</strong>
      </div>
      <p style="margin:0;font-size:13px;color:var(--text);line-height:1.55;">{{ scanError.message }}</p>
      <button @click="$router.push(scanError.actionPath)"
              style="padding:9px 18px;border-radius:6px;background:var(--accent);color:#fff;
                     border:none;cursor:pointer;font-size:13px;font-weight:500;">
        {{ scanError.actionLabel }} →
      </button>
    </div>

    <!-- Boshqa xato -->
    <div v-else-if="scanError"
         style="padding:16px;border-radius:8px;border:1px solid rgba(239,68,68,.3);
                background:rgba(239,68,68,.06);color:#ef4444;font-size:13px;">
      {{ scanError.message }}
    </div>

    <!-- Empty state -->
    <div v-else-if="totalPostsCount === 0" class="cd-empty" style="display:flex;flex-direction:column;align-items:stretch;gap:14px;max-width:640px;margin:0 auto;">
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;">
        <span style="font-size:14px;color:var(--text);font-weight:500;">{{ tt('disc.empty.title') }}</span>
        <span style="font-size:12.5px;color:var(--muted);">
          {{ tt('disc.empty.sub') }}
        </span>
      </div>

      <!-- Per-source diagnostic -->
      <div v-if="selectedSourcesWithStatus.length" style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">
          {{ tt('disc.empty.srcsTitle') }}
        </div>
        <div v-for="s in selectedSourcesWithStatus" :key="s.id"
             style="display:flex;flex-direction:column;gap:6px;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--panel);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="cd-src-avatar" :style="{ background: s.color, width:'24px', height:'24px', fontSize:'11px' }">{{ (s.name || '?').charAt(0) }}</span>
            <span style="font-size:13px;font-weight:600;">{{ s.name }}</span>
            <span class="mono" style="font-size:11px;color:var(--muted);">@{{ s.username }}</span>
            <div style="flex:1"></div>
            <button @click="scanFromEmpty(s)" :disabled="scanningOwnedId === s.ownedId"
                    style="padding:5px 10px;border-radius:5px;border:1px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;font-size:11.5px;">
              {{ scanningOwnedId === s.ownedId ? tt('disc.empty.scanning') : tt('disc.empty.scanBtn') }}
            </button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:var(--muted);">
            <span>{{ tt('disc.empty.subs') }}: <strong style="color:var(--text);">{{ s.subs.toLocaleString('uz-UZ').replace(/,/g, ' ') }}</strong></span>
            <span>{{ tt('disc.empty.lastScan') }}: <strong style="color:var(--text);">{{ s.lastScannedAt ? formatRelative(s.lastScannedAt) : tt('disc.empty.noScan') }}</strong></span>
          </div>
          <div v-if="s.lastError"
               style="padding:6px 8px;border-radius:5px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);font-size:11.5px;color:#dc2626;line-height:1.4;">
            ⚠ {{ s.lastError }}
          </div>
          <div v-else-if="s.subs > 0 && !s.lastScannedAt"
               style="font-size:11.5px;color:var(--muted);font-style:italic;">
            {{ tt('disc.empty.notScanned') }}
          </div>
        </div>
      </div>

      <div style="font-size:11.5px;color:var(--muted);text-align:center;line-height:1.5;">
        {{ tt('disc.empty.tip') }}
      </div>
    </div>

    <!-- Channel sections -->
    <div v-else style="display:flex;flex-direction:column;gap:24px;">
      <section v-for="s in visibleSources" :key="s.id" v-show="postsForSource(s.id).length">
        <header class="cd-src-head">
          <span class="cd-src-avatar" :style="{ background: s.color }">{{ (s.name || '?').charAt(0) }}</span>
          <div style="display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:14px;font-weight:600;letter-spacing:-0.01em;">{{ s.name }}</span>
              <span class="mono" style="font-size:11px;color:var(--muted);">@{{ s.username }}</span>
            </div>
            <span style="font-size:11px;color:var(--muted);">
              {{ tt('disc.srcHead.posts', { n: postsForSource(s.id).length }) }}
            </span>
          </div>
        </header>

        <div class="cd-grid">
          <DiscoverCard v-for="(p, i) in postsForSource(s.id)" :key="p.id"
            :post="p"
            :source="s"
            :rank="i + 1"
            :selected="!!selected[p.id]"
            @toggle="pickAndEdit(p.id)"
            @preview="previewing = p"/>
        </div>
      </section>

      <div v-if="filtered.length === 0" class="cd-empty">
        <span style="font-size:13px;color:var(--muted);">{{ tt('disc.noFilter') }}</span>
      </div>
    </div>

    <!-- Sticky selection bar -->
    <transition name="cd-bar">
      <div v-if="selectedCount > 0" class="cd-sticky">
        <span class="cd-sticky-count">
          {{ tt('disc.selected', { n: selectedCount }) }}
        </span>
        <span class="cd-divider-v"/>
        <span class="cd-sticky-avg">
          {{ tt('disc.avgScore') }}:
          <span class="tabular" :style="{ fontWeight:600, color: scoreColor(selectedAvg) }">{{ selectedAvg }}</span>
        </span>
        <AppButton variant="secondary" size="md" @click="clearSelection">
          <template #icon><AppIcon name="Close" :size="12"/></template>
          {{ tt('disc.clear') }}
        </AppButton>
      </div>
    </transition>

    <!-- Preview overlay -->
    <DiscoverPreview v-if="previewing"
      :post="previewing"
      :source="sourceOf(previewing)"
      :is-selected="!!selected[previewing.id]"
      @close="previewing = null"
      @toggle="() => { const id = previewing.id; previewing = null; pickAndEdit(id) }"/>

    <!-- ─── Loading overlay (Tanlash bosilganda) ─── -->
    <transition name="cd-pick-fade">
      <div v-if="picking" class="cd-pick-overlay">
        <div class="cd-pick-card">
          <div class="cd-pick-orb"/>
          <div class="cd-pick-orb cd-pick-orb-2"/>

          <div class="cd-pick-icon">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="white" stroke-width="3"
                stroke-linecap="round" stroke-dasharray="32 126"
                style="transform-origin: 24px 24px; animation: cd-pick-spin 1.1s linear infinite;"/>
            </svg>
            <AppIcon name="Sparkle" :size="20" class="cd-pick-spark"/>
          </div>

          <h3 class="cd-pick-title">{{ tt('disc.picking.title') }}</h3>
          <p class="cd-pick-sub">{{ tt('disc.picking.sub') }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { channelsApi } from '@/api/channels.js'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import DiscoverCard from '@/components/discover/DiscoverCard.vue'
import DiscoverPreview from '@/components/discover/DiscoverPreview.vue'
import DiscoverSetup from '@/components/discover/DiscoverSetup.vue'
import DiscoverScanning from '@/components/discover/DiscoverScanning.vue'
import DiscoverWebSearch from '@/components/discover/DiscoverWebSearch.vue'
import { discoverApi } from '@/api/discover.js'
import { companiesApi } from '@/api/companies.js'
import { postsApi } from '@/api/posts.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const router = useRouter()

const phase = ref('setup') // setup | scanning | results

const TIME_RANGES = computed(() => [
  { id: '15m', label: tt('disc.time.ranges.15m'), hint: tt('disc.time.ranges.15m') },
  { id: '30m', label: tt('disc.time.ranges.30m'), hint: tt('disc.time.ranges.30m') },
  { id: '1h',  label: tt('disc.time.ranges.1h'),  hint: tt('disc.time.ranges.1h') },
  { id: '3h',  label: tt('disc.time.ranges.3h'),  hint: tt('disc.time.ranges.3h') },
  { id: '6h',  label: tt('disc.time.ranges.6h'),  hint: tt('disc.time.ranges.6h') },
  { id: '24h', label: tt('disc.time.ranges.24h'), hint: tt('disc.time.ranges.24h') },
  { id: '3d',  label: tt('disc.time.ranges.3d'),  hint: tt('disc.time.ranges.3d') },
  { id: '7d',  label: tt('disc.time.ranges.7d'),  hint: tt('disc.time.ranges.7d'), recommended: true },
  { id: '30d', label: tt('disc.time.ranges.30d'), hint: tt('disc.time.ranges.30d') },
  { id: '90d', label: tt('disc.time.ranges.90d'), hint: tt('disc.time.ranges.90d') },
  { id: 'all', label: tt('disc.time.ranges.all'), hint: tt('disc.time.ranges.all') },
])
const CATEGORIES = computed(() => [
  { id: 'all', label: tt('disc.filter.all') },
])

const config = reactive({
  sources: [],
  perChannel: 5,
  timeRange: '24h',
  categories: ['all'],
  customSource: '',
  includeVideos: false,
  sortMode: 'latest', // 'latest' — eng oxirgi postlar (default); 'best' — eng yaxshi postlar
  sourceType: 'all', // 'all' | 'telegram' | 'website'
  allowUndated: false, // website manbalar: sanasi aniqlanmagan postlarni ham olish
})

// ── Channels + sources from backend ──────────────────────
// Discover endi KANAL-scoped: avval kanal tanlanadi, keyin faqat shu kanalga
// biriktirilgan manbalar ko'rinadi va qidiriladi.
const availableSources = ref([]) // [{ id, name, username, handle, color, category, subs }]
const loadingSources = ref(false)
const company = ref(null)
const channels = ref([])
const loadingChannels = ref(true)
const selectedChannelId = ref(null)

const PALETTE = [
  'oklch(0.65 0.18 28)',
  'oklch(0.62 0.16 245)',
  'oklch(0.68 0.16 75)',
  'oklch(0.55 0.16 300)',
  'oklch(0.62 0.18 145)',
  'oklch(0.62 0.18 195)',
  'oklch(0.62 0.18 350)',
]
function colorFor(idx) { return PALETTE[idx % PALETTE.length] }

function pickName(name_i18n, fallback) {
  if (!name_i18n) return fallback
  return name_i18n.uz || name_i18n.en || name_i18n.ru || fallback
}

// ── Discover history (oxirgi qidiruvlar) ────────────────
const history = ref([])
const loadingHistorySnapshot = ref(false)

async function loadHistory() {
  if (!company.value) { history.value = []; return }
  try {
    const list = await discoverApi.history(company.value.id, 5)
    history.value = Array.isArray(list) ? list : []
  } catch { history.value = [] }
}

function formatHistoryTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${dd}.${mm} · ${hh}:${min}`
}

function rangeLabel(id) {
  const r = TIME_RANGES.value.find(t => t.id === id)
  return r?.label || id
}

async function openHistoryItem(h) {
  if (!company.value || !h?.id) return
  loadingHistorySnapshot.value = true
  scanError.value = null
  try {
    const snap = await discoverApi.historyById(company.value.id, h.id)
    discovered.value = snap?.result || { channels: [], total: 0 }
    // Filtrlar bo'sh holatdan boshlasin
    filter.value = 'all'
    query.value = ''
    selected.value = {}
    phase.value = 'results'
  } catch (e) {
    scanError.value = {
      message: e?.response?.data?.message || e?.message || tt('clientDiscover.errHistoryOpen'),
      actionLabel: null, actionPath: null,
    }
  } finally {
    loadingHistorySnapshot.value = false
  }
}

async function loadInitial() {
  loadingChannels.value = true
  try {
    const comps = await companiesApi.getMy().catch(() => [])
    const list = Array.isArray(comps) ? comps : [comps].filter(Boolean)
    company.value = list[0] || null
    if (!company.value) {
      channels.value = []
      return
    }
    const chans = await channelsApi.list(company.value.id).catch(() => [])
    channels.value = Array.isArray(chans) ? chans : []
    // Bitta kanal bo'lsa — avtomatik tanlaymiz (qo'shimcha qadam shart emas)
    if (channels.value.length === 1) {
      await onSelectChannel(channels.value[0].id)
    }
    // Tarix kompaniya darajasida — kanaldan qat'iy nazar yuklaymiz
    loadHistory()
  } finally {
    loadingChannels.value = false
  }
}

async function onSelectChannel(channelId) {
  selectedChannelId.value = channelId
  await loadChannelSources(channelId)
}

async function loadChannelSources(channelId) {
  if (!company.value || !channelId) { availableSources.value = []; return }
  loadingSources.value = true
  try {
    // Faqat SHU kanalga biriktirilgan manbalar.
    const owned = await channelsApi.listSources(company.value.id, channelId).catch(() => [])
    availableSources.value = (owned || [])
      .filter(s => s.source_channel_id)
      .map((s, i) => ({
        id: s.source_channel_id,
        ownedId: s.id,
        type: s.source_type || 'telegram',
        name: s.title || s.username_normalized,
        username: s.username_normalized,
        handle: (s.source_type === 'website' ? '' : '@') + s.username_normalized,
        color: colorFor(i),
        category: '',
        subs: s.subscriber_count || 0,
        lastError: s.last_error || null,
        lastScannedAt: s.last_scanned_at || null,
      }))
    // Default selection: shu kanalning barcha manbalari
    config.sources = availableSources.value.map(s => s.id)
  } finally {
    loadingSources.value = false
  }
}
onMounted(loadInitial)

// ── Discovery ────────────────────────────────────────────
const discovered = ref({ channels: [], total: 0 })
const liveCounts = ref({}) // { source_id: count } - skanerlash davomida real-time
const scanError = ref(null) // { message, actionLabel, actionPath }
const scanningOwnedId = ref(null)
let scanAnimationDone = false
let scanRequestDone = false

// Empty state'da ko'rsatish uchun: hozir tanlangan manbalar + ularning oxirgi
// scan holati (last_error, last_scanned_at, subscriber_count).
const selectedSourcesWithStatus = computed(() => {
  const ids = new Set(config.sources || [])
  return availableSources.value.filter(s => ids.has(s.id))
})

function formatRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return tt('clientDiscover.justNow')
  if (diff < 3600) return tt('clientDiscover.minutesAgo', { n: Math.floor(diff / 60) })
  if (diff < 86400) return tt('clientDiscover.hoursAgo', { n: Math.floor(diff / 3600) })
  if (diff < 86400 * 7) return tt('clientDiscover.daysAgo', { n: Math.floor(diff / 86400) })
  return d.toLocaleDateString('uz-UZ', { dateStyle: 'medium' })
}

async function scanFromEmpty(s) {
  if (!company.value || !selectedChannelId.value || !s?.ownedId) return
  scanningOwnedId.value = s.ownedId
  try {
    // Website manba uchun "sanasiz postlar ham" sozlamasini scan oldidan saqlaymiz —
    // shunda undated maqolalarga scan vaqti qo'yilib, ular ham natijaga tushadi.
    // (Telegram manbada ahamiyatsiz — postlar har doim sanali.)
    if (s.type === 'website') {
      await channelsApi.updateSource(company.value.id, selectedChannelId.value, s.ownedId, {
        allow_undated: !!config.allowUndated,
      }).catch(() => {})
    }
    await channelsApi.scanSource(company.value.id, selectedChannelId.value, s.ownedId)
    // Bir necha soniya kutib, manbalarni qayta yuklaymiz (last_scanned_at yangilanadi)
    await new Promise(r => setTimeout(r, 3000))
    await loadChannelSources(selectedChannelId.value)
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  } finally {
    scanningOwnedId.value = null
  }
}

async function startScan() {
  if (!company.value || !selectedChannelId.value || config.sources.length === 0) return
  phase.value = 'scanning'
  scanAnimationDone = false
  scanRequestDone = false
  liveCounts.value = {}
  selected.value = {}

  const payload = {
    channel_id: selectedChannelId.value,
    source_ids: config.sources,
    source_types: config.sourceType === 'all' ? undefined : [config.sourceType],
    time_range: config.timeRange,
    per_channel: config.perChannel,
    similarity_threshold: 0.5,
    include_videos: config.includeVideos,
    sort_mode: config.sortMode,
  }

  // Parallel: real discover + live counts (counts return faster, drive UI)
  discoverApi.counts(company.value.id, payload)
    .then(counts => { liveCounts.value = counts || {} })
    .catch(() => {})

  try {
    const result = await discoverApi.run(company.value.id, payload)
    discovered.value = result || { channels: [], total: 0 }
    scanError.value = null
  } catch (err) {
    discovered.value = { channels: [], total: 0 }
    const body = err?.response?.data
    if (body?.code === 'NO_TELEGRAM_SESSION' || err?.response?.status === 403) {
      scanError.value = {
        message: body?.message || tt('clientDiscover.errNoTelegramSession'),
        actionLabel: body?.action?.label || tt('clientDiscover.telegramConnect'),
        actionPath: body?.action?.path || '/client/telegram-api',
      }
    } else {
      scanError.value = { message: body?.message || err?.message || tt('clientDiscover.errGeneric'), actionLabel: null, actionPath: null }
    }
    console.error('discover failed', err)
  }
  scanRequestDone = true
  // Skanerlash tugadi — tarixni yangilab qo'yamiz (yangi yozuv qo'shilgan bo'lishi mumkin)
  loadHistory()
  maybeFinishScan()
}

function onScanAnimationDone() {
  scanAnimationDone = true
  maybeFinishScan()
}
function maybeFinishScan() {
  if (scanAnimationDone && scanRequestDone) phase.value = 'results'
}

// ── Map backend posts → DiscoverCard shape ─────────────────
function mapBackendPost(p) {
  const text = (p.text || '').trim()
  const firstNewline = text.indexOf('\n')
  const title = firstNewline > 0 ? text.slice(0, firstNewline).slice(0, 180) : text.slice(0, 140)
  const snippet = firstNewline > 0 ? text.slice(firstNewline + 1, firstNewline + 220).trim() : ''
  // Sana-vaqt: avval haqiqiy qiymat tekshiriladi. Aniqlanmagan/yaroqsiz bo'lsa —
  // umuman yozilmaydi (dateLabel = null).
  const postedMs = p.posted_at ? new Date(p.posted_at).getTime() : NaN
  const hasDate = !isNaN(postedMs)
  const ageH = hasDate ? (Date.now() - postedMs) / 3_600_000 : null
  const time = !hasDate ? null
    : ageH < 1 ? tt('clientDiscover.ageMin', { n: Math.max(1, Math.round(ageH * 60)) })
    : ageH < 24 ? tt('clientDiscover.ageHour', { n: Math.round(ageH) })
    : tt('clientDiscover.ageDay', { n: Math.round(ageH / 24) })
  const dateLabel = hasDate ? fmtPostedAt(postedMs) : null
  // Website maqolasi telegram emas — embed/score/metrikalar yo'q, rasm image_url'dan.
  const isWebsite = p.source_type === 'website' || p.media_type === 'webpage'
  const cleanUsername = (p.source_username || '').replace(/^@+/, '')
  const embedUrl = !isWebsite && cleanUsername && p.external_message_id
    ? `https://t.me/${cleanUsername}/${p.external_message_id}?embed=1&single=1`
    : null
  const tmePostUrl = !isWebsite && cleanUsername && p.external_message_id
    ? `https://t.me/${cleanUsername}/${p.external_message_id}`
    : null
  return {
    id: p.id,
    src: p.source_channel_id,
    title: title || '—',
    snippet: snippet,
    category: '',
    time,
    views: p.view_count,
    reactions: p.reaction_count,
    shares: p.forward_count,
    tags: [],
    media: p.media_type === 'video' ? 'video' : 'image',
    trend: p.forward_count > 100 ? 'up' : 'flat',
    ai: { total: p.ai_score, relevance: p.ai_score, virality: Math.min(100, p.ai_score + 4), freshness: Math.min(100, p.ai_score + 2), audience: Math.max(0, p.ai_score - 3) },
    rawScore: Number(p.score) || 0,
    embedUrl,
    tmePostUrl,
    isWebsite,
    imageUrl: p.image_url || null,
    articleUrl: isWebsite ? (p.media_url || null) : null,
    dateLabel,
    _raw: p,
  }
}

// posted_at (ms) → "07.06.2026 11:29" (mahalliy vaqt). Bugun bo'lsa "Bugun 11:29".
function fmtPostedAt(ms) {
  const d = new Date(ms)
  if (isNaN(d.getTime())) return null
  const pad = (n) => String(n).padStart(2, '0')
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const now = new Date()
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  const y = new Date(now); y.setDate(now.getDate() - 1)
  const isYtd = d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate()
  if (sameDay) return `${tt('disc.today')} ${hm}`
  if (isYtd) return `${tt('disc.yesterday')} ${hm}`
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${hm}`
}

const mappedPosts = computed(() => {
  const out = []
  for (const ch of discovered.value.channels || []) {
    for (const p of ch.posts || []) out.push(mapBackendPost(p))
  }
  return out
})

const discoveredSources = computed(() => {
  const ids = new Set((discovered.value.channels || []).map(c => c.source_channel_id))
  return availableSources.value.filter(s => ids.has(s.id))
})

// ── Results filtering ───────────────────────────────────
const filter = ref('all')
const query = ref('')
const selected = ref({})
const previewing = ref(null)

const visibleSources = computed(() =>
  filter.value === 'all' ? discoveredSources.value : discoveredSources.value.filter(s => s.id === filter.value)
)

function matchesQuery(p) {
  if (!query.value.trim()) return true
  const q = query.value.trim().toLowerCase()
  if (p.title.toLowerCase().includes(q)) return true
  if (p.snippet.toLowerCase().includes(q)) return true
  return false
}
/**
 * Backend allaqachon `per_channel` soni bo'yicha score desc tartibida
 * eng yuqori postlarni qaytaradi. Bu yerda faqat qidiruv va kanal filtri.
 */
function postsForSource(id) {
  return mappedPosts.value
    .filter(p => p.src === id && matchesQuery(p))
    .sort((a, b) => b.ai.total - a.ai.total)
}
function countBySource(id) {
  return mappedPosts.value.filter(p => p.src === id).length
}
const filtered = computed(() =>
  mappedPosts.value
    .filter(p => (filter.value === 'all' || p.src === filter.value) && matchesQuery(p))
    .sort((a, b) => b.ai.total - a.ai.total)
)
const totalPostsCount = computed(() => mappedPosts.value.length)
const averageScore = computed(() => {
  if (!mappedPosts.value.length) return 0
  return Math.round(mappedPosts.value.reduce((a, p) => a + p.ai.total, 0) / mappedPosts.value.length)
})

const currentRangeLabel = computed(() => TIME_RANGES.value.find(t => t.id === config.timeRange)?.label || config.timeRange)
const sourceTypeLabel = computed(() =>
  config.sourceType === 'website' ? 'Website' : config.sourceType === 'telegram' ? 'Telegram' : '')
const selectedCount = computed(() => Object.values(selected.value).filter(Boolean).length)
const selectedAvg = computed(() => {
  const list = mappedPosts.value.filter(p => selected.value[p.id])
  if (!list.length) return 0
  return Math.round(list.reduce((a, p) => a + p.ai.total, 0) / list.length)
})

const picking = ref(false)
function toggle(id) { selected.value = { ...selected.value, [id]: !selected.value[id] } }

/**
 * Discover'dan postni tanlaganda — yangi qoralama post yaratamiz
 * (rasm rasmga, matn content blokka) va editor sahifasiga o'tamiz.
 */
async function pickAndEdit(id) {
  if (picking.value || !company.value) return
  picking.value = true
  selected.value = { ...selected.value, [id]: true }
  try {
    const created = await postsApi.createFromSource(company.value.id, id)
    if (created?.id) {
      router.push(`/client/posts/${created.id}/edit`)
    }
  } catch (e) {
    console.error('pickAndEdit failed', e)
    selected.value = { ...selected.value, [id]: false }
    const msg = e?.response?.data?.message || tt('clientDiscover.errCreatePost')
    alert(Array.isArray(msg) ? msg.join('. ') : msg)
  } finally {
    picking.value = false
  }
}
function clearSelection() { selected.value = {} }
function autoSelectTop() {
  const top = [...mappedPosts.value].sort((a, b) => b.ai.total - a.ai.total).slice(0, 5)
  const next = {}
  for (const p of top) next[p.id] = true
  selected.value = next
}
function sourceOf(post) { return availableSources.value.find(s => s.id === post.src) }
function scoreColor(v) {
  if (v >= 85) return 'var(--success)'
  if (v >= 70) return 'var(--accent)'
  return '#F59E0B'
}
</script>

<style scoped>
.cd-setup-wrap { display: flex; flex-direction: column; gap: 16px; padding: 20px 24px 0; }

/* ─── Oxirgi qidiruvlar (history) ─── */
.cd-history {
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.cd-history-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px dashed var(--border-2);
}
.cd-history-head-left { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0; }
.cd-history-ic {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: color-mix(in oklab, var(--accent) 14%, transparent);
  color: var(--accent);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cd-history-title { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: -0.005em; }
.cd-history-sub { font-size: 11px; color: var(--muted); margin-top: 2px; line-height: 1.4; }
.cd-history-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  height: 24px; padding: 0 10px;
  background: transparent; border: 1px solid var(--border-2); border-radius: 6px;
  font-size: 11px; color: var(--muted); cursor: pointer;
}
.cd-history-spinner {
  width: 11px; height: 11px;
  border-radius: 999px;
  border: 2px solid color-mix(in oklab, currentColor 30%, transparent);
  border-top-color: currentColor;
  animation: cdHistorySpin 0.8s linear infinite;
}
@keyframes cdHistorySpin { to { transform: rotate(360deg); } }

.cd-history-list {
  display: flex; flex-direction: column;
}
.cd-history-item {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-top: 1px solid var(--border-2);
  cursor: pointer;
  transition: background .12s ease;
  text-align: left;
  width: 100%;
}
.cd-history-item:first-child { border-top: none; }
.cd-history-item:hover:not(:disabled) {
  background: color-mix(in oklab, var(--accent) 5%, transparent);
}
.cd-history-item:disabled { opacity: 0.6; cursor: progress; }
.cd-history-item-when {
  display: flex; flex-direction: column; gap: 2px;
  min-width: 140px;
  flex-shrink: 0;
}
.cd-history-item-time {
  font-size: 13px; font-weight: 600; color: var(--text);
  font-feature-settings: 'tnum';
  letter-spacing: -0.005em;
}
.cd-history-item-ago {
  font-size: 11px; color: var(--muted);
}
.cd-history-item-meta {
  display: flex; flex-wrap: wrap; gap: 6px;
  flex: 1; min-width: 0;
}
.cd-history-pill {
  display: inline-flex; align-items: center; gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  background: color-mix(in oklab, var(--accent) 12%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in oklab, var(--accent) 22%, transparent);
}
.cd-history-pill-muted {
  background: var(--panel-2);
  color: var(--muted);
  border-color: var(--border-2);
}
.cd-history-pill-blue {
  background: color-mix(in oklab, #3b82f6 12%, transparent);
  color: #1d4ed8;
  border-color: color-mix(in oklab, #3b82f6 30%, transparent);
}
.cd-history-pill-accent {
  background: color-mix(in oklab, #f59e0b 14%, transparent);
  color: #b45309;
  border-color: color-mix(in oklab, #f59e0b 32%, transparent);
}
.cd-history-item-arrow {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: var(--panel-2);
  color: var(--muted);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background .12s, color .12s, transform .12s;
}
.cd-history-item:hover:not(:disabled) .cd-history-item-arrow {
  background: var(--accent);
  color: #fff;
  transform: translateX(2px);
}

@media (max-width: 640px) {
  .cd-history-item { flex-wrap: wrap; }
  .cd-history-item-when { min-width: 0; flex: 1; }
}

.cd-root { padding: 20px 24px 100px; display: flex; flex-direction: column; gap: 16px; }

.cd-banner {
  position: relative;
  background: linear-gradient(105deg,
    color-mix(in oklab, var(--accent) 14%, var(--panel)) 0%,
    color-mix(in oklab, #6E56CF 12%, var(--panel)) 100%);
  border: 1px solid color-mix(in oklab, var(--accent) 22%, var(--border));
  border-radius: 12px; padding: 14px 18px;
  display: flex; align-items: center; gap: 14px; overflow: hidden;
}
.cd-banner-glow {
  position: absolute; top: -40px; right: -40px;
  width: 200px; height: 200px; border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, var(--accent) 28%, transparent), transparent 70%);
  filter: blur(20px); pointer-events: none;
}
.cd-banner-ic {
  width: 38px; height: 38px; border-radius: 10px;
  background: color-mix(in oklab, var(--accent) 18%, white);
  border: 1px solid color-mix(in oklab, var(--accent) 30%, transparent);
  color: var(--accent);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cd-banner-body { flex: 1; display: flex; flex-direction: column; gap: 2px; position: relative; min-width: 0; }
.cd-banner-line { display: flex; align-items: center; gap: 8px; }
.cd-banner-title { font-size: 13px; font-weight: 600; }
.cd-banner-sub { font-size: 12px; color: var(--text-2); }

.cd-pill {
  display: inline-flex; align-items: center; gap: 5px;
  height: 20px; padding: 0 8px;
  border-radius: 999px;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
}
.cd-pill-accent { background: var(--accent-bg); color: var(--accent); }

.cd-filterbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 10px;
}
.cd-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.cd-chip {
  height: 28px; padding: 0 10px;
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--panel-2); border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: 6px; font-size: 12px; font-weight: 500;
  cursor: pointer; font-family: inherit;
  transition: all 0.12s;
}
.cd-chip:hover { color: var(--text); border-color: color-mix(in oklab, var(--accent) 20%, var(--border)); }
.cd-chip.active { background: var(--accent-bg); border-color: color-mix(in oklab, var(--accent) 30%, transparent); color: var(--accent); }
.cd-chip-dot { width: 7px; height: 7px; border-radius: 999px; flex-shrink: 0; }
.cd-chip-count {
  font-size: 10.5px; padding: 1px 5px; border-radius: 4px;
  background: var(--panel); color: var(--muted); border: 1px solid var(--border);
}
.cd-chip.active .cd-chip-count {
  background: color-mix(in oklab, var(--accent) 18%, white);
  color: var(--accent); border: none;
}
.cd-min-score { display: flex; align-items: center; gap: 8px; }
.cd-range { width: 100px; accent-color: var(--accent); }
.cd-divider-v { width: 1px; height: 18px; background: var(--border); }
.cd-search-wrap {
  display: flex; align-items: center; gap: 6px;
  padding: 0 10px; height: 28px; width: 200px;
  background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px;
}
.cd-search {
  flex: 1; background: transparent; border: none; outline: none;
  font-size: 12px; color: var(--text); font-family: inherit;
}

.cd-src-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 0 2px; }
.cd-src-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; letter-spacing: -0.01em; flex-shrink: 0;
}
.cd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 1100px) { .cd-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) { .cd-grid { grid-template-columns: 1fr; } }

.cd-empty {
  padding: 60px 20px; text-align: center;
  background: var(--panel); border: 1px dashed var(--border);
  border-radius: 12px;
  display: flex; flex-direction: column; align-items: center;
}

.cd-sticky {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  z-index: 60;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 999px; padding: 8px 8px 8px 18px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 20px 60px -16px rgba(15,23,42,0.25), 0 4px 12px -4px rgba(15,23,42,0.1);
}
.cd-sticky-count { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 500; }
.cd-sticky-badge {
  width: 22px; height: 22px; border-radius: 999px;
  background: var(--accent); color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600;
}
.cd-sticky-avg { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--muted); }

.cd-bar-enter-active, .cd-bar-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(.4,.0,.2,1);
}
.cd-bar-enter-from, .cd-bar-leave-to { opacity: 0; transform: translate(-50%, 20px); }

/* ───── Pick (Tanlash) loading overlay ───── */
.cd-pick-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--bg) 70%, transparent);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  padding: 24px;
}
.cd-pick-fade-enter-active, .cd-pick-fade-leave-active {
  transition: opacity 0.25s ease;
}
.cd-pick-fade-enter-from, .cd-pick-fade-leave-to { opacity: 0; }
.cd-pick-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 420px;
  padding: 36px 30px 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--accent) 0%, #6E56CF 100%);
  color: white;
  box-shadow:
    0 30px 80px -20px color-mix(in oklab, var(--accent) 60%, transparent),
    0 10px 30px -10px rgba(15,23,42,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.cd-pick-orb {
  position: absolute;
  width: 280px; height: 280px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%);
  top: -120px; left: -100px;
  filter: blur(20px);
  pointer-events: none;
  animation: cd-pick-orb 6s ease-in-out infinite;
}
.cd-pick-orb-2 {
  top: auto; bottom: -120px;
  left: auto; right: -80px;
  background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%);
  animation-delay: -3s;
}
@keyframes cd-pick-orb {
  0%, 100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(20px,-15px) scale(1.1); }
}
.cd-pick-icon {
  position: relative;
  width: 48px; height: 48px;
  margin-bottom: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cd-pick-spark {
  position: absolute;
  color: white;
  animation: cd-pick-spark-pulse 1.6s ease-in-out infinite;
}
@keyframes cd-pick-spin { to { transform: rotate(360deg); } }
@keyframes cd-pick-spark-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.18); }
}
.cd-pick-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  position: relative;
}
.cd-pick-sub {
  margin: 0 0 22px;
  font-size: 12.5px;
  font-weight: 500;
  opacity: 0.85;
  line-height: 1.5;
  max-width: 280px;
  position: relative;
}
.cd-pick-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px 16px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
}
.cd-pick-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.55);
  transition: color 0.3s;
  text-align: left;
}
.cd-pick-step.active { color: white; }
.cd-pick-step-dot {
  width: 18px; height: 18px;
  border-radius: 999px;
  background: rgba(255,255,255,0.15);
  border: 1.5px solid rgba(255,255,255,0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--accent);
  transition: background 0.3s, border-color 0.3s;
}
.cd-pick-step.active .cd-pick-step-dot {
  background: white;
  border-color: white;
}
.cd-pick-step-pulse {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: var(--accent);
  animation: cd-pick-pulse 1s ease-in-out infinite;
}
@keyframes cd-pick-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.6); opacity: 0.4; }
}
</style>
