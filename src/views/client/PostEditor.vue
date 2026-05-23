<template>
  <div class="pe-root">
    <!-- ─────────── Hero header ─────────── -->
    <header class="pe-hero">
      <div aria-hidden class="pe-hero-dots"/>
      <div aria-hidden class="pe-hero-glow"/>

      <div class="pe-hero-inner">
        <button class="pe-back" @click="$router.push('/client/posts')">
          <AppIcon name="ChevronL" :size="13"/>
          {{ tt('pe.back') }}
        </button>
        <div class="pe-hero-text">
          <span class="pe-hero-eyebrow">
            {{ isEdit ? tt('posts.title').toUpperCase() : tt('posts.new').toUpperCase() }}
          </span>
          <h1 class="pe-hero-title">
            {{ isEdit ? (firstNonEmptyTitle() || tt('pe.titleEdit')) : tt('pe.titleNew') }}
          </h1>
          <div v-if="post" class="pe-hero-meta">
            <span class="cp-card-status" :class="post.status">
              <span class="cp-card-status-dot"/>
              {{ tt('posts.status.' + post.status) }}
            </span>
            <span class="pe-hero-divider"/>
            <span class="pe-hero-saved">{{ savedLabel }}</span>
          </div>
        </div>
        <div class="pe-hero-right">
          <AppButton v-if="isEdit" variant="ghost" size="md" @click="onDelete">
            <template #icon><AppIcon name="Trash" :size="13"/></template>
            <span class="pe-hide-sm">{{ tt('pe.delete') }}</span>
          </AppButton>
          <AppButton variant="secondary" size="md" @click="$router.push('/client/posts')">
            {{ tt('pe.cancel') }}
          </AppButton>
          <AppButton variant="secondary" size="md" :loading="saving" @click="saveAll">
            <template #icon><AppIcon name="Check" :size="13"/></template>
            {{ tt('pe.saveDraft') }}
          </AppButton>
          <AppButton v-if="isEdit && form.platform === 'telegram'" variant="primary" size="md"
            :loading="publishing" :disabled="!form.telegram_channel_id"
            @click="publishNow">
            <template #icon><AppIcon name="Send" :size="13"/></template>
            {{ tt('pe.publish') }}
          </AppButton>
        </div>
      </div>
    </header>

    <!-- ─────────── Loading initial ─────────── -->
    <div v-if="initLoading" class="pe-loading">
      <span class="pe-spinner"/>
      <span>{{ tt('cc.loading') }}</span>
    </div>

    <template v-else>
      <!-- ─────────── Main two-column body ─────────── -->
      <div class="pe-body">
        <!-- ╔══════ LEFT (writer) ══════╗ -->
        <main class="pe-writer">
          <!-- Cover preview / drop zone -->
          <div class="pe-cover" :class="{ filled: !!form.cover_image_url }"
               :style="form.cover_image_url ? { backgroundImage: `url(${form.cover_image_url})` } : null">
            <input ref="coverFileInput" type="file" accept="image/*" @change="onCoverFile" hidden/>
            <div class="pe-cover-overlay">
              <div class="pe-cover-controls">
                <button class="pe-cover-btn" @click="coverGalleryOpen = true" :title="'Media kutubxonadan tanlash'">
                  <AppIcon name="Layers" :size="12"/>
                  Media kutubxona
                </button>
                <button class="pe-cover-btn" @click="coverFileInput?.click()" :title="'To\'g\'ridan-to\'g\'ri yuklash'" :disabled="coverUploading">
                  <AppIcon :name="coverUploading ? 'Sparkle' : 'Plus'" :size="12"/>
                  {{ coverUploading ? 'Yuklanmoqda...' : 'Yuklash' }}
                </button>
                <input v-model="form.cover_image_url" placeholder="https://..." class="pe-cover-input"/>
                <button v-if="form.cover_image_url" class="pe-cover-clear" @click="clearCover" :title="tt('cc.action.remove')">
                  <AppIcon name="Close" :size="11"/>
                </button>
              </div>
            </div>
          </div>

          <!-- Language tabs -->
          <div class="pe-lang-tabs">
            <button v-for="l in LANGS" :key="l"
              class="pe-lang-tab"
              :class="[{ active: activeLang === l }, langState(l)]"
              @click="activeLang = l">
              <span class="pe-lang-tab-flag">{{ l.toUpperCase() }}</span>
              <span class="pe-lang-tab-label">{{ tt('pe.lang.' + l) }}</span>
              <span class="pe-lang-tab-dot"/>
            </button>
            <div class="pe-lang-spacer"/>
            <button v-if="hasAnyContent(activeLang)" class="pe-lang-remove" @click="removeLang" :title="tt('pe.lang.removeTranslation')">
              <AppIcon name="Trash" :size="11"/>
            </button>
            <button class="pe-lang-complete" :class="{ on: activeTr.is_complete }" @click="toggleComplete">
              <AppIcon :name="activeTr.is_complete ? 'Check' : 'Edit'" :size="11"/>
              {{ activeTr.is_complete ? tt('pe.lang.complete') : tt('pe.lang.markComplete') }}
            </button>
          </div>

          <!-- Title input (card style) -->
          <div class="pe-card-input">
            <label class="pe-field-label-inline">
              <AppIcon name="Edit" :size="11"/>
              {{ tt('pe.field.langTitle') }}
            </label>
            <input v-model="activeTr.title"
              :placeholder="tt('pe.field.langTitlePh')"
              class="pe-title-input"/>
          </div>

          <!-- Short description -->
          <div class="pe-card-input">
            <label class="pe-field-label-inline">
              <AppIcon name="Layers" :size="11"/>
              {{ tt('pe.field.langShortDesc') }}
              <span class="tabular pe-card-input-counter">{{ (activeTr.short_description || '').length }} / 500</span>
            </label>
            <textarea v-model="activeTr.short_description"
              :placeholder="tt('pe.field.langShortDescPh')"
              rows="2" maxlength="500"
              class="pe-short-input"/>
          </div>

          <!-- Editor.js -->
          <div class="pe-editor-wrap">
            <RichEditor :key="activeLang" v-model="activeTr.content_json" :placeholder="tt('pe.field.langContentPh')"/>
          </div>
        </main>

        <!-- ╔══════ RIGHT (sticky sidebar) ══════╗ -->
        <aside class="pe-sidebar">
          <!-- iPhone 16 Telegram preview — switch bilan yoqiladi -->
          <section class="pe-preview-wrap" :class="{ on: previewShown }">
            <div class="pe-preview-head">
              <span class="pe-preview-head-icon"><AppIcon name="Telegram" :size="12"/></span>
              <span class="pe-preview-head-title">Telegram preview</span>
              <span v-if="previewShown" class="pe-preview-head-lang">{{ activeLang.toUpperCase() }}</span>
              <button
                type="button"
                class="pe-switch"
                :class="{ on: previewShown }"
                @click="previewShown = !previewShown"
                :aria-pressed="previewShown"
                role="switch">
                <span class="pe-switch-thumb"/>
              </button>
            </div>
            <div v-if="previewShown" class="pe-preview-body">
              <TelegramPreview
                :channel-name="previewChannelName"
                :subscriber-count="previewSubscriberCount"
                :title="activeTr.title"
                :short-description="activeTr.short_description"
                :content-json="activeTr.content_json"
                :cover-url="form.cover_image_url"
                :gallery="galleryArr"
                :tags="tagsArr"/>
              <div class="pe-preview-hint">Bu — kanalingizdagi taxminiy ko'rinish. Til almashtirsangiz preview ham yangilanadi.</div>
            </div>
          </section>

          <!-- Settings card -->
          <section class="pe-card">
            <header class="pe-card-head">
              <span class="pe-card-head-icon"><AppIcon name="Settings" :size="13"/></span>
              <h3>{{ tt('pe.section.basics') }}</h3>
            </header>

            <!-- Platform cards -->
            <div class="pe-field">
              <label class="pe-label">{{ tt('pe.field.platform') }}</label>
              <div class="pe-platform-cards">
                <button v-for="p in platforms" :key="p"
                  class="pe-platform-card"
                  :class="{ active: form.platform === p }"
                  @click="form.platform = p"
                  :title="tt('pe.platform.' + p)">
                  <span class="pe-platform-card-icon" :style="iconStyle(p)">
                    <AppIcon :name="platformIcon(p)" :size="14"/>
                  </span>
                  <span class="pe-platform-card-name">{{ tt('pe.platform.' + p) }}</span>
                </button>
              </div>
            </div>

            <div class="pe-field">
              <label class="pe-label">{{ tt('pe.field.category') }}</label>
              <div class="pe-cat-row">
                <select v-model="form.category_id" class="pe-input pe-cat-select">
                  <option :value="null">— tanlang —</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <button type="button" class="pe-cat-add" @click="openCategoryModal" :title="'Yangi kategoriya'">
                  <AppIcon name="Plus" :size="12"/>
                </button>
              </div>
            </div>

            <div class="pe-field" style="position:relative;">
              <label class="pe-label">{{ tt('pe.field.tags') }}</label>
              <div class="pe-tags">
                <span v-for="(tg, idx) in tagsArr" :key="`${tg}-${idx}`" class="pe-tag">
                  {{ tg }}
                  <button @click="removeTag(idx)" class="pe-tag-x">
                    <AppIcon name="Close" :size="9"/>
                  </button>
                </span>
                <input v-model="tagInput"
                  @keydown.enter.prevent="onTagEnter"
                  @keydown.,.prevent="addTag"
                  @keydown.down.prevent="moveSuggest(1)"
                  @keydown.up.prevent="moveSuggest(-1)"
                  @keydown.escape="hideSuggest"
                  @input="onTagInput"
                  @focus="onTagInput"
                  @blur="onTagBlur"
                  :placeholder="tagsArr.length ? '+' : tt('pe.field.tagsPh')"
                  class="pe-tag-input"/>
              </div>
              <!-- Autocomplete dropdown -->
              <div v-if="tagSuggestOpen && tagSuggestions.length" class="pe-tag-suggest">
                <button v-for="(s, i) in tagSuggestions" :key="s.name"
                  type="button"
                  class="pe-tag-suggest-item"
                  :class="{ active: i === tagSuggestActive }"
                  @mousedown.prevent="pickSuggestion(s.name)"
                  @mouseenter="tagSuggestActive = i">
                  <span class="pe-tag-suggest-name">{{ s.name }}</span>
                  <span class="pe-tag-suggest-count">{{ s.count }}×</span>
                </button>
              </div>
            </div>

            <div class="pe-field">
              <label class="pe-label">
                <AppIcon name="Calendar" :size="11" :style="{ verticalAlign: 'middle', marginRight: '4px' }"/>
                {{ tt('pe.field.publishAt') }}
              </label>
              <DateTimePicker v-model="form.publish_at"/>
              <span class="pe-hint">{{ tt('pe.field.publishAtHint') }}</span>
            </div>
          </section>

          <!-- Gallery card -->
          <section class="pe-card">
            <header class="pe-card-head">
              <span class="pe-card-head-icon"><AppIcon name="Layers" :size="13"/></span>
              <h3>{{ tt('pe.field.gallery') }}</h3>
            </header>
            <div class="pe-gallery-grid">
              <div v-for="(url, i) in galleryArr" :key="`${url}-${i}`" class="pe-gallery-item"
                :style="{ backgroundImage: `url(${url})` }">
                <button class="pe-gallery-x" @click="removeGallery(i)">
                  <AppIcon name="Close" :size="10"/>
                </button>
              </div>
            </div>
            <div class="pe-gallery-add">
              <input ref="galleryFileInput" type="file" accept="image/*" multiple @change="onGalleryFiles" hidden/>
              <button class="pe-gallery-upload-btn pe-gallery-library-btn" @click="galleryLibraryOpen = true">
                <AppIcon name="Layers" :size="13"/>
                Media kutubxonadan tanlash
              </button>
              <button class="pe-gallery-upload-btn" @click="galleryFileInput?.click()" :disabled="galleryUploading">
                <AppIcon :name="galleryUploading ? 'Sparkle' : 'Plus'" :size="13"/>
                {{ galleryUploading ? 'Yuklanmoqda...' : 'Yangi yuklash' }}
              </button>
              <input v-model="galleryInput" @keydown.enter.prevent="addGallery"
                placeholder="yoki https://... + Enter" class="pe-input"/>
            </div>
          </section>

          <!-- Telegram-specific card -->
          <section v-if="form.platform === 'telegram'" class="pe-card pe-card-platform">
            <header class="pe-card-head">
              <span class="pe-card-head-icon" style="background:#2AABEE26;color:#2AABEE">
                <AppIcon name="Telegram" :size="13"/>
              </span>
              <h3>{{ tt('pe.section.platform') }}</h3>
            </header>

            <div class="pe-field">
              <label class="pe-label">{{ tt('pe.tg.channel') }}</label>
              <select v-model="form.telegram_channel_id" class="pe-input">
                <option :value="null">{{ tt('pe.tg.channelPh') }}</option>
                <option v-for="ch in connectedTgChannels" :key="ch.id" :value="ch.id">
                  {{ ch.display_name || ch.username }} ({{ ch.username }})
                </option>
              </select>
              <span v-if="!connectedTgChannels.length" class="pe-hint pe-hint-err">
                {{ tt('pe.tg.noConnected') }}
              </span>
            </div>

            <div class="pe-field">
              <label class="pe-label">
                <AppIcon name="Sparkle" :size="11" :style="{ verticalAlign: 'middle', marginRight: '4px', color: 'var(--accent)' }"/>
                {{ tt('pe.tg.longText') }}
              </label>
              <textarea v-model="form.telegram_raw_long_text" rows="5" class="pe-input pe-textarea"
                placeholder="..."/>
              <span class="pe-hint">{{ tt('pe.tg.longTextHint') }}</span>
            </div>

            <AppButton variant="secondary" size="md" :loading="adapting"
              :disabled="!isEdit || !form.telegram_raw_long_text" @click="adaptTelegram"
              :style="{ width: '100%', justifyContent: 'center' }">
              <template #icon><AppIcon name="Sparkle" :size="12"/></template>
              {{ tt('pe.tg.adapt') }}
            </AppButton>

            <div v-if="adaptedResult" class="pe-adapted">
              <div class="pe-adapted-label">{{ tt('pe.tg.adaptResult') }}</div>
              <div class="pe-adapted-body">{{ adaptedResult }}</div>
            </div>
          </section>
        </aside>
      </div>

      <!-- Inline error toast -->
      <div v-if="formError" class="pe-error">
        <AppIcon name="Close" :size="12"/>
        {{ formError }}
      </div>
    </template>

    <!-- Media gallery (cover) -->
    <MediaGallery v-model="coverGalleryOpen" :multiple="false" @pick="onPickCover"/>

    <!-- Media gallery (gallery) -->
    <MediaGallery v-model="galleryLibraryOpen" :multiple="true" @pick="onPickGallery"/>

    <!-- Category create modal -->
    <AppModal v-model="catModalOpen" title="Yangi kategoriya" subtitle="Faqat ushbu kompaniya uchun">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="pe-label">Nom</label>
          <input v-model="catForm.name" placeholder="Masalan: Yangiliklar"
            class="pe-input" @keydown.enter.prevent="saveCategory"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="pe-label">Rang (ixtiyoriy)</label>
          <input v-model="catForm.color" type="color" class="pe-input" style="height:36px;padding:2px 6px;"/>
        </div>
        <div v-if="catError" class="pe-error" style="margin:0;">
          <AppIcon name="Close" :size="12"/> {{ catError }}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
          <AppButton variant="secondary" size="md" @click="catModalOpen = false">Bekor qilish</AppButton>
          <AppButton variant="primary" size="md" :loading="catSaving" @click="saveCategory">
            Saqlash
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RichEditor from '@/components/editor/RichEditor.vue'
import TelegramPreview from '@/components/preview/TelegramPreview.vue'
import DateTimePicker from '@/components/ui/DateTimePicker.vue'
import AppModal from '@/components/ui/AppModal.vue'
import MediaGallery from '@/components/media/MediaGallery.vue'
import { categoriesApi } from '@/api/categories.js'
import { useAppStore } from '@/stores/app.js'
import { useStorageStore } from '@/stores/storage.js'
import { companiesApi } from '@/api/companies.js'
import { channelsApi } from '@/api/channels.js'
import { postsApi } from '@/api/posts.js'
import { uploadsApi } from '@/api/uploads.js'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const storageStore = useStorageStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const LANGS = ['uz', 'ru', 'en']
const platforms = ['telegram', 'website', 'instagram']

const isEdit = computed(() => !!route.params.id)
const postId = computed(() => route.params.id)

const initLoading = ref(true)
const saving = ref(false)
const publishing = ref(false)
const adapting = ref(false)
const previewShown = ref(false)
const adaptedResult = ref('')
const formError = ref('')
const lastSavedAt = ref(null)

const company = ref(null)
const allChannels = ref([])
const post = ref(null)

const form = reactive({
  platform: 'telegram',
  category: '',
  category_id: null,
  publish_at: '',
  cover_image_url: '',
  telegram_channel_id: null,
  telegram_raw_long_text: '',
})

// ── Media kutubxona modal'lari ─────────────────────────────
const coverGalleryOpen = ref(false)
const galleryLibraryOpen = ref(false)

async function onPickCover(url) {
  if (!url) return
  const oldUrl = form.cover_image_url
  form.cover_image_url = url
  // Edit rejimida DB'ga darhol saqlash
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { cover_image_url: url })
    } catch { /* save'da saqlanadi */ }
  } else if (oldUrl && oldUrl !== url) {
    // Create rejimida: eski cover tanlangan bo'lsa, lekin u DB'da yo'q —
    // baribir o'chirmaymiz (boshqa postlarda foydalanilayotgan bo'lishi mumkin
    // chunki bu media kutubxonadan tanlangan, alohida uploaded fayl emas)
  }
  storageStore.refresh()
}

async function onPickGallery(urls) {
  if (!urls?.length) return
  // Dublikatlarni chiqarib tashlaymiz
  const existing = new Set(galleryArr.value)
  const toAdd = urls.filter(u => u && !existing.has(u))
  if (!toAdd.length) return
  galleryArr.value.push(...toAdd)
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { gallery: [...galleryArr.value] })
    } catch { /* save'da saqlanadi */ }
  }
  storageStore.refresh()
}

// ── Kategoriyalar (per-company spravochnik) ─────────────────
const categories = ref([])
const catModalOpen = ref(false)
const catSaving = ref(false)
const catError = ref('')
const catForm = reactive({ name: '', color: '#2F6FED' })

async function loadCategories() {
  if (!company.value) return
  try {
    categories.value = await categoriesApi.list(company.value.id)
  } catch { /* jim */ }
}

function openCategoryModal() {
  catForm.name = ''
  catForm.color = '#2F6FED'
  catError.value = ''
  catModalOpen.value = true
}

async function saveCategory() {
  catError.value = ''
  const name = catForm.name.trim()
  if (!name) { catError.value = 'Nom kiritilishi shart'; return }
  if (!company.value) { catError.value = 'Kompaniya topilmadi'; return }
  catSaving.value = true
  try {
    const created = await categoriesApi.create(company.value.id, {
      name,
      color: catForm.color || undefined,
    })
    categories.value = [...categories.value, created].sort((a, b) =>
      (a.sort_order - b.sort_order) || a.name.localeCompare(b.name)
    )
    form.category_id = created.id
    catModalOpen.value = false
  } catch (e) {
    const msg = e?.response?.data?.message
    catError.value = Array.isArray(msg) ? msg.join('. ') : (msg || 'Saqlashda xato')
  } finally {
    catSaving.value = false
  }
}

const tagsArr = ref([])
const tagInput = ref('')
const galleryArr = ref([])
const galleryInput = ref('')
const coverFileInput = ref(null)
const galleryFileInput = ref(null)
const coverUploading = ref(false)
const galleryUploading = ref(false)

async function clearCover() {
  const url = form.cover_image_url
  form.cover_image_url = ''
  if (!url) return
  // Edit rejimida: post DB'da bor → cover_image_url=null ni darhol saqlab qo'yamiz,
  // shunda refresh'da rasm qaytib chiqmaydi. Backend update() bucket'dan ham o'chiradi.
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { cover_image_url: null })
      storageStore.refresh()
      return
    } catch {/* fallback: alohida delete */}
  }
  try {
    await uploadsApi.deleteByUrls([url])
    storageStore.refresh()
  } catch { /* save'da diff orqali tozalanadi */ }
}

async function onCoverFile(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // reset
  if (!file) return
  coverUploading.value = true
  const oldUrl = form.cover_image_url
  try {
    const res = await uploadsApi.uploadImage(file)
    if (res?.url) form.cover_image_url = res.url

    // Edit rejimida: yangi cover'ni DB'ga darhol yozamiz — refresh'da yo'qolmasin.
    // Backend update() diff orqali eski cover'ni bucket'dan ham o'chiradi.
    if (isEdit.value && company.value && post.value) {
      try {
        await postsApi.update(company.value.id, postId.value, { cover_image_url: form.cover_image_url || null })
      } catch {/* save bosilganida diff orqali tozalanadi */}
    } else if (oldUrl && oldUrl !== form.cover_image_url) {
      // Create rejimida: eski cover'ni alohida o'chiramiz
      uploadsApi.deleteByUrls([oldUrl]).catch(() => {})
    }
    storageStore.refresh()
  } catch (err) {
    const msg = err?.response?.data?.message || 'Yuklashda xato'
    formError.value = Array.isArray(msg) ? msg.join('. ') : msg
  } finally {
    coverUploading.value = false
  }
}

async function onGalleryFiles(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return
  galleryUploading.value = true
  try {
    const res = await uploadsApi.uploadImages(files)
    const urls = (res?.files || []).map(f => f.url).filter(Boolean)
    galleryArr.value.push(...urls)

    // Edit rejimida: yangi gallery'ni DB'ga darhol yozamiz — refresh'da yo'qolmasin
    if (isEdit.value && company.value && post.value) {
      try {
        await postsApi.update(company.value.id, postId.value, { gallery: [...galleryArr.value] })
      } catch {/* save bosilganida saqlanadi */}
    }
    storageStore.refresh()
  } catch (err) {
    const msg = err?.response?.data?.message || 'Yuklashda xato'
    formError.value = Array.isArray(msg) ? msg.join('. ') : msg
  } finally {
    galleryUploading.value = false
  }
}

function addTag(value) {
  const raw = typeof value === 'string' ? value : tagInput.value
  const v = (raw || '').trim().replace(/,/g, '')
  if (!v) return
  if (!tagsArr.value.includes(v)) tagsArr.value.push(v)
  tagInput.value = ''
  hideSuggest()
}
function removeTag(i) { tagsArr.value.splice(i, 1) }

// ── Tag autocomplete ────────────────────────────────────────
const tagSuggestions = ref([])
const tagSuggestOpen = ref(false)
const tagSuggestActive = ref(-1)
let tagSuggestT = null

async function fetchTagSuggestions(q) {
  if (!company.value) return
  try {
    const list = await postsApi.listTags(company.value.id, q || undefined, 10)
    // Allaqachon tanlangan teglarni chiqarib tashlaymiz
    const taken = new Set(tagsArr.value.map(t => t.toLowerCase()))
    tagSuggestions.value = (list || []).filter(s => !taken.has(s.name.toLowerCase()))
    tagSuggestActive.value = tagSuggestions.value.length ? 0 : -1
    tagSuggestOpen.value = tagSuggestions.value.length > 0
  } catch {
    tagSuggestions.value = []
    tagSuggestOpen.value = false
  }
}

function onTagInput() {
  clearTimeout(tagSuggestT)
  const q = tagInput.value.trim()
  tagSuggestT = setTimeout(() => fetchTagSuggestions(q), 180)
}

function onTagBlur() {
  // mousedown.prevent suggestion click'ni saqlab qoldi —
  // bu blur faqat input outsida tugmasi bosilmaganda yopadi
  setTimeout(() => { tagSuggestOpen.value = false }, 120)
}

function hideSuggest() {
  tagSuggestOpen.value = false
  tagSuggestActive.value = -1
}

function moveSuggest(delta) {
  if (!tagSuggestOpen.value || !tagSuggestions.value.length) {
    fetchTagSuggestions(tagInput.value.trim())
    return
  }
  const n = tagSuggestions.value.length
  tagSuggestActive.value = (tagSuggestActive.value + delta + n) % n
}

function pickSuggestion(name) {
  addTag(name)
}

function onTagEnter() {
  // Agar suggestion tanlangan bo'lsa shuni qo'shamiz, aks holda input matnini
  if (tagSuggestOpen.value && tagSuggestActive.value >= 0 && tagSuggestions.value[tagSuggestActive.value]) {
    pickSuggestion(tagSuggestions.value[tagSuggestActive.value].name)
  } else {
    addTag()
  }
}
function addGallery() {
  const v = galleryInput.value.trim()
  if (!v) return
  galleryArr.value.push(v)
  galleryInput.value = ''
}
async function removeGallery(i) {
  const url = galleryArr.value[i]
  galleryArr.value.splice(i, 1)
  if (!url) return
  // Edit rejimida: post DB'da bor → yangilangan gallery'ni darhol saqlaymiz,
  // shunda refresh'da rasm qaytib chiqmaydi. Backend update() diff bo'yicha
  // bucket'dan ham o'chiradi va counter'ni yangilaydi.
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { gallery: [...galleryArr.value] })
      storageStore.refresh()
      return
    } catch {/* fallback: alohida delete */}
  }
  // Create rejimida (yangi post hali saqlanmagan) yoki backend xatosi — bucket'dan to'g'ridan o'chiramiz
  try {
    await uploadsApi.deleteByUrls([url])
    storageStore.refresh()
  } catch { /* keyingi save'da diff orqali tozalanadi */ }
}

const translations = reactive({
  uz: { title: '', short_description: '', content_json: { blocks: [] }, is_complete: false },
  ru: { title: '', short_description: '', content_json: { blocks: [] }, is_complete: false },
  en: { title: '', short_description: '', content_json: { blocks: [] }, is_complete: false },
})
const activeLang = ref(store.lang in translations ? store.lang : 'uz')
const activeTr = computed(() => translations[activeLang.value])

const connectedTgChannels = computed(() =>
  allChannels.value.filter(c => (c.platform?.slug === 'telegram' || c.telegram_chat_id) && c.status === 'connected'),
)

const previewChannelName = computed(() => {
  const ch = connectedTgChannels.value.find(c => c.id === form.telegram_channel_id)
  return ch?.display_name || ch?.username || store.companyName || 'Mening kanalim'
})
const previewSubscriberCount = computed(() => {
  const ch = connectedTgChannels.value.find(c => c.id === form.telegram_channel_id)
  return typeof ch?.subscriber_count === 'number' ? ch.subscriber_count : null
})

function platformIcon(p) {
  return p === 'instagram' ? 'Instagram' : p === 'website' ? 'Globe' : 'Telegram'
}
function iconStyle(p) {
  let bg = '#2AABEE', fg = '#fff'
  if (p === 'instagram') { bg = 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' }
  else if (p === 'website') { bg = 'var(--panel-2)'; fg = 'var(--text-2)' }
  return { width:'24px', height:'24px', borderRadius:'7px', background: bg, color: fg, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }
}

function langState(l) {
  const tr = translations[l]
  if (!tr) return 'empty'
  if (tr.is_complete && (tr.title || hasContent(tr.content_json))) return 'complete'
  if (tr.title || tr.short_description || hasContent(tr.content_json)) return 'draft'
  return 'empty'
}
function hasContent(json) {
  return !!(json && Array.isArray(json.blocks) && json.blocks.length)
}
function hasAnyContent(l) { return langState(l) !== 'empty' }
function firstNonEmptyTitle() {
  for (const l of [store.lang, 'uz', 'ru', 'en']) {
    if (translations[l]?.title) return translations[l].title
  }
  return ''
}

function toggleComplete() { activeTr.value.is_complete = !activeTr.value.is_complete }

function removeLang() {
  if (!confirm(tt('pe.lang.removeTranslation') + '?')) return
  const t2 = translations[activeLang.value]
  t2.title = ''; t2.short_description = ''; t2.content_json = { blocks: [] }; t2.is_complete = false
  if (isEdit.value && post.value) {
    postsApi.removeTranslation(company.value.id, postId.value, activeLang.value).catch(() => {})
  }
}

const savedLabel = computed(() => {
  if (!lastSavedAt.value) return ''
  const diff = Math.floor((Date.now() - lastSavedAt.value) / 1000)
  if (diff < 5) return tt('pe.savedDraft') + ' ✓'
  if (diff < 60) return tt('pe.savedDraft') + ` (${diff}s)`
  return tt('pe.savedDraft')
})

async function loadInitial() {
  initLoading.value = true
  try {
    const cs = await companiesApi.getMy().catch(() => [])
    const list = Array.isArray(cs) ? cs : [cs].filter(Boolean)
    company.value = list[0] || null
    if (!company.value) { initLoading.value = false; return }

    const chs = await channelsApi.list(company.value.id).catch(() => [])
    allChannels.value = chs || []

    // Kategoriyalar spravochnigini yuklab olamiz (parallel emas, oddiy)
    await loadCategories()

    if (isEdit.value) {
      const p = await postsApi.get(company.value.id, postId.value)
      post.value = p
      form.platform = p.platform || 'telegram'
      form.category = p.category || ''
      form.category_id = p.category_id || null
      form.publish_at = p.publish_at ? toLocalDatetime(p.publish_at) : ''
      form.cover_image_url = p.cover_image_url || ''
      form.telegram_channel_id = p.telegram_channel_id || null
      form.telegram_raw_long_text = p.telegram_raw_long_text || ''
      tagsArr.value = p.tags || []
      galleryArr.value = p.gallery || []
      for (const l of LANGS) {
        const tr = p.translations?.find(x => x.lang === l)
        if (tr) {
          translations[l].title = tr.title || ''
          translations[l].short_description = tr.short_description || ''
          translations[l].content_json = tr.content_json || { blocks: [] }
          translations[l].is_complete = !!tr.is_complete
        }
      }
    }
  } finally {
    initLoading.value = false
  }
}

function toLocalDatetime(d) {
  try {
    let s = String(d).trim()
    if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) s = s.replace(' ', 'T')
    const dt = new Date(s)
    if (isNaN(dt.getTime())) return ''
    const pad = n => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  } catch { return '' }
}

onMounted(loadInitial)

async function saveAll() {
  formError.value = ''
  const anyTitle = LANGS.some(l => translations[l].title && translations[l].title.trim())
  if (!anyTitle) { formError.value = tt('pe.err.noTitle'); return }
  if (!company.value) return

  saving.value = true
  try {
    const payload = {
      platform: form.platform,
      category: form.category || null,
      category_id: form.category_id || null,
      tags: tagsArr.value,
      cover_image_url: form.cover_image_url || null,
      gallery: galleryArr.value,
      publish_at: form.publish_at ? new Date(form.publish_at).toISOString() : null,
      telegram_channel_id: form.telegram_channel_id || null,
      telegram_raw_long_text: form.telegram_raw_long_text || null,
    }

    let saved
    if (isEdit.value) {
      saved = await postsApi.update(company.value.id, postId.value, payload)
    } else {
      const trArr = LANGS
        .filter(l => translations[l].title || translations[l].short_description || hasContent(translations[l].content_json))
        .map(l => ({
          lang: l,
          title: translations[l].title || null,
          short_description: translations[l].short_description || null,
          content_json: translations[l].content_json || null,
          is_complete: translations[l].is_complete || false,
        }))
      saved = await postsApi.create(company.value.id, { ...payload, translations: trArr })
    }
    post.value = saved

    if (isEdit.value) {
      for (const l of LANGS) {
        const tr = translations[l]
        const hasAny = tr.title || tr.short_description || hasContent(tr.content_json)
        if (hasAny) {
          await postsApi.upsertTranslation(company.value.id, postId.value, l, {
            title: tr.title || null,
            short_description: tr.short_description || null,
            content_json: tr.content_json || null,
            is_complete: tr.is_complete,
          })
        }
      }
    }

    lastSavedAt.value = Date.now()
    // Saqlash paytida olib tashlangan rasmlar bucket'dan o'chiriladi → usage yangilanadi
    storageStore.refresh()

    if (!isEdit.value && saved?.id) {
      router.replace(`/client/posts/${saved.id}/edit`)
    }
  } catch (e) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic'))
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!isEdit.value || !post.value) return
  if (!confirm(tt('posts.confirmDelete', { name: firstNonEmptyTitle() }))) return
  try {
    await postsApi.remove(company.value.id, postId.value)
    storageStore.refresh()
    router.push('/client/posts')
  } catch {}
}

async function publishNow() {
  if (!isEdit.value || !post.value) return
  if (!form.telegram_channel_id) {
    formError.value = tt('pe.tg.noConnected')
    return
  }
  // Avval saqlaymiz — eng so'nggi o'zgarishlar Telegramga borishi uchun
  formError.value = ''
  await saveAll()
  if (formError.value) return

  publishing.value = true
  try {
    const res = await postsApi.publish(company.value.id, postId.value)
    post.value = res
    lastSavedAt.value = Date.now()
  } catch (e) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic'))
  } finally {
    publishing.value = false
  }
}

async function adaptTelegram() {
  if (!isEdit.value || !post.value) return
  adapting.value = true
  adaptedResult.value = ''
  try {
    const res = await postsApi.adaptTelegram(company.value.id, postId.value)
    adaptedResult.value = res?.adapted || ''
  } catch {} finally {
    adapting.value = false
  }
}
</script>

<style scoped>
.pe-root {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 0 0 80px;
  min-height: 100%;
}

/* ────────── Hero ────────── */
.pe-hero {
  position: relative;
  overflow: hidden;
  padding: 24px 28px;
  background: linear-gradient(135deg,
    color-mix(in oklab, var(--accent) 18%, var(--bg-2)) 0%,
    var(--bg-2) 100%);
  border-bottom: 1px solid var(--border-2);
}
.pe-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(color-mix(in oklab, var(--accent) 22%, transparent) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 70% 80% at 80% 0%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 80% 0%, black 30%, transparent 80%);
}
.pe-hero-glow {
  position: absolute; top: -100px; right: -80px;
  width: 360px; height: 360px; border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%);
  filter: blur(20px);
}
.pe-hero-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}
.pe-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px 0 8px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.pe-back:hover { border-color: var(--accent); color: var(--text); }
.pe-hero-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.pe-hero-eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--accent);
  text-transform: uppercase;
}
.pe-hero-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
  color: var(--text);
  margin: 0;
  max-width: 700px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pe-hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  font-size: 11.5px;
}
.pe-hero-divider { width: 3px; height: 3px; border-radius: 999px; background: var(--border); }
.pe-hero-saved { color: var(--success); font-weight: 500; }
.pe-hero-right { display: flex; align-items: center; gap: 8px; }

/* status pill (shared with cards) */
.cp-card-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--panel);
  border: 1px solid var(--border-2);
  color: var(--text);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.cp-card-status-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--muted); }
.cp-card-status.draft     .cp-card-status-dot { background: var(--muted); }
.cp-card-status.scheduled .cp-card-status-dot { background: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.22); }
.cp-card-status.published .cp-card-status-dot { background: var(--success); box-shadow: 0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent); }
.cp-card-status.failed    .cp-card-status-dot { background: var(--danger); }

/* ────────── Loading ────────── */
.pe-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 80px 0;
  color: var(--muted);
  font-size: 13px;
}
.pe-spinner {
  width: 22px; height: 22px; border-radius: 999px;
  border: 2.5px solid var(--border); border-top-color: var(--accent);
  animation: pe-spin 0.8s linear infinite;
}
@keyframes pe-spin { to { transform: rotate(360deg); } }

/* ────────── Two-column body ────────── */
.pe-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  padding: 0 28px;
  align-items: start;
}

/* ────────── Writer (left) ────────── */
.pe-writer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* Cover — Notion-style */
.pe-cover {
  position: relative;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: var(--panel-2);
  background-image:
    linear-gradient(135deg,
      color-mix(in oklab, var(--accent) 12%, transparent),
      color-mix(in oklab, #6E56CF 8%, transparent));
  border: 1px solid var(--border);
  transition: border-color 0.15s;
}
.pe-cover.filled {
  background-image: none;
}
.pe-cover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 14px;
  background: linear-gradient(180deg, transparent 0%, transparent 60%, rgba(0,0,0,0.45) 100%);
}
.pe-cover.filled .pe-cover-overlay {
  background: linear-gradient(180deg, transparent 0%, transparent 60%, rgba(0,0,0,0.55) 100%);
}
.pe-cover-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: rgba(0,0,0,0.45);
  border-radius: 9px;
  color: white;
  backdrop-filter: blur(10px);
}
.pe-cover-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 13px;
  font-family: var(--font-mono);
}
.pe-cover-input::placeholder { color: rgba(255,255,255,0.65); }
.pe-cover-clear {
  width: 22px; height: 22px;
  background: rgba(255,255,255,0.18);
  border: none;
  border-radius: 999px;
  color: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pe-cover-clear:hover { background: rgba(255,255,255,0.32); }
.pe-cover-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.28);
  color: white;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(6px);
  white-space: nowrap;
}
.pe-cover-btn:hover:not(:disabled) { background: rgba(255,255,255,0.32); }
.pe-cover-btn:disabled { opacity: 0.7; cursor: wait; }

.pe-gallery-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
}
.pe-gallery-upload-btn:hover:not(:disabled) {
  background: color-mix(in oklab, var(--accent) 85%, black);
}
.pe-gallery-upload-btn:disabled { opacity: 0.7; cursor: wait; }

.pe-gallery-library-btn {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  margin-bottom: 6px;
}
.pe-gallery-library-btn:hover {
  background: var(--panel-2);
  border-color: var(--accent);
}

/* Language tabs */
.pe-lang-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.pe-lang-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--muted);
  font-size: 12.5px;
  transition: all 0.15s;
}
.pe-lang-tab:hover { color: var(--text-2); }
.pe-lang-tab.active {
  background: var(--panel-2);
  color: var(--text);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.pe-lang-tab-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 20px;
  background: var(--panel-2);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.pe-lang-tab.active .pe-lang-tab-flag {
  background: var(--accent);
  color: white;
}
.pe-lang-tab-dot {
  width: 7px; height: 7px;
  border-radius: 999px;
  background: var(--border);
}
.pe-lang-tab.draft .pe-lang-tab-dot {
  background: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent);
}
.pe-lang-tab.complete .pe-lang-tab-dot {
  background: var(--success);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent);
}

.pe-lang-spacer { flex: 1; }
.pe-lang-remove,
.pe-lang-complete {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}
.pe-lang-remove:hover { background: var(--danger-bg); color: var(--danger); }
.pe-lang-complete:hover { background: var(--panel-2); color: var(--text-2); }
.pe-lang-complete.on {
  background: color-mix(in oklab, var(--success) 14%, transparent);
  color: var(--success);
}

/* Card-style sarlavha va qisqa tavsif uchun input wrapperlari */
.pe-card-input {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pe-card-input:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.pe-field-label-inline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.pe-card-input-counter {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  color: var(--muted);
}

/* Title — katta Medium-style, lekin endi card ichida */
.pe-title-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.022em;
  color: var(--text);
  font-family: inherit;
  line-height: 1.25;
}
.pe-title-input::placeholder {
  color: color-mix(in oklab, var(--text) 28%, transparent);
}

/* Short description */
.pe-short-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14.5px;
  font-weight: 400;
  color: var(--text);
  font-family: inherit;
  line-height: 1.55;
  resize: vertical;
}
.pe-short-input::placeholder {
  color: var(--muted);
}

.pe-editor-wrap {
  margin-top: 6px;
}

/* ────────── Sidebar (right) ────────── */
.pe-sidebar {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-self: start;
}

.pe-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pe-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.pe-card-head h3 {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  margin: 0;
  color: var(--text);
}
.pe-card-head-icon {
  width: 24px; height: 24px;
  border-radius: 7px;
  background: var(--accent-bg);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pe-field { display: flex; flex-direction: column; gap: 5px; }

/* Kategoriya selecti + "+" tugmasi */
.pe-cat-row {
  display: flex;
  gap: 6px;
  align-items: stretch;
}
.pe-cat-select {
  flex: 1;
  cursor: pointer;
}
.pe-cat-add {
  width: 36px;
  height: 36px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.pe-cat-add:hover { background: color-mix(in oklab, var(--accent) 85%, black); }
.pe-label {
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pe-hint { font-size: 10.5px; color: var(--muted); line-height: 1.5; }
.pe-hint-err { color: var(--danger); }

.pe-input {
  width: 100%;
  height: 36px;
  padding: 0 11px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.pe-input:focus {
  background: var(--panel);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.pe-textarea {
  height: auto;
  min-height: 80px;
  padding: 10px 11px;
  resize: vertical;
  line-height: 1.5;
}

/* Platform cards in sidebar */
.pe-platform-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.pe-platform-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  background: var(--panel-2);
  border: 1.5px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
}
.pe-platform-card:hover { background: var(--panel); border-color: var(--border); }
.pe-platform-card.active {
  background: color-mix(in oklab, var(--accent) 10%, var(--panel));
  border-color: var(--accent);
}
.pe-platform-card-name {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text);
}

/* Tags input */
.pe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  min-height: 36px;
  align-items: center;
}
.pe-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 4px 0 8px;
  background: var(--accent-bg);
  color: var(--accent);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.pe-tag-x {
  width: 16px; height: 16px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--accent) 22%, transparent);
  border: none;
  color: var(--accent);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pe-tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12.5px;
  color: var(--text);
  height: 22px;
}

/* Autocomplete dropdown */
.pe-tag-suggest {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 18px 50px -18px rgba(15, 23, 42, 0.25), 0 6px 16px -8px rgba(15, 23, 42, 0.12);
  padding: 4px;
  max-height: 220px;
  overflow-y: auto;
  animation: peTagPop 0.12s ease;
}
@keyframes peTagPop {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pe-tag-suggest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--text);
  text-align: left;
  font-family: inherit;
}
.pe-tag-suggest-item:hover,
.pe-tag-suggest-item.active {
  background: var(--panel-2);
}
.pe-tag-suggest-item.active {
  background: color-mix(in oklab, var(--accent) 12%, var(--panel));
}
.pe-tag-suggest-name {
  flex: 1;
  font-weight: 500;
}
.pe-tag-suggest-count {
  font-size: 10.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--panel-2);
}
.pe-tag-suggest-item.active .pe-tag-suggest-count {
  background: var(--accent);
  color: white;
}

/* Gallery */
.pe-gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.pe-gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 7px;
  background-size: cover;
  background-position: center;
  background-color: var(--panel-2);
  border: 1px solid var(--border-2);
}
.pe-gallery-x {
  position: absolute;
  top: 4px; right: 4px;
  width: 18px; height: 18px;
  border-radius: 999px;
  background: rgba(0,0,0,0.55);
  color: white;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.pe-gallery-add { display: flex; flex-direction: column; gap: 4px; }

/* Telegram card */
.pe-card-platform {
  border-color: color-mix(in oklab, #2AABEE 30%, var(--border));
  background: linear-gradient(180deg,
    color-mix(in oklab, #2AABEE 4%, var(--panel)) 0%,
    var(--panel) 100%);
}

.pe-adapted {
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 9px;
  padding: 10px 12px;
}
.pe-adapted-label {
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.pe-adapted-body {
  font-size: 12.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--text);
  max-height: 200px;
  overflow-y: auto;
}

/* Error toast */
.pe-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 28px;
  padding: 10px 13px;
  background: var(--danger-bg);
  border: 1px solid color-mix(in oklab, var(--danger) 25%, transparent);
  border-radius: 9px;
  font-size: 12.5px;
  color: var(--danger);
  animation: errSlide 0.3s ease both;
}
@keyframes errSlide {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ───── Telegram preview (inline + switch) ───── */
.pe-preview-wrap {
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.pe-preview-wrap.on {
  background: linear-gradient(180deg,
    color-mix(in oklab, #2AABEE 7%, var(--panel)) 0%,
    var(--panel) 100%);
  border-color: color-mix(in oklab, #2AABEE 25%, var(--border));
  border-radius: 16px;
  box-shadow: 0 10px 30px -10px rgba(42,171,238,0.18);
}
.pe-preview-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
}
.pe-preview-head-icon {
  width: 24px; height: 24px;
  border-radius: 7px;
  background: var(--panel-2);
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.pe-preview-wrap.on .pe-preview-head-icon {
  background: #2AABEE;
  color: white;
}
.pe-preview-head-title {
  flex: 1;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--text);
}
.pe-preview-head-lang {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  background: var(--accent);
  color: white;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.pe-preview-body {
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: pePreviewIn 0.25s ease both;
}
@keyframes pePreviewIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pe-preview-hint {
  font-size: 10.5px;
  color: var(--muted);
  line-height: 1.45;
  text-align: center;
  padding: 0 6px;
}

/* iOS-style switch */
.pe-switch {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: var(--border);
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.25s cubic-bezier(.4,0,.2,1);
}
.pe-switch.on {
  background: #34c759;
}
.pe-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04);
  transition: transform 0.25s cubic-bezier(.4,0,.2,1);
}
.pe-switch.on .pe-switch-thumb {
  transform: translateX(16px);
}
.pe-switch:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 1100px) {
  .pe-body {
    grid-template-columns: 1fr;
  }
  .pe-sidebar { position: static; }
}
@media (max-width: 720px) {
  .pe-hero,
  .pe-body { padding-left: 16px; padding-right: 16px; }
  .pe-hero-inner { flex-wrap: wrap; }
  .pe-title-input { font-size: 20px; }
  .pe-hide-sm { display: none; }
}
</style>
