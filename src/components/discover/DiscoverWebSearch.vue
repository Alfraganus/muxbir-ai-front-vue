<template>
  <div class="dws-root">
    <!-- Sarlavha -->
    <div class="dws-head">
      <span class="dws-head-ic"><AppIcon name="Search" :size="14"/></span>
      <div>
        <div class="dws-title">{{ tt('discoverWebSearch.title') }}</div>
        <div class="dws-sub">
          {{ tt('discoverWebSearch.subtitle') }}
        </div>
      </div>
    </div>

    <!-- Qidiruv paneli -->
    <form class="dws-bar" @submit.prevent="runSearch">
      <div class="dws-input-wrap dws-input-query">
        <AppIcon name="Search" :size="14" :style="{ color: 'var(--muted)', flexShrink: 0 }"/>
        <input
          v-model="query"
          class="dws-input"
          :placeholder="tt('discoverWebSearch.queryPlaceholder')"
          :disabled="searching"/>
      </div>
      <select v-model="timeRange" class="dws-select" :disabled="searching">
        <option value="24h">{{ tt('discoverWebSearch.range24h') }}</option>
        <option value="3d">{{ tt('discoverWebSearch.range3d') }}</option>
        <option value="7d">{{ tt('discoverWebSearch.range7d') }}</option>
        <option value="30d">{{ tt('discoverWebSearch.range30d') }}</option>
      </select>
      <select v-model="lang" class="dws-select dws-select-lang" :disabled="searching">
        <option value="uz">{{ tt('discoverWebSearch.langUz') }}</option>
        <option value="ru">{{ tt('discoverWebSearch.langRu') }}</option>
        <option value="en">{{ tt('discoverWebSearch.langEn') }}</option>
      </select>
      <AppButton variant="primary" size="md" :disabled="searching || query.trim().length < 2" @click="runSearch">
        <template #icon>
          <span v-if="searching" class="dws-spinner"/>
          <AppIcon v-else name="Search" :size="13"/>
        </template>
        {{ searching ? tt('discoverWebSearch.searching') : tt('discoverWebSearch.searchBtn') }}
      </AppButton>
    </form>

    <!-- Manba tanlash -->
    <div class="dws-src-panel">
      <div class="dws-src-modes">
        <button type="button" class="dws-mode" :class="{ active: sourceMode === 'web' }"
                :disabled="searching" @click="sourceMode = 'web'">
          <AppIcon name="Globe" :size="12"/>
          {{ tt('discoverWebSearch.wholeInternet') }}
        </button>
        <button type="button" class="dws-mode" :class="{ active: sourceMode === 'picked' }"
                :disabled="searching" @click="sourceMode = 'picked'">
          <AppIcon name="Layers" :size="12"/>
          {{ tt('discoverWebSearch.pickedSources') }}
          <span v-if="pickedCount" class="dws-mode-count">{{ pickedCount }}</span>
        </button>
      </div>

      <div v-if="sourceMode === 'picked'" class="dws-src-body">
        <!-- Kanal manbalari (checkbox) -->
        <div v-if="selectableSources.length" class="dws-src-grid">
          <label v-for="s in selectableSources" :key="s.key" class="dws-src-check"
                 :class="{ on: checkedKeys.includes(s.key) }">
            <input type="checkbox" v-model="checkedKeys" :value="s.key" :disabled="searching"/>
            <AppIcon :name="s.type === 'telegram' ? 'Telegram' : 'Globe'" :size="12"
                     :style="{ color: s.type === 'telegram' ? '#2AABEE' : 'var(--accent)', flexShrink: 0 }"/>
            <span class="dws-src-check-name">{{ s.name }}</span>
            <span class="dws-src-check-dom mono">{{ s.domain }}</span>
          </label>
        </div>
        <div v-else class="dws-src-none">
          {{ tt('discoverWebSearch.noSources') }}
        </div>

        <!-- Qo'lda manba qo'shish -->
        <div class="dws-custom-row">
          <input
            v-model="customInput"
            class="dws-custom-input"
            :placeholder="tt('discoverWebSearch.customPlaceholder')"
            :disabled="searching"
            @keydown.enter.prevent="addCustom"/>
          <AppButton variant="secondary" size="sm" :disabled="searching || !customInput.trim()" @click="addCustom">
            <template #icon><AppIcon name="Plus" :size="11"/></template>
            {{ tt('discoverWebSearch.addBtn') }}
          </AppButton>
        </div>
        <div v-if="customDomains.length" class="dws-custom-chips">
          <span v-for="d in customDomains" :key="d" class="dws-custom-chip">
            <span class="mono">{{ d }}</span>
            <button type="button" class="dws-custom-chip-x" :disabled="searching" @click="removeCustom(d)">
              <AppIcon name="Close" :size="9"/>
            </button>
          </span>
        </div>
      </div>
    </div>

    <!-- Xato -->
    <div v-if="error" class="dws-error">{{ error }}</div>

    <!-- Natijalar -->
    <div v-if="searched && !searching" class="dws-results">
      <div v-if="!items.length" class="dws-empty">
        {{ tt('discoverWebSearch.emptyResults') }}
      </div>
      <template v-else>
        <div class="dws-results-count">{{ tt('discoverWebSearch.resultsCount', { n: items.length }) }}</div>
        <div v-for="(it, i) in items" :key="i" class="dws-item">
          <div class="dws-item-body">
            <div class="dws-item-title">{{ it.title }}</div>
            <div class="dws-item-meta">
              <span v-if="it.source_name" class="dws-item-src">
                <AppIcon name="Globe" :size="10"/>
                {{ it.source_name }}
              </span>
              <span v-if="it.posted_at" class="dws-item-date">{{ formatDate(it.posted_at) }}</span>
            </div>
          </div>
          <div class="dws-item-actions">
            <AppButton variant="secondary" size="sm"
                       :disabled="resolvingIdx !== null"
                       @click="openOriginal(it, i)">
              <template #icon>
                <span v-if="resolvingIdx === i && resolvingAction === 'open'" class="dws-spinner dws-spinner-dark"/>
                <AppIcon v-else name="Arrow" :size="11"/>
              </template>
              {{ tt('discoverWebSearch.openBtn') }}
            </AppButton>
            <AppButton variant="primary" size="sm"
                       :disabled="resolvingIdx !== null"
                       @click="writeArticle(it, i)">
              <template #icon>
                <span v-if="resolvingIdx === i && resolvingAction === 'write'" class="dws-spinner"/>
                <AppIcon v-else name="Sparkle" :size="11"/>
              </template>
              {{ tt('discoverWebSearch.writeArticleBtn') }}
            </AppButton>
          </div>
        </div>
      </template>
    </div>

    <!-- AI maqola modal -->
    <AppModal v-model="showWriteModal"
              :title="tt('discoverWebSearch.modalTitle')"
              :subtitle="tt('discoverWebSearch.modalSubtitle')"
              width="600px">
      <ArticleFromUrlForm
        v-if="showWriteModal"
        :initial-url="pickedUrl"
        @created="onArticleCreated"
        @goto="(p) => { showWriteModal = false; $router.push(p) }"
      />
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ArticleFromUrlForm from '@/components/posts/ArticleFromUrlForm.vue'
import { discoverApi } from '@/api/discover.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  companyId: { type: String, default: null },
  /** Kanalga biriktirilgan manbalar ro'yxati (ClientDiscover'dagi availableSources) */
  sources: { type: Array, default: () => [] },
})

const router = useRouter()

const query = ref('')
const timeRange = ref('7d')
const lang = ref('uz')

// Kanal manbalari — website domen sifatida, telegram esa t.me/s/<kanal>
// prefiksi sifatida qidiriladi (Google site: operatori path prefiksini biladi).
const selectableSources = computed(() =>
  (props.sources || [])
    .filter(s => s.username)
    .map(s => ({
      key: s.id,
      type: s.type === 'telegram' ? 'telegram' : 'website',
      name: s.name || s.username,
      domain: s.type === 'telegram' ? `t.me/s/${s.username}` : s.username,
    }))
)

// 'web' — butun internet; 'picked' — checkbox bilan tanlangan manbalar
const sourceMode = ref('web')
const checkedKeys = ref([])
const customInput = ref('')
const customDomains = ref([])

// Manbalar ro'yxati o'zgarsa — hammasini belgilab qo'yamiz (default: barchasi)
watch(selectableSources, (list) => {
  checkedKeys.value = list.map(s => s.key)
}, { immediate: true })

const pickedCount = computed(() =>
  checkedKeys.value.length + customDomains.value.length)

function addCustom() {
  const raw = customInput.value.trim()
  if (!raw) return
  // "https://www.bbc.com/uz?x" → "bbc.com/uz" (protokol/www/query olib tashlanadi)
  const dom = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
    .split(/[?#]/)[0].replace(/\/+$/, '')
  if (dom && !customDomains.value.includes(dom)) {
    customDomains.value = [...customDomains.value, dom]
  }
  customInput.value = ''
}
function removeCustom(d) {
  customDomains.value = customDomains.value.filter(x => x !== d)
}

const searching = ref(false)
const searched = ref(false)
const items = ref([])
const error = ref(null)

const resolvingIdx = ref(null)
const resolvingAction = ref(null) // 'open' | 'write'
const showWriteModal = ref(false)
const pickedUrl = ref('')

async function runSearch() {
  if (!props.companyId || query.value.trim().length < 2 || searching.value) return
  searching.value = true
  error.value = null
  try {
    let domains
    if (sourceMode.value === 'picked') {
      const checked = selectableSources.value
        .filter(s => checkedKeys.value.includes(s.key))
        .map(s => s.domain)
      domains = [...checked, ...customDomains.value]
    }
    const r = await discoverApi.webSearch(props.companyId, {
      query: query.value.trim(),
      domains: domains && domains.length ? domains : undefined,
      time_range: timeRange.value,
      lang: lang.value,
      limit: 20,
    })
    items.value = r?.items || []
    searched.value = true
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || tt('discoverWebSearch.searchError')
    items.value = []
    searched.value = true
  } finally {
    searching.value = false
  }
}

/** Google redirect havolasini haqiqiy URL'ga yechadi (bir marta — keshlanadi). */
async function resolveItem(it) {
  if (it._resolvedUrl) return it._resolvedUrl
  const r = await discoverApi.webResolve(props.companyId, it.google_url)
  if (r?.url) it._resolvedUrl = r.url
  return r?.url || null
}

async function openOriginal(it, i) {
  resolvingIdx.value = i
  resolvingAction.value = 'open'
  try {
    const url = await resolveItem(it)
    if (url) window.open(url, '_blank', 'noopener')
    else error.value = tt('discoverWebSearch.openError')
  } finally {
    resolvingIdx.value = null
    resolvingAction.value = null
  }
}

async function writeArticle(it, i) {
  resolvingIdx.value = i
  resolvingAction.value = 'write'
  error.value = null
  try {
    const url = await resolveItem(it)
    if (!url) {
      error.value = tt('discoverWebSearch.resolveError')
      return
    }
    pickedUrl.value = url
    showWriteModal.value = true
  } finally {
    resolvingIdx.value = null
    resolvingAction.value = null
  }
}

function onArticleCreated(postId) {
  showWriteModal.value = false
  router.push(`/client/posts/${postId}/edit`)
}

function formatDate(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 3600) return tt('discoverWebSearch.minutesAgo', { n: Math.max(1, Math.floor(diff / 60)) })
  if (diff < 86400) return tt('discoverWebSearch.hoursAgo', { n: Math.floor(diff / 3600) })
  if (diff < 86400 * 7) return tt('discoverWebSearch.daysAgo', { n: Math.floor(diff / 86400) })
  return d.toLocaleDateString('uz-UZ', { dateStyle: 'medium' })
}
</script>

<style scoped>
.dws-root {
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.dws-head { display: flex; align-items: flex-start; gap: 10px; }
.dws-head-ic {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: color-mix(in oklab, var(--accent) 14%, transparent);
  color: var(--accent);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dws-title { font-size: 13px; font-weight: 700; color: var(--text); }
.dws-sub { font-size: 11px; color: var(--muted); margin-top: 2px; line-height: 1.4; }

.dws-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: stretch; }
.dws-input-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px; height: 38px;
  background: var(--bg);
  border: 1px solid var(--border-2);
  border-radius: 9px;
  transition: border-color .15s, box-shadow .15s;
}
.dws-input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 12%, transparent);
}
.dws-input-query { flex: 2; min-width: 220px; }

/* ─── Manba tanlash paneli ─── */
.dws-src-panel {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px;
  background: var(--bg);
  border: 1px solid var(--border-2);
  border-radius: 10px;
}
.dws-src-modes { display: flex; gap: 6px; }
.dws-mode {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 12px;
  background: var(--panel); border: 1px solid var(--border-2);
  border-radius: 8px; font-size: 12px; font-weight: 600;
  color: var(--text-2); cursor: pointer; font-family: inherit;
  transition: all .12s;
}
.dws-mode:hover:not(:disabled) { border-color: color-mix(in oklab, var(--accent) 30%, var(--border-2)); }
.dws-mode.active {
  background: var(--accent-bg, color-mix(in oklab, var(--accent) 10%, transparent));
  border-color: color-mix(in oklab, var(--accent) 35%, transparent);
  color: var(--accent);
}
.dws-mode-count {
  min-width: 17px; height: 17px; padding: 0 5px;
  border-radius: 999px; background: var(--accent); color: #fff;
  font-size: 10px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
}
.dws-src-body { display: flex; flex-direction: column; gap: 10px; }
.dws-src-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
}
.dws-src-check {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 10px;
  border: 1px solid var(--border-2); border-radius: 8px;
  background: var(--panel); cursor: pointer;
  transition: border-color .12s, background .12s;
  min-width: 0;
}
.dws-src-check:hover { border-color: color-mix(in oklab, var(--accent) 30%, var(--border-2)); }
.dws-src-check.on {
  border-color: color-mix(in oklab, var(--accent) 40%, transparent);
  background: color-mix(in oklab, var(--accent) 5%, var(--panel));
}
.dws-src-check input[type="checkbox"] {
  width: 14px; height: 14px; margin: 0;
  accent-color: var(--accent); cursor: pointer; flex-shrink: 0;
}
.dws-src-check-name {
  font-size: 12px; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dws-src-check-dom {
  font-size: 10.5px; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-left: auto; flex-shrink: 1; min-width: 0;
}
.dws-src-none { font-size: 12px; color: var(--muted); }
.dws-custom-row { display: flex; gap: 8px; align-items: center; }
.dws-custom-input {
  flex: 1; height: 32px; padding: 0 11px;
  background: var(--panel); border: 1px solid var(--border-2);
  border-radius: 8px; font-size: 12.5px; color: var(--text);
  font-family: inherit; outline: none;
  transition: border-color .15s;
}
.dws-custom-input:focus { border-color: var(--accent); }
.dws-custom-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.dws-custom-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 24px; padding: 0 6px 0 9px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in oklab, var(--accent) 25%, transparent);
  color: var(--accent); font-size: 11px; font-weight: 600;
}
.dws-custom-chip-x {
  width: 15px; height: 15px; border-radius: 999px;
  border: none; background: color-mix(in oklab, var(--accent) 18%, transparent);
  color: var(--accent); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0;
}
.dws-custom-chip-x:hover { background: var(--accent); color: #fff; }
.dws-input {
  flex: 1; background: transparent; border: none; outline: none;
  font-size: 13px; color: var(--text); font-family: inherit;
}
.dws-select {
  height: 38px; padding: 0 10px;
  background: var(--bg); border: 1px solid var(--border-2);
  border-radius: 9px; font-size: 12.5px; color: var(--text);
  font-family: inherit; cursor: pointer;
}
.dws-select-lang { min-width: 105px; }

.dws-error {
  padding: 10px 12px; border-radius: 8px;
  background: rgba(239,68,68,.07); border: 1px solid rgba(239,68,68,.25);
  color: #ef4444; font-size: 12.5px;
}

.dws-results { display: flex; flex-direction: column; gap: 8px; }
.dws-results-count {
  font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: .05em;
}
.dws-empty {
  padding: 26px 16px; text-align: center;
  border: 1px dashed var(--border-2); border-radius: 10px;
  font-size: 12.5px; color: var(--muted);
}
.dws-item {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border-2); border-radius: 10px;
  background: var(--bg);
  transition: border-color .12s, background .12s;
}
.dws-item:hover {
  border-color: color-mix(in oklab, var(--accent) 30%, var(--border-2));
  background: color-mix(in oklab, var(--accent) 3%, var(--bg));
}
.dws-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.dws-item-title {
  font-size: 13.5px; font-weight: 600; color: var(--text);
  line-height: 1.4; letter-spacing: -0.005em;
}
.dws-item-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dws-item-src {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: var(--accent);
}
.dws-item-date { font-size: 11px; color: var(--muted); }
.dws-item-actions { display: flex; gap: 7px; flex-shrink: 0; }

.dws-spinner {
  width: 12px; height: 12px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  animation: dwsSpin 0.8s linear infinite;
  display: inline-block;
}
.dws-spinner-dark {
  border-color: color-mix(in oklab, var(--text) 25%, transparent);
  border-top-color: var(--text);
}
@keyframes dwsSpin { to { transform: rotate(360deg); } }

@media (max-width: 720px) {
  .dws-bar { flex-direction: column; }
  .dws-input-query { min-width: 0; }
  .dws-src-grid { grid-template-columns: 1fr; }
  .dws-item { flex-direction: column; align-items: stretch; }
  .dws-item-actions { justify-content: flex-end; }
}
</style>
