<template>
  <div class="qpc-wrap" @click="$emit('open', post)">
    <!-- Cover -->
    <div class="qpc-cover">
      <div v-if="post.cover_url" class="qpc-cover-img" :style="{ backgroundImage: `url(${post.cover_url})` }"/>
      <div v-else class="qpc-cover-img empty">
        <AppIcon name="Send" :size="16"/>
      </div>
    </div>

    <!-- Body -->
    <div class="qpc-body">
      <div class="qpc-meta">
        <span v-if="post.source_name" class="qpc-chip">
          <AppIcon name="Globe2" :size="10"/>
          {{ post.source_name }}
        </span>
        <span class="qpc-chip qpc-chip-blue">
          <AppIcon name="Telegram" :size="10"/>
          {{ post.channel_name }}
        </span>
        <span v-if="post.flow_stage === 'preview'" class="qpc-chip qpc-chip-stage">
          {{ tt('qpc.stage1') }}
        </span>
        <span v-else-if="post.flow_stage === 'publish'" class="qpc-chip qpc-chip-stage2">
          {{ tt('qpc.stage2') }}
        </span>
        <span v-if="post.prepared_at" class="qpc-chip qpc-chip-muted">
          {{ timeAgo(post.prepared_at) }}
        </span>
      </div>

      <div class="qpc-text">{{ shortText(displayText) }}</div>

      <div v-if="post.target_boundary_at" class="qpc-dest">
        <AppIcon name="Calendar" :size="11"/>
        {{ formatDate(post.target_boundary_at) }}
      </div>

      <!-- Sent/approved status label -->
      <div v-if="activeTab === 'approved'" class="qpc-status qpc-status-approved">
        <AppIcon name="Check" :size="11"/>
        {{ tt('qpc.approved', { date: formatDate(post.approved_at) }) }}
      </div>
      <div v-else-if="activeTab === 'sent'" class="qpc-status qpc-status-sent">
        <AppIcon name="Send" :size="11"/>
        {{ tt('qpc.sent') }}
      </div>
    </div>

    <!-- Actions (pending only) -->
    <div v-if="activeTab === 'pending'" class="qpc-actions" :class="{ 'qpc-actions-wide': isTwoStage }" @click.stop>
      <!-- 1-bosqich: taklif -->
      <template v-if="post.flow_stage === 'preview'">
        <button class="qpc-lbtn qpc-lbtn-danger" :disabled="post._acting" @click="$emit('reject-preview', post)">
          {{ tt('qpc.cancel') }}
        </button>
        <button class="qpc-lbtn qpc-lbtn-success" :disabled="post._acting" @click="$emit('approve-preview', post)">
          <span v-if="post._acting" class="cp-spinner-xs"/>
          <template v-else>{{ tt('qpc.write') }}</template>
        </button>
      </template>
      <!-- 2-bosqich: yakuniy -->
      <template v-else-if="post.flow_stage === 'publish'">
        <button class="qpc-lbtn qpc-lbtn-danger" :disabled="post._acting" @click="$emit('decline-publish', post)">
          {{ tt('qpc.decline') }}
        </button>
        <button class="qpc-lbtn qpc-lbtn-success" :disabled="post._acting" @click="$emit('confirm-publish', post)">
          <span v-if="post._acting" class="cp-spinner-xs"/>
          <template v-else>{{ tt('qpc.publish') }}</template>
        </button>
      </template>
      <!-- Oddiy (approval) rejim -->
      <template v-else>
        <button class="qpc-btn qpc-btn-danger" :disabled="post._acting" @click="$emit('reject', post)">
          <AppIcon name="Close" :size="13"/>
        </button>
        <button class="qpc-btn qpc-btn-success" :disabled="post._acting" @click="$emit('approve', post)">
          <span v-if="post._acting" class="cp-spinner-xs"/>
          <AppIcon v-else name="Check" :size="13"/>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  post: { type: Object, required: true },
  activeTab: { type: String, default: 'pending' },
})
defineEmits([
  'approve', 'reject', 'open',
  'approve-preview', 'reject-preview', 'confirm-publish', 'decline-publish',
])

const isTwoStage = computed(() =>
  props.post.flow_stage === 'preview' || props.post.flow_stage === 'publish',
)

// 1-bosqichda flash taklif (preview_summary) ko'rsatiladi; 2-bosqichda pro yozgan ai_text.
const displayText = computed(() =>
  props.post.flow_stage === 'preview'
    ? (props.post.preview_summary || props.post.ai_text)
    : props.post.ai_text,
)

function shortText(text) {
  if (!text) return '—'
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length > 160 ? clean.slice(0, 160) + '...' : clean
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}s`
  return `${Math.floor(diff / 86400)}k`
}
</script>

<style scoped>
.qpc-wrap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.qpc-wrap:hover { border-color: var(--border-2); background: var(--panel); }

.qpc-cover { flex-shrink: 0; }
.qpc-cover-img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}
.qpc-cover-img.empty {
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  border: 1px solid var(--border);
}

.qpc-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }

.qpc-meta { display: flex; gap: 5px; flex-wrap: wrap; }
.qpc-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  background: var(--panel);
  border: 1px solid var(--border);
  color: var(--text-2);
}
.qpc-chip-blue { background: rgba(47,111,237,0.08); border-color: rgba(47,111,237,0.2); color: var(--accent); }
.qpc-chip-muted { color: var(--muted); background: transparent; border-color: transparent; }
.qpc-chip-stage { background: rgba(234,179,8,0.12); border-color: rgba(234,179,8,0.3); color: #b8860b; }
.qpc-chip-stage2 { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.3); color: #16a34a; }

.qpc-text {
  font-size: 12.5px;
  color: var(--text);
  line-height: 1.45;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.qpc-dest {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--muted);
}

.qpc-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
}
.qpc-status-approved { color: #22c55e; }
.qpc-status-sent { color: var(--accent); }

.qpc-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.qpc-actions-wide { width: 150px; }

.qpc-lbtn {
  width: 100%;
  min-height: 30px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  color: var(--text-2);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.qpc-lbtn:disabled { opacity: 0.5; cursor: not-allowed; }
.qpc-lbtn-success { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.35); color: #16a34a; }
.qpc-lbtn-success:hover:not(:disabled) { background: rgba(34,197,94,0.18); }
.qpc-lbtn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }

.qpc-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--muted);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.qpc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.qpc-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }
.qpc-btn-success:hover:not(:disabled) { background: rgba(34,197,94,0.1); border-color: #22c55e; color: #22c55e; }

.cp-spinner-xs {
  width: 11px;
  height: 11px;
  border: 1.5px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
