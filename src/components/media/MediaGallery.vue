<template>
  <AppModal v-model="open" title="Media kutubxona" subtitle="Buckettagi rasmlardan tanlang yoki yangisini yuklang" width="880px">
    <div class="mg-root">
      <!-- Toolbar -->
      <div class="mg-toolbar">
        <div class="mg-search">
          <AppIcon name="Search" :size="13" :style="{ color: 'var(--muted)' }"/>
          <input v-model="search" placeholder="Qidirish (URL bo'yicha)" @input="debounceLoad"/>
        </div>
        <input ref="fileInput" type="file" accept="image/*" :multiple="multiple"
          @change="onUpload" hidden/>
        <AppButton variant="primary" size="md" :loading="uploading" @click="fileInput?.click()">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          Yangi yuklash
        </AppButton>
      </div>

      <!-- Folders strip — root chip "Asosiy" + custom folders -->
      <div class="mg-folders">
        <button class="mg-folder" :class="{ active: !scope }" @click="setScope(null)">
          <AppIcon name="Home" :size="13"/>
          <span class="mg-folder-name">Asosiy</span>
          <span class="mg-folder-count">{{ rootCount }}</span>
        </button>
        <div v-for="f in visibleFolders" :key="f.name"
          class="mg-folder" :class="{ active: scope === f.name }"
          @click="setScope(f.name)">
          <AppIcon name="Tag" :size="12"/>
          <span class="mg-folder-name">{{ f.name }}</span>
          <span class="mg-folder-count">{{ f.count }}</span>
          <span class="mg-folder-size">{{ formatBytes(f.size) }}</span>
          <button type="button"
            class="mg-folder-del"
            :disabled="deletingFolders.has(f.name)"
            title="Folderni o'chirish"
            @mousedown.stop
            @click="handleFolderDelete($event, f)">
            <AppIcon name="Close" :size="10"/>
          </button>
        </div>
        <button type="button" class="mg-folder mg-folder-new" @click="newFolderOpen = true" title="Yangi papka">
          <AppIcon name="Plus" :size="12"/>
          <span class="mg-folder-name">Yangi papka</span>
        </button>
      </div>

      <!-- Confirm banner (custom — native confirm() ba'zi embed muhitlarda ishlamaydi) -->
      <div v-if="pendingConfirm" class="mg-confirm">
        <AppIcon name="Close" :size="14" :style="{ color: 'var(--danger)' }"/>
        <span class="mg-confirm-msg">{{ pendingConfirm.message }}</span>
        <div style="display:flex;gap:6px;">
          <AppButton variant="secondary" size="md" @click="pendingConfirm = null">Bekor</AppButton>
          <AppButton variant="primary" size="md" :loading="confirmRunning" @click="runConfirmed">
            Ha, o'chir
          </AppButton>
        </div>
      </div>

      <!-- New folder inline modal -->
      <div v-if="newFolderOpen" class="mg-new-folder">
        <input v-model="newFolderName"
          placeholder="Papka nomi (masalan: events)"
          class="mg-new-folder-input"
          @keydown.enter.prevent="createFolder"
          @keydown.escape="newFolderOpen = false"
          ref="newFolderInputEl"/>
        <AppButton variant="primary" size="md" :loading="creatingFolder" @click="createFolder">Yaratish</AppButton>
        <AppButton variant="secondary" size="md" @click="newFolderOpen = false">Bekor</AppButton>
      </div>

      <!-- Breadcrumb / back -->
      <div v-if="scope" class="mg-breadcrumb">
        <button type="button" class="mg-back" @click="setScope(null)" title="Orqaga">
          <AppIcon name="ChevronL" :size="13"/>
          <span>Asosiy</span>
        </button>
        <AppIcon name="ChevronR" :size="11" :style="{ color: 'var(--muted-2)' }"/>
        <span class="mg-crumb-name">{{ scope }}</span>
      </div>

      <!-- Loading / empty -->
      <div v-if="loading" class="mg-status">Yuklanmoqda…</div>
      <div v-else-if="!scope && !files.length && !visibleFolders.length" class="mg-empty">
        <AppIcon name="Layers" :size="34" :style="{ color: 'var(--muted-2)' }"/>
        <div class="mg-empty-title">Kutubxona bo'sh</div>
        <div class="mg-empty-sub">Papka yarating yoki rasm yuklang</div>
      </div>
      <div v-else-if="scope && !files.length" class="mg-empty">
        <AppIcon name="Tag" :size="34" :style="{ color: 'var(--muted-2)' }"/>
        <div class="mg-empty-title">Bu papka bo'sh</div>
        <div class="mg-empty-sub">Yangi rasm yuklang</div>
      </div>

      <!-- Grid -->
      <div v-else class="mg-grid">
        <!-- Folder cards (only at root level "Barchasi") -->
        <template v-if="!scope">
          <div v-for="f in visibleFolders" :key="`folder-${f.name}`"
            class="mg-item mg-item-folder"
            @click="setScope(f.name)">
            <div class="mg-folder-card">
              <AppIcon name="Layers" :size="28" :style="{ color: 'var(--accent)' }"/>
              <div class="mg-folder-card-name">{{ f.name }}</div>
              <div class="mg-folder-card-meta">{{ f.count }} ta · {{ formatBytes(f.size) }}</div>
            </div>
            <button v-if="f.name !== 'posts'" type="button"
              class="mg-del"
              :disabled="deletingFolders.has(f.name)"
              title="Folderni o'chirish"
              @mousedown.stop
              @click="handleFolderDelete($event, f)">
              <AppIcon name="Trash" :size="11"/>
            </button>
          </div>
        </template>

        <!-- File cards -->
        <div v-for="f in files" :key="f.id"
          class="mg-item"
          :class="{ selected: selectedSet.has(f.url), deleting: deletingIds.has(f.id) }"
          @click="toggle(f)">
          <div class="mg-thumb" :style="{ backgroundImage: `url(${f.url})` }"/>
          <div class="mg-item-meta">
            <span class="mg-item-size">{{ formatBytes(f.size) }}</span>
            <span class="mg-item-scope">{{ f.scope }}</span>
          </div>
          <div v-if="selectedSet.has(f.url)" class="mg-check">
            <AppIcon name="Check" :size="13"/>
          </div>
          <button type="button" class="mg-del"
            :disabled="deletingIds.has(f.id)"
            title="O'chirish"
            @mousedown.stop
            @click="handleFileDelete($event, f)">
            <AppIcon name="Trash" :size="11"/>
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="files.length && total > files.length + offset" class="mg-more">
        <AppButton variant="secondary" size="md" @click="loadMore">Ko'proq yuklash</AppButton>
      </div>
    </div>

    <template #footer>
      <div class="mg-footer">
        <span class="mg-footer-info">
          <template v-if="selected.length">{{ selected.length }} ta tanlandi</template>
          <template v-else>Tanlang yoki yangi yuklang</template>
        </span>
        <div style="display:flex;gap:8px;">
          <AppButton variant="secondary" size="md" @click="open = false">Bekor qilish</AppButton>
          <AppButton variant="primary" size="md" :disabled="!selected.length" @click="confirm">
            Tanlash ({{ selected.length }})
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { uploadsApi } from '@/api/uploads.js'
import { useStorageStore } from '@/stores/storage.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'pick'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const folders = ref([])
const files = ref([])
const total = ref(0)
const totalAll = ref(0)
const scope = ref(null)
const search = ref('')
const offset = ref(0)
const PAGE = 60
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref(null)
const selected = ref([]) // array of urls
const selectedSet = computed(() => new Set(selected.value))
// "Asosiy" view'da folder cards — 'posts' (root) o'zi child folder emas, chiqarib tashlaymiz
const visibleFolders = computed(() =>
  [...folders.value].filter(f => f.name !== 'posts').sort((a, b) => a.name.localeCompare(b.name))
)
// Asosiy papka sanog'i (root fayllar)
const rootCount = computed(() => folders.value.find(f => f.name === 'posts')?.count ?? 0)
const deletingIds = ref(new Set())
const deletingFolders = ref(new Set())
// Custom confirm dialog — native confirm() ba'zi embed/iframe muhitlarda ishlamaydi
const pendingConfirm = ref(null) // { message, action: () => Promise<void> }
const confirmRunning = ref(false)

async function runConfirmed() {
  if (!pendingConfirm.value?.action) { pendingConfirm.value = null; return }
  confirmRunning.value = true
  try {
    await pendingConfirm.value.action()
  } finally {
    confirmRunning.value = false
    pendingConfirm.value = null
  }
}
const newFolderOpen = ref(false)
const newFolderName = ref('')
const newFolderInputEl = ref(null)
const creatingFolder = ref(false)
const storageStore = useStorageStore()

watch(newFolderOpen, async (v) => {
  if (v) {
    newFolderName.value = ''
    await nextTick()
    newFolderInputEl.value?.focus?.()
  }
})

async function createFolder() {
  const name = newFolderName.value.trim()
  if (!name) return
  creatingFolder.value = true
  try {
    const created = await uploadsApi.createFolder(name)
    // Lokal ro'yxatga qo'shamiz va o'sha folderga o'tamiz
    if (created?.name) {
      if (!folders.value.find(f => f.name === created.name)) {
        folders.value = [...folders.value, { name: created.name, count: 0, size: 0 }]
          .sort((a, b) => a.name.localeCompare(b.name))
      }
      newFolderOpen.value = false
      setScope(created.name)
    }
  } catch (e) {
    alert(e?.response?.data?.message || 'Folder yaratishda xato')
  } finally {
    creatingFolder.value = false
  }
}

function onDeleteFolder(f) {
  if (!f?.name || deletingFolders.value.has(f.name)) return
  const message = f.count
    ? `"${f.name}" papka va uning ichidagi ${f.count} ta rasm butunlay o'chirilsinmi?`
    : `"${f.name}" bo'sh papka o'chirilsinmi?`
  pendingConfirm.value = {
    message,
    action: () => doDeleteFolder(f),
  }
}

async function doDeleteFolder(f) {
  deletingFolders.value = new Set([...deletingFolders.value, f.name])
  try {
    const res = await uploadsApi.deleteFolder(f.name)
    folders.value = folders.value.filter(x => x.name !== f.name)
    if (scope.value === f.name) {
      scope.value = null
      await load(true)
    } else {
      files.value = files.value.filter(x => x.scope !== f.name)
    }
    totalAll.value = Math.max(0, totalAll.value - (Number(f.count) || 0))
    storageStore.refresh()
  } catch (e) {
    console.error('[MediaGallery] folder delete xato:', e?.response?.status, e?.response?.data, e)
    const status = e?.response?.status
    const msg = e?.response?.data?.message
    if (status === 404) {
      alert("Backend yangilanmagan — '/uploads/folders/...' endpoint topilmadi. Backend'ni qayta ishga tushiring (npm run start:dev)")
    } else {
      alert((Array.isArray(msg) ? msg.join('. ') : msg) || `Folder o'chirishda xato (${status || 'tarmoq'})`)
    }
  } finally {
    const next = new Set(deletingFolders.value)
    next.delete(f.name)
    deletingFolders.value = next
  }
}

function handleFileDelete(e, f) {
  if (e) { e.preventDefault(); e.stopPropagation() }
  console.log('[MediaGallery] file delete click', f)
  return onDelete(f)
}

function handleFolderDelete(e, f) {
  if (e) { e.preventDefault(); e.stopPropagation() }
  console.log('[MediaGallery] folder delete click', f)
  return onDeleteFolder(f)
}

async function onDelete(f) {
  if (!f?.url || deletingIds.value.has(f.id)) return
  // Custom confirm — UI ichida tasdiqlash
  pendingConfirm.value = {
    message: `Ushbu rasm (${formatBytes(f.size)}) bucket'dan butunlay o'chirilsinmi?`,
    action: () => doDeleteFile(f),
  }
}

async function doDeleteFile(f) {
  // Reactive Set yangilash uchun yangi Set
  deletingIds.value = new Set([...deletingIds.value, f.id])
  try {
    console.log('[MediaGallery] DELETE /uploads/by-url', f.url)
    const res = await uploadsApi.deleteByUrls([f.url])
    console.log('[MediaGallery] backend javob:', res)
    files.value = files.value.filter(x => x.id !== f.id)
    // Selected'dan ham olib tashlaymiz
    const i = selected.value.indexOf(f.url)
    if (i >= 0) selected.value.splice(i, 1)
    // Folder count'ni darhol pasaytiramiz (server qayta yuklanmasdan)
    const fi = folders.value.findIndex(x => x.name === f.scope)
    if (fi >= 0) {
      const updated = { ...folders.value[fi] }
      updated.count = Math.max(0, updated.count - 1)
      updated.size = Math.max(0, updated.size - Number(f.size || 0))
      if (updated.count === 0) folders.value.splice(fi, 1)
      else folders.value[fi] = updated
    }
    totalAll.value = Math.max(0, totalAll.value - 1)
    total.value = Math.max(0, total.value - 1)
    storageStore.refresh()
  } catch (err) {
    console.error('[MediaGallery] image delete xato:', err?.response?.status, err?.response?.data, err)
    const status = err?.response?.status
    const msg = err?.response?.data?.message
    if (status === 404) {
      alert("Backend yangilanmagan — DELETE /uploads/by-url endpoint topilmadi. Backend'ni qayta ishga tushiring.")
    } else {
      alert((Array.isArray(msg) ? msg.join('. ') : msg) || `O'chirishda xato (${status || 'tarmoq'})`)
    }
  } finally {
    const next = new Set(deletingIds.value)
    next.delete(f.id)
    deletingIds.value = next
  }
}

async function load(reset = true) {
  loading.value = true
  if (reset) {
    offset.value = 0
    files.value = []
  }
  try {
    // "Barchasi" view (scope=null) — root papka (`posts`) fayllarini ko'rsatamiz,
    // boshqa papkalardagi fayllar faqat o'sha papkaga kirilganda chiqadi.
    const effectiveScope = scope.value || 'posts'
    const res = await uploadsApi.media({
      scope: effectiveScope,
      search: search.value || undefined,
      limit: PAGE,
      offset: offset.value,
    })
    folders.value = res.folders || []
    if (reset) {
      files.value = res.files || []
      // Total "barchasi" — folders count yig'indisi
      totalAll.value = (res.folders || []).reduce((s, f) => s + (f.count || 0), 0)
    } else {
      files.value = [...files.value, ...(res.files || [])]
    }
    total.value = res.total || 0
  } catch { /* jim */ } finally {
    loading.value = false
  }
}

function setScope(s) {
  scope.value = s
  load(true)
}

function loadMore() {
  offset.value += PAGE
  load(false)
}

let debounceT = null
function debounceLoad() {
  clearTimeout(debounceT)
  debounceT = setTimeout(() => load(true), 250)
}

function toggle(f) {
  if (props.multiple) {
    const i = selected.value.indexOf(f.url)
    if (i >= 0) selected.value.splice(i, 1)
    else selected.value.push(f.url)
  } else {
    selected.value = [f.url]
  }
}

function confirm() {
  if (!selected.value.length) return
  emit('pick', props.multiple ? [...selected.value] : selected.value[0])
  open.value = false
}

async function onUpload(e) {
  const fls = Array.from(e.target.files || [])
  e.target.value = ''
  if (!fls.length) return
  uploading.value = true
  // Hozir tanlangan papkaga (scope) yuklaymiz; tanlanmagan bo'lsa default ('posts')
  const targetScope = scope.value || undefined
  try {
    if (props.multiple) {
      const res = await uploadsApi.uploadImages(fls, targetScope)
      const urls = (res?.files || []).map(f => f.url).filter(Boolean)
      selected.value = [...selected.value, ...urls]
    } else {
      const res = await uploadsApi.uploadImage(fls[0], targetScope)
      if (res?.url) selected.value = [res.url]
    }
    storageStore.refresh()
    await load(true)
  } catch (err) {
    alert(err?.response?.data?.message || 'Yuklashda xato')
  } finally {
    uploading.value = false
  }
}

function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return v + ' B'
  if (v < 1024 * 1024) return (v / 1024).toFixed(0) + ' KB'
  if (v < 1024 * 1024 * 1024) return (v / (1024 * 1024)).toFixed(1).replace(/\.0$/, '') + ' MB'
  return (v / (1024 * 1024 * 1024)).toFixed(2).replace(/\.00$/, '') + ' GB'
}

watch(open, (v) => {
  if (v) {
    selected.value = []
    scope.value = null
    search.value = ''
    load(true)
  }
})
</script>

<style scoped>
.mg-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 420px;
  max-height: 70vh;
}

/* Toolbar */
.mg-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.mg-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 11px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 8px;
}
.mg-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
}

/* Folders strip */
.mg-folders {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.mg-folder {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: inherit;
  transition: all 0.15s;
}
.mg-folder:hover {
  border-color: color-mix(in oklab, var(--accent) 50%, var(--border));
}
.mg-folder.active {
  background: color-mix(in oklab, var(--accent) 12%, var(--panel));
  border-color: var(--accent);
}
.mg-folder-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  text-transform: capitalize;
}
.mg-folder-count {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--muted);
}
.mg-folder.active .mg-folder-count {
  background: var(--accent);
  color: white;
}
.mg-folder-size {
  font-size: 10.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.mg-folder {
  position: relative;
}
.mg-folder-del {
  width: 20px;
  height: 20px;
  margin-left: 4px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
  z-index: 5;
}
.mg-folder-del:hover {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
  transform: scale(1.1);
}
.mg-folder-del:disabled { opacity: 0.5; cursor: wait; }

.mg-folder-new {
  background: transparent;
  border-style: dashed;
  color: var(--accent);
}
.mg-folder-new .mg-folder-name { color: var(--accent); }
.mg-folder-new:hover {
  background: color-mix(in oklab, var(--accent) 8%, var(--panel));
  border-style: dashed;
}

/* Custom confirm banner */
.mg-confirm {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--danger-bg);
  border: 1px solid color-mix(in oklab, var(--danger) 35%, transparent);
  border-radius: 10px;
  animation: mgConfirmIn 0.18s ease;
}
@keyframes mgConfirmIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mg-confirm-msg {
  flex: 1;
  font-size: 12.5px;
  color: var(--text);
  font-weight: 500;
}

/* Inline create folder bar */
.mg-new-folder {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
  background: color-mix(in oklab, var(--accent) 6%, var(--panel-2));
  border: 1px solid color-mix(in oklab, var(--accent) 40%, var(--border));
  border-radius: 10px;
}
.mg-new-folder-input {
  flex: 1;
  height: 32px;
  padding: 0 11px;
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 7px;
  font-size: 13px;
  color: var(--text);
  outline: none;
  font-family: inherit;
}
.mg-new-folder-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}

/* Breadcrumb */
.mg-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 2px;
  font-size: 12.5px;
}
.mg-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px 0 6px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-2);
  cursor: pointer;
  font-family: inherit;
}
.mg-back:hover {
  border-color: var(--accent);
  color: var(--text);
}
.mg-crumb-name {
  font-weight: 600;
  color: var(--text);
  text-transform: capitalize;
}

/* Grid */
.mg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
  grid-auto-rows: max-content; /* har item o'z balandligi bilan */
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  padding: 2px;
  align-content: start;
}
.mg-item {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: var(--panel);
  border: 2px solid var(--border-2);
  cursor: pointer;
  transition: all 0.15s;
  overflow: hidden;
}
.mg-item:hover {
  border-color: color-mix(in oklab, var(--accent) 60%, var(--border));
  transform: translateY(-1px);
  box-shadow: 0 6px 20px -10px rgba(15, 23, 42, 0.2);
}
.mg-item.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent);
}
.mg-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--panel-2);
  flex-shrink: 0;
  display: block;
}

/* Folder card */
.mg-item-folder { cursor: pointer; }
.mg-folder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px 10px 22px;
  aspect-ratio: 1 / 1;
  background: linear-gradient(160deg,
    color-mix(in oklab, var(--accent) 6%, var(--panel)) 0%,
    var(--panel) 100%);
  text-align: center;
}
.mg-folder-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90%;
}
.mg-folder-card-meta {
  font-size: 10.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.mg-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  font-size: 10.5px;
}
.mg-item-size {
  font-variant-numeric: tabular-nums;
  color: var(--text-2);
  font-weight: 500;
}
.mg-item-scope {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--muted);
  font-weight: 500;
  text-transform: capitalize;
}
.mg-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  background: var(--accent);
  color: white;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px -2px color-mix(in oklab, var(--accent) 60%, transparent);
}

.mg-del :deep(svg) { pointer-events: none; }
.mg-folder-del :deep(svg) { pointer-events: none; }
.mg-del {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 5;
  width: 24px;
  height: 24px;
  background: rgba(15, 23, 42, 0.7);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: background 0.15s, transform 0.15s, border-color 0.15s;
}
.mg-del:hover {
  background: var(--danger);
  border-color: white;
  transform: scale(1.08);
}
.mg-del:disabled {
  opacity: 0.6;
  cursor: wait;
}
.mg-item.deleting {
  opacity: 0.5;
  pointer-events: none;
}

/* Empty / status */
.mg-status,
.mg-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  padding: 40px 20px;
}
.mg-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
}
.mg-empty-sub { font-size: 12px; }

/* More */
.mg-more { display: flex; justify-content: center; padding: 4px 0; }

/* Footer */
.mg-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.mg-footer-info {
  font-size: 12px;
  color: var(--muted);
}
</style>
