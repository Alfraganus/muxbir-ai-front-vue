<template>
  <AppModal v-model="show" :title="title" :subtitle="subtitle" width="640px">
    <div style="display:flex;flex-direction:column;gap:12px;">
      <!-- Editor toolbar + content (lightweight contenteditable) -->
      <div class="sig-editor">
        <div class="sig-toolbar">
          <button type="button" class="sig-btn" @click="exec('bold')"
                  :class="{ on: state.bold }" title="Qalin (Ctrl+B)"><b>B</b></button>
          <button type="button" class="sig-btn" @click="exec('italic')"
                  :class="{ on: state.italic }" title="Kursiv (Ctrl+I)"><i>I</i></button>
          <button type="button" class="sig-btn" @click="exec('underline')"
                  :class="{ on: state.underline }" title="Tag ostida"><u>U</u></button>
          <button type="button" class="sig-btn" @click="exec('strikeThrough')"
                  :class="{ on: state.strike }" title="Chizilgan"><s>S</s></button>
          <span class="sig-sep"/>
          <button type="button" class="sig-btn" @click="toggleBlockquote"
                  :class="{ on: state.blockquote }" title="Iqtibos (Telegram blockquote)">
            ❝ Iqtibos
          </button>
          <button type="button" class="sig-btn" @click="exec('formatBlock', 'p')"
                  title="Oddiy paragraf (iqtibosdan chiqish)">¶</button>
          <span class="sig-sep"/>
          <button type="button" class="sig-btn" @click="openLinkDialog" title="Havola qo'shish">
            <AppIcon name="Globe" :size="13"/> Havola
          </button>
          <button type="button" class="sig-btn" @click="removeLink" title="Havolani olib tashlash">
            <AppIcon name="Close" :size="11"/>
          </button>
          <span class="sig-sep"/>
          <button type="button" class="sig-btn" @click="insertSeparator" title="Vertical chiziq | ajratuvchi">
            |
          </button>
          <button type="button" class="sig-btn" @click="clearAll" title="Hammasini tozalash">
            Tozalash
          </button>
        </div>
        <div
          ref="editorRef"
          class="sig-content"
          contenteditable="true"
          spellcheck="false"
          @input="onInput"
          @keyup="updateToolbarState"
          @mouseup="updateToolbarState"
          @paste="onPaste"
        />
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:var(--muted);">
          Imzo har bir yuborilgan post oxiriga avtomatik qo'shiladi.
          Telegram qo'llab-quvvatlaydigan teglar: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;s&gt;,
          &lt;a href&gt;, &lt;code&gt;.
        </span>
        <span style="font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums;">
          {{ textLength }}/2000
        </span>
      </div>

      <!-- Live preview (Telegram-style) -->
      <div v-if="hasContent" class="sig-preview">
        <div class="sig-preview-label">Telegramda qanday ko'rinadi:</div>
        <div class="sig-preview-bubble">
          <div class="sig-preview-msg">[AI yozgan postingiz matni shu yerda…]</div>
          <div class="sig-preview-sig" v-html="htmlValue"/>
        </div>
      </div>

      <div v-if="error" class="sig-error">
        <AppIcon name="Close" :size="12"/> {{ error }}
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" size="md" @click="close" :disabled="saving">
        Bekor qilish
      </AppButton>
      <AppButton variant="danger" size="md" :disabled="saving || !hasContent"
                 @click="clearAndSave" title="Imzoni o'chirish">
        <template #icon><AppIcon name="Trash" :size="12"/></template>
        Imzoni olib tashlash
      </AppButton>
      <AppButton variant="primary" size="md" :loading="saving" @click="save">
        <template #icon><AppIcon name="Check" :size="13"/></template>
        Saqlash
      </AppButton>
    </template>

    <!-- Link sub-modal -->
    <AppModal v-model="linkOpen" title="Havola qo'shish" subtitle="Tanlangan matnga URL biriktiring"
              width="480px">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">Matn</span>
          <input v-model="linkForm.text" placeholder="Masalan: RASMIY"
                 style="padding:9px 12px;border:1px solid var(--border-2);border-radius:7px;
                        background:var(--bg);color:var(--text);font-size:13px;outline:none;"/>
        </label>
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">URL</span>
          <input v-model="linkForm.url" placeholder="https://t.me/yourchannel"
                 type="url" autocomplete="off"
                 style="padding:9px 12px;border:1px solid var(--border-2);border-radius:7px;
                        background:var(--bg);color:var(--text);font-size:13px;
                        font-family:'JetBrains Mono',monospace;outline:none;"/>
        </label>
      </div>
      <template #footer>
        <AppButton variant="secondary" size="md" @click="linkOpen = false">Bekor</AppButton>
        <AppButton variant="primary" size="md" @click="applyLink"
                   :disabled="!linkForm.text.trim() || !linkForm.url.trim()">
          Qo'shish
        </AppButton>
      </template>
    </AppModal>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch, nextTick, reactive } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  channel: { type: Object, default: null },
  initialSignature: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'saved', 'save'])

const show = ref(props.modelValue)
watch(() => props.modelValue, (v) => { show.value = v })
watch(show, (v) => emit('update:modelValue', v))

const editorRef = ref(null)
const htmlValue = ref('')
const error = ref('')
const saving = ref(false)

const linkOpen = ref(false)
const linkForm = reactive({ text: '', url: '' })
let savedRange = null

const state = reactive({
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  blockquote: false,
})

const title = computed(() =>
  props.channel
    ? `Kanal imzosi — ${props.channel.display_name || props.channel.username || 'kanal'}`
    : 'Kanal imzosi'
)
const subtitle = "Har bir yuborilayotgan post oxiriga qo'shiladigan imzo. Havolalar qo'llab-quvvatlanadi."

const hasContent = computed(() => !!htmlValue.value.replace(/<[^>]+>/g, '').trim())
const textLength = computed(() => htmlValue.value.length)

// Modal ochilganda content'ni initialize qilamiz
watch(() => props.modelValue, async (v) => {
  if (v) {
    error.value = ''
    htmlValue.value = props.initialSignature || ''
    await nextTick()
    if (editorRef.value) editorRef.value.innerHTML = htmlValue.value
  }
}, { immediate: true })

function onInput() {
  if (editorRef.value) {
    htmlValue.value = editorRef.value.innerHTML
  }
  updateToolbarState()
}

function onPaste(e) {
  // HTML emas, faqat plain text yopishtirsin (formatlash buzilmasligi uchun)
  e.preventDefault()
  const text = e.clipboardData.getData('text/plain')
  document.execCommand('insertText', false, text)
}

function exec(command, value) {
  editorRef.value?.focus()
  document.execCommand(command, false, value ?? null)
  onInput()
}

/** Tanlangan matnni <blockquote> ichiga oladi (yoki yangi bo'sh bloc yaratadi). */
function toggleBlockquote() {
  editorRef.value?.focus()
  // execCommand('formatBlock', '<blockquote>') — barcha asosiy brauzerlarda ishlaydi
  document.execCommand('formatBlock', false, '<blockquote>')
  onInput()
}

/** Cursor joyiga " | " ajratuvchi qo'yadi. */
function insertSeparator() {
  editorRef.value?.focus()
  document.execCommand('insertText', false, ' | ')
  onInput()
}

function updateToolbarState() {
  state.bold = document.queryCommandState('bold')
  state.italic = document.queryCommandState('italic')
  state.underline = document.queryCommandState('underline')
  state.strike = document.queryCommandState('strikeThrough')
  // queryCommandValue('formatBlock') brauzerga qarab 'blockquote' yoki '' qaytaradi
  const block = String(document.queryCommandValue('formatBlock') || '').toLowerCase()
  state.blockquote = block === 'blockquote'
}

function saveSelection() {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0).cloneRange()
}
function restoreSelection() {
  if (!savedRange) return false
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(savedRange)
  return true
}

function openLinkDialog() {
  editorRef.value?.focus()
  saveSelection()
  // Tanlangan matn bo'lsa, "text" maydoniga qo'yamiz
  const sel = window.getSelection()
  linkForm.text = sel?.toString() || ''
  linkForm.url = ''
  linkOpen.value = true
}

function applyLink() {
  const text = linkForm.text.trim()
  let url = linkForm.url.trim()
  if (!text || !url) return
  // URL ga schema qo'shamiz, agar yo'q bo'lsa
  if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !url.startsWith('tg://')) {
    url = 'https://' + url
  }
  editorRef.value?.focus()
  restoreSelection()
  // Tanlangan matn bo'lsa o'rniga, yo'q bo'lsa cursor joyiga
  const sel = window.getSelection()
  if (sel && !sel.isCollapsed) {
    document.execCommand('insertHTML', false,
      `<a href="${escapeAttr(url)}">${escapeHtml(text)}</a>`)
  } else {
    document.execCommand('insertHTML', false,
      `<a href="${escapeAttr(url)}">${escapeHtml(text)}</a>`)
  }
  onInput()
  linkOpen.value = false
}

function removeLink() {
  editorRef.value?.focus()
  document.execCommand('unlink', false, null)
  onInput()
}

function clearAll() {
  if (!confirm("Imzo matni to'liq tozalansin?")) return
  if (editorRef.value) editorRef.value.innerHTML = ''
  htmlValue.value = ''
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;')
}

async function save() {
  error.value = ''
  if (htmlValue.value.length > 2000) {
    error.value = '2000 belgidan oshmasin'
    return
  }
  saving.value = true
  try {
    await emit('save', htmlValue.value.trim() || null)
  } catch (e) {
    error.value = e?.message || "Saqlashda xato"
  } finally {
    saving.value = false
  }
}

async function clearAndSave() {
  if (!confirm("Imzo butunlay olib tashlansin?")) return
  htmlValue.value = ''
  saving.value = true
  try {
    await emit('save', null)
  } finally {
    saving.value = false
  }
}

function close() {
  show.value = false
}

defineExpose({
  setSaving(v) { saving.value = v },
  closeWithSuccess() { show.value = false; emit('saved') },
  setError(msg) { error.value = msg },
})
</script>

<style scoped>
.sig-editor {
  border: 1px solid var(--border-2);
  border-radius: 9px;
  background: var(--bg);
  overflow: hidden;
}
.sig-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-2);
  background: var(--panel, rgba(0,0,0,0.02));
}
.sig-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 30px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--text);
}
.sig-btn:hover { background: rgba(99, 102, 241, 0.10); }
.sig-btn.on {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.30);
  color: var(--accent);
}
.sig-sep {
  display: inline-block;
  width: 1px;
  height: 18px;
  margin: 5px 4px;
  background: var(--border);
}
.sig-content {
  min-height: 120px;
  max-height: 320px;
  overflow-y: auto;
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 1.55;
  outline: none;
  color: var(--text);
  white-space: pre-wrap;
}
.sig-content:focus { outline: none; }
.sig-content :deep(a) {
  color: var(--accent);
  text-decoration: underline;
}
.sig-content :deep(blockquote),
.sig-preview-sig :deep(blockquote) {
  position: relative;
  margin: 6px 0;
  padding: 6px 28px 6px 12px;
  border-left: 3px solid #2AABEE;
  background: rgba(42, 171, 238, 0.08);
  border-radius: 0 8px 8px 0;
  color: var(--text);
  font-style: normal;
  quotes: none;
}
.sig-content :deep(blockquote)::after,
.sig-preview-sig :deep(blockquote)::after {
  content: '❞';
  position: absolute;
  top: 4px;
  right: 8px;
  color: #2AABEE;
  font-size: 16px;
  line-height: 1;
  font-weight: 700;
  opacity: 0.9;
}
.sig-content:empty::before {
  content: 'Imzo matnini bu yerga yozing... Havola qo\'shish uchun "🌐 Havola" tugmasini ishlating.';
  color: var(--muted);
  font-style: italic;
  pointer-events: none;
}

/* Preview */
.sig-preview {
  border-radius: 10px;
  background: rgba(42, 171, 238, 0.06);
  border: 1px solid rgba(42, 171, 238, 0.20);
  padding: 10px 12px;
}
.sig-preview-label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 8px;
}
.sig-preview-bubble {
  background: var(--bg);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text);
}
.sig-preview-msg {
  color: var(--muted);
  font-style: italic;
}
.sig-preview-sig {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-2);
  white-space: pre-wrap;
}
.sig-preview-sig :deep(a) { color: var(--accent); }

.sig-error {
  padding: 9px 11px;
  border-radius: 7px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
