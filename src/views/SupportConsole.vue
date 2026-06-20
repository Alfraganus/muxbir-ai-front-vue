<template>
  <div class="sc-root">
    <!-- ── Login ───────────────────────────────────────── -->
    <div v-if="!token" class="sc-login">
      <form class="sc-login-card" @submit.prevent="doLogin">
        <div class="sc-login-logo">🗂</div>
        <h1 class="sc-login-title">{{ tt('sc.title') }}</h1>
        <p class="sc-login-sub">{{ tt('sc.loginSub') }}</p>
        <label class="sc-label">{{ tt('sc.username') }}</label>
        <input v-model="loginUser" class="sc-input" autocomplete="username" :placeholder="tt('sc.username')"/>
        <label class="sc-label">{{ tt('sc.password') }}</label>
        <input v-model="loginPass" type="password" class="sc-input" autocomplete="current-password" placeholder="••••••"/>
        <div v-if="loginErr" class="sc-err">{{ loginErr }}</div>
        <button type="submit" class="sc-btn" :disabled="loggingIn">
          {{ loggingIn ? '…' : tt('sc.loginBtn') }}
        </button>
      </form>
    </div>

    <!-- ── Console ─────────────────────────────────────── -->
    <div v-else class="sc-app">
      <!-- Conversations list -->
      <div v-if="!selected" class="sc-pane">
        <div class="sc-head">
          <div class="sc-head-title">{{ tt('sc.conversations') }}</div>
          <button class="sc-logout" @click="logout">{{ tt('sc.logout') }}</button>
        </div>
        <div class="sc-list">
          <div v-if="!conversations.length && !loadingConvos" class="sc-empty">{{ tt('sc.empty') }}</div>
          <button v-for="c in conversations" :key="c.visitor_id" class="sc-conv" @click="openConv(c)">
            <span class="sc-avatar">{{ initials(c) }}</span>
            <div class="sc-conv-mid">
              <div class="sc-conv-top">
                <span class="sc-conv-name">{{ displayName(c) }}</span>
                <span class="sc-conv-time">{{ fmtTime(c.last_at) }}</span>
              </div>
              <div class="sc-conv-last">
                <span v-if="c.last_dir === 'out'" class="sc-you">{{ tt('sc.you') }}: </span>{{ c.last_text }}
              </div>
              <div v-if="c.phone" class="sc-conv-phone">📞 {{ c.phone }}</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Conversation detail -->
      <div v-else class="sc-pane">
        <div class="sc-head">
          <button class="sc-back" @click="back">←</button>
          <div class="sc-head-mid">
            <div class="sc-head-title">{{ displayName(selected) }}</div>
            <div v-if="selected.phone" class="sc-head-phone">{{ selected.phone }}</div>
          </div>
        </div>
        <div ref="scrollEl" class="sc-msgs">
          <div v-for="m in messages" :key="m.id" class="sc-msg" :class="m.direction === 'out' ? 'mine' : 'theirs'">
            <div v-if="m.direction === 'out' && m.name" class="sc-msg-name">{{ m.name }}</div>
            <div class="sc-bubble">{{ m.text }}</div>
            <div class="sc-time">{{ fmtTime(m.created_at) }}</div>
          </div>
        </div>
        <form class="sc-foot" @submit.prevent="send">
          <textarea v-model="draft" class="sc-foot-input" rows="1" :placeholder="tt('sc.placeholder')"
            @keydown.enter.exact.prevent="send"/>
          <button type="submit" class="sc-foot-send" :disabled="!draft.trim() || sending">➤</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { supportConsoleApi, SC_TOKEN_KEY } from '@/api/supportConsole.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const token = ref(localStorage.getItem(SC_TOKEN_KEY) || '')
const loginUser = ref('')
const loginPass = ref('')
const loginErr = ref('')
const loggingIn = ref(false)

const conversations = ref([])
const loadingConvos = ref(false)
const selected = ref(null)
const messages = ref([])
const draft = ref('')
const sending = ref(false)
const scrollEl = ref(null)
let convTimer = null
let msgTimer = null

function initials(c) {
  const n = (c.name || 'Mehmon').trim()
  return n.slice(0, 1).toUpperCase()
}
function displayName(c) {
  return c.name || (tt('sc.guest') + ' ' + String(c.visitor_id).slice(-6))
}
function fmtTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const today = new Date()
    const sameDay = d.toDateString() === today.toDateString()
    const loc = store.lang === 'ru' ? 'ru-RU' : 'uz-UZ'
    return sameDay
      ? d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' })
  } catch { return '' }
}

async function doLogin() {
  loginErr.value = ''
  if (!loginUser.value || !loginPass.value) { loginErr.value = tt('sc.loginErr'); return }
  loggingIn.value = true
  try {
    const res = await supportConsoleApi.login(loginUser.value.trim(), loginPass.value)
    token.value = res.token
    localStorage.setItem(SC_TOKEN_KEY, res.token)
    startPolling()
    loadConversations()
  } catch {
    loginErr.value = tt('sc.loginErr')
  } finally {
    loggingIn.value = false
  }
}
function logout() {
  token.value = ''
  localStorage.removeItem(SC_TOKEN_KEY)
  selected.value = null
  conversations.value = []
  stopPolling()
}

async function loadConversations() {
  if (!token.value) return
  loadingConvos.value = true
  try { conversations.value = await supportConsoleApi.conversations() }
  catch (e) { if (e?.response?.status === 401) logout() }
  finally { loadingConvos.value = false }
}

async function loadMessages(scroll = false) {
  if (!selected.value) return
  try {
    messages.value = await supportConsoleApi.messages(selected.value.visitor_id)
    if (scroll) scrollDown()
  } catch (e) { if (e?.response?.status === 401) logout() }
}

async function openConv(c) {
  selected.value = c
  messages.value = []
  await loadMessages(true)
}
function back() { selected.value = null; loadConversations() }

async function send() {
  const text = draft.value.trim()
  if (!text || !selected.value) return
  draft.value = ''
  sending.value = true
  try {
    await supportConsoleApi.reply(selected.value.visitor_id, text)
    await loadMessages(true)
  } catch { draft.value = text }
  finally { sending.value = false }
}

async function scrollDown() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}
watch(messages, () => { if (selected.value) scrollDown() })

function startPolling() {
  stopPolling()
  convTimer = setInterval(() => { if (!selected.value) loadConversations() }, 5000)
  msgTimer = setInterval(() => { if (selected.value) loadMessages() }, 3000)
}
function stopPolling() {
  if (convTimer) clearInterval(convTimer)
  if (msgTimer) clearInterval(msgTimer)
  convTimer = msgTimer = null
}

// Telegram WebApp SDK (Mini App ichida) — ready + expand
function initTelegram() {
  try {
    const tg = window.Telegram?.WebApp
    if (tg) { tg.ready(); tg.expand?.() }
  } catch {}
}
function loadTgScript() {
  if (window.Telegram?.WebApp) { initTelegram(); return }
  const s = document.createElement('script')
  s.src = 'https://telegram.org/js/telegram-web-app.js'
  s.onload = initTelegram
  document.head.appendChild(s)
}

onMounted(() => {
  loadTgScript()
  if (token.value) { startPolling(); loadConversations() }
})
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.sc-root {
  position: fixed; inset: 0; z-index: 5000;
  background: var(--bg, #f1f5f9);
  display: flex; flex-direction: column;
  font-family: inherit; color: var(--text, #0f172a);
}

/* Login */
.sc-login { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
.sc-login-card {
  width: 100%; max-width: 340px; padding: 28px 24px;
  background: var(--panel, #fff); border: 1px solid var(--border, #e2e8f0);
  border-radius: 18px; box-shadow: 0 30px 70px -28px rgba(8,24,52,0.3);
  display: flex; flex-direction: column;
}
.sc-login-logo { font-size: 34px; text-align: center; }
.sc-login-title { font-size: 19px; font-weight: 700; text-align: center; margin: 8px 0 2px; }
.sc-login-sub { font-size: 12.5px; color: var(--muted, #64748b); text-align: center; margin: 0 0 18px; }
.sc-label { font-size: 11.5px; font-weight: 500; color: var(--text-2, #475569); margin-bottom: 5px; }
.sc-input {
  height: 42px; border: 1px solid var(--border, #e2e8f0); border-radius: 11px;
  padding: 0 13px; font-size: 13px; font-family: inherit; outline: none;
  background: var(--bg, #f8fafc); color: var(--text, #0f172a); margin-bottom: 13px;
}
.sc-input:focus { border-color: var(--accent, #2F6FED); box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent,#2F6FED) 16%, transparent); }
.sc-err { font-size: 11.5px; color: #ef4444; margin: -6px 0 12px; }
.sc-btn {
  height: 44px; border: none; border-radius: 12px; cursor: pointer;
  background: linear-gradient(135deg, var(--accent, #2F6FED), #4f8af5); color: #fff;
  font-size: 14px; font-weight: 700; font-family: inherit;
}
.sc-btn:disabled { opacity: .6; }

/* App */
.sc-app { flex: 1; min-height: 0; display: flex; }
.sc-pane { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.sc-head {
  height: 54px; flex-shrink: 0;
  display: flex; align-items: center; gap: 10px; padding: 0 14px;
  background: var(--panel, #fff); border-bottom: 1px solid var(--border, #e2e8f0);
}
.sc-head-title { font-size: 15px; font-weight: 700; }
.sc-head-mid { flex: 1; min-width: 0; }
.sc-head-phone { font-size: 11px; color: var(--muted, #64748b); }
.sc-logout { margin-left: auto; border: none; background: transparent; color: #ef4444; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.sc-back { width: 32px; height: 32px; border: none; background: var(--bg, #f1f5f9); border-radius: 8px; font-size: 18px; cursor: pointer; color: var(--text,#0f172a); }

/* List */
.sc-list { flex: 1; overflow-y: auto; }
.sc-empty { padding: 40px 20px; text-align: center; color: var(--muted, #94a3b8); font-size: 13px; }
.sc-conv {
  width: 100%; display: flex; align-items: center; gap: 11px; padding: 12px 14px;
  border: none; border-bottom: 1px solid var(--border-2, #eef2f7); background: var(--panel, #fff);
  cursor: pointer; text-align: left;
}
.sc-conv:hover { background: var(--bg-2, #f8fafc); }
.sc-avatar {
  width: 42px; height: 42px; border-radius: 999px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent, #2F6FED), #46E0FF); color: #fff;
  display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;
}
.sc-conv-mid { flex: 1; min-width: 0; }
.sc-conv-top { display: flex; justify-content: space-between; gap: 8px; }
.sc-conv-name { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sc-conv-time { font-size: 10.5px; color: var(--muted, #94a3b8); flex-shrink: 0; }
.sc-conv-last { font-size: 12px; color: var(--text-2, #64748b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.sc-you { color: var(--accent, #2F6FED); font-weight: 600; }
.sc-conv-phone { font-size: 11px; color: var(--muted, #94a3b8); margin-top: 2px; }

/* Messages */
.sc-msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 9px; background: var(--bg, #f1f5f9); }
.sc-msg { display: flex; flex-direction: column; max-width: 78%; }
.sc-msg.mine { align-self: flex-end; align-items: flex-end; }
.sc-msg.theirs { align-self: flex-start; align-items: flex-start; }
.sc-msg-name { font-size: 10px; font-weight: 600; color: var(--accent, #2F6FED); margin: 0 4px 2px; }
.sc-bubble { padding: 9px 12px; border-radius: 14px; font-size: 13px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
.sc-msg.mine .sc-bubble { background: linear-gradient(135deg, var(--accent, #2F6FED), #4f8af5); color: #fff; border-bottom-right-radius: 5px; }
.sc-msg.theirs .sc-bubble { background: var(--panel, #fff); border: 1px solid var(--border, #e2e8f0); border-bottom-left-radius: 5px; }
.sc-time { font-size: 9.5px; color: var(--muted, #94a3b8); margin: 2px 4px 0; }

/* Composer */
.sc-foot { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px; background: var(--panel, #fff); border-top: 1px solid var(--border, #e2e8f0); }
.sc-foot-input {
  flex: 1; resize: none; max-height: 100px; border: 1px solid var(--border, #e2e8f0); border-radius: 12px;
  padding: 9px 12px; font-size: 13px; font-family: inherit; outline: none; line-height: 1.4;
  background: var(--bg, #f8fafc); color: var(--text, #0f172a);
}
.sc-foot-input:focus { border-color: var(--accent, #2F6FED); }
.sc-foot-send {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0; border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--accent, #2F6FED), #4f8af5); color: #fff; font-size: 16px;
}
.sc-foot-send:disabled { opacity: .45; cursor: not-allowed; }

@media (min-width: 760px) {
  .sc-login-card { box-shadow: 0 40px 90px -30px rgba(8,24,52,0.35); }
  .sc-app { max-width: 1000px; margin: 0 auto; width: 100%; border-left: 1px solid var(--border, #e2e8f0); border-right: 1px solid var(--border, #e2e8f0); }
}
</style>
