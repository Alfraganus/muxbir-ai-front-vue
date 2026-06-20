<template>
  <div class="lcw">
    <!-- Chat panel -->
    <Transition name="lcw-pop">
      <div v-if="open" class="lcw-panel">
        <!-- Header -->
        <div class="lcw-head">
          <div class="lcw-head-l">
            <span class="lcw-head-av">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/>
              </svg>
            </span>
            <div>
              <div class="lcw-head-title">{{ tt('chat.title') }}</div>
              <div class="lcw-head-sub"><span class="lcw-dot"/>{{ tt('chat.subtitle') }}</div>
            </div>
          </div>
          <button class="lcw-head-x" @click="open = false" :aria-label="tt('chat.close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Messages -->
        <div ref="scrollEl" class="lcw-body">
          <div class="lcw-greet">
            <span class="lcw-greet-ic">👋</span>
            <p>{{ tt('chat.greeting') }}</p>
          </div>
          <div v-for="m in messages" :key="m.id" class="lcw-msg" :class="m.mine ? 'mine' : 'theirs'">
            <div v-if="!m.mine && m.name" class="lcw-msg-name">{{ m.name }}</div>
            <div class="lcw-bubble">{{ m.text }}</div>
            <div class="lcw-time">{{ fmtTime(m.at) }}</div>
          </div>
        </div>

        <!-- Composer -->
        <form class="lcw-foot" @submit.prevent="send">
          <textarea
            v-model="draft"
            class="lcw-input"
            rows="1"
            :placeholder="tt('chat.placeholder')"
            @keydown.enter.exact.prevent="send"
          />
          <button type="submit" class="lcw-send" :disabled="!draft.trim()" :aria-label="tt('chat.send')">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </form>
      </div>
    </Transition>

    <!-- Launcher -->
    <button class="lcw-launch" :class="{ open }" @click="toggle" :aria-label="tt('chat.open')">
      <Transition name="lcw-ic" mode="out-in">
        <svg v-if="!open" key="chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/>
        </svg>
        <svg v-else key="x" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </Transition>
      <span v-if="unread > 0 && !open" class="lcw-badge">{{ unread > 9 ? '9+' : unread }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { supportChatApi } from '@/api/supportChat.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const LS_ID = 'support_visitor_id'
const LS_MSGS = 'support_chat_msgs'
const LS_SEEN = 'support_chat_seen'
const POLL_MS = 4000

function genId() {
  try { if (crypto?.randomUUID) return crypto.randomUUID() } catch {}
  return 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const visitorId = (() => {
  let v = localStorage.getItem(LS_ID)
  if (!v) { v = genId(); localStorage.setItem(LS_ID, v) }
  return v
})()

const open = ref(false)
const draft = ref('')
const unread = ref(0)
const scrollEl = ref(null)
const messages = ref(loadMsgs())
let lastSeen = Number(localStorage.getItem(LS_SEEN) || 0)
let timer = null

function loadMsgs() {
  try { return JSON.parse(localStorage.getItem(LS_MSGS) || '[]') } catch { return [] }
}
function persist() {
  // Faqat oxirgi 100 ta xabarni saqlaymiz
  const trimmed = messages.value.slice(-100)
  localStorage.setItem(LS_MSGS, JSON.stringify(trimmed))
  localStorage.setItem(LS_SEEN, String(lastSeen))
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString(store.lang === 'ru' ? 'ru-RU' : 'uz-UZ',
      { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function pageLabel() {
  const h = (window.location.hash || '').replace(/^#/, '')
  if (!h || h === '/' || h.includes('signin') || h.includes('signup')) return 'login'
  return h.split('?')[0].slice(0, 48)
}

async function scrollDown() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

function toggle() {
  open.value = !open.value
  if (open.value) { unread.value = 0; scrollDown() }
}

async function send() {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  messages.value.push({ id: 'l' + Date.now(), mine: true, text, at: new Date().toISOString() })
  persist()
  scrollDown()
  try {
    await supportChatApi.send({ visitor_id: visitorId, text, page: pageLabel() })
  } catch {
    messages.value.push({ id: 'e' + Date.now(), mine: false, text: tt('chat.sendError'), at: new Date().toISOString() })
    persist()
    scrollDown()
  }
}

async function poll() {
  try {
    const rows = await supportChatApi.replies(visitorId, lastSeen)
    if (Array.isArray(rows) && rows.length) {
      for (const r of rows) {
        messages.value.push({ id: 's' + r.id, mine: false, text: r.text, name: r.name, at: r.created_at })
        if (r.id > lastSeen) lastSeen = r.id
      }
      if (!open.value) unread.value += rows.length
      persist()
      scrollDown()
    }
  } catch { /* tarmoq xatosi — keyingi tick'da qayta urinamiz */ }
}

watch(open, (v) => { if (v) scrollDown() })

onMounted(() => {
  poll()
  timer = setInterval(poll, POLL_MS)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.lcw {
  position: fixed;
  right: 22px; bottom: 22px;
  z-index: 2147482000;
  display: flex; flex-direction: column; align-items: flex-end; gap: 14px;
  font-family: inherit;
}

/* ── Launcher ─────────────────────────────────── */
.lcw-launch {
  position: relative;
  width: 56px; height: 56px; border-radius: 999px;
  border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--accent, #2F6FED), #46E0FF);
  color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 12px 30px -8px color-mix(in oklab, var(--accent, #2F6FED) 60%, transparent),
              0 2px 6px rgba(8,24,52,0.2);
  transition: transform .18s ease, box-shadow .25s ease, filter .15s ease;
}
.lcw-launch:hover { transform: translateY(-2px) scale(1.04); filter: brightness(1.05); }
.lcw-launch:active { transform: scale(.96); }
.lcw-launch.open { background: var(--panel, #fff); color: var(--text, #0f172a); border: 1px solid var(--border, #e2e8f0); }
.lcw-badge {
  position: absolute; top: -3px; right: -3px;
  min-width: 19px; height: 19px; padding: 0 5px;
  border-radius: 999px; background: #ef4444; color: #fff;
  font-size: 11px; font-weight: 700; line-height: 19px;
  border: 2px solid var(--bg, #fff);
}

/* ── Panel ────────────────────────────────────── */
.lcw-panel {
  width: 350px; max-width: calc(100vw - 32px);
  height: 480px; max-height: calc(100vh - 120px);
  background: var(--panel, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 18px; overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 40px 90px -28px rgba(8,24,52,0.4), 0 12px 30px -14px rgba(8,24,52,0.18);
}

/* Header */
.lcw-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 14px 14px;
  background: linear-gradient(135deg, var(--accent, #2F6FED), #1f4fb0);
  color: #fff;
}
.lcw-head-l { display: flex; align-items: center; gap: 11px; min-width: 0; }
.lcw-head-av {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25);
  display: inline-flex; align-items: center; justify-content: center;
}
.lcw-head-title { font-size: 14.5px; font-weight: 700; letter-spacing: -0.01em; }
.lcw-head-sub { font-size: 11.5px; opacity: .85; display: flex; align-items: center; gap: 6px; margin-top: 1px; }
.lcw-dot { width: 7px; height: 7px; border-radius: 999px; background: #34d399; box-shadow: 0 0 0 3px rgba(52,211,153,0.3); }
.lcw-head-x {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  border: none; background: rgba(255,255,255,0.14); color: #fff; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.lcw-head-x:hover { background: rgba(255,255,255,0.26); }

/* Body */
.lcw-body {
  flex: 1; overflow-y: auto;
  padding: 16px 14px;
  display: flex; flex-direction: column; gap: 10px;
  background:
    radial-gradient(600px 300px at 100% 0%, color-mix(in oklab, var(--accent, #2F6FED) 6%, transparent), transparent 60%),
    var(--bg, #f8fafc);
}
.lcw-greet {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px; border-radius: 12px;
  background: var(--panel, #fff); border: 1px solid var(--border, #e2e8f0);
  margin-bottom: 4px;
}
.lcw-greet-ic { font-size: 20px; line-height: 1; }
.lcw-greet p { margin: 0; font-size: 12.5px; color: var(--text-2, #475569); line-height: 1.5; }

.lcw-msg { display: flex; flex-direction: column; max-width: 82%; }
.lcw-msg.mine { align-self: flex-end; align-items: flex-end; }
.lcw-msg.theirs { align-self: flex-start; align-items: flex-start; }
.lcw-msg-name { font-size: 10.5px; font-weight: 600; color: var(--accent, #2F6FED); margin: 0 4px 3px; }
.lcw-bubble {
  padding: 9px 12px; border-radius: 14px;
  font-size: 13px; line-height: 1.45; white-space: pre-wrap; word-break: break-word;
}
.lcw-msg.mine .lcw-bubble {
  background: linear-gradient(135deg, var(--accent, #2F6FED), #4f8af5); color: #fff;
  border-bottom-right-radius: 5px;
}
.lcw-msg.theirs .lcw-bubble {
  background: var(--panel, #fff); color: var(--text, #0f172a);
  border: 1px solid var(--border, #e2e8f0); border-bottom-left-radius: 5px;
}
.lcw-time { font-size: 10px; color: var(--muted, #94a3b8); margin: 3px 4px 0; }

/* Composer */
.lcw-foot {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border, #e2e8f0);
  background: var(--panel, #fff);
}
.lcw-input {
  flex: 1; resize: none; max-height: 96px;
  border: 1px solid var(--border, #e2e8f0); border-radius: 12px;
  padding: 9px 12px; font-size: 13px; font-family: inherit;
  color: var(--text, #0f172a); background: var(--bg, #f8fafc);
  outline: none; line-height: 1.4;
  transition: border-color .15s, box-shadow .15s;
}
.lcw-input:focus { border-color: var(--accent, #2F6FED); box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent, #2F6FED) 16%, transparent); }
.lcw-send {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--accent, #2F6FED), #4f8af5); color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  transition: filter .15s, transform .1s, opacity .15s;
}
.lcw-send:hover:not(:disabled) { filter: brightness(1.06); }
.lcw-send:active:not(:disabled) { transform: scale(.94); }
.lcw-send:disabled { opacity: .45; cursor: not-allowed; }

/* Transitions */
.lcw-pop-enter-active, .lcw-pop-leave-active { transition: opacity .2s ease, transform .22s cubic-bezier(.34,1.2,.64,1); transform-origin: bottom right; }
.lcw-pop-enter-from, .lcw-pop-leave-to { opacity: 0; transform: translateY(12px) scale(.96); }
.lcw-ic-enter-active, .lcw-ic-leave-active { transition: opacity .12s ease, transform .12s ease; }
.lcw-ic-enter-from, .lcw-ic-leave-to { opacity: 0; transform: rotate(-30deg) scale(.6); }

@media (max-width: 520px) {
  .lcw { right: 14px; bottom: 14px; }
  .lcw-panel { width: calc(100vw - 28px); height: 70vh; }
}
</style>
