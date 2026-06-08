<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="tt('posts.title')" :subtitle="tt('posts.subtitle')">
      <template #right>
        <AppButton variant="secondary" size="md" @click="loadAll" :loading="loading">
          {{ tt('cc.refresh') }}
        </AppButton>
        <AppButton variant="secondary" size="md" @click="showFromUrl = true">
          <template #icon><AppIcon name="Globe2" :size="13"/></template>
          Havoladan maqola
        </AppButton>
        <AppButton variant="primary" size="md" @click="$router.push('/client/posts/new')">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('posts.new') }}
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <AppTabs v-model="filter" :items="filterTabs"/>
      <div style="flex:1;"/>
      <AppInput v-model="query" :placeholder="tt('posts.search')" :style="{ width: '260px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}"/></template>
      </AppInput>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;padding:60px 0;color:var(--muted);font-size:13px;gap:10px;">
      <span class="cp-spinner"/>
      {{ tt('cc.loading') }}
    </div>

    <!-- Empty (umuman post yo'q) -->
    <AppPanel v-else-if="!counts.all" :padding="44">
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;">
        <span style="width:56px;height:56px;border-radius:14px;background:var(--accent-bg);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;">
          <AppIcon name="Send" :size="26"/>
        </span>
        <div>
          <div style="font-size:15px;font-weight:600;margin-bottom:4px;">{{ tt('posts.empty.title') }}</div>
          <div style="font-size:12.5px;color:var(--muted);max-width:380px;">{{ tt('posts.empty.sub') }}</div>
        </div>
        <AppButton variant="primary" size="md" @click="$router.push('/client/posts/new')">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('posts.empty.cta') }}
        </AppButton>
      </div>
    </AppPanel>

    <!-- Empty filter -->
    <AppPanel v-else-if="!filtered.length" :padding="32">
      <div style="text-align:center;color:var(--muted);font-size:13px;">
        {{ tt('cc.empty.filtered') }}
      </div>
    </AppPanel>

    <!-- Table -->
    <AppPanel v-else :padding="0">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th v-for="h in headers" :key="h.key"
              :style="{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }">
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in filtered" :key="p.id"
            :style="{ borderTop: i===0 ? 'none' : '1px solid var(--border-2)', cursor: 'pointer' }"
            @click="goEdit(p)">
            <td style="padding:12px 14px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span v-if="p.cover_image_url" class="cp-post-cover" :style="{ backgroundImage: `url(${p.cover_image_url})` }"/>
                <span v-else class="cp-post-cover empty"><AppIcon name="Send" :size="13"/></span>
                <div style="display:flex;flex-direction:column;min-width:0;">
                  <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;">
                    {{ titleOf(p) }}
                  </span>
                  <span v-if="p.category" style="font-size:11px;color:var(--muted);">{{ p.category }}</span>
                </div>
              </div>
            </td>
            <td style="padding:10px 14px;vertical-align:middle;">
              <span class="cp-platform-pill" :style="{ color: platformColor(p.platform), background: platformColor(p.platform) + '14' }">
                {{ tt('pe.platform.' + p.platform) }}
              </span>
            </td>

            <!-- Manba (qaerdan olingan: qalampir.uz, daryo.uz, t.me/...) -->
            <td style="padding:10px 14px;vertical-align:middle;" @click.stop>
              <a v-if="p.ai_source_url"
                 :href="p.ai_source_url"
                 target="_blank"
                 rel="noopener"
                 class="cp-source-chip"
                 :title="p.ai_source_url">
                <img v-if="sourceHostOf(p)" :src="faviconUrl(sourceHostOf(p))" alt="" class="cp-source-fav"/>
                <span class="cp-source-text">{{ sourceHostOf(p) || tt('posts.col.source.unknown') || 'manba' }}</span>
              </a>
              <span v-else class="cp-source-empty">—</span>
            </td>

            <!-- Asl manba (matn ichidagi tashqi link: dxx.uz, original sayt) -->
            <td style="padding:10px 14px;vertical-align:middle;" @click.stop>
              <a v-if="p.original_source_url"
                 :href="p.original_source_url"
                 target="_blank"
                 rel="noopener"
                 class="cp-source-chip cp-source-original"
                 :title="p.original_source_url">
                <img v-if="hostOf(p.original_source_url)" :src="faviconUrl(hostOf(p.original_source_url))" alt="" class="cp-source-fav"/>
                <span class="cp-source-text">{{ hostOf(p.original_source_url) }}</span>
              </a>
              <span v-else class="cp-source-empty">—</span>
            </td>

            <td style="padding:10px 14px;vertical-align:middle;">
              <div style="display:flex;gap:4px;">
                <span v-for="l in ['uz','uz_cyr','ru','en']" :key="l"
                  class="cp-lang-chip cp-lang-chip-btn"
                  :class="langChipState(p, l)"
                  :title="langChipTitle(p, l)"
                  @click.stop="goEdit(p, l)">
                  {{ langChipCode(l) }}
                </span>
              </div>
            </td>
            <td style="padding:10px 14px;vertical-align:middle;color:var(--muted);">{{ publishLabel(p) }}</td>
            <td style="padding:10px 14px;vertical-align:middle;">
              <span v-if="fmtViews(p.view_count)" class="cp-views"
                :title="p.views_updated_at ? `Oxirgi yangilanish: ${publishLabel({ publish_at: p.views_updated_at })}` : 'Ko\'rishlar (kuniga 2 marta yangilanadi)'">
                <AppIcon name="Eye" :size="12"/>
                <span class="tabular">{{ fmtViews(p.view_count) }}</span>
              </span>
              <span v-else style="color:var(--muted);font-size:12px;">—</span>
            </td>
            <td style="padding:10px 14px;vertical-align:middle;" @click.stop>
              <span class="cp-status-pill" :class="`tone-${statusTone(p.status)}`" :title="tt('pe.field.statusHint')">
                <span class="cp-status-dot"/>
                <select :value="p.status" class="cp-status-select" @change="onStatusChange(p, $event.target.value)">
                  <option value="draft">{{ tt('posts.status.draft') }}</option>
                  <option value="scheduled">{{ tt('posts.status.scheduled') }}</option>
                  <option value="published">{{ tt('posts.status.published') }}</option>
                  <option value="failed">{{ tt('posts.status.failed') }}</option>
                </select>
                <AppIcon name="ChevronL" :size="9" class="cp-status-chev"/>
              </span>
            </td>
            <td style="padding:10px 14px;vertical-align:middle;text-align:right;white-space:nowrap;" @click.stop>
              <AppButton v-if="p.status !== 'draft'" variant="ghost" size="sm" @click="onStatusChange(p, 'draft')" :title="tt('posts.action.toDraft')">
                <template #icon><AppIcon name="Edit" :size="12"/></template>
              </AppButton>
              <AppButton variant="ghost" size="sm" @click="removePost(p)">
                <template #icon><AppIcon name="Trash" :size="12"/></template>
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginatsiya -->
      <div v-if="total > 0" class="cp-pagination">
        <span class="cp-pag-info">{{ rangeStart }}–{{ rangeEnd }} / {{ total }}</span>
        <div class="cp-pag-btns">
          <button class="cp-pag-btn" :disabled="page === 0 || loading" @click="goToPage(page - 1)">
            <AppIcon name="ChevronL" :size="12"/>
            <span>Oldingi</span>
          </button>
          <span class="cp-pag-page">{{ page + 1 }} / {{ totalPages }}</span>
          <button class="cp-pag-btn" :disabled="page >= totalPages - 1 || loading" @click="goToPage(page + 1)">
            <span>Keyingi</span>
            <AppIcon name="ChevronL" :size="12" :style="{ transform: 'rotate(180deg)' }"/>
          </button>
        </div>
      </div>
    </AppPanel>
    <!-- Havoladan maqola modal -->
    <AppModal v-model="showFromUrl"
              title="Havoladan maqola yozish"
              subtitle="URL → AI → tahrir uchun editor"
              width="600px">
      <ArticleFromUrlForm
        @created="onArticleCreated"
        @goto="(p) => { showFromUrl = false; router.push(p) }"
      />
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ArticleFromUrlForm from '@/components/posts/ArticleFromUrlForm.vue'
import { useAppStore } from '@/stores/app.js'
import { companiesApi } from '@/api/companies.js'
import { postsApi } from '@/api/posts.js'

const router = useRouter()
const showFromUrl = ref(false)

function onArticleCreated(postId) {
  showFromUrl.value = false
  router.push(`/client/posts/${postId}/edit`)
}
const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const loading = ref(true)
const company = ref(null)
const posts = ref([])
const filter = ref('published')
const query = ref('')

// ── Paginatsiya (server-side, offset orqali) ──────────────────
const PAGE_SIZE = 20
const page = ref(0)        // 0-based
const total = ref(0)       // joriy filtr/qidiruvga mos jami post soni
const counts = ref({ all: 0, published: 0, scheduled: 0, draft: 0, failed: 0 })
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const rangeStart = computed(() => (total.value === 0 ? 0 : page.value * PAGE_SIZE + 1))
const rangeEnd = computed(() => Math.min((page.value + 1) * PAGE_SIZE, total.value))

async function loadPosts() {
  if (!company.value) { posts.value = []; total.value = 0; return }
  loading.value = true
  try {
    const res = await postsApi.list(company.value.id, {
      status: filter.value === 'all' ? undefined : filter.value,
      q: query.value.trim() || undefined,
      limit: PAGE_SIZE,
      offset: page.value * PAGE_SIZE,
    })
    posts.value = res?.items || []
    total.value = res?.total || 0
    counts.value = res?.counts || { all: 0, published: 0, scheduled: 0, draft: 0, failed: 0 }
  } catch {
    posts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadAll() {
  loading.value = true
  try {
    const cs = await companiesApi.getMy().catch(() => [])
    const list = Array.isArray(cs) ? cs : [cs].filter(Boolean)
    company.value = list[0] || null
  } catch {
    company.value = null
  }
  if (!company.value) {
    posts.value = []
    total.value = 0
    loading.value = false
    return
  }
  await loadPosts() // loading'ni o'zi false qiladi
}

onMounted(loadAll)

// Filtr yoki qidiruv o'zgarsa — birinchi sahifaga qaytib qayta yuklaymiz.
// Qidiruvni biroz kechiktiramiz (debounce) — har bosishda so'rov ketmasin.
let searchTimer = null
watch(filter, () => { page.value = 0; loadPosts() })
watch(query, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 0; loadPosts() }, 350)
})

function goToPage(n) {
  const target = Math.min(Math.max(0, n), totalPages.value - 1)
  if (target === page.value) return
  page.value = target
  loadPosts()
}

const filterTabs = computed(() => [
  { value: 'published', label: tt('posts.filter.published'), count: counts.value.published || 0 },
  { value: 'scheduled', label: tt('posts.filter.scheduled'), count: counts.value.scheduled || 0 },
  { value: 'draft',     label: tt('posts.filter.draft'),     count: counts.value.draft || 0 },
  { value: 'all',       label: tt('posts.filter.all'),       count: counts.value.all || 0 },
])

// Server allaqachon filtr/qidiruvni qo'llaydi — shu sahifa postlarini ko'rsatamiz
const filtered = computed(() => posts.value)

const headers = computed(() => [
  { key: 'title',    label: tt('posts.col.title') },
  { key: 'platform', label: tt('posts.col.platform') },
  { key: 'source',   label: 'Manba' },
  { key: 'original', label: 'Asl manba' },
  { key: 'langs',    label: tt('posts.col.langs') },
  { key: 'time',     label: tt('posts.col.publishAt') },
  { key: 'views',    label: 'Ko\'rishlar' },
  { key: 'status',   label: tt('posts.col.status') },
  { key: 'actions',  label: '' },
])

/** View sonini ixcham formatlaydi: 1234 → "1.2K", 277000 → "277K". */
function fmtViews(n) {
  const v = Number(n) || 0
  if (v <= 0) return null
  if (v < 1000) return String(v)
  if (v < 1e6) return (v / 1e3).toFixed(v < 1e4 ? 1 : 0).replace(/\.0$/, '') + 'K'
  return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
}

// Manba URL'idan host ajratish (qalampir.uz, daryo.uz, t.me)
function hostOf(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase()
  } catch { return '' }
}
function faviconUrl(host) {
  if (!host) return ''
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(host)}`
}
function sourceHostOf(p) {
  // ai_source_slug ustunlik beradi (manba nomi: 'kunuz', 'daryo')
  // lekin host (qalampir.uz) ko'rsatkichi ko'proq foydali — URL bo'lsa undan olamiz.
  return hostOf(p.ai_source_url) || (p.ai_source_slug || '')
}

// ── Helpers ────────────────────────────────────────────────
function titleOf(p) {
  // Tanlangan tilning sarlavhasini ko'rsatamiz (fallback yo'q —
  // agar bo'sh bo'lsa, foydalanuvchi shu tilda hali to'ldirmagan).
  const tr = p.translations?.find(t => t.lang === store.lang)
  if (tr?.title) return tr.title
  // Hech qaysi tilda title bo'lmagan post — joker
  const any = p.translations?.find(t => t.title)
  if (!any) return '— ' + tt('pe.lang.notFilled')
  return '— ' + tt('pe.lang.notFilled') + ' (' + store.lang.toUpperCase() + ')'
}

function langChipState(p, l) {
  const tr = p.translations?.find(x => x.lang === l)
  if (!tr) return 'empty'
  if (tr.is_complete) return 'complete'
  return 'draft'
}
function langChipTitle(p, l) {
  const tr = p.translations?.find(x => x.lang === l)
  if (!tr) return tt('pe.lang.notFilled')
  return tr.is_complete ? tt('pe.lang.complete') : tt('pe.lang.draft')
}
// Til chipi qisqa kodi (uz_cyr juda uzun)
const LANG_CHIP_CODE = { uz: 'UZ', uz_cyr: 'ЎЗ', ru: 'RU', en: 'EN' }
function langChipCode(l) { return LANG_CHIP_CODE[l] || (l || '').toUpperCase() }

function platformColor(slug) {
  if (slug === 'instagram') return '#E1306C'
  if (slug === 'website')   return '#64748B'
  return '#2AABEE'
}

const UZ_MONTHS = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek']
function publishLabel(p) {
  const d = p.publish_at || p.updated_at
  if (!d) return '—'
  let s = String(d).trim()
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T')
  const dt = new Date(s)
  if (isNaN(dt.getTime())) return '—'
  return `${dt.getDate().toString().padStart(2,'0')} ${UZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

function statusTone(s) {
  if (s === 'published') return 'success'
  if (s === 'scheduled') return 'accent'
  if (s === 'failed')    return 'danger'
  return 'muted'
}

function goEdit(p, lang) {
  router.push({ path: `/client/posts/${p.id}/edit`, query: lang ? { lang } : {} })
}

async function onStatusChange(p, newStatus) {
  if (!company.value || !newStatus || newStatus === p.status) return
  const prev = p.status
  p.status = newStatus // optimistic
  try {
    await postsApi.update(company.value.id, p.id, { status: newStatus })
    await loadPosts() // counts va filtr (post boshqa statusga o'tdi) yangilansin
  } catch (e) {
    p.status = prev
    const msg = e?.response?.data?.message
    alert(Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic')))
  }
}

async function removePost(p) {
  if (!confirm(tt('posts.confirmDelete', { name: titleOf(p) }))) return
  try {
    await postsApi.remove(company.value.id, p.id)
    // Sahifadagi oxirgi post o'chsa va bu birinchi sahifa bo'lmasa — oldingisiga qaytamiz
    if (posts.value.length === 1 && page.value > 0) page.value -= 1
    await loadPosts()
  } catch {}
}
</script>

<style scoped>
.cp-spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: cp-spin 0.8s linear infinite;
}
@keyframes cp-spin { to { transform: rotate(360deg); } }

/* Paginatsiya */
.cp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.cp-pag-info {
  font-size: 12px;
  color: var(--muted);
}
.cp-pag-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cp-pag-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-2);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background .12s, border-color .12s, color .12s;
}
.cp-pag-btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--panel-2);
}
.cp-pag-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.cp-pag-page {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  min-width: 56px;
  text-align: center;
}

.cp-post-cover {
  width: 38px; height: 38px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  background-color: var(--panel-2);
  flex-shrink: 0;
}
.cp-post-cover.empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.cp-views {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--success-soft, rgba(34,197,94,0.12));
  color: var(--success);
  font-size: 12px;
  font-weight: 600;
}
.cp-views :deep(svg) { opacity: 0.85; }
.cp-platform-pill {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 4px;
  text-transform: uppercase;
}

.cp-lang-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 18px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: 4px;
  border: 1px solid var(--border);
}
.cp-lang-chip.empty { color: var(--muted); background: transparent; opacity: 0.5; }
.cp-lang-chip.draft {
  color: var(--accent);
  background: color-mix(in oklab, var(--accent) 12%, transparent);
  border-color: transparent;
}
.cp-lang-chip-btn { cursor: pointer; transition: transform .12s, box-shadow .12s; }
.cp-lang-chip-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px -6px rgba(15,23,42,0.25); }
.cp-lang-chip.complete {
  color: var(--success);
  background: color-mix(in oklab, var(--success) 14%, transparent);
  border-color: transparent;
}

/* Inline status pill bilan select */
.cp-status-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 22px 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid var(--border-2);
  background: var(--panel);
  color: var(--text);
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.cp-status-pill:hover { border-color: var(--accent); }
.cp-status-dot {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: var(--muted);
  flex-shrink: 0;
}
.cp-status-pill.tone-success .cp-status-dot {
  background: var(--success);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent);
}
.cp-status-pill.tone-accent .cp-status-dot {
  background: #F59E0B;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.22);
}
.cp-status-pill.tone-danger .cp-status-dot {
  background: var(--danger);
}
.cp-status-select {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  padding: 0;
  margin: 0;
  font-weight: 600;
}
.cp-status-chev {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  opacity: 0.55;
  pointer-events: none;
}

/* Manba / Asl manba — favicon + host chip */
.cp-source-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 9px 0 6px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text);
  background: var(--panel-2, rgba(99, 102, 241, 0.06));
  border: 1px solid var(--border-2);
  text-decoration: none;
  max-width: 160px;
  transition: border-color .15s, background .15s, transform .12s;
}
.cp-source-chip:hover {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 8%, transparent);
  transform: translateY(-1px);
}
.cp-source-original {
  background: color-mix(in oklab, #f59e0b 8%, transparent);
  border-color: color-mix(in oklab, #f59e0b 25%, transparent);
}
.cp-source-original:hover {
  border-color: #f59e0b;
  background: color-mix(in oklab, #f59e0b 14%, transparent);
}
.cp-source-fav {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  object-fit: contain;
  background: #fff;
}
.cp-source-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cp-source-empty {
  color: var(--muted);
  font-size: 12px;
  opacity: 0.5;
}
</style>
