<template>
  <div class="rich-editor-wrap">
    <div ref="holder" class="rich-editor-holder"/>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'
import ImageTool from '@editorjs/image'
import Embed from '@editorjs/embed'
import Quote from '@editorjs/quote'
import Marker from '@editorjs/marker'
import InlineCode from '@editorjs/inline-code'
import Code from '@editorjs/code'
import { uploadsApi } from '@/api/uploads.js'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ blocks: [] }) },
  placeholder: { type: String, default: 'Bu yerga yozing...' },
  readOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const holder = ref(null)
let editor = null
let isSelfChange = false

async function initEditor() {
  if (!holder.value) return
  editor = new EditorJS({
    holder: holder.value,
    placeholder: props.placeholder,
    readOnly: props.readOnly,
    data: props.modelValue && Object.keys(props.modelValue || {}).length ? props.modelValue : { blocks: [] },
    tools: {
      header: { class: Header, inlineToolbar: true, config: { levels: [2, 3, 4], defaultLevel: 2 } },
      paragraph: { class: Paragraph, inlineToolbar: true },
      list: { class: List, inlineToolbar: true },
      quote: { class: Quote, inlineToolbar: true },
      embed: Embed,
      // Image tool — backend upload kerakligi sababli hozircha URL'dan ham qabul qiladigan rejimda
      image: {
        class: ImageTool,
        config: {
          uploader: {
            uploadByUrl: (url) => Promise.resolve({ success: 1, file: { url } }),
            uploadByFile: async (file) => {
              try {
                const res = await uploadsApi.uploadImage(file)
                return { success: 1, file: { url: res.url } }
              } catch (e) {
                return { success: 0 }
              }
            },
          },
        },
      },
      marker: Marker,
      inlineCode: InlineCode,
      code: Code,
    },
    onChange: async () => {
      if (!editor) return
      try {
        const out = await editor.save()
        isSelfChange = true
        emit('update:modelValue', out)
      } catch (e) {
        /* ignore */
      }
    },
  })
}

onMounted(initEditor)

watch(
  () => props.modelValue,
  async (val) => {
    if (isSelfChange) {
      isSelfChange = false
      return
    }
    if (!editor) return
    // Tashqaridan o'zgargan — qayta render
    try {
      await editor.isReady
      await editor.render(val && Object.keys(val).length ? val : { blocks: [] })
    } catch {}
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (editor?.destroy) {
    try { editor.destroy() } catch {}
  }
  editor = null
})
</script>

<style>
/* Editor.js global stillarini biroz moslab qo'yamiz */
.rich-editor-wrap {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 18px;
  min-height: 220px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.rich-editor-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.rich-editor-holder {
  min-height: 180px;
  color: var(--text);
  font-size: 14.5px;
  line-height: 1.6;
}
.codex-editor__redactor {
  padding-bottom: 60px !important;
}
.ce-paragraph[data-placeholder]:empty::before {
  color: var(--muted);
  opacity: 0.7;
}
.ce-toolbar__plus,
.ce-toolbar__settings-btn {
  color: var(--text-2);
}
.ce-popover, .ce-conversion-toolbar, .ce-inline-toolbar {
  background: var(--panel) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
}
.ce-popover-item:hover {
  background: var(--panel-2) !important;
}
[data-theme="dark"] .ce-block__content {
  color: var(--text);
}
</style>
