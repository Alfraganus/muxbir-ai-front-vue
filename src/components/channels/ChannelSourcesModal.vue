<template>
  <div class="csm-overlay" @click.self="$emit('close')">
    <div class="csm-modal">
      <!-- Header -->
      <div class="csm-head">
        <div style="min-width:0;">
          <div class="csm-title">{{ tt('channelSourcesModal.title') }}</div>
          <div class="csm-sub">
            <strong>{{ channel.display_name || channel.username || tt('channelSourcesModal.channelFallback') }}</strong>
            {{ tt('channelSourcesModal.subtitle') }}
          </div>
        </div>
        <button class="csm-x" @click="$emit('close')" :aria-label="tt('channelSourcesModal.close')">✕</button>
      </div>

      <div class="csm-body">
        <!-- Manba turi -->
        <div class="csm-types">
          <button type="button" class="csm-type" :class="{ active: newType === 'telegram' }" @click="newType = 'telegram'">
            <AppIcon name="Telegram" :size="15"/>
            <span>{{ tt('channelSourcesModal.typeTelegram') }}</span>
          </button>
          <button type="button" class="csm-type" :class="{ active: newType === 'website' }" @click="newType = 'website'">
            <AppIcon name="Globe" :size="15"/>
            <span>{{ tt('channelSourcesModal.typeWebsite') }}</span>
          </button>
          <button type="button" class="csm-type csm-type-soon" disabled :title="tt('channelSourcesModal.comingSoon')">
            <AppIcon name="Facebook" :size="15"/>
            <span>Facebook</span>
            <span class="csm-soon">{{ tt('channelSourcesModal.comingSoonBadge') }}</span>
          </button>
          <button type="button" class="csm-type csm-type-soon" disabled :title="tt('channelSourcesModal.comingSoon')">
            <AppIcon name="Instagram" :size="15"/>
            <span>Instagram</span>
            <span class="csm-soon">{{ tt('channelSourcesModal.comingSoonBadge') }}</span>
          </button>
        </div>

        <!-- TG API holati (faqat telegram tur uchun) -->
        <div v-if="newType === 'telegram' && tgApi.loaded && !tgApi.is_saved" class="csm-warn">
          <span style="font-size:16px;">⚠️</span>
          <span style="flex:1;">
            {{ tt('channelSourcesModal.tgApiWarnPre') }} <strong>Telegram API</strong> {{ tt('channelSourcesModal.tgApiWarnPost') }}
          </span>
          <button class="csm-btn-accent" @click="goToTgApi">{{ tt('channelSourcesModal.tgApiBtn') }}</button>
        </div>

        <!-- Yangi manba qo'shish -->
        <form class="csm-add" @submit.prevent="addOne">
          <input
            v-model="newValue"
            type="text"
            :placeholder="newType === 'website' ? tt('channelSourcesModal.websitePlaceholder') : tt('channelSourcesModal.telegramPlaceholder')"
            :disabled="adding"
            class="csm-input"
          />
          <button type="submit" :disabled="adding || !newValue.trim() || telegramLocked" class="csm-btn-accent">
            {{ adding ? tt('channelSourcesModal.adding') : tt('channelSourcesModal.addBtn') }}
          </button>
        </form>

        <!-- Website uchun qo'shimcha sozlamalar (ixtiyoriy) -->
        <div v-if="newType === 'website'" class="csm-adv">
          <input
            v-model="newFeedUrl"
            type="text"
            :placeholder="tt('channelSourcesModal.feedUrlPlaceholder')"
            :disabled="adding"
            class="csm-input"
          />
          <label class="csm-check">
            <input type="checkbox" v-model="newAllowUndated" :disabled="adding" />
            <span>{{ tt('channelSourcesModal.allowUndatedAdd') }}</span>
          </label>
        </div>

        <!-- Manba o'zbek OAV hisoblanadimi (telegram va website uchun) -->
        <label class="csm-check">
          <input type="checkbox" v-model="newIsUzbekMedia" :disabled="adding" />
          <span>{{ tt('channelSourcesModal.uzbekMediaAdd') }}</span>
        </label>

        <div class="csm-hint">
          {{ newType === 'website'
            ? tt('channelSourcesModal.websiteHint')
            : tt('channelSourcesModal.telegramHint') }}
        </div>
        <div v-if="addError" class="csm-err">{{ addError }}</div>

        <!-- Ro'yxat (tanlangan tur bo'yicha filtrlangan) -->
        <div v-if="loading" class="csm-muted">{{ tt('channelSourcesModal.loading') }}</div>
        <div v-else-if="!sources.length" class="csm-empty">
          {{ tt('channelSourcesModal.emptyAll') }}
        </div>
        <div v-else-if="!filteredSources.length" class="csm-empty">
          {{ newType === 'website' ? tt('channelSourcesModal.emptyWebsite') : tt('channelSourcesModal.emptyTelegram') }}
          {{ tt('channelSourcesModal.emptyFilteredHint') }}
        </div>
        <div v-else class="csm-list">
          <div v-for="s in filteredSources" :key="s.id" class="csm-row">
            <div class="csm-row-main">
              <label class="csm-switch-row">
                <span class="csm-switch">
                  <input type="checkbox" :checked="s.is_active" @change="toggleActive(s)" />
                  <span class="csm-switch-track"><span class="csm-switch-thumb"/></span>
                </span>
                <span :style="{ color: s.is_active ? '#16a34a' : 'var(--muted)' }">
                  {{ tt('channelSourcesModal.useThisSource') }}
                </span>
              </label>

              <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span class="csm-type-badge" :class="s.source_type === 'website' ? 'web' : 'tg'">
                    <AppIcon :name="s.source_type === 'website' ? 'Globe' : 'Telegram'" :size="10"/>
                    {{ s.source_type === 'website' ? 'Website' : 'Telegram' }}
                  </span>
                  <a v-if="s.source_type === 'website'" :href="s.username_raw || ('https://' + s.username_normalized)" target="_blank" class="csm-handle">
                    {{ s.username_normalized }}
                  </a>
                  <a v-else :href="`https://t.me/${s.username_normalized}`" target="_blank" class="csm-handle">
                    @{{ s.username_normalized }}
                  </a>
                  <span v-if="sourceDisplayName(s) && sourceDisplayName(s) !== s.username_normalized" style="font-size:12px;color:var(--text);">— {{ sourceDisplayName(s) }}</span>
                  <span v-if="s.subscriber_count > 0" class="csm-badge">
                    {{ tt('channelSourcesModal.subscribers', { n: formatNumber(s.subscriber_count) }) }}
                  </span>
                </div>
                <div style="font-size:11px;color:var(--muted);">
                  <span v-if="s.last_scanned_at">{{ tt('channelSourcesModal.lastScan', { date: formatDate(s.last_scanned_at) }) }}</span>
                  <span v-else>{{ tt('channelSourcesModal.notScanned') }}</span>
                  <span v-if="s.last_error" style="color:#ef4444;margin-left:6px;">· ⚠ {{ s.last_error }}</span>
                </div>
                <label v-if="s.source_type === 'website'" class="csm-check csm-check-sm">
                  <input type="checkbox" :checked="s.allow_undated" @change="toggleUndated(s)" />
                  <span>{{ tt('channelSourcesModal.allowUndated') }}</span>
                </label>
                <label class="csm-check csm-check-sm">
                  <input type="checkbox" :checked="s.is_uzbek_media" @change="toggleUzbekMedia(s)" />
                  <span>{{ tt('channelSourcesModal.uzbekMedia') }}</span>
                </label>
              </div>

              <button @click="toggleEditNames(s)" class="csm-btn-ghost" :title="tt('channelSourcesModal.editNames')">
                <AppIcon name="Edit" :size="12"/>
              </button>
              <button @click="scanOne(s)" :disabled="scanningId === s.id" class="csm-btn-ghost" :title="tt('channelSourcesModal.scanNow')">
                {{ scanningId === s.id ? '…' : tt('channelSourcesModal.scanBtn') }}
              </button>
              <button @click="remove(s)" class="csm-btn-danger" :title="tt('channelSourcesModal.removeBtn')">{{ tt('channelSourcesModal.removeBtn') }}</button>
            </div>

            <div v-if="editingNamesId === s.id" class="csm-names-edit">
              <div class="csm-names-hint">{{ tt('channelSourcesModal.namesHint') }}</div>
              <div class="csm-names-grid">
                <div v-for="f in NAME_LANG_FIELDS" :key="f.key" class="csm-name-field">
                  <label class="csm-name-label">{{ f.label }}</label>
                  <input type="text" v-model="nameDraft[f.key]" class="csm-input" :placeholder="f.label"/>
                </div>
              </div>
              <div v-if="nameEditError" class="csm-err">{{ nameEditError }}</div>
              <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button type="button" class="csm-btn-ghost" @click="cancelEditNames">{{ tt('channelSourcesModal.namesCancel') }}</button>
                <button type="button" class="csm-btn-accent" :disabled="savingNames" @click="saveNames(s)">
                  {{ savingNames ? tt('channelSourcesModal.namesSaving') : tt('channelSourcesModal.namesSave') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { channelsApi } from '@/api/channels.js'
import { companiesApi } from '@/api/companies.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  companyId: { type: [String, Number], required: true },
  channel: { type: Object, required: true },
})
defineEmits(['close'])

const router = useRouter()
const loading = ref(true)
const adding = ref(false)
const addError = ref(null)
const newType = ref('telegram')   // 'telegram' | 'website'
const newValue = ref('')
const newFeedUrl = ref('')        // website: ixtiyoriy RSS feed URL
const newAllowUndated = ref(false) // website: sanasiz postlarga ruxsat
const newIsUzbekMedia = ref(false) // telegram/website: manba o'zbek OAV hisoblanadimi
const sources = ref([])
const scanningId = ref(null)
const tgApi = reactive({ loaded: false, is_saved: false })

// ── Manba nomini tilga qarab tahrirlash (display_names: uz/uz_cyr/ru/en) ──
const editingNamesId = ref(null)
const nameDraft = reactive({ uz: '', uz_cyr: '', ru: '', en: '' })
const savingNames = ref(false)
const nameEditError = ref(null)
const NAME_LANG_FIELDS = computed(() => [
  { key: 'uz', label: tt('cc.lang.uzLat') },
  { key: 'uz_cyr', label: tt('cc.lang.uzCyr') },
  { key: 'ru', label: tt('cc.lang.ru') },
  { key: 'en', label: tt('cc.lang.en') },
])

/** Ro'yxatda ko'rsatiladigan manba nomi — joriy UI tiliga qarab (uz/ru/en), bo'lmasa fallback. */
function sourceDisplayName(s) {
  const names = s.display_names
  if (names) return names[store.lang] || names.uz || ''
  return s.title || ''
}

// Telegram manba uchun TG API saqlanmagan bo'lsa — qo'shishni bloklash
const telegramLocked = computed(() => newType.value === 'telegram' && tgApi.loaded && !tgApi.is_saved)

// Ro'yxat tanlangan tur bo'yicha filtrlanadi (source_type yo'q bo'lsa — telegram).
const filteredSources = computed(() =>
  sources.value.filter((s) => (s.source_type || 'telegram') === newType.value)
)

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return String(d) }
}
function formatNumber(n) {
  return (Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ')
}
function goToTgApi() { router.push('/client/telegram-api') }

async function reload() {
  sources.value = await channelsApi.listSources(props.companyId, props.channel.id)
}

onMounted(async () => {
  try {
    const [api] = await Promise.all([
      companiesApi.getTelegramApi(props.companyId).catch(() => ({ is_saved: false })),
      reload(),
    ])
    tgApi.loaded = true
    tgApi.is_saved = !!api.is_saved
  } catch (e) {
    addError.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

async function addOne() {
  const val = newValue.value.trim()
  if (!val || telegramLocked.value) return
  adding.value = true
  addError.value = null
  try {
    const payload = newType.value === 'website'
      ? {
          source_type: 'website',
          url: val,
          feed_url: newFeedUrl.value.trim() || undefined,
          allow_undated: newAllowUndated.value,
          is_uzbek_media: newIsUzbekMedia.value,
        }
      : { source_type: 'telegram', username: val, is_uzbek_media: newIsUzbekMedia.value }
    await channelsApi.addSource(props.companyId, props.channel.id, payload)
    newValue.value = ''
    newFeedUrl.value = ''
    newAllowUndated.value = false
    newIsUzbekMedia.value = false
    await reload()
  } catch (e) {
    addError.value = e?.response?.data?.message ?? e.message
  } finally {
    adding.value = false
  }
}

async function toggleActive(s) {
  try {
    await channelsApi.updateSource(props.companyId, props.channel.id, s.id, { is_active: !s.is_active })
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}

async function toggleUndated(s) {
  try {
    await channelsApi.updateSource(props.companyId, props.channel.id, s.id, { allow_undated: !s.allow_undated })
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}

async function toggleUzbekMedia(s) {
  try {
    await channelsApi.updateSource(props.companyId, props.channel.id, s.id, { is_uzbek_media: !s.is_uzbek_media })
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}

async function scanOne(s) {
  scanningId.value = s.id
  try {
    await channelsApi.scanSource(props.companyId, props.channel.id, s.id)
    alert(tt('channelSourcesModal.scanQueued'))
    setTimeout(reload, 3000)
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  } finally {
    scanningId.value = null
  }
}

async function remove(s) {
  if (!confirm(tt('channelSourcesModal.removeConfirm', { name: s.username_normalized }))) return
  try {
    await channelsApi.removeSource(props.companyId, props.channel.id, s.id)
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}

function toggleEditNames(s) {
  if (editingNamesId.value === s.id) {
    editingNamesId.value = null
    return
  }
  nameEditError.value = null
  const base = s.title || s.username_normalized
  nameDraft.uz = s.display_names?.uz || base
  nameDraft.uz_cyr = s.display_names?.uz_cyr || nameDraft.uz
  nameDraft.ru = s.display_names?.ru || base
  nameDraft.en = s.display_names?.en || base
  editingNamesId.value = s.id
}

function cancelEditNames() {
  editingNamesId.value = null
}

async function saveNames(s) {
  if (!nameDraft.uz.trim() || !nameDraft.ru.trim() || !nameDraft.en.trim()) {
    nameEditError.value = tt('channelSourcesModal.namesRequired')
    return
  }
  savingNames.value = true
  nameEditError.value = null
  try {
    await channelsApi.updateSource(props.companyId, props.channel.id, s.id, {
      name_i18n: {
        uz: nameDraft.uz.trim(),
        uz_cyr: nameDraft.uz_cyr.trim(),
        ru: nameDraft.ru.trim(),
        en: nameDraft.en.trim(),
      },
    })
    editingNamesId.value = null
    await reload()
  } catch (e) {
    nameEditError.value = e?.response?.data?.message ?? e.message
  } finally {
    savingNames.value = false
  }
}
</script>

<style scoped>
.csm-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 40px 16px; overflow-y: auto;
}
.csm-modal {
  width: 100%; max-width: 640px;
  background: var(--bg); color: var(--text);
  border: 1px solid var(--border-2); border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
  display: flex; flex-direction: column;
}
.csm-head {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid var(--border-2);
}
.csm-title { font-size: 15px; font-weight: 700; }
.csm-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
.csm-x {
  margin-left: auto; background: transparent; border: none; cursor: pointer;
  color: var(--muted); font-size: 16px; line-height: 1; padding: 4px;
}
.csm-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.csm-warn {
  padding: 10px 12px; border-radius: 8px; font-size: 12.5px;
  background: rgba(234,179,8,.08); border: 1px solid rgba(234,179,8,.3);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.csm-add { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.csm-input {
  flex: 1; min-width: 200px; padding: 9px 11px;
  border: 1px solid var(--border-2); border-radius: 6px;
  background: var(--bg); color: var(--text);
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace; font-size: 13px;
}
.csm-btn-accent {
  padding: 9px 16px; border-radius: 6px; background: var(--accent); color: #fff;
  border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; white-space: nowrap;
}
.csm-btn-accent:disabled { opacity: .6; cursor: default; }
.csm-err {
  padding: 8px 12px; border-radius: 6px; font-size: 12.5px; color: #ef4444;
  background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25);
}
.csm-types { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.csm-type {
  display: flex; align-items: center; gap: 7px; position: relative;
  padding: 9px 11px; border: 1.5px solid var(--border-2); border-radius: 8px;
  background: var(--bg); color: var(--text); cursor: pointer;
  font-size: 12.5px; font-weight: 500; font-family: inherit;
}
.csm-type.active { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 8%, var(--bg)); color: var(--accent); }
.csm-type-soon { opacity: .55; cursor: not-allowed; }
.csm-soon {
  margin-left: auto; font-size: 9px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted); background: var(--bg-2, rgba(0,0,0,.05)); padding: 1px 5px; border-radius: 999px;
}
.csm-hint { font-size: 11px; color: var(--muted); line-height: 1.5; }
.csm-adv { display: flex; flex-direction: column; gap: 8px; margin-top: -4px; }
.csm-check {
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  user-select: none; font-size: 12px; color: var(--text);
}
.csm-check input { cursor: pointer; }
.csm-check-sm { font-size: 11px; color: var(--muted); margin-top: 2px; }
.csm-type-badge {
  display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0;
  font-size: 9.5px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase;
  padding: 2px 6px; border-radius: 4px;
}
.csm-type-badge.tg { color: #2AABEE; background: rgba(42,171,238,.12); }
.csm-type-badge.web { color: #16a34a; background: rgba(34,197,94,.12); }
.csm-muted { color: var(--muted); font-size: 13px; }
.csm-empty {
  padding: 26px; text-align: center; color: var(--muted); font-size: 13px;
  border: 1px dashed var(--border-2); border-radius: 8px;
}
.csm-list { display: flex; flex-direction: column; gap: 8px; }
.csm-row {
  display: flex; flex-direction: column; gap: 10px; padding: 11px;
  border: 1px solid var(--border-2); border-radius: 8px; background: var(--bg);
}
.csm-row-main { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.csm-names-edit {
  display: flex; flex-direction: column; gap: 10px;
  padding-top: 10px; border-top: 1px solid var(--border-2);
}
.csm-names-hint { font-size: 11px; color: var(--muted); line-height: 1.5; }
.csm-names-grid { display: flex; flex-direction: column; gap: 8px; }
.csm-name-field { display: flex; flex-direction: column; gap: 4px; }
.csm-name-label { font-size: 11px; font-weight: 600; color: var(--muted); }
.csm-switch-row {
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  user-select: none; font-size: 11px; color: var(--muted); white-space: nowrap;
}
.csm-switch {
  position: relative; display: inline-block; width: 34px; height: 19px; flex-shrink: 0;
}
.csm-switch input {
  position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; z-index: 1;
}
.csm-switch-track {
  position: absolute; inset: 0; border-radius: 999px;
  background: var(--border-2); transition: background .15s;
}
.csm-switch-thumb {
  position: absolute; top: 2px; left: 2px; width: 15px; height: 15px;
  border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25);
  transition: transform .15s;
}
.csm-switch input:checked + .csm-switch-track {
  background: #16a34a;
}
.csm-switch input:checked + .csm-switch-track .csm-switch-thumb {
  transform: translateX(15px);
}
.csm-switch input:focus-visible + .csm-switch-track {
  outline: 2px solid var(--accent); outline-offset: 2px;
}
.csm-handle {
  font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600;
  color: var(--accent); text-decoration: none;
}
.csm-badge {
  font-size: 11px; color: var(--muted); padding: 2px 7px;
  background: var(--bg-2, rgba(0,0,0,.04)); border-radius: 999px;
}
.csm-btn-ghost {
  padding: 6px 10px; border: 1px solid var(--accent); background: transparent;
  color: var(--accent); border-radius: 5px; cursor: pointer; font-size: 11.5px;
}
.csm-btn-danger {
  padding: 6px 10px; border: 1px solid #ef4444; background: transparent;
  color: #ef4444; border-radius: 5px; cursor: pointer; font-size: 11.5px;
}
</style>
