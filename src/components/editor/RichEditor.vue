<template>
  <div class="rich-editor-wrap">
    <div v-if="!readOnly" class="rich-toolbar">
      <template v-if="!sourceMode">
        <button type="button" class="rt-btn" :class="{ on: isActive('bold') }" @click="run(c => c.toggleBold())" :title="tt('richEditor.boldTitle')"><b>B</b></button>
        <button type="button" class="rt-btn" :class="{ on: isActive('italic') }" @click="run(c => c.toggleItalic())" :title="tt('richEditor.italicTitle')"><i>I</i></button>
        <button type="button" class="rt-btn" :class="{ on: isActive('underline') }" @click="run(c => c.toggleUnderline())" :title="tt('richEditor.underlineTitle')"><u>U</u></button>
        <button type="button" class="rt-btn" :class="{ on: isActive('strike') }" @click="run(c => c.toggleStrike())" :title="tt('richEditor.strikeTitle')"><s>S</s></button>
        <span class="rt-sep"/>
        <button type="button" class="rt-btn" :class="{ on: isActive('heading', { level: 2 }) }" @click="run(c => c.toggleHeading({ level: 2 }))" title="H2">H2</button>
        <button type="button" class="rt-btn" :class="{ on: isActive('heading', { level: 3 }) }" @click="run(c => c.toggleHeading({ level: 3 }))" title="H3">H3</button>
        <span class="rt-sep"/>
        <button type="button" class="rt-btn" :class="{ on: isActive('bulletList') }" @click="run(c => c.toggleBulletList())" :title="tt('richEditor.bulletListTitle')">• List</button>
        <button type="button" class="rt-btn" :class="{ on: isActive('orderedList') }" @click="run(c => c.toggleOrderedList())" :title="tt('richEditor.orderedListTitle')">1. List</button>
        <button type="button" class="rt-btn" :class="{ on: isActive('blockquote') }" @click="run(c => c.toggleBlockquote())" :title="tt('richEditor.blockquoteTitle')">❝</button>
        <button type="button" class="rt-btn" :class="{ on: isActive('code') }" @click="run(c => c.toggleCode())" :title="tt('richEditor.inlineCodeTitle')"><code>&lt;/&gt;</code></button>
        <span class="rt-sep"/>
        <button type="button" class="rt-btn" :class="{ on: isActive('link') }" @click="onLinkClick" :title="tt('richEditor.linkTitle')">🔗</button>
        <button type="button" class="rt-btn" @click="onImageClick" :title="tt('richEditor.imageTitle')">🖼</button>
        <span class="rt-sep"/>
        <button type="button" class="rt-btn" @click="run(c => c.undo())" :title="tt('richEditor.undoTitle')">↶</button>
        <button type="button" class="rt-btn" @click="run(c => c.redo())" :title="tt('richEditor.redoTitle')">↷</button>
      </template>
      <template v-else>
        <span class="rt-source-label">{{ tt('richEditor.sourceLabel') }}</span>
      </template>
      <span class="rt-spacer"/>
      <button
        type="button"
        class="rt-btn rt-btn-source"
        :class="{ on: sourceMode }"
        @click="toggleSource"
        :title="sourceMode ? tt('richEditor.backToVisualTitle') : tt('richEditor.viewHtmlTitle')"
      >&lt;/&gt; {{ sourceMode ? tt('richEditor.visualBtn') : tt('richEditor.htmlBtn') }}</button>
    </div>

    <editor-content v-show="!sourceMode" :editor="editor" class="rich-editor-holder"/>

    <textarea
      v-if="sourceMode"
      v-model="sourceHtml"
      class="rich-editor-source"
      spellcheck="false"
      :placeholder="placeholder"
      @input="onSourceInput"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { uploadsApi } from '@/api/uploads.js'

const props = defineProps({
  // content_json: { html: "..." } shaklida — backwards compat: agar string kelsa, html sifatida qabul qilamiz
  modelValue: { type: [Object, String], default: () => ({ html: '' }) },
  placeholder: { type: String, default: 'Bu yerga yozing...' },
  readOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const editor = shallowRef(null)
// Editor'ning oxirgi emit qilgan HTML qiymati — watch shu bilan solishtirib,
// haqiqiy tashqi o'zgarishlarni o'zining emitidan ajratadi. Flag o'rniga ishlatamiz
// chunki flag race condition'larga moyil bo'ladi.
let lastEmittedHtml = ''

const sourceMode = ref(false)
const sourceHtml = ref('')

function toggleSource() {
  if (!editor.value) return
  if (!sourceMode.value) {
    // Vizual → HTML: editorning hozirgi HTML'ini textarea'ga ko'chiramiz
    sourceHtml.value = editor.value.getHTML()
    sourceMode.value = true
  } else {
    // HTML → Vizual: textareadagi HTML'ni editorga yuklaymiz
    editor.value.commands.setContent(sourceHtml.value || '', false)
    sourceMode.value = false
    const html = editor.value.getHTML()
    lastEmittedHtml = html
    emit('update:modelValue', { html })
  }
}

function onSourceInput() {
  // HTML manba rejimida ham tahrir qilinishi bilan parent yangilanadi
  const html = sourceHtml.value || ''
  lastEmittedHtml = html
  emit('update:modelValue', { html })
}

function extractHtml(v) {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') return v.html || ''
  return ''
}

function isActive(name, attrs) {
  return editor.value ? editor.value.isActive(name, attrs) : false
}

function run(fn) {
  if (!editor.value) return
  fn(editor.value.chain().focus()).run()
}

function onLinkClick() {
  if (!editor.value) return
  const prev = editor.value.getAttributes('link')?.href || ''
  const url = window.prompt(tt('richEditor.linkPrompt'), prev)
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: safe }).run()
}

async function onImageClick() {
  if (!editor.value) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const res = await uploadsApi.uploadImage(file)
      if (res?.url) {
        editor.value.chain().focus().setImage({ src: res.url }).run()
      }
    } catch (e) { /* ignore */ }
  }
  input.click()
}

onMounted(() => {
  editor.value = new Editor({
    editable: !props.readOnly,
    content: extractHtml(props.modelValue),
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: 'rt-code-block' } },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noopener nofollow', target: '_blank' },
      }),
      Image.configure({ inline: false, HTMLAttributes: { class: 'rt-img' } }),
      Placeholder.configure({ placeholder: props.placeholder }),
    ],
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      lastEmittedHtml = html
      emit('update:modelValue', { html })
    },
  })
})

watch(
  () => props.modelValue,
  (val) => {
    if (!editor.value) return
    const next = extractHtml(val)
    // Bizning o'zimiz emit qilgan qiymat qaytib kelmoqda — qayta yuklash kerak emas
    if (next === lastEmittedHtml) return
    // Editor'da allaqachon shu HTML bor — o'tkazib yuboramiz
    if (next === editor.value.getHTML()) return
    editor.value.commands.setContent(next, false)
    lastEmittedHtml = next
    // HTML manba rejimi ochiq bo'lsa textareani ham sinxronlaymiz
    if (sourceMode.value) sourceHtml.value = next
  },
  { deep: true },
)

watch(() => props.readOnly, (ro) => {
  if (editor.value) editor.value.setEditable(!ro)
})

onBeforeUnmount(() => {
  if (editor.value) {
    try { editor.value.destroy() } catch {}
    editor.value = null
  }
})
</script>

<style>
.rich-editor-wrap {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  min-height: 220px;
  transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;
}
.rich-editor-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}

.rich-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
  background: var(--panel-2, var(--panel));
}
.rt-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.2;
  min-width: 28px;
}
.rt-btn:hover { background: color-mix(in oklab, var(--text) 8%, transparent); }
.rt-btn.on { background: color-mix(in oklab, var(--accent) 18%, transparent); color: var(--accent); }
.rt-btn code { font-family: ui-monospace, monospace; font-size: 11px; }
.rt-sep {
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 4px;
}
.rt-spacer { flex: 1; }
.rt-source-label {
  font-size: 11.5px;
  color: var(--muted);
  padding: 2px 6px;
}
.rt-btn-source {
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  padding: 4px 9px;
  border: 1px solid var(--border);
}
.rt-btn-source.on {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.rich-editor-source {
  display: block;
  width: 100%;
  min-height: 220px;
  padding: 14px 18px;
  background: var(--panel);
  color: var(--text);
  border: none;
  outline: none;
  resize: vertical;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.55;
  white-space: pre;
  tab-size: 2;
}
.rich-editor-source::placeholder {
  color: var(--muted);
  opacity: 0.6;
}

.rich-editor-holder {
  min-height: 180px;
  color: var(--text);
  font-size: 14.5px;
  line-height: 1.6;
  padding: 14px 18px 20px;
}
.rich-editor-holder .ProseMirror {
  outline: none;
  min-height: 180px;
}
.rich-editor-holder .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--muted);
  opacity: 0.7;
  float: left;
  pointer-events: none;
  height: 0;
}
.rich-editor-holder .ProseMirror p { margin: 0 0 0.6em; }
.rich-editor-holder .ProseMirror h2 { font-size: 1.3em; margin: 0.8em 0 0.4em; font-weight: 700; }
.rich-editor-holder .ProseMirror h3 { font-size: 1.15em; margin: 0.7em 0 0.3em; font-weight: 600; }
.rich-editor-holder .ProseMirror h4 { font-size: 1.05em; margin: 0.6em 0 0.3em; font-weight: 600; }
.rich-editor-holder .ProseMirror ul,
.rich-editor-holder .ProseMirror ol { margin: 0.4em 0 0.8em; padding-left: 1.4em; }
.rich-editor-holder .ProseMirror li { margin: 0.2em 0; }
.rich-editor-holder .ProseMirror blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
  color: var(--text-2);
  margin: 0.6em 0;
}
.rich-editor-holder .ProseMirror code {
  background: color-mix(in oklab, var(--text) 8%, transparent);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.92em;
}
.rich-editor-holder .ProseMirror pre {
  background: color-mix(in oklab, var(--text) 8%, transparent);
  padding: 10px 12px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  margin: 0.6em 0;
}
.rich-editor-holder .ProseMirror pre code { background: transparent; padding: 0; }
.rich-editor-holder .ProseMirror a { color: var(--accent); text-decoration: underline; }
.rich-editor-holder .ProseMirror img.rt-img {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.4em 0;
}
</style>
