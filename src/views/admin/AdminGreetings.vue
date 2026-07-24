<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader
      :title="tt('adminGreetings.title')"
      :subtitle="tt('adminGreetings.subtitle')"
    >
      <template #right>
        <AppButton variant="secondary" size="md" @click="load" :loading="loading">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          {{ tt('adminGreetings.refresh') }}
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div class="ag-stat">
        <span class="ag-stat-val">{{ greetings.length }}</span>
        <span class="ag-stat-lbl">{{ tt('adminGreetings.totalLabel') }}</span>
      </div>
    </div>

    <!-- Oy tanlagich -->
    <div class="ag-month-row">
      <button
        v-for="mo in MONTH_OPTIONS" :key="mo.value" type="button"
        class="ag-month-chip" :class="{ active: selectedMonth === mo.value }"
        @click="selectedMonth = mo.value"
      >
        {{ mo.label }}
        <span v-if="countByMonth[mo.value]" class="ag-month-count">{{ countByMonth[mo.value] }}</span>
      </button>
    </div>

    <AppPanel :padding="0">
      <div v-if="loading" style="padding:48px;text-align:center;color:var(--muted);font-size:13px;">
        <span class="ag-spinner"/> {{ tt('adminGreetings.loading') }}
      </div>
      <div v-else-if="error"
           style="padding:14px 16px;background:rgba(239,68,68,.08);
                  border-bottom:1px solid rgba(239,68,68,.2);color:#ef4444;font-size:13px;">
        <AppIcon name="Close" :size="12"/> {{ error }}
      </div>
      <div v-else class="ag-day-list">
        <div v-for="row in daysInSelectedMonth" :key="row.day" class="ag-day-row">
          <div class="ag-day-num">{{ row.day }}</div>
          <div class="ag-day-body">
            <template v-if="row.greeting">
              <div class="ag-day-text">{{ preview(row.greeting.text) }}</div>
              <div v-if="row.greeting.media_url" class="ag-day-media">
                <img v-if="row.greeting.media_type === 'image'" :src="row.greeting.media_url" class="ag-thumb"/>
                <video v-else :src="row.greeting.media_url" class="ag-thumb" muted/>
                <span class="ag-media-badge">{{ tt(row.greeting.media_type === 'video' ? 'adminGreetings.video' : 'adminGreetings.image') }}</span>
              </div>
            </template>
            <span v-else class="ag-day-empty">{{ tt('adminGreetings.dayEmpty') }}</span>
          </div>
          <div class="ag-day-actions">
            <AppButton variant="ghost" size="sm" @click="openEdit(row)" :title="row.greeting ? tt('adminGreetings.edit') : tt('adminGreetings.add')">
              <template #icon><AppIcon :name="row.greeting ? 'Edit' : 'Plus'" :size="12"/></template>
            </AppButton>
            <AppButton v-if="row.greeting" variant="ghost" size="sm" @click="openDelete(row.greeting)" :title="tt('adminGreetings.delete')">
              <template #icon><AppIcon name="Trash" :size="12"/></template>
            </AppButton>
          </div>
        </div>
      </div>
    </AppPanel>

    <!-- Create / Edit modal -->
    <AppModal v-model="formOpen"
              :title="form.id ? tt('adminGreetings.editTitle') : tt('adminGreetings.createTitle')"
              :subtitle="formDaySubtitle"
              width="640px">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">{{ tt('adminGreetings.textLabel') }}</span>
          <textarea v-model="form.text"
            rows="8"
            :disabled="formBusy"
            :placeholder="tt('adminGreetings.textPlaceholder')"
            class="ag-textarea"/>
        </label>

        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">{{ tt('adminGreetings.mediaLabel') }}</span>
          <div v-if="form.media_url" class="ag-media-preview">
            <img v-if="form.media_type === 'image'" :src="form.media_url" class="ag-preview-thumb"/>
            <video v-else :src="form.media_url" class="ag-preview-thumb" controls/>
            <AppButton variant="ghost" size="sm" @click="clearMedia" :disabled="formBusy || mediaUploading">
              <template #icon><AppIcon name="Trash" :size="12"/></template>
              {{ tt('adminGreetings.removeMedia') }}
            </AppButton>
          </div>
          <label v-else class="ag-upload-box" :class="{ busy: mediaUploading }">
            <input type="file" accept="image/*,video/mp4,video/quicktime" @change="onFileSelected" :disabled="formBusy || mediaUploading" hidden/>
            <span v-if="mediaUploading">{{ tt('adminGreetings.uploading') }}</span>
            <span v-else>
              <AppIcon name="Plus" :size="14"/>
              {{ tt('adminGreetings.uploadHint') }}
            </span>
          </label>
          <span style="font-size:11px;color:var(--muted);">{{ tt('adminGreetings.mediaHint') }}</span>
        </div>

        <div v-if="formError"
             style="padding:10px 12px;border-radius:7px;background:rgba(239,68,68,.08);
                    border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;">
          {{ formError }}
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="md" @click="formOpen = false" :disabled="formBusy">
          {{ tt('adminGreetings.cancel') }}
        </AppButton>
        <AppButton variant="primary" size="md" :loading="formBusy" @click="formSubmit">
          <template #icon><AppIcon name="Check" :size="12"/></template>
          {{ form.id ? tt('adminGreetings.save') : tt('adminGreetings.create') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Delete confirm -->
    <AppModal v-model="deleteOpen"
              :title="tt('adminGreetings.deleteTitle')"
              :subtitle="tt('adminGreetings.deleteSubtitle')"
              width="480px">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;flex-direction:column;gap:3px;padding:10px 12px;
                    background:var(--panel-2,rgba(99,102,241,.05));border-radius:8px;">
          <span style="font-size:11px;color:var(--muted);">{{ pendingDateLabel }}</span>
          <span style="font-weight:500;">{{ preview(pending?.text) }}</span>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" size="md" @click="deleteOpen = false" :disabled="deleteBusy">
          {{ tt('adminGreetings.cancel') }}
        </AppButton>
        <AppButton variant="danger" size="md" :loading="deleteBusy" @click="deleteRun">
          <template #icon><AppIcon name="Trash" :size="12"/></template>
          {{ tt('adminGreetings.delete') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Toast -->
    <Teleport to="body">
      <transition name="ag-toast">
        <div v-if="toast" class="ag-toast" :class="`ag-toast-${toast.kind}`" @click="toast = null">
          <AppIcon :name="toast.kind === 'success' ? 'Check' : 'Close'" :size="14"/>
          <span>{{ toast.text }}</span>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { adminApi } from '@/api/admin.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const loading = ref(true)
const error = ref('')
const greetings = ref([])

const MONTH_OPTIONS = computed(() => [
  { value: 1, label: tt('adminGreetings.month1') },
  { value: 2, label: tt('adminGreetings.month2') },
  { value: 3, label: tt('adminGreetings.month3') },
  { value: 4, label: tt('adminGreetings.month4') },
  { value: 5, label: tt('adminGreetings.month5') },
  { value: 6, label: tt('adminGreetings.month6') },
  { value: 7, label: tt('adminGreetings.month7') },
  { value: 8, label: tt('adminGreetings.month8') },
  { value: 9, label: tt('adminGreetings.month9') },
  { value: 10, label: tt('adminGreetings.month10') },
  { value: 11, label: tt('adminGreetings.month11') },
  { value: 12, label: tt('adminGreetings.month12') },
])

const selectedMonth = ref(new Date().getMonth() + 1)

const countByMonth = computed(() => {
  const out = {}
  for (const g of greetings.value) out[g.month] = (out[g.month] || 0) + 1
  return out
})

const daysInSelectedMonth = computed(() => {
  const max = DAYS_IN_MONTH[selectedMonth.value - 1]
  const byDay = new Map(
    greetings.value.filter((g) => g.month === selectedMonth.value).map((g) => [g.day, g]),
  )
  return Array.from({ length: max }, (_, i) => ({ day: i + 1, greeting: byDay.get(i + 1) || null }))
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    greetings.value = await adminApi.listGreetings()
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || tt('adminGreetings.errLoad')
    greetings.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── Create / Edit form ──
const formOpen = ref(false)
const formBusy = ref(false)
const formError = ref('')
const mediaUploading = ref(false)
const form = reactive({
  id: null,
  month: selectedMonth.value,
  day: 1,
  text: '',
  media_url: '',
  media_type: null,
})

const formDaySubtitle = computed(() => {
  const monthLabel = MONTH_OPTIONS.value.find((m) => m.value === form.month)?.label || ''
  return tt('adminGreetings.dayOfMonth', { day: form.day, month: monthLabel })
})

function resetForm() {
  formError.value = ''
  form.id = null
  form.text = ''
  form.media_url = ''
  form.media_type = null
}

function openEdit(row) {
  resetForm()
  form.month = selectedMonth.value
  form.day = row.day
  if (row.greeting) {
    form.id = row.greeting.id
    form.text = row.greeting.text
    form.media_url = row.greeting.media_url || ''
    form.media_type = row.greeting.media_type || null
  }
  formOpen.value = true
}

async function onFileSelected(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  mediaUploading.value = true
  formError.value = ''
  try {
    const res = await adminApi.uploadGreetingMedia(file)
    form.media_url = res.url
    form.media_type = res.media_type
  } catch (err) {
    formError.value = err?.response?.data?.message || err.message || tt('adminGreetings.errUpload')
  } finally {
    mediaUploading.value = false
    e.target.value = ''
  }
}

function clearMedia() {
  form.media_url = ''
  form.media_type = null
}

async function formSubmit() {
  formError.value = ''
  const text = (form.text || '').trim()
  if (!text) { formError.value = tt('adminGreetings.errTextRequired'); return }

  const payload = {
    month: form.month,
    day: form.day,
    text,
    media_url: form.media_url || null,
    media_type: form.media_url ? form.media_type : null,
  }

  formBusy.value = true
  try {
    if (form.id) {
      await adminApi.updateGreeting(form.id, payload)
      showToast('success', tt('adminGreetings.toastUpdated'))
    } else {
      await adminApi.createGreeting(payload)
      showToast('success', tt('adminGreetings.toastCreated'))
    }
    formOpen.value = false
    await load()
  } catch (e) {
    formError.value = e?.response?.data?.message || e.message || tt('adminGreetings.errSave')
  } finally {
    formBusy.value = false
  }
}

// ── Delete ──
const deleteOpen = ref(false)
const deleteBusy = ref(false)
const pending = ref(null)

const pendingDateLabel = computed(() => {
  if (!pending.value) return ''
  const monthLabel = MONTH_OPTIONS.value.find((m) => m.value === pending.value.month)?.label || ''
  return tt('adminGreetings.dayOfMonth', { day: pending.value.day, month: monthLabel })
})

function openDelete(g) {
  pending.value = g
  deleteOpen.value = true
}

async function deleteRun() {
  if (!pending.value) return
  deleteBusy.value = true
  try {
    await adminApi.deleteGreeting(pending.value.id)
    showToast('success', tt('adminGreetings.toastDeleted'))
    deleteOpen.value = false
    await load()
  } catch (e) {
    showToast('error', e?.response?.data?.message || e.message || tt('adminGreetings.errDelete'), 5000)
  } finally {
    deleteBusy.value = false
  }
}

// ── Toast ──
const toast = ref(null)
function showToast(kind, text, ms = 3500) {
  toast.value = { kind, text }
  setTimeout(() => { if (toast.value?.text === text) toast.value = null }, ms)
}

// ── Helpers ──
function preview(text) {
  if (!text) return '—'
  const s = String(text).replace(/\s+/g, ' ').trim()
  return s.length > 100 ? s.slice(0, 100) + '…' : s
}
</script>

<style scoped>
.ag-stat {
  display: inline-flex; align-items: baseline; gap: 6px;
  padding: 6px 12px;
  background: var(--panel-2, rgba(99, 102, 241, 0.06));
  border: 1px solid var(--border-2);
  border-radius: 7px;
}
.ag-stat-val { font-size: 16px; font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; }
.ag-stat-lbl { font-size: 12px; color: var(--muted); }

.ag-month-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ag-month-chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-2);
  background: var(--bg);
  color: var(--text);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color .15s, background .15s;
}
.ag-month-chip:hover { border-color: var(--accent); }
.ag-month-chip.active {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 10%, transparent);
  color: var(--accent);
}
.ag-month-count {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--accent) 18%, transparent);
}

.ag-day-list { display: flex; flex-direction: column; }
.ag-day-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-2);
}
.ag-day-row:first-child { border-top: none; }
.ag-day-num {
  flex: 0 0 34px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-align: center;
}
.ag-day-body { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
.ag-day-text {
  font-size: 12.5px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.ag-day-empty { font-size: 12px; color: var(--muted); font-style: italic; }
.ag-day-media { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.ag-thumb { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-2); }
.ag-media-badge {
  font-size: 10px;
  color: var(--muted);
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--panel-2, rgba(99, 102, 241, 0.06));
}
.ag-day-actions { flex-shrink: 0; display: flex; gap: 2px; }

.ag-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-2);
  border-radius: 7px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  outline: none;
  resize: vertical;
  min-height: 140px;
  line-height: 1.55;
}
.ag-textarea:focus { border-color: var(--accent); }

.ag-upload-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  border: 1.5px dashed var(--border-2);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--muted);
  transition: border-color .15s, background .15s;
}
.ag-upload-box:hover { border-color: var(--accent); color: var(--accent); }
.ag-upload-box.busy { opacity: .6; cursor: wait; }

.ag-media-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ag-preview-thumb {
  max-width: 160px;
  max-height: 160px;
  border-radius: 8px;
  border: 1px solid var(--border-2);
  object-fit: cover;
}

.ag-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 999px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: ag-spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}
@keyframes ag-spin { to { transform: rotate(360deg); } }

.ag-toast {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 4000;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  max-width: 420px;
  box-shadow: 0 10px 30px -8px rgba(15,23,42,0.35);
  cursor: pointer;
}
.ag-toast-success {
  background: color-mix(in oklab, var(--success) 14%, var(--panel));
  color: var(--success);
  border: 1px solid color-mix(in oklab, var(--success) 30%, transparent);
}
.ag-toast-error {
  background: color-mix(in oklab, var(--danger) 14%, var(--panel));
  color: var(--danger);
  border: 1px solid color-mix(in oklab, var(--danger) 30%, transparent);
}
.ag-toast-enter-active, .ag-toast-leave-active { transition: opacity .2s, transform .2s; }
.ag-toast-enter-from, .ag-toast-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 640px) {
  .ag-day-row { flex-wrap: wrap; }
  .ag-day-body { flex-basis: 100%; order: 3; }
}
</style>
