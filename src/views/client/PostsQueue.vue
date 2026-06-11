<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader title="Navbat" subtitle="AI tayyorlagan postlarni tasdiqlang va navbatga qo'shing">
      <template #right>
        <AppButton variant="secondary" size="md" @click="load" :loading="loading">
          Yangilash
        </AppButton>
        <AppButton
          v-if="activeTab === 'pending' && counts.pending > 0"
          variant="primary" size="md"
          :loading="approvingAll"
          @click="approveAll"
        >
          <template #icon><AppIcon name="Check" :size="13"/></template>
          Barchasini tasdiqlash ({{ counts.pending }})
        </AppButton>
      </template>
    </PageHeader>

    <!-- Tabs -->
    <div style="display:flex;align-items:center;gap:10px;">
      <AppTabs v-model="activeTab" :items="tabs"/>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;padding:60px 0;color:var(--muted);font-size:13px;gap:10px;">
      <span class="cp-spinner"/>
      Yuklanmoqda...
    </div>

    <!-- Empty -->
    <AppPanel v-else-if="!posts.length" :padding="44">
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;">
        <span style="width:56px;height:56px;border-radius:14px;background:var(--accent-bg);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;">
          <AppIcon name="Send" :size="26"/>
        </span>
        <div>
          <div style="font-size:15px;font-weight:600;margin-bottom:4px;">
            {{ emptyText }}
          </div>
          <div style="font-size:12.5px;color:var(--muted);">
            {{ emptySubText }}
          </div>
        </div>
      </div>
    </AppPanel>

    <!-- Post cards -->
    <div v-else style="display:flex;flex-direction:column;gap:10px;">
      <QueuePostCard
        v-for="p in posts"
        :key="p.id"
        :post="p"
        :active-tab="activeTab"
        @approve="doApprove(p)"
        @reject="doReject(p)"
        @open="openDetail(p)"
      />
    </div>

    <!-- Detail modal -->
    <Teleport to="body">
      <div v-if="detailPost" class="pq-overlay" @click.self="detailPost = null">
        <div class="pq-modal">
          <div class="pq-modal-header">
            <div style="font-size:14px;font-weight:600;">Post tafsiloti</div>
            <button class="pq-close-btn" @click="detailPost = null">
              <AppIcon name="Close" :size="15"/>
            </button>
          </div>

          <div class="pq-modal-body">
            <!-- Cover -->
            <div v-if="detailPost.cover_url" class="pq-cover" :style="{ backgroundImage: `url(${detailPost.cover_url})` }"/>
            <div v-else class="pq-cover empty">
              <AppIcon name="Send" :size="28"/>
            </div>

            <!-- Source + channel -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
              <span v-if="detailPost.source_name" class="pq-chip">
                <AppIcon name="Globe2" :size="11"/>
                {{ detailPost.source_name }}
              </span>
              <span class="pq-chip pq-chip-blue">
                <AppIcon name="Telegram" :size="11"/>
                {{ detailPost.channel_name }}
              </span>
              <span v-if="detailPost.target_boundary_at" class="pq-chip pq-chip-muted">
                <AppIcon name="Calendar" :size="11"/>
                {{ formatDate(detailPost.target_boundary_at) }}
              </span>
            </div>

            <!-- Editable text -->
            <div style="margin-bottom:10px;">
              <label style="font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px;">
                AI matni
              </label>
              <textarea
                v-model="detailText"
                class="pq-textarea"
                rows="8"
                placeholder="AI tomonidan yozilgan matn..."
              />
            </div>

            <!-- AI actions -->
            <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;">
              <button class="pq-ai-chip" :disabled="!!aiLoading" @click="aiRewrite('shorten')">
                <span v-if="aiLoading === 'shorten'" class="cp-spinner-xs"/>
                <AppIcon v-else name="Layers" :size="12"/>
                Qisqartirish
              </button>
              <button class="pq-ai-chip" :disabled="!!aiLoading" @click="aiRewrite('rewrite')">
                <span v-if="aiLoading === 'rewrite'" class="cp-spinner-xs"/>
                <AppIcon v-else name="Sparkle" :size="12"/>
                Qayta yozish
              </button>
            </div>
          </div>

          <!-- Modal footer actions (only for pending) -->
          <div v-if="detailPost.status === 'pending_approval'" class="pq-modal-footer">
            <AppButton variant="ghost" size="md" :disabled="modalActing" @click="modalReject">
              <template #icon><AppIcon name="Close" :size="13"/></template>
              Rad etish
            </AppButton>
            <AppButton variant="primary" size="md" :loading="modalActing" @click="modalApprove">
              <template #icon><AppIcon name="Check" :size="13"/></template>
              Tasdiqlash va navbatga qo'shish
            </AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { queueApi } from '@/api/queue.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import QueuePostCard from '@/components/queue/QueuePostCard.vue'

const store = useAppStore()
const companyId = computed(() => store.companyId)

const activeTab = ref('pending')
const posts = ref([])
const counts = ref({ pending: 0, approved: 0 })
const loading = ref(false)
const approvingAll = ref(false)
const detailPost = ref(null)
const detailText = ref('')
const aiLoading = ref(null)
const modalActing = ref(false)

const tabs = computed(() => [
  { value: 'pending',  label: `Kutilmoqda${counts.value.pending ? ' · ' + counts.value.pending : ''}` },
  { value: 'approved', label: `Rejada${counts.value.approved ? ' · ' + counts.value.approved : ''}` },
  { value: 'sent',     label: 'Yuborilgan' },
])

const STATUS_MAP = {
  pending:  'pending_approval',
  approved: 'approved',
  sent:     'sent',
}

const emptyText = computed(() => ({
  pending:  'Tasdiqlanmagan postlar yo\'q',
  approved: 'Navbatda post yo\'q',
  sent:     'Yuborilgan postlar yo\'q',
}[activeTab.value]))

const emptySubText = computed(() => ({
  pending:  'AI yangi xabar tayyorlaganda bu yerda ko\'rinadi',
  approved: 'Tasdiqlangan postlar shu yerda ko\'rinadi',
  sent:     'Yuborilgan postlar tarixini shu yerda kuzatishingiz mumkin',
}[activeTab.value]))

async function load() {
  if (!companyId.value) return
  loading.value = true
  try {
    const [list, c] = await Promise.all([
      queueApi.list(companyId.value, { status: STATUS_MAP[activeTab.value] }),
      queueApi.counts(companyId.value),
    ])
    posts.value = Array.isArray(list) ? list : (list?.items ?? [])
    counts.value = c ?? { pending: 0, approved: 0 }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function silentRefresh() {
  if (!companyId.value) return
  try {
    const [list, c] = await Promise.all([
      queueApi.list(companyId.value, { status: STATUS_MAP[activeTab.value] }),
      queueApi.counts(companyId.value),
    ])
    posts.value = Array.isArray(list) ? list : (list?.items ?? [])
    counts.value = c ?? counts.value
  } catch {}
}

async function doApprove(post) {
  post._acting = true
  try {
    await queueApi.approve(companyId.value, post.id)
    await load()
  } catch (e) {
    console.error(e)
  } finally {
    post._acting = false
  }
}

async function doReject(post) {
  post._acting = true
  try {
    await queueApi.reject(companyId.value, post.id)
    await load()
  } catch (e) {
    console.error(e)
  } finally {
    post._acting = false
  }
}

async function approveAll() {
  approvingAll.value = true
  try {
    await queueApi.approveAll(companyId.value)
    await load()
  } catch (e) {
    console.error(e)
  } finally {
    approvingAll.value = false
  }
}

function openDetail(post) {
  detailPost.value = post
  detailText.value = post.ai_text ?? ''
  aiLoading.value = null
  modalActing.value = false
}

async function aiRewrite(mode) {
  if (!detailPost.value) return
  aiLoading.value = mode
  try {
    const res = await queueApi.rewrite(companyId.value, detailPost.value.id, mode)
    detailText.value = res.ai_text ?? detailText.value
  } catch (e) {
    console.error(e)
  } finally {
    aiLoading.value = null
  }
}

async function modalApprove() {
  if (!detailPost.value) return
  modalActing.value = true
  try {
    await queueApi.approve(companyId.value, detailPost.value.id)
    detailPost.value = null
    await load()
  } catch (e) {
    console.error(e)
  } finally {
    modalActing.value = false
  }
}

async function modalReject() {
  if (!detailPost.value) return
  modalActing.value = true
  try {
    await queueApi.reject(companyId.value, detailPost.value.id)
    detailPost.value = null
    await load()
  } catch (e) {
    console.error(e)
  } finally {
    modalActing.value = false
  }
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Tab o'zgarganda qayta yuklash
import { watch } from 'vue'
watch(activeTab, load)

let pollTimer = null
onMounted(() => {
  load()
  pollTimer = setInterval(silentRefresh, 30_000)
})
onBeforeUnmount(() => clearInterval(pollTimer))
</script>

<style scoped>
.pq-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.pq-modal {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pq-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.pq-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.pq-close-btn:hover { background: var(--panel); }

.pq-modal-body {
  padding: 18px;
  overflow-y: auto;
  flex: 1;
}

.pq-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.pq-cover {
  width: 100%;
  height: 180px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  margin-bottom: 14px;
}
.pq-cover.empty {
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.pq-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: var(--panel);
  border: 1px solid var(--border);
  color: var(--text-2);
}
.pq-chip-blue { background: rgba(47,111,237,0.08); border-color: rgba(47,111,237,0.2); color: var(--accent); }
.pq-chip-muted { color: var(--muted); }

.pq-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  font-size: 13.5px;
  line-height: 1.55;
  resize: vertical;
  font-family: inherit;
  outline: none;
}
.pq-textarea:focus { border-color: var(--accent); }

.pq-ai-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.pq-ai-chip:hover:not(:disabled) { background: var(--panel-2); border-color: var(--accent); color: var(--accent); }
.pq-ai-chip:disabled { opacity: 0.5; cursor: not-allowed; }

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
