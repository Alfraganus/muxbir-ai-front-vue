<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:760px;">
    <PageHeader
      :title="tt('clientTelegramChats.title')"
      :subtitle="tt('clientTelegramChats.subtitle')"
    />

    <!-- Yo'riqnoma -->
    <div style="padding:10px 12px;border-radius:8px;background:rgba(99,102,241,.08);
                border:1px solid rgba(99,102,241,.2);font-size:12px;line-height:1.6;color:var(--text);"
         v-html="tt('clientTelegramChats.instruction')">
    </div>

    <!-- Qo'shish formasi -->
    <AppPanel :padding="16">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:13px;font-weight:600;">{{ tt('clientTelegramChats.addNewChat') }}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;">
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:160px;">
            <span style="font-size:11px;color:var(--muted);">{{ tt('clientTelegramChats.chatIdLabel') }}</span>
            <AppInput v-model="form.chat_id" placeholder="-1001234567890" mono />
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:160px;">
            <span style="font-size:11px;color:var(--muted);">{{ tt('clientTelegramChats.nameLabel') }}</span>
            <AppInput v-model="form.title" :placeholder="tt('clientTelegramChats.namePlaceholder')" />
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <span style="font-size:11px;color:transparent;">.</span>
            <AppButton variant="primary" size="md" :loading="adding" @click="add">
              <template #icon><AppIcon name="Check" :size="13"/></template>
              {{ tt('clientTelegramChats.addBtn') }}
            </AppButton>
          </div>
        </div>
      </div>
    </AppPanel>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;padding:40px 0;color:var(--muted);font-size:13px;gap:10px;">
      <span class="ctc-spinner"/>
      {{ tt('clientTelegramChats.loading') }}
    </div>

    <!-- Empty -->
    <AppPanel v-else-if="!chats.length" :padding="36">
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;">
        <span style="width:52px;height:52px;border-radius:13px;background:var(--accent-bg);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;">
          <AppIcon name="Telegram" :size="24"/>
        </span>
        <div>
          <div style="font-size:14px;font-weight:600;margin-bottom:3px;">{{ tt('clientTelegramChats.emptyTitle') }}</div>
          <div style="font-size:12.5px;color:var(--muted);">{{ tt('clientTelegramChats.emptyHint') }}</div>
        </div>
      </div>
    </AppPanel>

    <!-- Ro'yxat -->
    <div v-else style="display:flex;flex-direction:column;gap:8px;">
      <AppPanel v-for="c in chats" :key="c.id" :padding="14">
        <div style="display:flex;align-items:center;gap:12px;">
          <span :style="{
            width:'34px',height:'34px',borderRadius:'9px',flexShrink:0,
            display:'inline-flex',alignItems:'center',justifyContent:'center',
            background: c.is_active ? 'var(--accent-bg)' : 'var(--panel-2)',
            color: c.is_active ? 'var(--accent)' : 'var(--muted)',
          }">
            <AppIcon name="Telegram" :size="17"/>
          </span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {{ c.title || tt('clientTelegramChats.untitledChat') }}
            </div>
            <div style="font-size:12px;color:var(--muted);font-family:var(--font-mono);">{{ c.chat_id }}</div>
          </div>
          <div style="display:flex;align-items:center;gap:14px;">
            <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);cursor:pointer;">
              <AppToggle :model-value="c.is_active" size="sm" @update:model-value="toggle(c)" />
              {{ c.is_active ? tt('clientTelegramChats.active') : tt('clientTelegramChats.inactive') }}
            </label>
            <button class="ctc-del" :disabled="c._busy" @click="remove(c)" :title="tt('clientTelegramChats.delete')">
              <AppIcon name="Close" :size="14"/>
            </button>
          </div>
        </div>
      </AppPanel>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { companiesApi } from '@/api/companies.js'
import { useToast } from '@/composables/useToast.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppToggle from '@/components/ui/AppToggle.vue'

const store = useAppStore()
const toast = useToast()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const companyId = ref(store.companyId)
const chats = ref([])
const loading = ref(false)
const adding = ref(false)
const form = reactive({ chat_id: '', title: '' })

async function resolveCompanyId() {
  if (companyId.value) return companyId.value
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    companyId.value = arr[0]?.id || null
  } catch { /* ignore */ }
  return companyId.value
}

async function load() {
  const cid = await resolveCompanyId()
  if (!cid) return
  loading.value = true
  try {
    chats.value = await companiesApi.listTelegramChats(cid)
  } catch (e) {
    toast.error(e?.response?.data?.message ?? tt('clientTelegramChats.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function add() {
  const cid = await resolveCompanyId()
  if (!cid) return
  const chat_id = form.chat_id.trim()
  if (!/^-?\d{4,20}$/.test(chat_id)) {
    toast.error(tt('clientTelegramChats.invalidChatId'))
    return
  }
  adding.value = true
  try {
    await companiesApi.addTelegramChat(cid, { chat_id, title: form.title.trim() || undefined })
    form.chat_id = ''
    form.title = ''
    toast.success(tt('clientTelegramChats.chatAdded'))
    await load()
  } catch (e) {
    toast.error(e?.response?.data?.message ?? tt('clientTelegramChats.addFailed'))
  } finally {
    adding.value = false
  }
}

async function toggle(c) {
  const next = !c.is_active
  c.is_active = next // optimistik
  try {
    await companiesApi.updateTelegramChat(companyId.value, c.id, { is_active: next })
  } catch (e) {
    c.is_active = !next // qaytarish
    toast.error(e?.response?.data?.message ?? tt('clientTelegramChats.updateFailed'))
  }
}

async function remove(c) {
  if (!confirm(tt('clientTelegramChats.confirmDelete', { name: c.title || c.chat_id }))) return
  c._busy = true
  try {
    await companiesApi.removeTelegramChat(companyId.value, c.id)
    chats.value = chats.value.filter(x => x.id !== c.id)
  } catch (e) {
    c._busy = false
    toast.error(e?.response?.data?.message ?? tt('clientTelegramChats.deleteFailed'))
  }
}

onMounted(load)
</script>

<style scoped>
.ctc-spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: ctc-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes ctc-spin { to { transform: rotate(360deg); } }

.ctc-del {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent;
  color: var(--muted); cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}
.ctc-del:hover:not(:disabled) { background: rgba(239,68,68,0.08); color: #ef4444; border-color: rgba(239,68,68,0.3); }
.ctc-del:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
