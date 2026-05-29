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

    <!-- Empty -->
    <AppPanel v-else-if="!posts.length" :padding="44">
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
            <td style="padding:10px 14px;vertical-align:middle;">
              <div style="display:flex;gap:4px;">
                <span v-for="l in ['uz','ru','en']" :key="l"
                  class="cp-lang-chip cp-lang-chip-btn"
                  :class="langChipState(p, l)"
                  :title="langChipTitle(p, l)"
                  @click.stop="goEdit(p, l)">
                  {{ l.toUpperCase() }}
                </span>
              </div>
            </td>
            <td style="padding:10px 14px;vertical-align:middle;color:var(--muted);">{{ publishLabel(p) }}</td>
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
import { ref, computed, onMounted } from 'vue'
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

async function loadAll() {
  loading.value = true
  try {
    const cs = await companiesApi.getMy().catch(() => [])
    const list = Array.isArray(cs) ? cs : [cs].filter(Boolean)
    company.value = list[0] || null
    if (!company.value) { posts.value = []; return }
    const data = await postsApi.list(company.value.id)
    posts.value = data || []
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

const filterTabs = computed(() => [
  { value: 'published', label: tt('posts.filter.published'), count: posts.value.filter(p => p.status === 'published').length },
  { value: 'scheduled', label: tt('posts.filter.scheduled'), count: posts.value.filter(p => p.status === 'scheduled').length },
  { value: 'draft',     label: tt('posts.filter.draft'),     count: posts.value.filter(p => p.status === 'draft').length },
  { value: 'all',       label: tt('posts.filter.all'),       count: posts.value.length },
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return posts.value.filter(p => {
    if (filter.value !== 'all' && p.status !== filter.value) return false
    if (q && !titleOf(p).toLowerCase().includes(q)) return false
    return true
  })
})

const headers = computed(() => [
  { key: 'title',    label: tt('posts.col.title') },
  { key: 'platform', label: tt('posts.col.platform') },
  { key: 'langs',    label: tt('posts.col.langs') },
  { key: 'time',     label: tt('posts.col.publishAt') },
  { key: 'status',   label: tt('posts.col.status') },
  { key: 'actions',  label: '' },
])

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
    posts.value = posts.value.filter(x => x.id !== p.id)
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
</style>
