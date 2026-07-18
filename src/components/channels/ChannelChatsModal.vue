<template>
  <div class="ctg-overlay" @click.self="$emit('close')">
    <div class="ctg-modal">
      <!-- Header -->
      <div class="ctg-head">
        <div style="min-width:0;">
          <div class="ctg-title">{{ tt('channelChatsModal.title') }}</div>
          <div class="ctg-sub">
            <strong>{{ channel.display_name || channel.username || tt('channelChatsModal.channelFallback') }}</strong>
            {{ tt('channelChatsModal.subtitle') }}
          </div>
        </div>
        <button class="ctg-x" @click="$emit('close')" :aria-label="tt('channelChatsModal.close')">✕</button>
      </div>

      <div class="ctg-body">
        <!-- Yo'riqnoma -->
        <div class="ctg-info" v-html="tt('channelChatsModal.instruction')"></div>

        <!-- Yangi chat qo'shish -->
        <form class="ctg-add" @submit.prevent="addOne">
          <input
            v-model="newChatId"
            type="text"
            :placeholder="tt('channelChatsModal.chatIdPlaceholder')"
            :disabled="adding"
            class="ctg-input ctg-mono"
          />
          <input
            v-model="newTitle"
            type="text"
            :placeholder="tt('channelChatsModal.namePlaceholder')"
            :disabled="adding"
            class="ctg-input"
          />
          <button type="submit" :disabled="adding || !newChatId.trim()" class="ctg-btn-accent">
            {{ adding ? tt('channelChatsModal.adding') : tt('channelChatsModal.addBtn') }}
          </button>
        </form>
        <div v-if="addError" class="ctg-err">{{ addError }}</div>

        <!-- Ro'yxat -->
        <div v-if="loading" class="ctg-muted">{{ tt('channelChatsModal.loading') }}</div>
        <div v-else-if="!chats.length" class="ctg-empty">
          {{ tt('channelChatsModal.empty') }}
        </div>
        <div v-else class="ctg-list">
          <div v-for="c in chats" :key="c.id" class="ctg-row">
            <span class="ctg-avatar" :class="{ on: c.is_active }">
              <AppIcon name="Telegram" :size="15"/>
            </span>
            <div style="flex:1;min-width:0;">
              <div class="ctg-name">{{ c.title || tt('channelChatsModal.untitled') }}</div>
              <div class="ctg-cid ctg-mono">{{ c.chat_id }}</div>
            </div>
            <label class="ctg-toggle">
              <input type="checkbox" :checked="c.is_active" @change="toggleActive(c)" />
              <span :style="{ color: c.is_active ? '#16a34a' : 'var(--muted)' }">
                {{ c.is_active ? tt('channelChatsModal.active') : tt('channelChatsModal.inactive') }}
              </span>
            </label>
            <button @click="remove(c)" :disabled="c._busy" class="ctg-btn-danger" :title="tt('channelChatsModal.removeBtn')">
              <AppIcon name="Close" :size="12"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { channelsApi } from '@/api/channels.js'
import { useAppStore } from '@/stores/app.js'
import { useToast } from '@/composables/useToast.js'

const store = useAppStore()
const toast = useToast()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  companyId: { type: [String, Number], required: true },
  channel: { type: Object, required: true },
})
defineEmits(['close'])

const loading = ref(true)
const adding = ref(false)
const addError = ref(null)
const newChatId = ref('')
const newTitle = ref('')
const chats = ref([])

async function reload() {
  chats.value = await channelsApi.listChats(props.companyId, props.channel.id)
}

onMounted(async () => {
  try {
    await reload()
  } catch (e) {
    addError.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

async function addOne() {
  const chatId = newChatId.value.trim()
  if (!chatId) return
  if (!/^-?\d{4,20}$/.test(chatId)) {
    addError.value = tt('channelChatsModal.invalidChatId')
    return
  }
  adding.value = true
  addError.value = null
  try {
    await channelsApi.addChat(props.companyId, props.channel.id, {
      chat_id: chatId,
      title: newTitle.value.trim() || undefined,
    })
    newChatId.value = ''
    newTitle.value = ''
    await reload()
    toast.success(tt('channelChatsModal.added'))
  } catch (e) {
    addError.value = e?.response?.data?.message ?? tt('channelChatsModal.addFailed')
  } finally {
    adding.value = false
  }
}

async function toggleActive(c) {
  const next = !c.is_active
  c.is_active = next // optimistik
  try {
    await channelsApi.updateChat(props.companyId, props.channel.id, c.id, { is_active: next })
  } catch (e) {
    c.is_active = !next // qaytarish
    toast.error(e?.response?.data?.message ?? tt('channelChatsModal.updateFailed'))
  }
}

async function remove(c) {
  if (!confirm(tt('channelChatsModal.confirmDelete', { name: c.title || c.chat_id }))) return
  c._busy = true
  try {
    await channelsApi.removeChat(props.companyId, props.channel.id, c.id)
    chats.value = chats.value.filter(x => x.id !== c.id)
  } catch (e) {
    c._busy = false
    toast.error(e?.response?.data?.message ?? tt('channelChatsModal.deleteFailed'))
  }
}
</script>

<style scoped>
.ctg-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 40px 16px; overflow-y: auto;
}
.ctg-modal {
  width: 100%; max-width: 560px;
  background: var(--bg); color: var(--text);
  border: 1px solid var(--border-2); border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
  display: flex; flex-direction: column;
}
.ctg-head {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid var(--border-2);
}
.ctg-title { font-size: 15px; font-weight: 700; }
.ctg-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
.ctg-x {
  margin-left: auto; background: transparent; border: none; cursor: pointer;
  color: var(--muted); font-size: 16px; line-height: 1; padding: 4px;
}
.ctg-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.ctg-info {
  padding: 10px 12px; border-radius: 8px; font-size: 12px; line-height: 1.6;
  background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.2); color: var(--text);
}
.ctg-add { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ctg-input {
  flex: 1; min-width: 150px; padding: 9px 11px;
  border: 1px solid var(--border-2); border-radius: 6px;
  background: var(--bg); color: var(--text); font-size: 13px;
}
.ctg-mono { font-family: 'JetBrains Mono', Menlo, Consolas, monospace; }
.ctg-btn-accent {
  padding: 9px 16px; border-radius: 6px; background: var(--accent); color: #fff;
  border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; white-space: nowrap;
}
.ctg-btn-accent:disabled { opacity: .6; cursor: default; }
.ctg-err {
  padding: 8px 12px; border-radius: 6px; font-size: 12.5px; color: #ef4444;
  background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25);
}
.ctg-muted { color: var(--muted); font-size: 13px; }
.ctg-empty {
  padding: 26px; text-align: center; color: var(--muted); font-size: 13px;
  border: 1px dashed var(--border-2); border-radius: 8px;
}
.ctg-list { display: flex; flex-direction: column; gap: 8px; }
.ctg-row {
  display: flex; align-items: center; gap: 10px; padding: 11px;
  border: 1px solid var(--border-2); border-radius: 8px; background: var(--bg); flex-wrap: wrap;
}
.ctg-avatar {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--panel-2, rgba(0,0,0,.05)); color: var(--muted);
}
.ctg-avatar.on { background: color-mix(in oklab, var(--accent) 14%, var(--bg)); color: var(--accent); }
.ctg-name { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ctg-cid { font-size: 12px; color: var(--muted); }
.ctg-toggle {
  display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
  user-select: none; font-size: 11.5px; color: var(--muted); white-space: nowrap;
}
.ctg-toggle input { cursor: pointer; }
.ctg-btn-danger {
  padding: 6px 9px; border: 1px solid var(--border-2); background: transparent;
  color: var(--muted); border-radius: 5px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.ctg-btn-danger:hover:not(:disabled) { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,.08); }
.ctg-btn-danger:disabled { opacity: .5; cursor: default; }

@media (max-width: 640px) {
  .ctg-overlay { padding: 16px 10px; }
  .ctg-input { min-width: 0; width: 100%; flex: 1 1 100%; }
  .ctg-btn-accent { width: 100%; }
}
</style>
