<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:1100px;">
    <PageHeader
      :title="tt('clientTelegramApi.pageTitle')"
      :subtitle="tt('clientTelegramApi.pageSubtitle')"
    />

    <div v-if="!unlocked" style="max-width:320px;display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:13px;color:var(--muted);margin:0;">{{ tt('clientTelegramApi.passwordGateTitle') }}</p>
      <input v-model="passwordInput" type="password" autocomplete="off"
             :placeholder="tt('clientTelegramApi.passwordGatePlaceholder')"
             @keyup.enter="submitPassword"
             style="padding:9px 12px;border:1px solid var(--border-2);border-radius:6px;
                    background:var(--bg);color:var(--text);font-size:13px;"/>
      <button @click="submitPassword" type="button"
              style="padding:9px 14px;border-radius:6px;background:var(--accent);color:#fff;
                     border:none;cursor:pointer;font-size:13px;font-weight:500;">
        {{ tt('clientTelegramApi.passwordGateSubmit') }}
      </button>
      <div v-if="passwordError" style="color:#ef4444;font-size:12px;">
        {{ tt('clientTelegramApi.passwordGateError') }}
      </div>
    </div>

    <template v-else>
      <div v-if="loadingDialogs" style="font-size:12.5px;color:var(--muted);">
        {{ tt('clientTelegramApi.testing') }}
      </div>
      <div v-if="error" style="padding:8px 12px;border-radius:6px;background:rgba(239,68,68,.08);
                   border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;">
        {{ error }}
      </div>

      <AppPanel v-if="!loadingDialogs" :padding="0">
        <div style="display:grid;grid-template-columns:280px 1fr;height:70vh;min-height:420px;">
          <!-- Chap: suhbatlar ro'yxati (pastga scroll -> yana yuklaydi) -->
          <div ref="dialogsListEl" @scroll="onDialogsScroll" style="border-right:1px solid var(--border-2);overflow-y:auto;display:flex;flex-direction:column;">
            <div v-for="d in dialogs" :key="d.id" @click="selectDialog(d)"
                 :style="{
                   padding: '10px 14px', cursor: 'pointer', display: 'flex',
                   justifyContent: 'space-between', alignItems: 'center', gap: '8px',
                   background: selectedDialog?.id === d.id ? 'var(--bg-2, rgba(0,0,0,.04))' : 'transparent',
                   borderBottom: '1px solid var(--border-2)',
                 }">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;">{{ d.title || d.id }}</span>
              <span v-if="d.unread_count" style="background:var(--accent);color:#fff;border-radius:999px;
                           font-size:10.5px;padding:1px 6px;flex-shrink:0;">{{ d.unread_count }}</span>
            </div>
            <div v-if="!dialogs.length" style="padding:14px;font-size:12px;color:var(--muted);">
              {{ tt('clientTelegramApi.noDialogs') }}
            </div>
            <!-- Pastki sentinel — ko'rinishga kirganda keyingi sahifa yuklanadi -->
            <div ref="dialogsSentinel" style="height:1px;"></div>
            <div v-if="loadingMoreDialogs" style="padding:8px;text-align:center;font-size:11px;color:var(--muted);">
              {{ tt('clientTelegramApi.loadingMore') }}
            </div>
          </div>

          <!-- O'ng: tanlangan suhbat xabarlari (tepaga scroll -> eskilarini yuklaydi) -->
          <div ref="messagesEl" @scroll="onMessagesScroll" style="overflow-y:auto;display:flex;flex-direction:column;padding:14px;gap:8px;">
            <div v-if="!selectedDialog" style="margin:auto;font-size:12.5px;color:var(--muted);">
              {{ tt('clientTelegramApi.selectDialogHint') }}
            </div>
            <template v-else>
              <!-- Tepa sentinel — ko'rinishga kirganda eski xabarlar yuklanadi -->
              <div ref="messagesSentinel" style="height:1px;"></div>
              <div v-if="loadingMore" style="text-align:center;font-size:11.5px;color:var(--muted);">
                {{ tt('clientTelegramApi.loadingMore') }}
              </div>
              <div v-for="m in messages" :key="m.id"
                   :style="{ alignSelf: m.out ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '2px' }">
                <span v-if="!m.out && m.sender_name" style="font-size:11px;font-weight:600;color:var(--accent);padding:0 2px;">
                  {{ m.sender_name }}
                </span>
                <div :style="{
                       background: m.out ? 'var(--accent)' : 'var(--bg-2, rgba(0,0,0,.05))',
                       color: m.out ? '#fff' : 'var(--text)',
                       borderRadius: '10px',
                       padding: '7px 11px',
                       fontSize: '13px',
                       whiteSpace: 'pre-wrap',
                       wordBreak: 'break-word',
                     }">
                  {{ m.text || tt('clientTelegramApi.emptyMessage') }}
                </div>
                <button v-if="m.media_type && m.media_type !== 'webpage'" @click="downloadMedia(m)" type="button"
                        :disabled="downloadingId === m.id"
                        style="align-self:inherit;background:none;border:none;color:inherit;opacity:.75;
                               cursor:pointer;font-size:11px;text-decoration:underline;padding:0;">
                  {{ downloadingId === m.id ? tt('clientTelegramApi.testing') : `${tt('clientTelegramApi.downloadMedia')} (${m.media_type})` }}
                </button>
              </div>
              <div v-if="loadingMessages" style="text-align:center;font-size:11.5px;color:var(--muted);">
                {{ tt('clientTelegramApi.testing') }}
              </div>
            </template>
          </div>
        </div>
      </AppPanel>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed, nextTick } from 'vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { companiesApi } from '@/api/companies.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const PAGE_SIZE = 50
const UNLOCK_STORAGE_KEY = 'tg_test_unlocked'

const company = ref(null)
const loadingDialogs = ref(false)
const error = ref(null)

const unlocked = ref(sessionStorage.getItem(UNLOCK_STORAGE_KEY) === '1')
const passwordInput = ref('')
const passwordError = ref(false)

const dialogs = ref([])
const dialogsLimit = ref(PAGE_SIZE)
const hasMoreDialogs = ref(true)
const loadingMoreDialogs = ref(false)
const dialogsListEl = ref(null)
const dialogsSentinel = ref(null)
let dialogsObserver = null

const selectedDialog = ref(null)
const messages = ref([])
const loadingMessages = ref(false)
const loadingMore = ref(false)
const hasMoreMessages = ref(true)
const messagesEl = ref(null)
const messagesSentinel = ref(null)
let messagesObserver = null
const downloadingId = ref(null)

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
  if (unlocked.value) await loadDialogsInitial()
})

onBeforeUnmount(() => {
  dialogsObserver?.disconnect()
  messagesObserver?.disconnect()
})

async function submitPassword() {
  if (!company.value) return
  passwordError.value = false
  try {
    const r = await companiesApi.verifyTelegramTestPassword(company.value.id, passwordInput.value)
    if (r.ok) {
      unlocked.value = true
      sessionStorage.setItem(UNLOCK_STORAGE_KEY, '1')
      passwordInput.value = ''
      await loadDialogsInitial()
    } else {
      passwordError.value = true
    }
  } catch (e) {
    passwordError.value = true
  }
}

async function loadDialogsInitial() {
  loadingDialogs.value = true
  try {
    dialogs.value = await companiesApi.getTelegramDialogs(company.value.id, dialogsLimit.value)
    if (dialogs.value.length < dialogsLimit.value) hasMoreDialogs.value = false
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loadingDialogs.value = false
    await nextTick()
    setupDialogsObserver()
  }
}

function setupDialogsObserver() {
  dialogsObserver?.disconnect()
  if (!dialogsListEl.value || !dialogsSentinel.value) return
  dialogsObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) loadMoreDialogs()
  }, { root: dialogsListEl.value, threshold: 0 })
  dialogsObserver.observe(dialogsSentinel.value)
}

// Zaxira (fallback) trigger — IntersectionObserver'ga qo'shimcha, ba'zi
// muhitlarda observer o'z vaqtida ishlamasligi mumkin (masalan fon rejimida
// throttling). Ikkalasi ham xuddi shu himoya shartlaridan (hasMore/loading)
// o'tadi, shuning uchun ikki marta yuklab yuborish xavfi yo'q.
function onDialogsScroll(e) {
  const el = e.target
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) loadMoreDialogs()
}

function onMessagesScroll(e) {
  const el = e.target
  if (el.scrollTop < 60) loadMoreMessages()
}

async function loadMoreDialogs() {
  if (!company.value || !hasMoreDialogs.value || loadingMoreDialogs.value) return
  loadingMoreDialogs.value = true
  try {
    const nextLimit = dialogsLimit.value + PAGE_SIZE
    const list = await companiesApi.getTelegramDialogs(company.value.id, nextLimit)
    dialogsLimit.value = nextLimit
    if (list.length < nextLimit) hasMoreDialogs.value = false
    dialogs.value = list
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loadingMoreDialogs.value = false
  }
}

async function selectDialog(d) {
  messagesObserver?.disconnect()
  selectedDialog.value = d
  messages.value = []
  hasMoreMessages.value = true
  await loadMessages()
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  setupMessagesObserver()
}

function setupMessagesObserver() {
  messagesObserver?.disconnect()
  if (!messagesEl.value || !messagesSentinel.value) return
  messagesObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) loadMoreMessages()
  }, { root: messagesEl.value, threshold: 0 })
  messagesObserver.observe(messagesSentinel.value)
}

async function loadMessages() {
  if (!company.value || !selectedDialog.value) return
  loadingMessages.value = true
  try {
    const batch = await companiesApi.getTelegramMessages(company.value.id, selectedDialog.value.id)
    if (batch.length < PAGE_SIZE) hasMoreMessages.value = false
    // Backend yangi→eski tartibda qaytaradi; chat UI'da eski tepada bo'lishi kerak.
    messages.value = [...batch].reverse()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loadingMessages.value = false
  }
}

async function loadMoreMessages() {
  if (!selectedDialog.value || !hasMoreMessages.value || loadingMore.value || !messages.value.length) return
  loadingMore.value = true
  try {
    const beforeId = messages.value[0].id
    const batch = await companiesApi.getTelegramMessages(company.value.id, selectedDialog.value.id, beforeId)
    if (batch.length < PAGE_SIZE) hasMoreMessages.value = false
    if (batch.length) {
      const el = messagesEl.value
      const prevHeight = el?.scrollHeight ?? 0
      messages.value = [...[...batch].reverse(), ...messages.value]
      await nextTick()
      if (el) el.scrollTop = el.scrollHeight - prevHeight
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loadingMore.value = false
  }
}

async function downloadMedia(m) {
  if (!company.value || !selectedDialog.value || downloadingId.value) return
  downloadingId.value = m.id
  try {
    const blob = await companiesApi.downloadTelegramMedia(company.value.id, selectedDialog.value.id, m.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telegram_${m.id}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    downloadingId.value = null
  }
}
</script>
